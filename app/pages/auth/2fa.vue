<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Field, useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  layout: 'empty',
  title: 'Two-Factor Authentication',
})

const VALIDATION_TEXT = {
  CODE_REQUIRED: 'Authentication code is required',
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
const { verify2FA } = useAuth()
const twoFaMethod = ref('email') // email, sms, app

// This is where you would send the form data to the server
const onSubmit = handleSubmit(async (values) => {
  const result = await verify2FA(values.code, twoFaMethod.value as 'email' | 'sms' | 'app')
  
  if (result.success) {
    router.push('/dashboard')
  } else {
    setFieldError('code', result.error || 'Invalid authentication code')
  }
})

const resendCode = async () => {
  try {
    // Simulate API call to resend code
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toaster.add({
      title: 'Code Sent',
      description: `A new authentication code has been sent via ${twoFaMethod.value}`,
      icon: 'ph:envelope',
      progress: true,
    })
  }
  catch {
    // handle error
  }
}

const getMethodDescription = () => {
  switch (twoFaMethod.value) {
    case 'email':
      return 'We\'ve sent a verification code to your email address'
    case 'sms':
      return 'We\'ve sent a verification code to your phone number'
    case 'app':
      return 'Enter the code from your authenticator app'
    default:
      return 'Enter your authentication code'
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
              <BaseIconBox
                variant="none"
                size="md"
                class="mx-auto mb-4"
              >
                <Icon name="ph:shield-check" class="size-8 text-primary-500" />
              </BaseIconBox>
              <BaseHeading
                as="h2"
                size="3xl"
                weight="medium"
              >
                Two-Factor Authentication
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-400 mb-6">
                {{ getMethodDescription() }}
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
                    label="Authentication Code"
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
                  Verify Code
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

              <!-- Method selection -->
              <div class="mt-6">
                <BaseParagraph size="sm" class="text-muted-400 mb-3 text-center">
                  Use a different method:
                </BaseParagraph>
                <div class="flex justify-center gap-2">
                  <BaseButton
                    variant="outline"
                    size="sm"
                    :class="{ 'bg-primary-50 border-primary-200': twoFaMethod === 'email' }"
                    @click="twoFaMethod = 'email'"
                  >
                    <Icon name="ph:envelope" class="size-4" />
                    Email
                  </BaseButton>
                  <BaseButton
                    variant="outline"
                    size="sm"
                    :class="{ 'bg-primary-50 border-primary-200': twoFaMethod === 'sms' }"
                    @click="twoFaMethod = 'sms'"
                  >
                    <Icon name="ph:phone" class="size-4" />
                    SMS
                  </BaseButton>
                  <BaseButton
                    variant="outline"
                    size="sm"
                    :class="{ 'bg-primary-50 border-primary-200': twoFaMethod === 'app' }"
                    @click="twoFaMethod = 'app'"
                  >
                    <Icon name="ph:device-mobile" class="size-4" />
                    App
                  </BaseButton>
                </div>
              </div>

              <!-- Back to login link -->
              <p
                class="text-muted-400 mt-4 flex justify-between font-sans text-sm leading-5"
              >
                <span>Having trouble?</span>
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
