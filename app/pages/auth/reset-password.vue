<script setup lang="ts">
import type { AddonInputPassword } from '#components'
import { toTypedSchema } from '@vee-validate/zod'
import { Field, useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  layout: 'empty',
  title: 'Reset Password',
})

const passwordRef = ref<InstanceType<typeof AddonInputPassword>>()

const VALIDATION_TEXT = {
  PASSWORD_LENGTH: 'Password must be at least 8 characters',
  PASSWORD_MATCH: 'Passwords do not match',
}

// This is the Zod schema for the form input
const zodSchema = z
  .object({
    password: z.string().min(8, VALIDATION_TEXT.PASSWORD_LENGTH),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    // This is a custom validation function that will be called
    // before the form is submitted
    if (passwordRef.value?.validation?.feedback?.warning || passwordRef.value?.validation?.feedback?.suggestions?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: passwordRef.value?.validation?.feedback?.warning || passwordRef.value.validation.feedback?.suggestions?.[0],
        path: ['password'],
      })
    }
    if (data.password !== data.confirmPassword) {
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
  password: '',
  confirmPassword: '',
} satisfies FormInput

const { values, handleSubmit, isSubmitting } = useForm({
  validationSchema,
  initialValues,
})

const router = useRouter()
const { resetPassword } = useAuth()

// This is where you would send the form data to the server
const onSubmit = handleSubmit(async (_values) => {
  // In a real app, you'd get the token from the URL params
  const token = 'reset-token-123' // This would come from the URL
  
  const result = await resetPassword(token, values.password)
  
  if (result.success) {
    router.push('/auth/login')
  } else {
    setFieldError('password', result.error || 'Password reset failed')
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
                  name="password"
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
