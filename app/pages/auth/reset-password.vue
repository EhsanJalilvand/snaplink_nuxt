<script setup lang="ts">
import type { AddonInputPassword } from '#components'
import { toTypedSchema } from '@vee-validate/zod'
import { Field, useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  layout: 'empty',
  title: 'Reset Password',
})

const route = useRoute()
const router = useRouter()
const toaster = useNuiToasts()

const passwordRef = ref<InstanceType<typeof AddonInputPassword>>()

const VALIDATION_TEXT = {
  PASSWORD_LENGTH: 'Password must be at least 8 characters',
  PASSWORD_MATCH: 'Passwords do not match',
}

// Get token from URL query params
const token = computed(() => {
  return (route.query.token as string) || ''
})

// This is the Zod schema for the form input
const zodSchema = z
  .object({
    newPassword: z.string().min(8, VALIDATION_TEXT.PASSWORD_LENGTH),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    // This is a custom validation function that will be called
    // before the form is submitted
    if (passwordRef.value?.validation?.feedback?.warning || passwordRef.value?.validation?.feedback?.suggestions?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: passwordRef.value?.validation?.feedback?.warning || passwordRef.value.validation.feedback?.suggestions?.[0],
        path: ['newPassword'],
      })
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_TEXT.PASSWORD_MATCH,
        path: ['confirmPassword'],
      })
    }
  })

type FormInput = z.infer<typeof zodSchema>

const validationSchema = toTypedSchema(zodSchema)
const initialValues = {
  newPassword: '',
  confirmPassword: '',
} satisfies FormInput

const { values, handleSubmit, isSubmitting, setFieldError } = useForm({
  validationSchema,
  initialValues,
})

// Check if token exists on mount
onMounted(() => {
  if (!token.value) {
    toaster.add({
      title: 'Invalid Link',
      description: 'Reset token is missing. Please request a new password reset.',
      icon: 'ph:warning',
      color: 'warning',
      progress: true,
    })
    router.push('/auth/forgot-password')
  }
})

// This is where you would send the form data to the server
const onSubmit = handleSubmit(async (_values) => {
  if (!token.value) {
    setFieldError('newPassword', 'Reset token is missing')
    return
  }

  try {
    // Call reset password API
    const response = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      },
    })

    if (response.success) {
      toaster.add({
        title: 'Success',
        description: 'Password reset successfully. Please login with your new password.',
        icon: 'ph:check-circle',
        progress: true,
      })
      
      // Redirect to login after successful reset
      await router.push('/auth/login')
    }
  } catch (error: any) {
    // Handle errors
    if (error.statusCode === 429) {
      toaster.add({
        title: 'Too Many Requests',
        description: error.message || 'Too many password reset attempts. Please try again later.',
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
        setFieldError('newPassword', error.message || 'Invalid or expired reset token')
      }
    } else {
      setFieldError('newPassword', error.message || 'Password reset failed. Please try again.')
    }
  }
})
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
              <BaseIconBox
                variant="none"
                size="md"
                class="mx-auto mb-4"
              >
                <Icon name="ph:key" class="size-8 text-primary-500" />
              </BaseIconBox>
              <BaseHeading
                as="h2"
                size="3xl"
                weight="medium"
              >
                Reset Password
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-400 mb-6">
                Enter your new password below
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
                  v-slot="{ field, errorMessage, handleChange, handleBlur }"
                  name="newPassword"
                >
                  <BaseField
                    v-slot="{ inputAttrs }"
                    label="New Password"
                    :state="errorMessage ? 'error' : 'idle'"
                    :error="errorMessage"
                    :disabled="isSubmitting"
                    required
                  >
                    <LazyAddonInputPassword
                      ref="passwordRef"
                      v-bind="inputAttrs"
                      :model-value="field.value"
                      :error="errorMessage"
                      :disabled="isSubmitting"
                      placeholder="••••••••••"
                      icon="solar:lock-keyhole-linear"
                      class="border-s-0 rounded-s-none ring-0!"
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
                    label="Confirm New Password"
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
                      placeholder="••••••••••"
                      @update:model-value="handleChange"
                      @blur="handleBlur"
                    />
                  </BaseField>
                </Field>
              </div>

              <div class="mb-6">
                <BaseButton
                  :disabled="isSubmitting"
                  :loading="isSubmitting"
                  type="submit"
                  variant="primary"
                  class="h-12! w-full"
                >
                  Reset Password
                </BaseButton>
              </div>

              <!-- Back to login link -->
              <p
                class="text-muted-400 mt-4 flex justify-between font-sans text-sm leading-5"
              >
                <span>Remember your password?</span>
                <NuxtLink
                  to="/auth/login"
                  class="text-primary-600 hover:text-primary-500 font-medium underline-offset-4 transition duration-150 ease-in-out hover:underline"
                >
                  Back to Login
                </NuxtLink>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
