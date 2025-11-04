<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Field, useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  layout: 'empty',
  title: 'Register',
  ssr: false,
})

const VALIDATION_TEXT = {
  EMAIL_REQUIRED: 'A valid email is required',
  USERNAME_LENGTH: 'Username must be at least 3 characters',
  PASSWORD_LENGTH: 'Password must be at least 6 characters',
  PASSWORD_CONTAINS_EMAIL: 'Password cannot contain your email',
  PASSWORD_MATCH: 'Passwords do not match',
  TERMS_REQUIRED: 'You must agree to the terms and conditions',
}

// This is the Zod schema for the form input
const zodSchema = z
  .object({
    email: z.string().email(VALIDATION_TEXT.EMAIL_REQUIRED),
    password: z.string().min(6, VALIDATION_TEXT.PASSWORD_LENGTH),
    confirmPassword: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    terms: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_TEXT.PASSWORD_MATCH,
        path: ['confirmPassword'],
      })
    }
    if (!data.terms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_TEXT.TERMS_REQUIRED,
        path: ['terms'],
      })
    }
  })

type FormInput = z.infer<typeof zodSchema>

const validationSchema = toTypedSchema(zodSchema)
const initialValues = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  terms: false,
} satisfies FormInput

const { values, handleSubmit, isSubmitting, setFieldError } = useForm({
  validationSchema,
  initialValues,
})

const router = useRouter()
const toaster = useNuiToasts()
const { startOAuth2Flow } = useAuth()

// This is where you would send the form data to the server
const onSubmit = handleSubmit(async (_values) => {
  try {
    // Use server-side endpoint to handle registration
    // This avoids CORS issues and handles Kratos flow properly
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        email: values.email,
        password: values.password,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
      },
      credentials: 'include',
    })

          if (response.success) {
            // Wait a moment for Kratos to fully process the identity
            // This ensures the identity is ready before sending verification email
            // Increased delay to ensure database transaction is committed
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // Create a new browser verification flow from client-side
            // This ensures CSRF cookies are set properly in the browser
            const config = useRuntimeConfig()
            const userEmail = response.email || values.email
            
            try {
              // Create a new browser verification flow (like login.vue does)
              // This sets CSRF cookie in browser properly
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
                  // Wait another moment before sending verification request
                  // This ensures Kratos has fully indexed the new identity
                  await new Promise(resolve => setTimeout(resolve, 500))
                  
                  // Submit verification request to send code to email
                  // This is the same approach as login.vue
                  const verifyResponse = await $fetch(`${config.public.kratosPublicUrl}/self-service/verification?flow=${verificationFlow.id}`, {
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
                    // Log error but continue - user can still request code manually
                    if (import.meta.dev) {
                      console.error('[auth/register.vue] Failed to send verification email automatically:', error)
                      console.error('[auth/register.vue] Error details:', error.response?.data || error.data)
                    }
                    throw error
                  })
                  
                  if (import.meta.dev) {
                    console.log('[auth/register.vue] Verification email sent successfully:', verifyResponse)
                  }
                }
                
                // Verification code sent - redirect to verify page
                toaster.add({
                  title: 'Success',
                  description: 'Account created! Please verify your email.',
                  icon: 'ph:envelope',
                  progress: true,
                })
                
                // Redirect to verify email page with flow ID and email
                await router.push({
                  path: '/auth/verify-email',
                  query: {
                    flow: verificationFlow.id,
                    email: userEmail,
                  },
                })
              } else {
                // Flow creation failed - still redirect to verify page
                toaster.add({
                  title: 'Success',
                  description: 'Account created! Please verify your email.',
                  icon: 'ph:check-circle',
                  progress: true,
                })
                
                await router.push({
                  path: '/auth/verify-email',
                  query: {
                    email: userEmail,
                  },
                })
              }
            } catch (emailError: any) {
              // Log error but continue - user can still request code manually
              if (import.meta.dev) {
                console.warn('[auth/register.vue] Failed to create verification flow:', emailError)
              }
              
              // Still redirect to verify email page (user can request new code)
              toaster.add({
                title: 'Success',
                description: 'Account created! Please verify your email.',
                icon: 'ph:check-circle',
                progress: true,
              })
              
              await router.push({
                path: '/auth/verify-email',
                query: {
                  email: userEmail,
                },
              })
            }
          }
  } catch (error: any) {
    // Handle errors
    if (error.statusCode === 429) {
      toaster.add({
        title: 'Too Many Requests',
        description: error.message || 'Too many registration attempts. Please try again later.',
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
    } else if (error.statusCode === 400) {
      // Handle validation errors
      if (error.data) {
        const errors = error.data as Array<{ path: string[]; message: string }>
        errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            setFieldError(err.path[0] as keyof FormInput, err.message)
          }
        })
      } else if (error.message) {
        // Handle specific errors like "Email is already registered"
        if (error.message.includes('email') || error.message.includes('Email')) {
          setFieldError('email', 'Email is already registered')
        } else {
          setFieldError('email', error.message)
        }
      }
    } else {
      setFieldError('email', error.message || 'Registration failed. Please try again.')
    }
  }
})

