<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Field, useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  layout: 'empty',
  title: 'Verify Email',
  ssr: false,
})

const VALIDATION_TEXT = {
  CODE_REQUIRED: 'Verification code is required',
  CODE_LENGTH: 'Verification code must be 6 digits',
}

const zodSchema = z.object({
  code: z.string()
    .min(1, VALIDATION_TEXT.CODE_REQUIRED)
    .regex(/^\d{6}$/, VALIDATION_TEXT.CODE_LENGTH),
})

type FormInput = z.infer<typeof zodSchema>

const validationSchema = toTypedSchema(zodSchema)
const initialValues = {
  code: '',
} satisfies FormInput

const { values, handleSubmit, isSubmitting, setFieldError } = useForm({
  validationSchema,
  initialValues,
})

const router = useRouter()
const toaster = useNuiToasts()
const route = useRoute()

const email = ref<string>('')
const verificationFlowId = ref<string>('')
const resendCooldown = ref<number>(0)

// Get email and flow ID from query params or route state
onMounted(() => {
  const queryEmail = route.query.email as string
  const queryFlowId = route.query.flow as string
  
  if (queryEmail) {
    email.value = queryEmail
  }
  
  if (queryFlowId) {
    verificationFlowId.value = queryFlowId
  }
  
  // Start resend cooldown
  resendCooldown.value = 60
  const interval = setInterval(() => {
    if (resendCooldown.value > 0) {
      resendCooldown.value--
    } else {
      clearInterval(interval)
    }
  }, 1000)
})

