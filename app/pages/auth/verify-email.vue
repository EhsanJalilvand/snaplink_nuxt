<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Field, useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  layout: 'empty',
  title: 'Verify Email',
})

const route = useRoute()
const router = useRouter()
const toaster = useNuiToasts()

const VALIDATION_TEXT = {
  TOKEN_REQUIRED: 'Verification token is required',
  EMAIL_REQUIRED: 'Email is required',
}

// Get token and email from URL query params
const token = computed(() => {
  return (route.query.token as string) || ''
})

const email = computed(() => {
  return (route.query.email as string) || ''
})

// This is the Zod schema for the form input
const zodSchema = z.object({
  token: z.string().min(1, VALIDATION_TEXT.TOKEN_REQUIRED),
  email: z.string().email(VALIDATION_TEXT.EMAIL_REQUIRED).optional(),
})

type FormInput = z.infer<typeof zodSchema>

const validationSchema = toTypedSchema(zodSchema)
const initialValues = {
  token: token.value || '',
  email: email.value || '',
} satisfies FormInput

const {
  handleSubmit,
  isSubmitting,
  setFieldError,
} = useForm({
  validationSchema,
  initialValues,
})

// This is where you would send the form data to the server
const onSubmit = handleSubmit(async (values) => {
  try {
    // Call verify email API
    const response = await $fetch('/api/auth/verify-email', {
      method: 'POST',
      body: {
        token: values.token || token.value,
        email: values.email || email.value,
      },
    })

    if (response.success) {
      toaster.add({
        title: 'Success',
        description: 'Email verified successfully. You can now login.',
        icon: 'ph:check-circle',
        progress: true,
      })
      
      // Redirect to login after successful verification
      await router.push('/auth/login')
    }
  } catch (error: any) {
    // Handle errors
    if (error.statusCode === 429) {
      toaster.add({
        title: 'Too Many Requests',
        description: error.message || 'Too many verification attempts. Please try again later.',
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
      } else {
        setFieldError('token', error.message || 'Invalid verification token')
      }
    } else {
      setFieldError('token', error.message || 'Email verification failed. Please try again.')
    }
  }
})

const resendVerification = async () => {
  try {
    // TODO: Implement resend verification email endpoint
    // For now, redirect to registration
    router.push('/auth/register')
    
    toaster.add({
      title: 'Info',
      description: 'Please register again to receive a new verification email',
      icon: 'ph:info',
      progress: true,
    })
  } catch {
    // handle error
  }
}
</script>

<template>
  <div
    class="bg-muted-100 dark:bg-muted-900 relative min-h-screen w-full overflow-hidden px-4 dark:[--color-input-default-bg:var(--color-muted-950)]"
  >
    <div
      class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4"
    >
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
    <div class="flex w-full items-center justify-center">
      <div class="relative mx-auto w-full max-w-2xl">
        <!-- Form -->
        <div class="me-auto ms-auto mt-4 w-full">
          <div class="me-auto ms-auto mt-4 w-full max-w-md">
            <div class="text-center">
              <BaseHeading
                as="h2"
                size="3xl"
                weight="medium"
              >
                Verify Your Email
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-400 mb-6">
                <span v-if="email">We've sent a verification email to <strong>{{ email }}</strong></span>
                <span v-else>Please click the verification link in your email, or enter your email below to verify.</span>
              </BaseParagraph>
            </div>
            <form
              method="POST"
              action=""
              class="px-8 py-4"
              novalidate
              @submit.prevent="onSubmit"
            >
              <div class="mb-4 space-y-4">
                <Field
                  v-if="!token"
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
                    <BaseInput
                      :ref="inputRef"
                      v-bind="inputAttrs"
                      :model-value="field.value"
                      type="email"
                      autocomplete="email"
                      @update:model-value="handleChange"
                      @blur="handleBlur"
                    />
                  </BaseField>
                </Field>
                
                <Field
                  v-if="!token"
                  v-slot="{ field, errorMessage, handleChange, handleBlur }"
                  name="token"
                >
                  <BaseField
                    v-slot="{ inputAttrs, inputRef }"
                    label="Verification Token (Optional)"
                    :state="errorMessage ? 'error' : 'idle'"
                    :error="errorMessage"
                    :disabled="isSubmitting"
                  >
                    <BaseInput
                      :ref="inputRef"
                      v-bind="inputAttrs"
                      :model-value="field.value"
                      placeholder="Enter verification token from email"
                      @update:model-value="handleChange"
                      @blur="handleBlur"
                    />
                  </BaseField>
                </Field>
              </div>

              <div class="mb-6">
                <BaseButton
                  :disabled="isSubmitting || (!token && !email)"
                  :loading="isSubmitting"
                  type="submit"
                  variant="primary"
                  class="h-12! w-full"
                >
                  Verify Email
                </BaseButton>
              </div>

              <div class="text-center">
                <BaseParagraph size="sm" class="text-muted-400 mb-4">
                  Didn't receive the email?
                </BaseParagraph>
                <BaseButton
                  variant="outline"
                  class="h-10! w-full"
                  @click="resendVerification"
                >
                  Resend Verification Email
                </BaseButton>
              </div>

              <!-- Back to login link -->
              <p
                class="text-muted-400 mt-4 flex justify-between font-sans text-sm leading-5"
              >
                <span>Wrong email?</span>
                <NuxtLink
                  to="/auth/register"
                  class="text-primary-600 hover:text-primary-500 font-medium underline-offset-4 transition duration-150 ease-in-out hover:underline"
                >
                  Register Again
                </NuxtLink>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
