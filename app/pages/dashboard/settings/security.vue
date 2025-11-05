<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Field, useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  title: 'Security Settings',
  layout: 'dashboard',
})

const VALIDATION_TEXT = {
  NEW_PASSWORD_LENGTH: 'Password must be at least 8 characters with letters and numbers',
  NEW_PASSWORD_MATCH: 'Passwords do not match',
}

// This is the Zod schema for the form input
const zodSchema = z
  .object({
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Only validate password fields if at least one is provided
    const hasPasswordFields = !!(data.newPassword || data.confirmPassword)
    
    if (hasPasswordFields) {
      if (!data.newPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VALIDATION_TEXT.NEW_PASSWORD_LENGTH,
          path: ['newPassword'],
        })
      } else {
        // Validate password strength only if password is provided
        if (data.newPassword.length < 8) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: VALIDATION_TEXT.NEW_PASSWORD_LENGTH,
            path: ['newPassword'],
          })
        }
        if (!/[A-Za-z]/.test(data.newPassword)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password must contain at least one letter',
            path: ['newPassword'],
          })
        }
        if (!/[0-9]/.test(data.newPassword)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password must contain at least one number',
            path: ['newPassword'],
          })
        }
      }
      if (data.newPassword && data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VALIDATION_TEXT.NEW_PASSWORD_MATCH,
          path: ['confirmPassword'],
        })
      }
    }
  })

type FormInput = z.infer<typeof zodSchema>

const validationSchema = toTypedSchema(zodSchema)
const initialValues = {
  newPassword: '',
  confirmPassword: '',
} satisfies FormInput

const {
  handleSubmit,
  isSubmitting,
  setFieldError,
  resetForm,
  values,
} = useForm({
  validationSchema,
  initialValues,
})

const success = ref(false)
const toaster = useNuiToasts()

// 2FA state
const twoFactorEnabled = ref(false)
const isTwoFactorLoading = ref(false)
const isSetupLoading = ref(false)

// 2FA Setup Wizard
const show2FAWizard = ref(false)

// Define 2FA wizard data type
interface TwoFAWizardData {
  qrCode: string
  secret: string
  flowId: string
  csrfToken: string
  verifyCode: string
}

interface TwoFAWizardStepMeta {
  name: string
  title: string
  subtitle?: string
}

// Manual step management for modal (not using routes)
const wizardCurrentStepId = ref(0)

// Define wizard steps
const wizardSteps: Array<{ id: number; meta: TwoFAWizardStepMeta }> = [
  {
    id: 0,
    meta: {
      name: 'Scan QR Code',
      title: 'Scan QR Code',
      subtitle: 'Open your authenticator app and scan the QR code below',
    },
  },
  {
    id: 1,
    meta: {
      name: 'Verify Code',
      title: 'Enter Verification Code',
      subtitle: 'Enter the 6-digit code from your authenticator app',
    },
  },
  {
    id: 2,
    meta: {
      name: 'Success',
      title: '2FA Enabled Successfully!',
      subtitle: 'Your account is now protected with two-factor authentication',
    },
  },
]

// Wizard state
const wizardData = ref<TwoFAWizardData>({
  qrCode: '',
  secret: '',
  flowId: '',
  csrfToken: '',
  verifyCode: '',
})

const wizardLoading = ref(false)
const wizardErrors = ref<Record<string, string>>({})

// Computed values
const wizardTotalSteps = computed(() => wizardSteps.length)
const wizardCurrentStep = computed(() => wizardSteps[wizardCurrentStepId.value])
const wizardIsLastStep = computed(() => wizardCurrentStepId.value === wizardTotalSteps.value - 1)

