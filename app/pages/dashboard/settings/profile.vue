<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Field, useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  title: 'Edit Profile',
  layout: 'dashboard',
})

const VALIDATION_TEXT = {
  FIRSTNAME_REQUIRED: 'First name is required',
  FIRSTNAME_TOO_LONG: 'First name is too long',
  LASTNAME_TOO_LONG: 'Last name is too long',
  EMAIL_REQUIRED: 'A valid email is required',
  EMAIL_INVALID: 'Invalid email address',
}

// This is the Zod schema for the form input (only firstName and lastName)
const zodSchema = z.object({
  firstName: z.string()
    .min(1, VALIDATION_TEXT.FIRSTNAME_REQUIRED)
    .max(100, VALIDATION_TEXT.FIRSTNAME_TOO_LONG),
  lastName: z.string()
    .max(100, VALIDATION_TEXT.LASTNAME_TOO_LONG)
    .optional()
    .transform((val) => val || ''),
})

type FormInput = z.infer<typeof zodSchema>

const validationSchema = toTypedSchema(zodSchema)

// Use shared user data composable for consistent state across all components
const { user: sharedUser, refreshUser } = useUserData()

const {
  handleSubmit,
  isSubmitting,
  setFieldError,
  resetForm,
  errors,
  setValues,
  setFieldValue,
} = useForm({
  validationSchema,
  initialValues: {
    firstName: '',
    lastName: '',
  },
})

const success = ref(false)
const toaster = useNuiToasts()
const router = useRouter()

// Avatar states
const inputFile = ref<FileList | null>(null)
const isAvatarUploading = ref(false)
const currentAvatar = computed(() => sharedUser.value?.avatar || null)

