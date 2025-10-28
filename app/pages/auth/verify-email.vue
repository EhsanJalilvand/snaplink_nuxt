<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Field, useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  layout: 'empty',
  title: 'Verify Email',
})

const VALIDATION_TEXT = {
  CODE_REQUIRED: 'Verification code is required',
  CODE_LENGTH: 'Code must be 6 digits',
}

// This is the Zod schema for the form input
const zodSchema = z.object({
  code: z.string().min(6, VALIDATION_TEXT.CODE_LENGTH).max(6, VALIDATION_TEXT.CODE_LENGTH),
})

type FormInput = z.infer<typeof zodSchema>

const validationSchema = toTypedSchema(zodSchema)
const initialValues = {
  code: '',
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
const { verifyEmail } = useAuth()
const email = ref('user@example.com') // This would come from the registration process

// This is where you would send the form data to the server
const onSubmit = handleSubmit(async (values) => {
  const result = await verifyEmail(values.code)
  
  if (result.success) {
    router.push('/auth/login')
  } else {
    setFieldError('code', result.error || 'Invalid verification code')
  }
})

const resendCode = async () => {
  try {
    // Simulate API call to resend code
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toaster.add({
      title: 'Code Sent',
      description: 'A new verification code has been sent to your email',
      icon: 'ph:envelope',
      progress: true,
    })
  }
  catch {
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
                We've sent a verification code to <strong>{{ email }}</strong>
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
                    <BaseInput
                      :ref="inputRef"
                      v-bind="inputAttrs"
                      :model-value="field.value"
                      placeholder="123456"
                      maxlength="6"
                      class="text-center text-2xl tracking-widest"
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
                  Verify Email
                </BaseButton>
              </div>

              <div class="text-center">
                <BaseParagraph size="sm" class="text-muted-400 mb-4">
                  Didn't receive the code?
                </BaseParagraph>
                <BaseButton
                  variant="outline"
                  class="h-10! w-full"
                  @click="resendCode"
                >
                  Resend Code
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
