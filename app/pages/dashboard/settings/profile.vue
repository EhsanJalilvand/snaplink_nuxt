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

const onSubmit = handleSubmit(async (values) => {
  success.value = false

  try {
    // Call update profile API (only firstName and lastName, no email)
    const response = await $fetch('/api/auth/profile', {
      method: 'PUT',
      body: {
        firstName: values.firstName,
        lastName: values.lastName || undefined,
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

          </div>
        </TairoFormGroup>
      </div>
    </div>
  </form>
</template>

