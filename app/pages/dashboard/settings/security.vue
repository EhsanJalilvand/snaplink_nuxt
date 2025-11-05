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

// Setup 2FA
const setupTwoFactor = async () => {
  isSetupLoading.value = true
  try {
    const response = await $fetch('/api/auth/two-factor/setup', {
      method: 'POST',
    })

    if (response.success) {
      toaster.add({
        title: 'Success',
        description: 'Check your email for 2FA setup instructions',
        icon: 'ph:check',
        progress: true,
      })
      
      // Refresh 2FA status after a short delay
      setTimeout(() => {
        fetchTwoFactorStatus()
      }, 2000)
    }
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to setup 2FA',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  } finally {
    isSetupLoading.value = false
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
                    :variant="twoFactorEnabled ? 'danger' : 'primary'"
                    :loading="isTwoFactorLoading || isSetupLoading"
                    @click="toggleTwoFactor"
                  >
                    <Icon :name="twoFactorEnabled ? 'ph:shield-slash' : 'ph:shield-check'" class="size-4" />
                    <span>{{ twoFactorEnabled ? 'Disable' : 'Enable' }} 2FA</span>
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>
        </TairoFormGroup>
      </div>
    </div>
  </form>
</template>