const onSubmit = handleSubmit(async (formValues) => {
  try {
    const response = await $fetch('/api/auth/verify-email', {
      method: 'POST',
      body: {
        code: formValues.code,
        flow: verificationFlowId.value,
      },
      credentials: 'include',
    })

    if (response.success) {
      toaster.add({
        title: 'Success',
        description: 'Email verified successfully!',
        icon: 'ph:check-circle-fill',
        progress: true,
      })
      
      // Wait a moment for Kratos to update the identity
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if user already has a session (from login flow)
      // If they do, they should be redirected to dashboard
      // If they don't, they need to login (from registration flow)
      const config = useRuntimeConfig()
      
      try {
        // Check if user has an active session by checking cookies
        // Use document.cookie to check for session cookie (more reliable)
        const cookies = document.cookie.split(';').map(c => c.trim())
        const kratosSessionCookie = cookies.find(c => c.startsWith('ory_kratos_session='))
        
        if (import.meta.dev) {
          console.log('[auth/verify-email.vue] All cookies:', cookies)
          console.log('[auth/verify-email.vue] Kratos session cookie:', kratosSessionCookie)
        }
        
        // Priority 1: Try to create session using password from registration (if available)
        // This is for registration flow where user has password in query params
        const passwordFromQuery = route.query.password as string
        
        if (passwordFromQuery && response.identityId) {
          try {
            if (import.meta.dev) {
              console.log('[auth/verify-email.vue] Password found in query params, creating session...')
            }
            
            // Create session using client-side login flow (like login.vue does)
            const siteUrl = config.public.siteUrl?.replace(/\/$/, '') || 'http://localhost:3000'
            const loginFlow = await $fetch(`${config.public.kratosPublicUrl}/self-service/login/browser?return_to=${encodeURIComponent(`${siteUrl}/dashboard`)}`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
              },
            })
            
            if (loginFlow?.id) {
              // Get CSRF token from flow
              const csrfToken = loginFlow.ui?.nodes?.find(
                (node: any) => node.attributes?.name === 'csrf_token'
              )?.attributes?.value
              
              if (csrfToken) {
                // Submit login form with credentials (client-side)
                const loginResponse = await $fetch(`${config.public.kratosPublicUrl}/self-service/login?flow=${loginFlow.id}`, {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                  },
                  body: {
                    method: 'password',
                    password: passwordFromQuery,
                    identifier: email.value,
                    csrf_token: csrfToken,
                  },
                })
                
                if (loginResponse?.session) {
                  if (import.meta.dev) {
                    console.log('[auth/verify-email.vue] Session created successfully from registration password')
                  }
                  
                  // Refresh user data
                  const { refreshUser } = useUserData()
                  await refreshUser()
                  
                  // Redirect to OAuth2 authorize endpoint
                  toaster.add({
                    title: 'Success',
                    description: 'Email verified! Redirecting to dashboard...',
                    icon: 'ph:check-circle-fill',
                    color: 'success',
                    progress: true,
                  })
                  
                  window.location.href = '/api/auth/oauth/authorize?return_to=/dashboard'
                  return
                }
              }
            }
          } catch (sessionError: any) {
            if (import.meta.dev) {
              console.warn('[auth/verify-email.vue] Failed to create session from password:', sessionError)
            }
          }
        }
        
        // Priority 2: Check if session already exists via API (for login flow)
        // This is for login flow where user already has session
        let hasSession = false
        
        // Always try to check session via API (even if cookie is not found)
        try {
          const sessionCheck = await $fetch(`${config.public.kratosPublicUrl}/sessions/whoami`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
            },
          })
          
          if (sessionCheck?.identity?.id) {
            hasSession = true
            if (import.meta.dev) {
              console.log('[auth/verify-email.vue] Session verified via API:', sessionCheck.identity.id)
              console.log('[auth/verify-email.vue] Verified identity ID:', response.identityId)
              console.log('[auth/verify-email.vue] Session matches verified identity:', sessionCheck.identity.id === response.identityId)
            }
          }
        } catch (sessionError: any) {
          if (import.meta.dev) {
            console.warn('[auth/verify-email.vue] Session check failed:', sessionError)
            console.warn('[auth/verify-email.vue] Session error details:', sessionError.response?.data || sessionError.message)
          }
        }
        
        if (hasSession) {
          // Session exists - refresh user data and redirect to OAuth2 authorize
          const { refreshUser } = useUserData()
          await refreshUser()
          
          // Start OAuth2 flow to get Hydra tokens
          toaster.add({
            title: 'Success',
            description: 'Email verified! Redirecting to dashboard...',
            icon: 'ph:check-circle-fill',
            color: 'success',
            progress: true,
          })
          
          // Redirect to OAuth2 authorize endpoint to get tokens
          window.location.href = '/api/auth/oauth/authorize?return_to=/dashboard'
          return
        }
        
        // No session found and no password - redirect to login
        if (import.meta.dev) {
          console.log('[auth/verify-email.vue] No session found and no password, redirecting to login')
        }
        
        toaster.add({
          title: 'Email Verified',
          description: 'Your email has been verified. Please login to continue.',
          icon: 'ph:check-circle-fill',
          color: 'success',
          progress: true,
        })
        
        await router.push({
          path: '/auth/login',
          query: {
            verified: 'true',
            email: email.value,
          },
        })
        return
      } catch (error: any) {
        if (import.meta.dev) {
          console.warn('[auth/verify-email.vue] Error checking session:', error)
        }
      }
      
      // If no session exists and no password from registration, redirect to login
      toaster.add({
        title: 'Email Verified',
        description: 'Your email has been verified. Please login to continue.',
        icon: 'ph:check-circle-fill',
        color: 'success',
        progress: true,
      })
      
      await router.push({
        path: '/auth/login',
        query: {
          verified: 'true',
          email: email.value,
        },
      })
    } else {
      setFieldError('code', response.error || 'Verification failed. Please try again.')
    }
  } catch (error: any) {
    if (error.statusCode === 400 || error.status === 400) {
      const errorMessage = error.data?.message || error.statusMessage || 'Invalid verification code. Please try again.'
      setFieldError('code', errorMessage)
      
      // Show error toast
      toaster.add({
        title: 'Verification Failed',
        description: errorMessage,
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
    } else {
      setFieldError('code', 'Verification failed. Please try again.')
      toaster.add({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
    }
  }
})

const resendCode = async () => {
  if (resendCooldown.value > 0) {
    return
  }

  try {
    const response = await $fetch('/api/auth/resend-verification', {
      method: 'POST',
      body: {
        email: email.value,
      },
      credentials: 'include',
    })

    if (response.success) {
      toaster.add({
        title: 'Code Sent',
        description: 'A new verification code has been sent to your email.',
        icon: 'ph:envelope',
        progress: true,
      })
      
      // Reset cooldown
      resendCooldown.value = 60
    } else {
      toaster.add({
        title: 'Error',
        description: response.error || 'Failed to resend verification code.',
        icon: 'ph:warning',
        color: 'danger',
      })
    }
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: 'Failed to resend verification code. Please try again.',
      icon: 'ph:warning',
      color: 'danger',
    })
  }
}
</script>

