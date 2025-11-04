<script setup lang="ts">
import { onMounted } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { Field, useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  layout: 'empty',
  title: 'Login',
  ssr: false,
})

const VALIDATION_TEXT = {
  EMAIL_OR_USERNAME_REQUIRED: 'Email or username is required',
  PASSWORD_REQUIRED: 'A password is required',
}

// This is the Zod schema for the form input
const zodSchema = z.object({
  emailOrUsername: z.string().min(1, VALIDATION_TEXT.EMAIL_OR_USERNAME_REQUIRED),
  password: z.string().min(1, VALIDATION_TEXT.PASSWORD_REQUIRED),
  trustDevice: z.boolean(),
})

type FormInput = z.infer<typeof zodSchema>

const validationSchema = toTypedSchema(zodSchema)
const initialValues = {
  emailOrUsername: '',
  password: '',
  trustDevice: false,
} satisfies FormInput

const {
  handleSubmit,
  isSubmitting,
  setFieldError,
} = useForm({
  validationSchema,
  initialValues,
})

const router = useRouter()
const route = useRoute()
const toaster = useNuiToasts()
const { login: authLogin, startOAuth2Flow, checkAuth } = useAuth()

// Check if user is already authenticated on mount
// If session exists, logout first to allow fresh login
onMounted(async () => {
  // Check if user just verified their email
  if (route.query.verified === 'true') {
    toaster.add({
      title: 'Email Verified',
      description: 'Your email has been verified. Please login to continue.',
      icon: 'ph:check-circle-fill',
      color: 'success',
      progress: true,
    })
    
    // Pre-fill email if provided
    if (route.query.email) {
      values.emailOrUsername = route.query.email as string
    }
  }
  
  try {
    const { isAuthenticated } = await checkAuth()
    
    // If already authenticated, logout first to allow fresh login
    // This allows users to login again without manually clearing cookies
    if (isAuthenticated) {
      const { logout } = useAuth()
      await logout()
      // After logout, allow user to login
    }
  } catch (error) {
    // User is not authenticated, allow login
  }
})