// Verify TOTP code function
async function verifyTOTPCode() {
  if (!wizardData.value.verifyCode || wizardData.value.verifyCode.length !== 6) {
    wizardErrors.value.verifyCode = 'Please enter a valid 6-digit code'
    return
  }

  wizardLoading.value = true
  wizardErrors.value = {}

  try {
    const response = await $fetch('/api/auth/two-factor/verify', {
      method: 'POST',
      body: {
        flow: wizardData.value.flowId,
        code: wizardData.value.verifyCode,
        csrf_token: wizardData.value.csrfToken,
      },
    })

    if (response.success) {
      // Show success toast
      toaster.add({
        title: 'Success',
        description: '2FA has been enabled successfully',
        icon: 'ph:check-circle',
        color: 'success',
        progress: true,
      })

      // Move to success step
      wizardCurrentStepId.value = 2

      // Refresh 2FA status immediately
      await fetchTwoFactorStatus()

      // Wait a bit and refresh again to ensure it's updated
      setTimeout(async () => {
        await fetchTwoFactorStatus()
      }, 1000)

      // Auto close after 3 seconds
      setTimeout(() => {
        closeWizard()
      }, 3000)
    } else {
      wizardErrors.value.verifyCode = 'Failed to verify TOTP code'
      toaster.add({
        title: 'Error',
        description: 'Failed to verify TOTP code',
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
    }
  } catch (error: any) {
    // Check for session refresh error
    if (error.statusCode === 403 && error.data?.error?.id === 'session_refresh_required') {
      // Redirect to Kratos login refresh URL
      const redirectUrl = error.data?.redirect_browser_to
      if (redirectUrl) {
        toaster.add({
          title: 'Session Expired',
          description: 'Refreshing your session...',
          icon: 'ph:arrow-clockwise',
          color: 'warning',
          progress: true,
        })
        
        // Redirect to Kratos refresh URL
        window.location.href = redirectUrl
        return
      } else {
        toaster.add({
          title: 'Session Expired',
          description: 'Your session has expired. Please refresh the page and try again.',
          icon: 'lucide:alert-triangle',
          color: 'warning',
          progress: true,
        })
      }
    } else {
      wizardErrors.value.verifyCode = error.message || 'Failed to verify TOTP code'
      toaster.add({
        title: 'Error',
        description: error.message || 'Failed to verify TOTP code',
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
    }
  } finally {
    wizardLoading.value = false
  }
}

// Fetch 2FA status
const fetchTwoFactorStatus = async () => {
  isTwoFactorLoading.value = true
  try {
    const response = await $fetch('/api/auth/two-factor/status')
    if (response.success) {
      twoFactorEnabled.value = response.enabled
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[security.vue] Failed to fetch 2FA status:', error)
    }
  } finally {
    isTwoFactorLoading.value = false
  }
}

// Setup 2FA - Start Wizard
const setupTwoFactor = async () => {
  isSetupLoading.value = true
  wizardCurrentStepId.value = 0
  wizardData.value = {
    qrCode: '',
    secret: '',
    flowId: '',
    csrfToken: '',
    verifyCode: '',
  }
  wizardErrors.value = {}
  wizardLoading.value = false

  try {
    const response = await $fetch('/api/auth/two-factor/setup', {
      method: 'POST',
    })

    if (response.success) {
      // Check if TOTP is already configured
      if (response.configured) {
        toaster.add({
          title: 'Info',
          description: '2FA is already enabled',
          icon: 'ph:info',
          progress: true,
        })
        fetchTwoFactorStatus()
        return
      }

      // If QR code is available, show wizard
      if (response.qrCode) {
        // Set wizard data
        wizardData.value.qrCode = response.qrCode
        wizardData.value.secret = response.secret || ''
        wizardData.value.flowId = response.flowId
        wizardData.value.csrfToken = response.csrfToken
        wizardData.value.verifyCode = ''
        
        // Reset and go to first step
        wizardCurrentStepId.value = 0
        wizardErrors.value = {}
        wizardLoading.value = false
        show2FAWizard.value = true
      } else {
        // Fallback: show error if QR code not available
        toaster.add({
          title: 'Error',
          description: 'Failed to generate QR code. Please try again.',
          icon: 'lucide:alert-triangle',
          color: 'danger',
          progress: true,
        })
      }
    }
  } catch (error: any) {
    // Check for session refresh error
    if (error.statusCode === 403 && error.data?.error?.id === 'session_refresh_required') {
      // Redirect to Kratos login refresh URL
      const redirectUrl = error.data?.redirect_browser_to
      if (redirectUrl) {
        toaster.add({
          title: 'Session Expired',
          description: 'Refreshing your session...',
          icon: 'ph:arrow-clockwise',
          color: 'warning',
          progress: true,
        })
        
        // Redirect to Kratos refresh URL
        window.location.href = redirectUrl
        return
      } else {
        toaster.add({
          title: 'Session Expired',
          description: 'Your session has expired. Please refresh the page and try again.',
          icon: 'lucide:alert-triangle',
          color: 'warning',
          progress: true,
        })
      }
    } else {
      toaster.add({
        title: 'Error',
        description: error.message || 'Failed to setup 2FA',
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
    }
  } finally {
    isSetupLoading.value = false
  }
}

// Close wizard
const closeWizard = () => {
  show2FAWizard.value = false
  wizardCurrentStepId.value = 0
  wizardData.value = {
    qrCode: '',
    secret: '',
    flowId: '',
    csrfToken: '',
    verifyCode: '',
  }
  wizardErrors.value = {}
  wizardLoading.value = false
}

// Copy secret to clipboard
const copySecret = async () => {
  if (wizardData.value.secret) {
    try {
      await navigator.clipboard.writeText(wizardData.value.secret)
      toaster.add({
        title: 'Copied',
        description: 'Secret code copied to clipboard',
        icon: 'ph:check',
        progress: true,
      })
    } catch (error) {
      toaster.add({
        title: 'Error',
        description: 'Failed to copy secret code',
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
    }
  }
}


// Toggle 2FA
const toggleTwoFactor = async () => {
  if (twoFactorEnabled.value) {
    // Disable 2FA
    isTwoFactorLoading.value = true
    try {
      const response = await $fetch('/api/auth/two-factor', {
        method: 'PUT',
        body: {
          enabled: false,
        },
      })

      if (response.success) {
        twoFactorEnabled.value = false
        toaster.add({
          title: 'Success',
          description: '2FA has been disabled',
          icon: 'ph:check',
          progress: true,
        })
      }
    } catch (error: any) {
      toaster.add({
        title: 'Error',
        description: error.message || 'Failed to disable 2FA',
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
    } finally {
      isTwoFactorLoading.value = false
    }
  } else {
    // Enable 2FA - show setup option
    setupTwoFactor()
  }
}

// Fetch 2FA status on mount
onMounted(() => {
  fetchTwoFactorStatus()
})

const onSubmit = handleSubmit(async (values) => {
  success.value = false

  try {
    // If password fields are filled, update password
    if (values.newPassword) {
      const passwordResponse = await $fetch('/api/auth/change-password', {
        method: 'PUT',
        body: {
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        },
      })

      if (passwordResponse.success) {
        toaster.add({
          title: 'Success',
          description: 'Password has been changed!',
          icon: 'ph:check',
          progress: true,
        })
        success.value = true
        resetForm()
        setTimeout(() => {
          success.value = false
        }, 3000)
        return
      }
    }

    success.value = true
    resetForm()
    setTimeout(() => {
      success.value = false
    }, 3000)
  }
  catch (error: any) {
    if (import.meta.dev) {
      console.log('[security.vue] Error caught:', error)
      console.log('[security.vue] Error statusCode:', error.statusCode)
      console.log('[security.vue] Error message:', error.message)
      console.log('[security.vue] Error data:', error.data)
    }

    let errorMessage = 'Failed to update security settings'
    let errorField: keyof FormInput = 'newPassword'

    // Handle errors
    if (error.statusCode === 400 && error.data) {
      // Handle validation errors - check if it's an array or object
      if (Array.isArray(error.data)) {
        // Array of validation errors
        const validationErrors = error.data as Array<{ path: string[]; message: string }>
        validationErrors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            setFieldError(err.path[0] as keyof FormInput, err.message)
          }
        })
        return // Early return for array errors
      } else if (typeof error.data === 'object') {
        // Object with validation errors
        // Priority 1: Check for Kratos UI nodes with password field errors
        if (error.data.ui?.nodes) {
          const nodes = error.data.ui.nodes
          // Find the password input node that has error messages
          const passwordNode = nodes.find((n: any) => 
            n.attributes?.name === 'password' && 
            n.messages && 
            n.messages.length > 0 &&
            n.messages.some((m: any) => m.type === 'error')
          )
          
          if (passwordNode && passwordNode.messages && passwordNode.messages.length > 0) {
            const errorMsg = passwordNode.messages.find((m: any) => m.type === 'error')
            if (errorMsg && errorMsg.text) {
              errorMessage = errorMsg.text
              errorField = 'newPassword'
            }
          }
        }
        
        // Priority 2: Check for Kratos UI messages (if not found in nodes)
        if (errorMessage === 'Failed to update security settings' && error.data.ui?.messages) {
          const messages = error.data.ui.messages
          const errorMsg = messages.find((m: any) => m.type === 'error')
          if (errorMsg && errorMsg.text) {
            errorMessage = errorMsg.text
            errorField = 'newPassword'
          }
        }
        
        // Priority 3: Check for direct error message in data (statusMessage or message)
        if (errorMessage === 'Failed to update security settings') {
          if (error.data.statusMessage) {
            errorMessage = error.data.statusMessage
            errorField = 'newPassword'
          } else if (error.data.message) {
            errorMessage = error.data.message
            errorField = 'newPassword'
          }
        }
      } else if (error.data) {
        // String error message
        errorMessage = String(error.data)
        errorField = 'newPassword'
      }
    }
    else if (error.statusCode === 401 || error.statusCode === 403) {
      if (error.statusCode === 403) {
        errorMessage = error.data?.statusMessage || error.data?.message || error.message || 'Your session has expired. Please log in again.'
      } else {
        errorMessage = error.data?.statusMessage || error.data?.message || error.message || 'Unauthorized. Please log in again.'
      }
      errorField = 'newPassword'
    }
    else {
      // For other errors, extract message from error.data if available
      if (error.data?.statusMessage) {
        errorMessage = error.data.statusMessage
      } else if (error.data?.message) {
        errorMessage = error.data.message
      } else if (error.message) {
        // Extract message from error.message if it contains prefix
        // Format: "[METHOD] "/path": STATUSCODE message"
        const messageMatch = error.message.match(/:\s*\d+\s+(.+)$/)
        if (messageMatch && messageMatch[1]) {
          errorMessage = messageMatch[1]
        } else {
          errorMessage = error.message
        }
      }
      errorField = 'newPassword'
    }

    // Set field error
    setFieldError(errorField, errorMessage)

    // Show toast notification
    toaster.add({
      title: 'Error',
      description: errorMessage,
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  }
})
</script>

<template>
  <form
    method="POST"
    action=""
    class="w-full pb-16 max-w-3xl dark:[--color-input-default-bg:var(--color-muted-950)]"
    novalidate
    @submit.prevent="onSubmit"
  >
    <div class="flex items-center justify-between border-b border-muted-300 dark:border-muted-800 pb-4 mb-6">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Security Settings
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Manage your password and two-factor authentication
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton
          type="button"
          variant="ghost"
          to="/dashboard/settings"
        >
          Cancel
        </BaseButton>
        <BaseButton
          type="submit"
          variant="primary"
          :disabled="isSubmitting"
          :loading="isSubmitting"
        >
          Save
        </BaseButton>
      </div>
    </div>

    <div>
      <div class="space-y-12">
        <BaseMessage v-if="success" @close="success = false">
          Your security settings have been updated!
        </BaseMessage>

        <TairoFormGroup
          label="Change Password"
          sublabel="For an improved account security"
        >
          <div class="grid grid-cols-12 gap-4">
            <Field
              v-slot="{ field, errorMessage, handleChange, handleBlur }"
              name="newPassword"
            >
              <BaseField
                v-slot="{ inputAttrs, inputRef }"
                label="New Password"
                :error="errorMessage"
                :disabled="isSubmitting"
                class="col-span-12"
              >
                <TairoInput
                  :ref="inputRef"
                  v-bind="inputAttrs"
                  :model-value="field.value"
                  :aria-invalid="errorMessage ? 'true' : undefined"
                  type="password"
                  icon="solar:lock-keyhole-linear"
                  placeholder="New password"
                  autocomplete="new-password"
                  rounded="lg"
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
                :error="errorMessage"
                :disabled="isSubmitting"
                class="col-span-12"
              >
                <TairoInput
                  :ref="inputRef"
                  v-bind="inputAttrs"
                  :model-value="field.value"
                  :aria-invalid="errorMessage ? 'true' : undefined"
                  type="password"
                  autocomplete="new-password"
                  icon="solar:lock-keyhole-linear"
                  placeholder="Repeat new password"
                  rounded="lg"
                  @update:model-value="handleChange"
                  @blur="handleBlur"
                />
              </BaseField>
            </Field>
          </div>
        </TairoFormGroup>

        <TairoFormGroup
          label="Two-Factor Authentication"
          sublabel="Secure your account with an authenticator app"
        >
          <div class="space-y-4">
            <div class="rounded-lg border border-muted-200 dark:border-muted-800 bg-white dark:bg-muted-950 p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                      <Icon name="ph:shield-check-duotone" class="size-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <BaseHeading size="sm" weight="semibold">Authenticator App</BaseHeading>
                      <BaseParagraph size="xs" class="text-muted-500">
                        Use Google Authenticator, Authy, or similar apps
                      </BaseParagraph>
                    </div>
                  </div>
                  
                  <div v-if="twoFactorEnabled" class="mt-4 space-y-2">
                    <div class="flex items-center gap-2 text-success-600 dark:text-success-500">
                      <Icon name="ph:check-circle-fill" class="size-5" />
                      <span class="text-sm font-medium">2FA is enabled</span>
                    </div>
                    <BaseParagraph size="xs" class="text-muted-500">
                      Your account is protected with two-factor authentication
                    </BaseParagraph>
                  </div>
                  <div v-else class="mt-4 space-y-2">
                    <div class="flex items-center gap-2 text-muted-500">
                      <Icon name="ph:x-circle" class="size-5" />
                      <span class="text-sm">2FA is disabled</span>
                    </div>
                    <BaseParagraph size="xs" class="text-muted-500">
                      Enable 2FA to add an extra layer of security to your account
                    </BaseParagraph>
                  </div>
                </div>
                
                <div class="flex items-start">
                  <BaseButton
                    v-if="twoFactorEnabled"
                    variant="danger"
                    :loading="isTwoFactorLoading"
                    @click="toggleTwoFactor"
                  >
                    <Icon name="ph:shield-slash" class="size-4" />
                    <span>Disable 2FA</span>
                  </BaseButton>
                  <BaseButton
                    v-else
                    variant="primary"
                    :loading="isSetupLoading"
                    @click="setupTwoFactor"
                  >
                    <Icon name="ph:shield-check" class="size-4" />
                    <span>Enable 2FA</span>
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>
        </TairoFormGroup>
      </div>
    </div>
  </form>

  <!-- 2FA Setup Wizard -->
  <DialogRoot v-model:open="show2FAWizard">
    <DialogPortal>
      <DialogOverlay class="bg-muted-800/70 dark:bg-muted-900/80 fixed inset-0 z-50" />

      <DialogContent
        class="fixed top-[5%] start-[50%] max-h-[90vh] w-[90vw] max-w-[32rem] translate-x-[-50%] rounded-lg overflow-hidden border border-white dark:border-muted-700 bg-white dark:bg-muted-800 focus:outline-none z-[100] transition-discrete transition-all duration-200 ease-out flex flex-col"
      >
        <!-- Header -->
        <div class="flex items-center justify-between w-full p-6 border-b border-muted-200 dark:border-muted-700">
          <div class="flex items-center gap-3">
            <Icon name="ph:shield-check" class="size-6 text-primary-500" />
            <div>
              <DialogTitle
                class="font-heading text-muted-900 text-lg font-semibold leading-6 dark:text-white"
              >
                Setup Two-Factor Authentication
              </DialogTitle>
              <BaseParagraph size="xs" class="text-muted-500 mt-1">
                Step {{ wizardCurrentStepId + 1 }} of {{ wizardTotalSteps }}
              </BaseParagraph>
            </div>
          </div>
          <!-- Progress Steps -->
          <div class="flex items-center gap-2">
          <div
            v-for="(step, index) in wizardSteps"
            :key="step.id"
            class="flex items-center"
          >
              <div
                class="flex size-8 items-center justify-center rounded-full border-2 transition-colors"
                :class="index <= wizardCurrentStepId
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-muted-300 text-muted-400 dark:border-muted-700'"
              >
                <Icon
                  v-if="index < wizardCurrentStepId"
                  name="ph:check"
                  class="size-4"
                />
                <span v-else class="text-sm font-medium">{{ index + 1 }}</span>
              </div>
              <div
                v-if="index < wizardTotalSteps - 1"
                class="h-0.5 w-8 transition-colors"
                :class="index < wizardCurrentStepId
                  ? 'bg-primary-500'
                  : 'bg-muted-300 dark:bg-muted-700'"
              />
            </div>
          </div>
          <BaseButton class="icon-md" @click="closeWizard">
            <Icon name="lucide:x" class="size-4" />
          </BaseButton>
        </div>

        <!-- Body -->
        <div class="nui-slimscroll overflow-y-auto px-6 py-6">
      <div class="space-y-6">
        <!-- Step 1: QR Code -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-4"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-4"
        >
          <div v-if="wizardCurrentStepId === 0" key="step-0" class="space-y-6">
          <div class="text-center">
            <BaseHeading as="h4" size="md" weight="medium" class="mb-2">
              {{ wizardCurrentStep.meta.title }}
            </BaseHeading>
            <BaseParagraph size="sm" class="text-muted-500">
              {{ wizardCurrentStep.meta.subtitle }}
            </BaseParagraph>
          </div>

          <!-- QR Code -->
          <div class="flex flex-col items-center justify-center">
            <div v-if="wizardData.qrCode" class="rounded-lg border border-muted-200 bg-white p-6 dark:border-muted-700 dark:bg-muted-800">
              <img :src="wizardData.qrCode" alt="TOTP QR Code" class="mx-auto max-w-xs">
            </div>
            <div v-else class="flex h-64 items-center justify-center rounded-lg border border-muted-200 bg-muted-50 dark:border-muted-700 dark:bg-muted-800">
              <BaseParagraph size="sm" class="text-muted-500">
                Loading QR code...
              </BaseParagraph>
            </div>
          </div>

          <!-- Manual Entry (if secret is available) -->
          <div v-if="wizardData.secret" class="rounded-lg border border-muted-200 bg-muted-50 p-4 dark:border-muted-700 dark:bg-muted-800">
            <BaseHeading as="h4" size="sm" weight="medium" class="mb-2">
              Can't scan? Enter this code manually
            </BaseHeading>
            <div class="flex items-center gap-2">
              <code class="flex-1 rounded bg-white px-3 py-2 text-sm font-mono dark:bg-muted-900">{{ wizardData.secret }}</code>
              <BaseButton
                size="sm"
                variant="pastel"
                @click="copySecret"
              >
                <Icon name="ph:copy" class="size-4" />
              </BaseButton>
            </div>
          </div>

          <!-- Instructions -->
          <div class="rounded-lg border border-muted-200 bg-muted-50 p-4 dark:border-muted-700 dark:bg-muted-800">
            <BaseHeading as="h4" size="sm" weight="medium" class="mb-2">
              Popular Authenticator Apps
            </BaseHeading>
            <ul class="space-y-2 text-sm text-muted-600 dark:text-muted-400">
              <li class="flex items-center gap-2">
                <Icon name="ph:check" class="size-4 text-primary-500" />
                <span>Google Authenticator</span>
              </li>
              <li class="flex items-center gap-2">
                <Icon name="ph:check" class="size-4 text-primary-500" />
                <span>Microsoft Authenticator</span>
              </li>
              <li class="flex items-center gap-2">
                <Icon name="ph:check" class="size-4 text-primary-500" />
                <span>Authy</span>
              </li>
            </ul>
          </div>
          </div>
        </Transition>

        <!-- Step 2: Verify Code -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-4"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-4"
        >
          <div v-if="wizardCurrentStepId === 1" key="step-1" class="space-y-6">
          <div class="text-center">
            <BaseHeading as="h4" size="md" weight="medium" class="mb-2">
              {{ wizardCurrentStep.meta.title }}
            </BaseHeading>
            <BaseParagraph size="sm" class="text-muted-500">
              {{ wizardCurrentStep.meta.subtitle }}
            </BaseParagraph>
          </div>

          <div class="flex justify-center">
            <div class="w-full max-w-xs">
              <BaseField
                label="Verification Code"
                description="Enter the code from your authenticator app"
                :error="wizardErrors.verifyCode"
              >
                <TairoInput
                  v-model="wizardData.verifyCode"
                  type="text"
                  placeholder="000000"
                  maxlength="6"
                  pattern="[0-9]{6}"
                  autocomplete="off"
                  rounded="lg"
                  icon="ph:key"
                  class="text-center text-2xl font-mono tracking-widest"
                  @keyup.enter="verifyTOTPCode"
                />
              </BaseField>
            </div>
          </div>
          </div>
        </Transition>

        <!-- Step 3: Success -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div v-if="wizardCurrentStepId === 2" key="step-2" class="space-y-6">
          <div class="text-center">
            <div class="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/20">
              <Icon name="ph:check-circle-fill" class="size-12 text-success-600 dark:text-success-400" />
            </div>
            <BaseHeading as="h4" size="md" weight="medium" class="mb-2">
              {{ wizardCurrentStep.meta.title }}
            </BaseHeading>
            <BaseParagraph size="sm" class="text-muted-500">
              {{ wizardCurrentStep.meta.subtitle }}
            </BaseParagraph>
          </div>
          </div>
        </Transition>
      </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between w-full p-6 border-t border-muted-200 dark:border-muted-700">
          <BaseButton
            v-if="wizardCurrentStepId > 0 && wizardCurrentStepId < 2"
            variant="pastel"
            @click="wizardCurrentStepId--"
          >
            <Icon name="ph:arrow-left" class="size-4" />
            <span>Previous</span>
          </BaseButton>
          <div v-else />

          <div class="flex items-center gap-2">
            <BaseButton
              v-if="!wizardIsLastStep"
              variant="pastel"
              @click="closeWizard"
            >
              Cancel
            </BaseButton>
            <BaseButton
              v-if="wizardCurrentStepId === 0"
              variant="primary"
              @click="wizardCurrentStepId++"
            >
              <span>Continue</span>
              <Icon name="ph:arrow-right" class="size-4" />
            </BaseButton>
            <BaseButton
              v-if="wizardCurrentStepId === 1"
              variant="primary"
              :loading="wizardLoading"
              :disabled="!wizardData.verifyCode || wizardData.verifyCode.length !== 6"
              @click="verifyTOTPCode"
            >
              <Icon name="ph:check" class="size-4" />
              <span>Verify & Enable</span>
            </BaseButton>
            <BaseButton
              v-if="wizardCurrentStepId === 2"
              variant="primary"
              @click="closeWizard"
            >
              <span>Done</span>
              <Icon name="ph:check" class="size-4" />
            </BaseButton>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

