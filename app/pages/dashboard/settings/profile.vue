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

// This is the Zod schema for the form input
const zodSchema = z.object({
  firstName: z.string()
    .min(1, VALIDATION_TEXT.FIRSTNAME_REQUIRED)
    .max(100, VALIDATION_TEXT.FIRSTNAME_TOO_LONG),
  lastName: z.string()
    .max(100, VALIDATION_TEXT.LASTNAME_TOO_LONG)
    .optional()
    .transform((val) => val || ''),
  email: z.string()
    .min(1, VALIDATION_TEXT.EMAIL_REQUIRED)
    .email(VALIDATION_TEXT.EMAIL_INVALID),
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
    email: '',
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

// Email verification states
const showEmailVerificationModal = ref(false)
const isEmailVerificationSending = ref(false)
const emailVerificationCode = ref('')
const originalEmail = ref('')
const newEmailValue = ref('')
const timeRemaining = ref(0)
const timerInterval = ref<NodeJS.Timeout | null>(null)

// Timer functions
const startTimer = () => {
  timeRemaining.value = 15 * 60 // 15 minutes in seconds
  
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  
  timerInterval.value = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
    } else {
      clearInterval(timerInterval.value!)
      timerInterval.value = null
    }
  }, 1000)
}

const formatTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60)
  const seconds = timeRemaining.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const isTimerExpired = computed(() => timeRemaining.value === 0)

// Cleanup on unmount
onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})

// Watch for user data changes to update form - only on client side
watch(sharedUser, (newUser) => {
  if (newUser) {
    nextTick(() => {
      setFieldValue('firstName', newUser.firstName || '')
      setFieldValue('lastName', newUser.lastName || '')
      setFieldValue('email', newUser.email || '')
      originalEmail.value = newUser.email || ''
    })
  }
}, { immediate: true })

// Also update on mount to ensure values are set
onMounted(() => {
  nextTick(() => {
    if (sharedUser.value) {
      setFieldValue('firstName', sharedUser.value.firstName || '')
      setFieldValue('lastName', sharedUser.value.lastName || '')
      setFieldValue('email', sharedUser.value.email || '')
      originalEmail.value = sharedUser.value.email || ''
    }
  })
})