// This is where you would send the form data to the server
const onSubmit = handleSubmit(async (values) => {
  try {
    // Use client-side login directly with Kratos
    // This ensures cookie is set in browser properly
    const config = useRuntimeConfig()
    
      // Get login flow from Kratos directly (client-side)
      // Use refresh=true to allow login even if session exists
      // This ensures CSRF cookie is set in browser properly
      const returnTo = encodeURIComponent('http://localhost:3000/dashboard')
      const flowResponse = await $fetch(`${config.public.kratosPublicUrl}/self-service/login/browser?refresh=true&return_to=${returnTo}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      })
    
    if (import.meta.dev) {
      console.log('[auth/login.vue] Flow response:', flowResponse)
      console.log('[auth/login.vue] Flow response type:', typeof flowResponse)
      console.log('[auth/login.vue] Flow response id:', flowResponse?.id)
      console.log('[auth/login.vue] Flow response keys:', Object.keys(flowResponse || {}))
    }
    
    // Check if response has redirect_browser_to (Kratos wants to redirect)
    if (flowResponse?.redirect_browser_to) {
      // Kratos wants to redirect - check if it's a valid URL
      const redirectUrl = flowResponse.redirect_browser_to
      if (import.meta.dev) {
        console.log('[auth/login.vue] Kratos wants to redirect to:', redirectUrl)
      }
      if (redirectUrl.includes('ory.sh') || redirectUrl.includes('fallback')) {
        // Fallback URL - error
        setFieldError('password', 'Kratos redirected to fallback URL. Please check configuration.')
        return
      }
      // Valid redirect - follow it
      window.location.href = redirectUrl
      return
    }
    
    // Check if flowResponse is a string (HTML response)
    if (typeof flowResponse === 'string') {
      if (import.meta.dev) {
        console.error('[auth/login.vue] Flow response is HTML string, not JSON:', flowResponse.substring(0, 200))
      }
      setFieldError('password', 'Kratos returned HTML instead of JSON. Please check configuration.')
      return
    }
    
    if (!flowResponse?.id) {
      if (import.meta.dev) {
        console.error('[auth/login.vue] Flow response has no id:', flowResponse)
        console.error('[auth/login.vue] Flow response structure:', JSON.stringify(flowResponse, null, 2))
      }
      setFieldError('password', 'Failed to initialize login flow. Please try again.')
      return
    }
    
    // Get CSRF token from flow
    const csrfToken = flowResponse.ui?.nodes?.find((n: any) => n.attributes?.name === 'csrf_token')?.attributes?.value
    
    if (!csrfToken) {
      setFieldError('password', 'Failed to get CSRF token. Please refresh the page and try again.')
      return
    }
    
    // Submit login form with credentials
    // This will set the session cookie in browser
    // Important: flow parameter must be in query string, not body
    const loginResponse = await $fetch(`${config.public.kratosPublicUrl}/self-service/login?flow=${flowResponse.id}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: {
        method: 'password',
        password: values.password,
        identifier: values.emailOrUsername,
        csrf_token: csrfToken,
      },
    }).catch((error: any) => {
      // Handle CORS or network errors
      if (import.meta.dev) {
        console.error('[auth/login.vue] Login error:', error)
      }
      
      // Check for validation errors
      if (error.response?.data?.ui?.messages) {
        const messages = error.response.data.ui.messages
        const errorMessage = messages.find((m: any) => m.type === 'error')?.text
        if (errorMessage) {
          setFieldError('password', errorMessage)
          return
        }
      }
      
      // Check for CORS errors
      if (error.message?.includes('CORS') || error.message?.includes('fetch')) {
        setFieldError('password', 'Network error. Please check CORS settings.')
        return
      }
      
      setFieldError('password', 'Login failed. Please try again.')
      throw error
    })
    
    // Check if login was successful
    if (loginResponse?.session) {
      // Check if email is verified
      const session = loginResponse.session
      const identity = session.identity
      const traits = identity?.traits || {}
      const emailVerified = traits.email_verified || traits.email_address_verified || false
      
      if (!emailVerified) {
        // Email not verified - redirect to verify page
        toaster.add({
          title: 'Email Verification Required',
          description: 'Please verify your email address to continue.',
          icon: 'ph:envelope',
          color: 'warning',
          progress: true,
        })
        
        // Start verification flow and send code to email
        const config = useRuntimeConfig()
        const userEmail = traits.email || traits.email_address || ''
        
        // Create verification flow
        const verificationFlow = await $fetch(`${config.public.kratosPublicUrl}/self-service/verification/browser`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        })
        
        if (verificationFlow?.id && userEmail) {
          // Get CSRF token from flow
          const csrfToken = verificationFlow.ui?.nodes?.find(
            (node: any) => node.attributes?.name === 'csrf_token'
          )?.attributes?.value
          
          if (csrfToken) {
            // Submit verification request to send code to email
            await $fetch(`${config.public.kratosPublicUrl}/self-service/verification?flow=${verificationFlow.id}`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: {
                email: userEmail,
                method: 'code',
                csrf_token: csrfToken,
              },
            }).catch((error: any) => {
              // Log error but continue
              if (import.meta.dev) {
                console.warn('[auth/login.vue] Failed to send verification code:', error)
              }
            })
          }
          
          // Redirect to verify page
          await router.push({
            path: '/auth/verify-email',
            query: {
              flow: verificationFlow.id,
              email: userEmail,
            },
          })
        } else {
          await router.push('/auth/verify-email')
        }
        return
      }
      
      // Email verified - start OAuth2 flow to get Hydra tokens
      // Redirect to OAuth2 authorize endpoint which will handle the flow from browser
      // This ensures cookies are properly set and CSRF tokens work
      toaster.add({
        title: 'Success',
        description: 'Welcome back!',
        icon: 'ph:user-circle-fill',
        progress: true,
      })
      
      // Redirect to OAuth2 authorize endpoint (browser flow)
      // Use window.location.href for server endpoint redirect
      // This will handle login/consent challenges and get tokens
      window.location.href = '/api/auth/oauth/authorize?return_to=/dashboard'
    } else if (loginResponse?.redirect_browser_to) {
      // Kratos wants to redirect (e.g., for verification)
      // Make sure it's a local URL
      const redirectUrl = loginResponse.redirect_browser_to
      if (redirectUrl.startsWith('http://localhost:3000') || redirectUrl.startsWith('/')) {
        window.location.href = redirectUrl
      } else {
        // Invalid redirect - go to dashboard
        await router.push('/dashboard')
      }
    } else {
      // Login failed - check for errors
      const errorMessage = loginResponse?.ui?.messages?.find((m: any) => m.type === 'error')?.text
      setFieldError('password', errorMessage || 'Login failed. Please try again.')
    }
  } catch (error: any) {
    // Handle errors
    if (error.statusCode === 401 || error.status === 401) {
      // Check if error.data is an array
      let errorMessage = 'Invalid email or password'
      if (Array.isArray(error.data)) {
        const passwordError = error.data.find((e: any) => e.path?.includes('password'))
        if (passwordError?.message) {
          errorMessage = passwordError.message
        }
      } else if (error.statusMessage) {
        errorMessage = error.statusMessage
      }
      setFieldError('password', errorMessage)
    } else if (error.statusCode === 403) {
      // CSRF error
      let errorMessage = 'Security validation failed. Please refresh the page and try again.'
      if (Array.isArray(error.data)) {
        const csrfError = error.data.find((e: any) => e.path?.includes('password'))
        if (csrfError?.message) {
          errorMessage = csrfError.message
        }
      } else if (error.statusMessage) {
        errorMessage = error.statusMessage
      }
      setFieldError('password', errorMessage)
    } else if (error.statusCode === 429) {
      setFieldError('password', 'Too many login attempts. Please try again later.')
    } else {
      setFieldError('password', error.message || 'Login failed. Please try again.')
    }
  }
})