// Google OAuth registration
const registerWithGoogle = async () => {
  try {
    // Start OAuth2 flow with Google provider
    // This will redirect to Hydra, which will handle Google OAuth
    await startOAuth2Flow('/dashboard')
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to start Google registration',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
  }
}
</script>

<template>
  <div class="h-screen md:flex dark:[--color-input-default-bg:var(--color-muted-950)]">
    <div
      class="from-primary-900 to-primary-500 i group relative hidden w-1/2 items-center justify-around overflow-hidden bg-gradient-to-tr md:flex"
    >
      <div class="mx-auto max-w-xs text-center">
        <BaseHeading
          as="h2"
          size="3xl"
          weight="medium"
          class="text-white"
        >
          Have an Account?
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-200 mb-3">
          No need to waste time on this page, let's take you back to your
          account
        </BaseParagraph>
        <BaseButton
          to="/auth/login"
          rounded="lg"
          class="w-full"
        >
          Login to Account
        </BaseButton>
      </div>
      <div
        class="bg-muted-200/20 absolute -start-6 -top-6 h-14 w-0 origin-top-left rotate-45 rounded-full transition-all delay-[25ms] duration-300 group-hover:w-72"
      />
      <div
        class="bg-muted-200/20 absolute -top-12 start-20 h-14 w-0 origin-top-left rotate-45 rounded-full transition-all delay-75 duration-300 group-hover:w-48"
      />
      <div
        class="bg-muted-200/20 absolute -start-7 top-24 h-14 w-0 origin-top-left rotate-45 rounded-full transition-all delay-150 duration-300 group-hover:w-40"
      />

      <div
        class="bg-muted-200/20 absolute -bottom-6 -end-6 h-14 w-0 origin-bottom-right rotate-45 rounded-full transition-all delay-150 duration-300 group-hover:w-72"
      />
      <div
        class="bg-muted-200/20 absolute -bottom-12 end-20 h-14 w-0 origin-bottom-right rotate-45 rounded-full transition-all delay-75 duration-300 group-hover:w-48"
      />
      <div
        class="bg-muted-200/20 absolute -end-7 bottom-24 h-14 w-0 origin-bottom-right rotate-45 rounded-full transition-all delay-[25ms] duration-300 group-hover:w-40"
      />
    </div>
    <div
      class="dark:bg-muted-900 flex flex-col items-center justify-between bg-white py-10 md:w-1/2"
    >
      <div class="mx-auto flex w-full max-w-xs items-center justify-between">
        <NuxtLink
          to="/"
          class="text-muted-400 hover:text-primary-500 dark:text-muted-700 dark:hover:text-primary-500 transition-colors duration-300"
        >
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Icon name="solar:link-linear" class="w-5 h-5 text-white" />
            </div>
            <span class="text-xl font-bold text-primary-600 dark:text-primary-400">SnapLink</span>
          </div>
        </NuxtLink>
        <div>
          <BaseThemeToggle />
        </div>
      </div>
      <form
        method="POST"
        action=""
        class="mx-auto w-full max-w-xs"
        novalidate
        @submit.prevent="onSubmit"
      >
        <BaseHeading
          as="h2"
          size="3xl"
          weight="medium"
        >
          Welcome to SnapLink
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-400 mb-6">
          Let's start by creating you account
        </BaseParagraph>

        <!-- Social Login Buttons -->
        <div class="mb-6">
          <BaseButton
            :disabled="isSubmitting"
            :loading="isSubmitting"
            type="button"
            variant="pastel"
            rounded="lg"
            class="w-full"
            @click="registerWithGoogle"
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
            <span class="bg-white dark:bg-muted-900 px-2 text-muted-500">
              Or sign up with email
            </span>
          </div>
        </div>

        <div class="mb-4 space-y-3">
          <!-- First Name and Last Name at the top -->
          <div class="grid grid-cols-2 gap-3">
            <Field
              v-slot="{ field, errorMessage, handleChange, handleBlur }"
              name="firstName"
            >
              <BaseField
                v-slot="{ inputAttrs, inputRef }"
                label="First Name (Optional)"
                :state="errorMessage ? 'error' : 'idle'"
                :error="errorMessage"
                :disabled="isSubmitting"
              >
                <TairoInput
                  :ref="inputRef"
                  v-bind="inputAttrs"
                  :model-value="field.value"
                  autocomplete="given-name"
                  rounded="lg"
                  icon="solar:user-linear"
                  @update:model-value="handleChange"
                  @blur="handleBlur"
                />
              </BaseField>
            </Field>
            <Field
              v-slot="{ field, errorMessage, handleChange, handleBlur }"
              name="lastName"
            >
              <BaseField
                v-slot="{ inputAttrs, inputRef }"
                label="Last Name (Optional)"
                :state="errorMessage ? 'error' : 'idle'"
                :error="errorMessage"
                :disabled="isSubmitting"
              >
                <TairoInput
                  :ref="inputRef"
                  v-bind="inputAttrs"
                  :model-value="field.value"
                  autocomplete="family-name"
                  rounded="lg"
                  icon="solar:user-linear"
                  @update:model-value="handleChange"
                  @blur="handleBlur"
                />
              </BaseField>
            </Field>
          </div>
          <Field
            v-slot="{ field, errorMessage, handleChange, handleBlur }"
            name="email"
          >
            <BaseField
              v-slot="{ inputAttrs, inputRef }"
              label="Email Address"
              :state="errorMessage ? 'error' : 'idle'"
              :error="errorMessage"
              :disabled="isSubmitting"
              required
            >
              <TairoInput
                :ref="inputRef"
                v-bind="inputAttrs"
                :model-value="field.value"
                type="email"
                autocomplete="email"
                rounded="lg"
                icon="solar:mention-circle-linear"
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
              <TairoInput
                :ref="inputRef"
                v-bind="inputAttrs"
                :model-value="field.value"
                type="password"
                autocomplete="new-password"
                rounded="lg"
                icon="solar:lock-keyhole-linear"
                @update:model-value="handleChange"
                @blur="handleBlur"
              />
            </BaseField>
          </Field>
          <Field
            v-slot="{ field, errorMessage, handleChange, handleBlur }"
            name="confirmPassword"
          >
            <BaseField
              v-slot="{ inputAttrs, inputRef }"
              label="Confirm password"
              :state="errorMessage ? 'error' : 'idle'"
              :error="errorMessage"
              :disabled="isSubmitting"
              required
            >
              <TairoInput
                :ref="inputRef"
                v-bind="inputAttrs"
                :model-value="field.value"
                type="password"
                rounded="lg"
                icon="ph:check"
                @update:model-value="handleChange"
                @blur="handleBlur"
              />
            </BaseField>
          </Field>
        </div>

        <div class="mb-4">
          <Field
            v-slot="{ field, errorMessage, handleChange, handleBlur }"
            name="terms"
          >
            <BaseCheckbox
              :model-value="field.value"
              :disabled="isSubmitting"
              :error="errorMessage"
              variant="default"
              @update:model-value="handleChange"
              @blur="handleBlur"
            >
              <span>
                <span>
                  I accept the
                </span>
                <a
                  href="#"
                  class="text-primary-500 hover:underline focus:underline"
                >Terms of Service</a>
              </span>
            </BaseCheckbox>
          </Field>
        </div>

        <BaseButton
          :disabled="isSubmitting"
          :loading="isSubmitting"
          type="submit"
          rounded="lg"
          variant="primary"
          class="h-11! w-full"
        >
          Create Account
        </BaseButton>
        <!-- No account link -->
        <p
          class="text-muted-400 mt-4 flex justify-between font-sans text-sm leading-5"
        >
          <span>Have an account?</span>
          <NuxtLink
            to="/auth/login"
            class="text-primary-600 hover:text-primary-500 font-medium underline-offset-4 transition duration-150 ease-in-out hover:underline focus:underline focus:outline-none"
          >
            Login here
          </NuxtLink>
        </p>
      </form>
      <div class="text-center">
        <BaseText size="sm" class="text-muted-400">
          © {{ new Date().getFullYear() }} SnapLink. All rights reserved.
        </BaseText>
      </div>
    </div>
  </div>
</template>