// Handle verify email button click
const handleVerifyEmail = async () => {
  if (!sharedUser.value?.email) {
    toaster.add({
      title: 'Error',
      description: 'No email address found',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
    return
  }

  newEmailValue.value = sharedUser.value.email
  const codeSent = await sendEmailVerificationCode()
  if (codeSent) {
    startTimer()
  }
}

// Send email verification code
const sendEmailVerificationCode = async () => {
  if (!newEmailValue.value) {
    toaster.add({
      title: 'Error',
      description: 'Please enter an email address',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
    return false
  }

  isEmailVerificationSending.value = true
  
  try {
    const response = await $fetch('/api/auth/send-email-verification', {
      method: 'POST',
      body: {
        newEmail: newEmailValue.value,
      },
    })

    if (response.success) {
      toaster.add({
        title: 'Success',
        description: response.message || 'Verification code sent to your email',
        icon: 'ph:check',
        progress: true,
      })

      // In development, show the code
      if (process.env.NODE_ENV === 'development' && response.code) {
        console.log('Verification code:', response.code)
      }

      showEmailVerificationModal.value = true
      return true
    }
    
    return false
  } catch (error: any) {
    if (error.statusCode === 409) {
      toaster.add({
        title: 'Error',
        description: 'Email is already registered',
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
    } else {
      toaster.add({
        title: 'Error',
        description: error.message || 'Failed to send verification code',
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
    }
    return false
  } finally {
    isEmailVerificationSending.value = false
  }
}

const onSubmit = handleSubmit(async (values) => {
  success.value = false

  try {
    // Call update profile API
    const response = await $fetch('/api/auth/profile', {
      method: 'PUT',
      body: {
        firstName: values.firstName,
        lastName: values.lastName || undefined,
        email: values.email,
      },
    })

    if (response.success) {
      // Clear verification code and close modal
      emailVerificationCode.value = ''
      showEmailVerificationModal.value = false

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
      // Email already exists
      setFieldError('email', 'Email is already registered')
    }
    else {
      setFieldError('email', error.message || 'Failed to update profile')
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

// Verify code and submit form
const verifyAndSubmit = async () => {
  if (!emailVerificationCode.value || emailVerificationCode.value.length !== 6) {
    toaster.add({
      title: 'Error',
      description: 'Please enter a 6-digit verification code',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
    return
  }

  try {
    const response = await $fetch('/api/auth/verify-email-change', {
      method: 'POST',
      body: {
        code: emailVerificationCode.value,
      },
    })

    if (response.success) {
      // Clear verification code and close modal
      emailVerificationCode.value = ''
      showEmailVerificationModal.value = false

      // Refresh all user data from server (shared cache)
      await refreshUser()
      
      // Also refresh auth state to update layout
      const { checkAuth: refreshAuth } = useAuth()
      await refreshAuth()

      toaster.add({
        title: 'Success',
        description: 'Email verified and updated successfully!',
        icon: 'ph:check',
        progress: true,
      })
    }
  } catch (error: any) {
    if (error.statusCode === 400) {
      toaster.add({
        title: 'Error',
        description: error.message || 'Invalid verification code',
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
    } else {
      toaster.add({
        title: 'Error',
        description: error.message || 'Failed to verify email',
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
    }
  }
}

// Close modal and reset
const cancelEmailChange = () => {
  showEmailVerificationModal.value = false
  emailVerificationCode.value = ''
  newEmailValue.value = ''
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
  timeRemaining.value = 0
}
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

            <Field
              v-slot="{ field, errorMessage, handleChange, handleBlur }"
              name="email"
            >
              <div class="col-span-12 space-y-4">
              <BaseField
                v-slot="{ inputAttrs, inputRef }"
                label="Email Address"
                :error="errorMessage"
                :disabled="isSubmitting"
                required
              >
                <TairoInput
                  :ref="inputRef"
                  v-bind="inputAttrs"
                  :model-value="field.value"
                  type="email"
                  :aria-invalid="errorMessage ? 'true' : undefined"
                  icon="solar:mention-circle-linear"
                  placeholder="Email address"
                  autocomplete="email"
                  rounded="lg"
                  @update:model-value="handleChange"
                  @blur="handleBlur"
                />
              </BaseField>
                
                <!-- Email Verification Status -->
                <div class="flex items-center gap-3">
                  <div v-if="sharedUser?.emailVerified" class="flex items-center gap-2 text-success-600 dark:text-success-500">
                    <Icon name="ph:check-circle-fill" class="size-5" />
                    <span class="text-sm font-medium">Email verified</span>
                  </div>
                  <div v-else class="flex items-center gap-3">
                    <div class="flex items-center gap-2 text-muted-500 dark:text-muted-400">
                      <Icon name="ph:warning-circle" class="size-5" />
                      <span class="text-sm">Email not verified</span>
                    </div>
                    <BaseButton
                      size="sm"
                      variant="muted"
                      :loading="isEmailVerificationSending"
                      @click="handleVerifyEmail"
                    >
                      <Icon name="ph:envelope-simple" class="size-4" />
                      <span>Verify Email</span>
                    </BaseButton>
                  </div>
                </div>
              </div>
            </Field>
          </div>
        </TairoFormGroup>
      </div>
    </div>
  </form>

  <!-- Email Verification Modal -->
  <DialogRoot v-model:open="showEmailVerificationModal">
    <DialogPortal>
      <DialogOverlay class="bg-muted-800/70 dark:bg-muted-900/80 fixed inset-0 z-50" />
      <DialogContent
        class="fixed starting:opacity-0 starting:top-[8%] top-[10%] start-[50%] max-h-[85vh] w-[90vw] max-w-[32rem] translate-x-[-50%] text-sm rounded-lg overflow-hidden border border-white dark:border-muted-700 bg-white dark:bg-muted-800 focus:outline-none z-[100] transition-discrete transition-all duration-200 ease-out flex flex-col"
      >
        <div class="flex w-full items-center justify-between p-4 md:p-6 border-b border-muted-200 dark:border-muted-700">
          <DialogTitle class="font-heading text-muted-900 text-lg font-medium leading-6 dark:text-white">
            Verify Your Email
          </DialogTitle>
          <BaseButton class="icon-md" @click="showEmailVerificationModal = false">
            <Icon name="lucide:x" class="size-4" />
          </BaseButton>
        </div>
        <div class="overflow-y-auto">
    <div class="space-y-6 p-6">
      <div class="text-center space-y-3">
        <div class="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
          <Icon name="ph:envelope-simple-duotone" class="size-8 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <BaseHeading size="lg" class="mb-2">Check your email</BaseHeading>
          <BaseParagraph class="text-muted-600 dark:text-muted-400">
            We've sent a 6-digit verification code to:
          </BaseParagraph>
          <BaseParagraph class="font-semibold text-muted-900 dark:text-muted-100 mt-1">
            {{ newEmailValue }}
          </BaseParagraph>
        </div>
      </div>

      <div class="space-y-4">
        <BaseField label="Verification Code" required>
          <TairoInput
            v-model="emailVerificationCode"
            type="text"
            placeholder="000000"
            maxlength="6"
            icon="ph:key-duotone"
            rounded="lg"
            :disabled="isTimerExpired"
          />
        </BaseField>

        <!-- Timer -->
        <div v-if="timeRemaining > 0" class="flex items-center justify-center gap-2 text-sm">
          <Icon name="ph:clock-countdown-duotone" class="size-5 text-muted-500" />
          <span class="text-muted-600 dark:text-muted-400">Code expires in</span>
          <span class="font-semibold text-danger-600 dark:text-danger-400">{{ formatTime }}</span>
        </div>
        <div v-else class="flex items-center justify-center gap-2 text-sm text-danger-600 dark:text-danger-500">
          <Icon name="ph:warning-circle" class="size-5" />
          <span>Verification code expired</span>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <BaseButton
            type="button"
            variant="muted"
            :disabled="isSubmitting"
            class="flex-1"
            @click="cancelEmailChange"
          >
            Cancel
          </BaseButton>
          <BaseButton
            type="button"
            variant="primary"
            :disabled="isSubmitting || emailVerificationCode.length !== 6 || isTimerExpired"
            :loading="isSubmitting"
            class="flex-1"
            @click="verifyAndSubmit"
          >
            Verify Email
          </BaseButton>
        </div>
      </div>
    </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