// Google OAuth login
const loginWithGoogle = async () => {
  try {
    // Start OAuth2 flow with Google provider
    // This will redirect to Hydra, which will handle Google OAuth
    await startOAuth2Flow('/dashboard')
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to start Google login',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
  }
}
</script>

<template>
  <div class="dark:bg-muted-800 flex min-h-screen bg-white">
    <div
      class="bg-muted-100 dark:bg-muted-900 relative hidden w-0 flex-1 items-center justify-center lg:flex lg:w-3/5"
    >
      <div
        class="mx-auto flex size-full max-w-4xl items-center justify-center"
      >
        <!-- Media image -->
        <img
          class="mx-auto max-w-xl"
          src="/img/illustrations/magician.svg"
          alt=""
          width="619"
          height="594"
        >
      </div>
    </div>
    <div
      class="relative flex flex-1 flex-col justify-center px-6 py-12 lg:w-2/5 lg:flex-none"
    >
      <div class="dark:bg-muted-800 relative mx-auto w-full max-w-sm bg-white">
        <!-- Nav -->
        <div class="flex w-full items-center justify-between">
          <NuxtLink
            to="/"
            class="text-muted-400 hover:text-primary-500 flex items-center gap-2 font-sans font-medium transition-colors duration-300"
          >
            <Icon name="gg:arrow-long-left" class="size-5" />
            <span>Back to Home</span>
          </NuxtLink>
          <!-- Theme button -->
          <BaseThemeToggle />
        </div>
        <div>
          <BaseHeading
            as="h2"
            size="3xl"
            lead="relaxed"
            weight="medium"
            class="mt-6"
          >
            Welcome back.
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-400 mb-6">
            Login with your credentials
          </BaseParagraph>
        </div>

        <!-- Social Login Buttons -->
        <div class="mb-6">
          <BaseButton
            :disabled="isSubmitting"
            :loading="isSubmitting"
            type="button"
            variant="pastel"
            rounded="lg"
            class="w-full"
            @click="loginWithGoogle"
          >
            <Icon name="logos:google-icon" class="size-5 mr-2" />
            Continue with Google
          </BaseButton>
        </div>

        <div class="relative mb-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-muted-300 dark:border-muted-700" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="bg-white dark:bg-muted-800 px-2 text-muted-500">
              Or continue with email
            </span>
          </div>
        </div>

        <!-- Form section -->
        <div class="mt-6">
          <div class="mt-5">
            <!-- Form -->
            <form
              method="POST"
              action=""
              class="mt-6"
              novalidate
              @submit.prevent="onSubmit"
            >
              <div class="space-y-4">
                <Field
                  v-slot="{ field, errorMessage, handleChange, handleBlur }"
                  name="emailOrUsername"
                >
                  <BaseField
                    v-slot="{ inputAttrs, inputRef }"
                    label="Email or Username"
                    :state="errorMessage ? 'error' : 'idle'"
                    :error="errorMessage"
                    :disabled="isSubmitting"
                    required
                  >
                    <BaseInput
                      :ref="inputRef"
                      v-bind="inputAttrs"
                      :model-value="field.value"
                      autocomplete="username"
                      rounded="lg"
                      placeholder="Enter your email or username"
                      @update:model-value="handleChange"
                      @blur="handleBlur"
                    />
                  </BaseField>
                </Field>

                <Field
                  v-slot="{ field, errorMessage, handleChange, handleBlur }"
                  name="password"
                >
                  <BaseField
                    v-slot="{ inputAttrs, inputRef }"
                    label="Password"
                    :state="errorMessage ? 'error' : 'idle'"
                    :error="errorMessage"
                    :disabled="isSubmitting"
                    required
                  >
                    <BaseInput
                      :ref="inputRef"
                      v-bind="inputAttrs"
                      :model-value="field.value"
                      type="password"
                      autocomplete="current-password"
                      rounded="lg"
                      @update:model-value="handleChange"
                      @blur="handleBlur"
                    />
                  </BaseField>
                </Field>
              </div>

              <!-- Remember -->
              <div class="mt-6 flex items-center justify-between">
                <Field
                  v-slot="{ field, handleChange, handleBlur }"
                  name="trustDevice"
                >
                  <BaseCheckbox
                    :model-value="field.value"
                    :disabled="isSubmitting"
                    label="Trust for 60 days"
                    variant="default"
                    @update:model-value="handleChange"
                    @blur="handleBlur"
                  />
                </Field>

                <div class="text-xs leading-5">
                  <NuxtLink
                    to="/auth/forgot-password"
                    class="text-primary-600 hover:text-primary-500 font-sans font-medium underline-offset-4 transition duration-150 ease-in-out hover:underline"
                  >
                    Forgot your password?
                  </NuxtLink>
                </div>
              </div>

              <!-- Submit -->
              <div class="mt-6">
                <div class="block w-full rounded-md shadow-xs">
                  <BaseButton
                    :disabled="isSubmitting"
                    :loading="isSubmitting"
                    type="submit"
                    variant="primary"
                    rounded="lg"
                    class="h-11! w-full"
                  >
                    Sign in
                  </BaseButton>
                </div>
              </div>
            </form>

            <!-- No account link -->
            <p
              class="muted-400 mt-4 flex justify-between font-sans text-xs leading-5"
            >
              <span>Don't have an account?</span>
              <NuxtLink
                to="/auth/register"
                class="text-primary-600 hover:text-primary-500 font-medium underline-offset-4 transition duration-150 ease-in-out hover:underline"
              >
                Create Account
              </NuxtLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