<template>
  <div class="dark:bg-muted-800 flex min-h-screen bg-white">
    <div
      class="bg-muted-50 relative flex flex-1 flex-col justify-center px-6 py-12 dark:bg-muted-900 lg:w-1/2 lg:flex-none"
    >
      <div class="mx-auto w-full max-w-sm">
        <NuxtLink
          to="/"
          class="text-muted-400 hover:text-primary-500 dark:text-muted-700 dark:hover:text-primary-500 transition-colors duration-300"
        >
          <div class="flex items-center space-x-2 mb-8">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Icon name="solar:link-linear" class="w-5 h-5 text-white" />
            </div>
            <span class="text-xl font-bold text-primary-600 dark:text-primary-400">SnapLink</span>
          </div>
        </NuxtLink>

        <BaseHeading
          as="h2"
          size="3xl"
          weight="medium"
        >
          Verify Your Email
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-400 mb-6">
          We've sent a 6-digit verification code to
          <span class="font-semibold text-muted-900 dark:text-muted-100">{{ email || 'your email' }}</span>.
          Please enter it below.
        </BaseParagraph>

        <form
          method="POST"
          action=""
          class="space-y-4"
          novalidate
          @submit.prevent="onSubmit"
        >
          <Field
            v-slot="{ field, errorMessage, handleChange, handleBlur }"
            name="code"
          >
            <BaseField
              v-slot="{ inputAttrs, inputRef }"
              label="Verification Code"
              :state="errorMessage ? 'error' : 'idle'"
              :error="errorMessage"
              :disabled="isSubmitting"
              required
            >
              <TairoInput
                :ref="inputRef"
                v-bind="inputAttrs"
                :model-value="field.value"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="6"
                autocomplete="one-time-code"
                rounded="lg"
                icon="solar:shield-check-linear"
                placeholder="000000"
                class="text-center text-2xl font-mono tracking-widest"
                @update:model-value="handleChange"
                @blur="handleBlur"
              />
            </BaseField>
          </Field>

          <BaseButton
            :disabled="isSubmitting"
            :loading="isSubmitting"
            type="submit"
            rounded="lg"
            variant="primary"
            class="h-11! w-full"
          >
            Verify Email
          </BaseButton>

          <div class="text-center">
            <BaseParagraph size="sm" class="text-muted-400">
              Didn't receive the code?
              <BaseButton
                :disabled="resendCooldown > 0"
                type="button"
                variant="link"
                class="text-primary-600 hover:text-primary-500"
                @click="resendCode"
              >
                {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code' }}
              </BaseButton>
            </BaseParagraph>
          </div>
        </form>

        <div class="mt-6 text-center">
          <NuxtLink
            to="/auth/login"
            class="text-muted-400 hover:text-primary-500 text-sm font-medium underline-offset-4 transition duration-150 ease-in-out hover:underline"
          >
            Back to Login
          </NuxtLink>
        </div>
      </div>
    </div>
    <div
      class="bg-muted-100 relative hidden flex-1 flex-col justify-center px-6 py-12 dark:bg-muted-800 lg:flex lg:w-1/2"
    >
      <div class="mx-auto w-full max-w-sm">
        <div class="relative">
          <div
            class="bg-muted-200/20 absolute -top-12 start-20 h-14 w-0 origin-top-left rotate-45 rounded-full transition-all delay-75 duration-300 group-hover:w-48"
          />
          <div
            class="bg-muted-200/20 absolute -bottom-12 end-20 h-14 w-0 origin-bottom-right rotate-45 rounded-full transition-all delay-75 duration-300 group-hover:w-48"
          />
          <div
            class="bg-muted-200/20 absolute -end-7 bottom-24 h-14 w-0 origin-bottom-right rotate-45 rounded-full transition-all delay-[25ms] duration-300 group-hover:w-40"
          />
        </div>
      </div>
    </div>
  </div>
</template>
