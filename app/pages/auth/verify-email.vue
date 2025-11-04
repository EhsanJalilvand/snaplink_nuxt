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
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Refresh user data to get updated email verification status
      const { refreshUser } = useUserData()
      await refreshUser()
      
      // Redirect to dashboard (middleware will check email verification)
      await router.push('/dashboard')
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
