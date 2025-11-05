<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Field, useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  layout: 'empty',
  title: 'Verify 2FA',
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

const loginFlowId = ref<string>('')
const returnTo = ref<string>('/dashboard')

// Get flow ID and return_to from query params
onMounted(() => {
  const queryFlowId = route.query.flow as string
  const queryReturnTo = route.query.return_to as string
  
  if (queryFlowId) {
    loginFlowId.value = queryFlowId
  }
  
  if (queryReturnTo) {
    // Parse return_to - if it's a full URL, extract the path
    try {
      const url = new URL(queryReturnTo)
      // If it's a full URL, use only the pathname
      returnTo.value = url.pathname + (url.search || '') + (url.hash || '')
    } catch {
      // If it's not a valid URL, use it as is (should be a path like /dashboard)
      returnTo.value = queryReturnTo.startsWith('/') ? queryReturnTo : `/${queryReturnTo}`
    }
  }
  
  // If no flow ID, redirect to login
  if (!loginFlowId.value) {
    toaster.add({
      title: 'Error',
      description: 'Invalid verification flow. Please login again.',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
    router.push('/auth/login')
  }
})

const onSubmit = handleSubmit(async (formValues) => {
  try {
    const config = useRuntimeConfig()
    
    // Always create a fresh flow with AAL2 and refresh=true to ensure we have the right flow
    let csrfToken: string | null = null
    let flowId = loginFlowId.value
    
    try {
      // Create a new flow with AAL2 requirement and refresh=true
      const flowResponse = await $fetch(`${config.public.kratosPublicUrl}/self-service/login/browser?aal=aal2&return_to=${encodeURIComponent(returnTo.value)}&refresh=true`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (import.meta.dev) {
        console.log('[auth/verify-2fa.vue] Flow response:', flowResponse)
        console.log('[auth/verify-2fa.vue] Flow state:', flowResponse?.state)
        console.log('[auth/verify-2fa.vue] Requested AAL:', flowResponse?.requested_aal)
      }
      
      // Check if flow has TOTP nodes
      const totpNodes = flowResponse?.ui?.nodes?.filter((node: any) => node.group === 'totp') || []
      
      if (totpNodes.length === 0) {
        setFieldError('code', 'TOTP method not available in this flow. Please try logging in again.')
        return
      }
      
      flowId = flowResponse.id
      loginFlowId.value = flowId
      
      csrfToken = flowResponse?.ui?.nodes?.find(
        (node: any) => node.attributes?.name === 'csrf_token'
      )?.attributes?.value
      
      if (!csrfToken) {
        setFieldError('code', 'Failed to get CSRF token. Please refresh the page and try again.')
        return
      }
    } catch (flowError: any) {
      if (import.meta.dev) {
        console.error('[auth/verify-2fa.vue] Failed to create flow:', flowError)
        console.error('[auth/verify-2fa.vue] Error data:', flowError.data)
      }
      
      // Check if error has redirect_browser_to
      if (flowError.data?.redirect_browser_to) {
        const redirectUrl = flowError.data.redirect_browser_to
        if (redirectUrl.includes('aal=aal2')) {
          // Extract flow from redirect URL
          const url = new URL(redirectUrl)
          const flowParam = url.searchParams.get('flow')
          if (flowParam) {
            flowId = flowParam
            loginFlowId.value = flowId
            
            // Try to get CSRF token from this flow
            try {
              const redirectFlow = await $fetch(`${config.public.kratosPublicUrl}/self-service/login/browser?flow=${flowId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                  'Accept': 'application/json',
                },
              })
              
              csrfToken = redirectFlow?.ui?.nodes?.find(
                (node: any) => node.attributes?.name === 'csrf_token'
              )?.attributes?.value
            } catch (e) {
              // Ignore
            }
          }
        }
      }
      
      if (!csrfToken) {
        setFieldError('code', 'Failed to initialize 2FA flow. Please try again.')
        return
      }
    }
    
    // Verify TOTP code
    const response = await $fetch(`${config.public.kratosPublicUrl}/self-service/login?flow=${flowId}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: {
        method: 'totp',
        totp_code: formValues.code,
        csrf_token: csrfToken,
      },
    })
    
    if (response?.session) {
      // 2FA verified successfully
      toaster.add({
        title: 'Success',
        description: '2FA verified successfully!',
        icon: 'ph:check-circle-fill',
        color: 'success',
        progress: true,
      })
      
      // Refresh user data
      const { refreshUser } = useUserData()
      await refreshUser()
      
      // Redirect to OAuth2 authorize endpoint
      window.location.href = `/api/auth/oauth/authorize?return_to=${encodeURIComponent(returnTo.value)}`
    } else if (response?.redirect_browser_to) {
      // Check if redirect is for AAL2 (still need 2FA)
      const redirectUrl = response.redirect_browser_to
      if (redirectUrl.includes('aal=aal2')) {
        // Still need 2FA - update flow ID
        const url = new URL(redirectUrl)
        const flowParam = url.searchParams.get('flow')
        if (flowParam) {
          loginFlowId.value = flowParam
          setFieldError('code', 'Invalid code. Please try again.')
        } else {
          setFieldError('code', 'Invalid code. Please try again.')
        }
      } else {
        // Redirect to dashboard
        window.location.href = redirectUrl
      }
    } else {
      // Check for errors
      const errorMessage = response?.ui?.messages?.find((m: any) => m.type === 'error')?.text
      setFieldError('code', errorMessage || 'Invalid code. Please try again.')
      
      toaster.add({
        title: 'Verification Failed',
        description: errorMessage || 'Invalid code. Please try again.',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
    }
  } catch (error: any) {
    if (error.statusCode === 400 || error.status === 400) {
      // Check for error messages in response
      const errorData = error.response?.data || error.data || {}
      const errorMessages = errorData.ui?.messages || []
      const errorMessage = errorMessages.find((m: any) => m.type === 'error')?.text || 
                          error.statusMessage || 
                          'Invalid verification code. Please try again.'
      
      setFieldError('code', errorMessage)
      
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

        <div class="text-center mb-6">
          <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
            <Icon name="ph:shield-check" class="size-8 text-primary-600 dark:text-primary-400" />
          </div>
          <BaseHeading
            as="h2"
            size="3xl"
            weight="medium"
          >
            Two-Factor Authentication
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-400 mt-2">
            Enter the 6-digit code from your authenticator app to continue
          </BaseParagraph>
        </div>

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
                icon="ph:key"
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
            Verify Code
          </BaseButton>
        </form>

        <div class="mt-6 text-center">
          <BaseParagraph size="sm" class="text-muted-400">
            <Icon name="ph:info" class="size-4 inline mr-1" />
            Having trouble? Make sure the time on your device is synchronized
          </BaseParagraph>
        </div>

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