// Avatar upload
const uploadAvatar = async () => {
  if (!inputFile.value || !inputFile.value.item(0)) {
    toaster.add({
      title: 'Error',
      description: 'Please select an image file',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
    return
  }

  const file = inputFile.value.item(0)!
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    toaster.add({
      title: 'Error',
      description: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
    return
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    toaster.add({
      title: 'Error',
      description: 'File size exceeds 5MB limit',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
    return
  }

  isAvatarUploading.value = true

  try {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await $fetch('/api/auth/profile/avatar', {
      method: 'POST',
      body: formData,
    })

    if (response.success) {
      // Refresh user data
      console.log('[profile.vue] Avatar uploaded successfully, refreshing user data...')
      await refreshUser()
      console.log('[profile.vue] User data refreshed, current avatar:', sharedUser.value?.avatar ? sharedUser.value.avatar.substring(0, 50) + '...' : 'undefined')
      
      // Clear file input
      inputFile.value = null

      toaster.add({
        title: 'Success',
        description: 'Avatar updated successfully!',
        icon: 'ph:check',
        progress: true,
      })
    }
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to upload avatar',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  } finally {
    isAvatarUploading.value = false
  }
}

// Delete avatar
const deleteAvatar = async () => {
  isAvatarUploading.value = true

  try {
    const response = await $fetch('/api/auth/profile/avatar', {
      method: 'DELETE',
    })

    if (response.success) {
      // Refresh user data
      await refreshUser()

      toaster.add({
        title: 'Success',
        description: 'Avatar removed successfully!',
        icon: 'ph:check',
        progress: true,
      })
    }
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to remove avatar',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  } finally {
    isAvatarUploading.value = false
  }
}

// Email change wizard states
const showEmailChangeWizard = ref(false)
const emailChangeWizardStep = ref(0) // 0: new email, 1: 2FA (if needed), 2: verify code
const newEmailValue = ref('')
const emailChange2FAFlowId = ref('')
const emailChangeVerificationFlowId = ref('')
const emailChange2FACode = ref('')
const emailChangeVerificationCode = ref('')
const emailChangeLoading = ref(false)
const emailChangeErrors = ref<Record<string, string>>({})
const resendCooldown = ref(0)

// Watch for user data changes to update form - only on client side
watch(sharedUser, (newUser) => {
  if (newUser) {
    nextTick(() => {
      setFieldValue('firstName', newUser.firstName || '')
      setFieldValue('lastName', newUser.lastName || '')
    })
  }
}, { immediate: true })

// Also update on mount to ensure values are set
onMounted(() => {
  nextTick(() => {
    if (sharedUser.value) {
      setFieldValue('firstName', sharedUser.value.firstName || '')
      setFieldValue('lastName', sharedUser.value.lastName || '')
    }
  })
})

// Start email change wizard
const startEmailChangeWizard = () => {
  showEmailChangeWizard.value = true
  emailChangeWizardStep.value = 0
  newEmailValue.value = ''
  emailChange2FAFlowId.value = ''
  emailChangeVerificationFlowId.value = ''
  emailChange2FACode.value = ''
  emailChangeVerificationCode.value = ''
  emailChangeErrors.value = {}
  emailChangeLoading.value = false
  resendCooldown.value = 0
}

// Cancel email change wizard
const cancelEmailChangeWizard = () => {
  showEmailChangeWizard.value = false
  emailChangeWizardStep.value = 0
  newEmailValue.value = ''
  emailChange2FAFlowId.value = ''
  emailChangeVerificationFlowId.value = ''
  emailChange2FACode.value = ''
  emailChangeVerificationCode.value = ''
  emailChangeErrors.value = {}
  emailChangeLoading.value = false
}

// Step 1: Submit new email
const submitNewEmail = async () => {
  if (!newEmailValue.value) {
    emailChangeErrors.value.newEmail = 'Please enter a new email address'
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newEmailValue.value)) {
    emailChangeErrors.value.newEmail = 'Please enter a valid email address'
    return
  }

  emailChangeLoading.value = true
  emailChangeErrors.value = {}

  try {
    const response = await $fetch('/api/auth/send-email-verification', {
      method: 'POST',
      body: {
        newEmail: newEmailValue.value,
      },
    })

    if (response.success) {
      // Check if 2FA is required
      if (response.requires2FA) {
        // Create AAL2 login flow from frontend
        const config = useRuntimeConfig()
        try {
          const aal2Flow = await $fetch(`${config.public.kratosPublicUrl}/self-service/login/browser?aal=aal2&return_to=${encodeURIComponent(`${config.public.siteUrl}/auth/verify-email-change?email=${encodeURIComponent(newEmailValue.value)}`)}&refresh=true`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
            },
          })
          
          if (aal2Flow?.id) {
            emailChange2FAFlowId.value = aal2Flow.id
            emailChangeWizardStep.value = 1 // Go to 2FA step
          } else {
            emailChangeErrors.value.newEmail = 'Failed to create 2FA flow. Please try again.'
          }
        } catch (flowError: any) {
          if (import.meta.dev) {
            console.error('[profile.vue] Failed to create AAL2 flow:', flowError)
          }
          emailChangeErrors.value.newEmail = 'Failed to create 2FA flow. Please try again.'
        }
      } else if (response.requiresVerificationFlow) {
        // Use verification flow to send code to new email
        // Verification flow can send code to any email, even if not in identity
        const config = useRuntimeConfig()
        try {
          // Create verification flow for new email
          const verificationFlow = await $fetch(`${config.public.kratosPublicUrl}/self-service/verification/browser?return_to=${encodeURIComponent(`${config.public.siteUrl}/auth/verify-email-change?email=${encodeURIComponent(newEmailValue.value)}`)}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
            },
          })
          
          if (verificationFlow?.id) {
            // Get CSRF token
            const csrfToken = verificationFlow.ui?.nodes?.find(
              (node: any) => node.attributes?.name === 'csrf_token'
            )?.attributes?.value
            
            if (!csrfToken) {
              emailChangeErrors.value.newEmail = 'Failed to get CSRF token. Please try again.'
              return
            }
            
            // Submit verification request to send code to new email
            const verificationResponse = await $fetch(`${config.public.kratosPublicUrl}/self-service/verification?flow=${verificationFlow.id}`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: {
                email: newEmailValue.value,
                method: 'code',
                csrf_token: csrfToken,
              },
            })
            
            if (import.meta.dev) {
              console.log('[profile.vue] Verification flow response:', verificationResponse)
              console.log('[profile.vue] Verification flow state:', verificationResponse?.state)
              console.log('[profile.vue] Verification flow messages:', verificationResponse?.ui?.messages)
            }
            
            // Check if verification code was sent
            const codeNode = verificationResponse?.ui?.nodes?.find(
              (node: any) => node.group === 'code' && node.attributes?.name === 'code'
            )
            
            const hasCodeMessage = verificationResponse?.ui?.messages?.some((m: any) => 
              m.type === 'info' && (m.text?.includes('verification code') || m.text?.includes('sent to'))
            )
            
            if (codeNode || hasCodeMessage || verificationResponse?.state === 'sent_email') {
              // Verification code was sent, use verification flow for verification
              emailChangeVerificationFlowId.value = verificationFlow.id
              emailChangeWizardStep.value = 2 // Go directly to verification step
              
              if (import.meta.dev) {
                console.log('[profile.vue] Verification code sent, flow ID:', verificationFlow.id)
              }
            } else {
              // Check for errors
              const errorMessage = verificationResponse?.ui?.messages?.find((m: any) => m.type === 'error')?.text
              if (errorMessage) {
                emailChangeErrors.value.newEmail = errorMessage
              } else {
                emailChangeErrors.value.newEmail = 'Failed to send verification code. Please try again.'
              }
              
              if (import.meta.dev) {
                console.error('[profile.vue] Failed to send verification code')
                console.error('[profile.vue] Response:', verificationResponse)
              }
            }
          } else {
            emailChangeErrors.value.newEmail = 'Failed to create verification flow. Please try again.'
          }
        } catch (flowError: any) {
          if (import.meta.dev) {
            console.error('[profile.vue] Failed to create verification flow:', flowError)
            console.error('[profile.vue] Error details:', flowError.data || flowError.response?.data)
          }
          
          // Check for specific error messages
          if (flowError.data?.ui?.messages) {
            const errorMessage = flowError.data.ui.messages.find((m: any) => m.type === 'error')?.text
            if (errorMessage) {
              emailChangeErrors.value.newEmail = errorMessage
            } else {
              emailChangeErrors.value.newEmail = 'Failed to create verification flow. Please try again.'
            }
          } else {
            emailChangeErrors.value.newEmail = 'Failed to create verification flow. Please try again.'
          }
        }
      } else if (response.verificationFlowId) {
        emailChangeVerificationFlowId.value = response.verificationFlowId
        emailChangeWizardStep.value = 2 // Go directly to verification step
      } else {
        emailChangeErrors.value.newEmail = 'Failed to initiate email change. Please try again.'
      }
    } else {
      emailChangeErrors.value.newEmail = response.message || 'Failed to send verification code'
    }
  } catch (error: any) {
    if (error.statusCode === 409) {
      emailChangeErrors.value.newEmail = 'Email is already registered'
    } else if (error.statusCode === 400) {
      emailChangeErrors.value.newEmail = error.statusMessage || error.message || 'Invalid email address'
    } else {
      emailChangeErrors.value.newEmail = error.message || 'Failed to send verification code'
    }
  } finally {
    emailChangeLoading.value = false
  }
}

// Step 2: Verify 2FA code
const verify2FACode = async () => {
  if (!emailChange2FACode.value || emailChange2FACode.value.length !== 6) {
    emailChangeErrors.value.twoFA = 'Please enter a valid 6-digit code'
    return
  }

  emailChangeLoading.value = true
  emailChangeErrors.value = {}

  try {
    const config = useRuntimeConfig()
    
    // Get CSRF token from flow
    const flowResponse = await $fetch(`${config.public.kratosPublicUrl}/self-service/login/browser?flow=${emailChange2FAFlowId.value}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    })

    const csrfToken = flowResponse?.ui?.nodes?.find(
      (node: any) => node.attributes?.name === 'csrf_token'
    )?.attributes?.value

    if (!csrfToken) {
      emailChangeErrors.value.twoFA = 'Failed to get CSRF token. Please try again.'
      emailChangeLoading.value = false
      return
    }

    // Verify TOTP code
    const response = await $fetch(`${config.public.kratosPublicUrl}/self-service/login?flow=${emailChange2FAFlowId.value}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: {
        method: 'totp',
        totp_code: emailChange2FACode.value,
        csrf_token: csrfToken,
      },
    })

    if (response?.session) {
      // 2FA verified successfully, now send verification code
      const verifyResponse = await $fetch('/api/auth/send-email-verification', {
        method: 'POST',
        body: {
          newEmail: newEmailValue.value,
        },
      })

      if (verifyResponse.success && verifyResponse.verificationFlowId) {
        emailChangeVerificationFlowId.value = verifyResponse.verificationFlowId
        emailChangeWizardStep.value = 2 // Go to verification step
      } else {
        emailChangeErrors.value.twoFA = 'Failed to send verification code. Please try again.'
      }
    } else {
      emailChangeErrors.value.twoFA = 'Invalid 2FA code. Please try again.'
    }
  } catch (error: any) {
    if (error.response?.data?.ui?.messages) {
      const errorMessage = error.response.data.ui.messages.find((m: any) => m.type === 'error')?.text
      emailChangeErrors.value.twoFA = errorMessage || 'Invalid 2FA code. Please try again.'
    } else {
      emailChangeErrors.value.twoFA = error.message || 'Failed to verify 2FA code. Please try again.'
    }
  } finally {
    emailChangeLoading.value = false
  }
}

// Step 3: Verify email code
const verifyEmailCode = async () => {
  if (!emailChangeVerificationCode.value || emailChangeVerificationCode.value.length !== 6) {
    emailChangeErrors.value.verification = 'Please enter a valid 6-digit code'
    return
  }

  if (!emailChangeVerificationFlowId.value) {
    emailChangeErrors.value.verification = 'Verification flow not found. Please start over.'
    return
  }

  emailChangeLoading.value = true
  emailChangeErrors.value = {}

  try {
    const response = await $fetch('/api/auth/verify-email-change', {
      method: 'POST',
      body: {
        code: emailChangeVerificationCode.value,
        flow: emailChangeVerificationFlowId.value,
        newEmail: newEmailValue.value, // Send newEmail so backend can change it after verification
      },
      credentials: 'include',
    })

    if (response.success) {
      toaster.add({
        title: 'Success',
        description: 'Email changed successfully!',
        icon: 'ph:check-circle-fill',
        color: 'success',
        progress: true,
      })

      // Refresh user data
      await refreshUser()

      // Close wizard
      cancelEmailChangeWizard()
    } else {
      emailChangeErrors.value.verification = response.error || 'Verification failed. Please try again.'
    }
  } catch (error: any) {
    if (error.statusCode === 400) {
      emailChangeErrors.value.verification = error.data?.message || error.statusMessage || 'Invalid verification code. Please try again.'
    } else {
      emailChangeErrors.value.verification = error.message || 'Failed to verify email. Please try again.'
    }
  } finally {
    emailChangeLoading.value = false
  }
}

// Resend verification code
const resendVerificationCode = async () => {
  if (resendCooldown.value > 0) {
    return
  }

  emailChangeLoading.value = true
  emailChangeErrors.value = {}

  try {
    const response = await $fetch('/api/auth/send-email-verification', {
      method: 'POST',
      body: {
        newEmail: newEmailValue.value,
      },
    })

    if (response.success) {
      if (response.requires2FA) {
        // If 2FA is required, go back to 2FA step
        const config = useRuntimeConfig()
        try {
          const aal2Flow = await $fetch(`${config.public.kratosPublicUrl}/self-service/login/browser?aal=aal2&return_to=${encodeURIComponent(`${config.public.siteUrl}/auth/verify-email-change?email=${encodeURIComponent(newEmailValue.value)}`)}&refresh=true`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
            },
          })
          
          if (aal2Flow?.id) {
            emailChange2FAFlowId.value = aal2Flow.id
            emailChangeWizardStep.value = 1
          }
        } catch (flowError: any) {
          emailChangeErrors.value.verification = 'Failed to create 2FA flow. Please try again.'
        }
      } else if (response.settingsFlowId) {
        // Settings flow was created and updated, email should be sent
        emailChangeVerificationFlowId.value = response.settingsFlowId
        toaster.add({
          title: 'Code Sent',
          description: 'A new verification code has been sent to your email.',
          icon: 'ph:envelope',
          progress: true,
        })
        resendCooldown.value = 60
        const interval = setInterval(() => {
          if (resendCooldown.value > 0) {
            resendCooldown.value--
          } else {
            clearInterval(interval)
          }
        }, 1000)
      } else if (response.verificationFlowId) {
        emailChangeVerificationFlowId.value = response.verificationFlowId
        toaster.add({
          title: 'Code Sent',
          description: 'A new verification code has been sent to your email.',
          icon: 'ph:envelope',
          progress: true,
        })
        resendCooldown.value = 60
        const interval = setInterval(() => {
          if (resendCooldown.value > 0) {
            resendCooldown.value--
          } else {
            clearInterval(interval)
          }
        }, 1000)
      }
    }
  } catch (error: any) {
    emailChangeErrors.value.verification = error.message || 'Failed to resend code. Please try again.'
  } finally {
    emailChangeLoading.value = false
  }
}

const onSubmit = handleSubmit(async (values) => {
  success.value = false

  try {
    // Call update profile API (only firstName and lastName, no email)
    const response = await $fetch('/api/auth/profile', {
      method: 'PUT',
      body: {
        firstName: values.firstName,
        lastName: values.lastName || undefined,
        email: sharedUser.value?.email, // Keep current email unchanged
      },
    })

    if (response.success) {
      // Refresh all user data from server (shared cache)
      await refreshUser()
      
      // Also refresh auth state to update layout
      const { checkAuth: refreshAuth } = useAuth()
      await refreshAuth()

      toaster.add({
        title: 'Success',
        description: 'Your profile has been updated!',
        icon: 'ph:check',
        progress: true,
      })

      success.value = true
      setTimeout(() => {
        success.value = false
      }, 3000)
    }
  }
  catch (error: any) {
    // Handle errors
    if (error.statusCode === 400 && error.data) {
      // Handle validation errors
      const validationErrors = error.data as Array<{ path: string[]; message: string }>
      validationErrors.forEach((err) => {
        if (err.path && err.path.length > 0) {
          setFieldError(err.path[0] as keyof FormInput, err.message)
        }
      })
    }
    else if (error.statusCode === 409) {
      // Handle conflict errors
      const errorMessage = error.statusMessage || error.message || 'Failed to update profile'
      toaster.add({
        title: 'Error',
        description: errorMessage,
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
    }
    else {
      toaster.add({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
    }

    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to update profile',
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
          Edit Profile
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Update your personal information
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
          Your profile has been updated!
        </BaseMessage>

        <TairoFormGroup
          label="Profile Picture"
          sublabel="This is how others will recognize you"
        >
          <div class="relative flex flex-col gap-4">
            <TairoFullscreenDropfile
              icon="ph:image-duotone"
              :filter-file-dropped="(file) => file.type.startsWith('image')"
              @drop="(value) => { inputFile = value }"
            />
            <TairoInputFileHeadless
              v-slot="{ open, remove, preview, files }"
              v-model="inputFile"
              accept="image/*"
            >
              <div class="relative size-32 mx-auto">
                <img
                  v-if="files?.length && files.item(0)"
                  :src="preview(files.item(0)!).value"
                  alt="Upload preview"
                  class="bg-muted-200 dark:bg-muted-700/60 size-32 rounded-full object-cover object-center border-4 border-muted-200 dark:border-muted-800"
                >
                <img
                  v-else-if="currentAvatar"
                  :src="currentAvatar"
                  alt="Current avatar"
                  class="bg-muted-200 dark:bg-muted-700/60 size-32 rounded-full object-cover object-center border-4 border-muted-200 dark:border-muted-800"
                >
                <div
                  v-else
                  class="bg-muted-200 dark:bg-muted-700/60 size-32 rounded-full object-cover object-center border-4 border-muted-200 dark:border-muted-800 flex items-center justify-center"
                >
                  <Icon name="ph:user-duotone" class="size-16 text-muted-400" />
                </div>
                
                <div
                  v-if="files?.length && files.item(0)"
                  class="absolute bottom-0 end-0 z-20"
                >
                  <BaseTooltip content="Remove image">
                    <BaseButton
                      size="icon-sm"
                      rounded="full"
                      variant="danger"
                      @click="remove(files.item(0)!)"
                    >
                      <Icon name="lucide:x" class="size-4" />
                    </BaseButton>
                  </BaseTooltip>
                </div>
                <div v-else-if="currentAvatar" class="absolute bottom-0 end-0 z-20">
                  <BaseTooltip content="Remove avatar">
                    <BaseButton
                      size="icon-sm"
                      rounded="full"
                      variant="danger"
                      :loading="isAvatarUploading"
                      @click="deleteAvatar"
                    >
                      <Icon name="lucide:trash-2" class="size-4" />
                    </BaseButton>
                  </BaseTooltip>
                </div>
                <div v-else class="absolute bottom-0 end-0 z-20">
                  <BaseTooltip content="Upload image">
                    <BaseButton
                      size="icon-sm"
                      rounded="full"
                      variant="primary"
                      @click="open"
                    >
                      <Icon name="lucide:plus" class="size-4" />
                    </BaseButton>
                  </BaseTooltip>
                </div>
              </div>
            </TairoInputFileHeadless>
            
            <div class="flex items-center justify-center gap-2 mt-4">
              <BaseButton
                v-if="inputFile && inputFile.item(0)"
                variant="primary"
                :loading="isAvatarUploading"
                :disabled="isAvatarUploading"
                @click="uploadAvatar"
              >
                <Icon name="ph:upload-duotone" class="size-4" />
                <span>Upload Avatar</span>
              </BaseButton>
            </div>
          </div>
        </TairoFormGroup>

        <TairoFormGroup
          label="Personal Information"
          sublabel="Update your name and email address"
        >
          <div class="grid grid-cols-12 gap-4">
            <Field
              v-slot="{ field, errorMessage, handleChange, handleBlur }"
              name="firstName"
            >
              <BaseField
                v-slot="{ inputAttrs, inputRef }"
                label="First Name"
                :error="errorMessage"
                :disabled="isSubmitting"
                class="col-span-12 sm:col-span-6"
                required
              >
                <TairoInput
                  :ref="inputRef"
                  v-bind="inputAttrs"
                  :model-value="field.value"
                  :aria-invalid="errorMessage ? 'true' : undefined"
                  icon="solar:user-rounded-linear"
                  placeholder="First name"
                  rounded="lg"
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
                :error="errorMessage"
                :disabled="isSubmitting"
                class="col-span-12 sm:col-span-6"
              >
                <TairoInput
                  :ref="inputRef"
                  v-bind="inputAttrs"
                  :model-value="field.value"
                  :aria-invalid="errorMessage ? 'true' : undefined"
                  icon="solar:user-rounded-linear"
                  placeholder="Last name"
                  rounded="lg"
                  @update:model-value="handleChange"
                  @blur="handleBlur"
                />
              </BaseField>
            </Field>

            <!-- Email Address (Read-only) -->
            <div class="col-span-12 space-y-4">
              <BaseField
                label="Email Address"
              >
                <div class="flex items-center gap-3">
                  <TairoInput
                    :model-value="sharedUser?.email || ''"
                    type="email"
                    icon="solar:mention-circle-linear"
                    placeholder="Email address"
                    rounded="lg"
                    disabled
                    class="flex-1"
                  />
                  <BaseButton
                    size="sm"
                    variant="primary"
                    @click="startEmailChangeWizard"
                  >
                    <Icon name="ph:pencil-simple" class="size-4" />
                    <span>Change Email</span>
                  </BaseButton>
                </div>
              </BaseField>
                
              <!-- Email Verification Status -->
              <div class="flex items-center gap-3">
                <div v-if="sharedUser?.emailVerified" class="flex items-center gap-2 text-success-600 dark:text-success-500">
                  <Icon name="ph:check-circle-fill" class="size-5" />
                  <span class="text-sm font-medium">Email verified</span>
                </div>
                <div v-else class="flex items-center gap-2 text-muted-500 dark:text-muted-400">
                  <Icon name="ph:warning-circle" class="size-5" />
                  <span class="text-sm">Email not verified</span>
                </div>
              </div>
            </div>
          </div>
        </TairoFormGroup>
      </div>
    </div>
  </form>

  <!-- Email Change Wizard (Inline) -->
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 max-h-0"
    enter-to-class="opacity-100 max-h-[1000px]"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 max-h-[1000px]"
    leave-to-class="opacity-0 max-h-0"
  >
    <div v-if="showEmailChangeWizard" class="mt-6 rounded-lg border border-muted-200 dark:border-muted-700 bg-muted-50 dark:bg-muted-800/50 p-6 space-y-6">
      <!-- Wizard Header -->
      <div class="flex items-center justify-between border-b border-muted-200 dark:border-muted-700 pb-4">
        <div>
          <BaseHeading size="lg" weight="medium" class="mb-1">
            Change Email Address
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500">
            Step {{ emailChangeWizardStep + 1 }} of {{ emailChange2FAFlowId ? 3 : 2 }}
          </BaseParagraph>
        </div>
        <BaseButton
          variant="ghost"
          size="sm"
          @click="cancelEmailChangeWizard"
        >
          <Icon name="lucide:x" class="size-4" />
        </BaseButton>
      </div>

      <!-- Progress Steps -->
      <div class="flex items-center gap-2">
        <div
          v-for="(step, index) in (emailChange2FAFlowId ? 3 : 2)"
          :key="index"
          class="flex items-center"
        >
          <div
            class="flex size-8 items-center justify-center rounded-full border-2 transition-colors"
            :class="index <= emailChangeWizardStep
              ? 'border-primary-500 bg-primary-500 text-white'
              : 'border-muted-300 text-muted-400 dark:border-muted-700'"
          >
            <Icon
              v-if="index < emailChangeWizardStep"
              name="ph:check"
              class="size-4"
            />
            <span v-else class="text-sm font-medium">{{ index + 1 }}</span>
          </div>
          <div
            v-if="index < (emailChange2FAFlowId ? 2 : 1)"
            class="h-0.5 w-8 transition-colors"
            :class="index < emailChangeWizardStep
              ? 'bg-primary-500'
              : 'bg-muted-300 dark:bg-muted-700'"
          />
        </div>
      </div>

      <!-- Step 1: New Email -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <div v-if="emailChangeWizardStep === 0" class="space-y-4">
          <BaseField
            label="New Email Address"
            :error="emailChangeErrors.newEmail"
            required
          >
            <TairoInput
              v-model="newEmailValue"
              type="email"
              placeholder="Enter your new email address"
              icon="solar:mention-circle-linear"
              rounded="lg"
              :disabled="emailChangeLoading"
              @keyup.enter="submitNewEmail"
            />
          </BaseField>
          <div class="flex items-center gap-3">
            <BaseButton
              variant="muted"
              :disabled="emailChangeLoading"
              @click="cancelEmailChangeWizard"
            >
              Cancel
            </BaseButton>
            <BaseButton
              variant="primary"
              :loading="emailChangeLoading"
              :disabled="!newEmailValue || emailChangeLoading"
              @click="submitNewEmail"
            >
              Continue
              <Icon name="ph:arrow-right" class="size-4" />
            </BaseButton>
          </div>
        </div>
      </Transition>

      <!-- Step 2: 2FA Verification (if needed) -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <div v-if="emailChangeWizardStep === 1 && emailChange2FAFlowId" class="space-y-4">
          <div class="text-center space-y-2">
            <BaseHeading size="md" weight="medium">
              Verify Two-Factor Authentication
            </BaseHeading>
            <BaseParagraph size="sm" class="text-muted-500">
              Enter the 6-digit code from your authenticator app
            </BaseParagraph>
          </div>
          <BaseField
            label="2FA Code"
            :error="emailChangeErrors.twoFA"
            required
          >
            <TairoInput
              v-model="emailChange2FACode"
              type="text"
              placeholder="000000"
              maxlength="6"
              pattern="[0-9]{6}"
              icon="ph:shield-check"
              rounded="lg"
              class="text-center text-2xl font-mono tracking-widest"
              :disabled="emailChangeLoading"
              @keyup.enter="verify2FACode"
            />
          </BaseField>
          <div class="flex items-center gap-3">
            <BaseButton
              variant="muted"
              :disabled="emailChangeLoading"
              @click="emailChangeWizardStep = 0"
            >
              <Icon name="ph:arrow-left" class="size-4" />
              Back
            </BaseButton>
            <BaseButton
              variant="primary"
              :loading="emailChangeLoading"
              :disabled="!emailChange2FACode || emailChange2FACode.length !== 6 || emailChangeLoading"
              @click="verify2FACode"
            >
              Verify
              <Icon name="ph:check" class="size-4" />
            </BaseButton>
          </div>
        </div>
      </Transition>

      <!-- Step 3: Email Verification Code -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <div v-if="emailChangeWizardStep === 2" class="space-y-4">
          <div class="text-center space-y-2">
            <BaseHeading size="md" weight="medium">
              Verify Your New Email
            </BaseHeading>
            <BaseParagraph size="sm" class="text-muted-500">
              We've sent a 6-digit verification code to:
            </BaseParagraph>
            <BaseParagraph size="sm" class="font-semibold text-muted-900 dark:text-muted-100">
              {{ newEmailValue }}
            </BaseParagraph>
          </div>
          <BaseField
            label="Verification Code"
            :error="emailChangeErrors.verification"
            required
          >
            <TairoInput
              v-model="emailChangeVerificationCode"
              type="text"
              placeholder="000000"
              maxlength="6"
              pattern="[0-9]{6}"
              icon="ph:key"
              rounded="lg"
              class="text-center text-2xl font-mono tracking-widest"
              :disabled="emailChangeLoading"
              @keyup.enter="verifyEmailCode"
            />
          </BaseField>
          <div class="text-center">
            <BaseButton
              variant="link"
              size="sm"
              :disabled="resendCooldown > 0 || emailChangeLoading"
              @click="resendVerificationCode"
            >
              {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code' }}
            </BaseButton>
          </div>
          <div class="flex items-center gap-3">
            <BaseButton
              variant="muted"
              :disabled="emailChangeLoading"
              @click="emailChangeWizardStep = emailChange2FAFlowId ? 1 : 0"
            >
              <Icon name="ph:arrow-left" class="size-4" />
              Back
            </BaseButton>
            <BaseButton
              variant="primary"
              :loading="emailChangeLoading"
              :disabled="!emailChangeVerificationCode || emailChangeVerificationCode.length !== 6 || emailChangeLoading"
              @click="verifyEmailCode"
            >
              Verify Email
              <Icon name="ph:check" class="size-4" />
            </BaseButton>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

