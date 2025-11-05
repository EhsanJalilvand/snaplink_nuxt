<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  showUploadButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showUploadButton: true,
})

const emit = defineEmits<{
  upload: []
  delete: []
}>()

// Use shared user data composable for consistent state across all components
const { user: sharedUser, refreshUser } = useUserData()

// Avatar states
const inputFile = ref<FileList | null>(null)
const isAvatarUploading = ref(false)
const currentAvatar = computed(() => sharedUser.value?.avatar || null)
const toaster = useNuiToasts()

// Size classes
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'size-16'
    case 'md':
      return 'size-20'
    case 'lg':
      return 'size-32'
    default:
      return 'size-20'
  }
})

const iconSizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'size-8'
    case 'md':
      return 'size-10'
    case 'lg':
      return 'size-16'
    default:
      return 'size-10'
  }
})

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
      await refreshUser()
      
      // Clear file input
      inputFile.value = null

      toaster.add({
        title: 'Success',
        description: 'Avatar updated successfully!',
        icon: 'ph:check',
        progress: true,
      })

      emit('upload')
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

      emit('delete')
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
</script>

<template>
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
      <div class="relative" :class="sizeClasses">
        <img
          v-if="files?.length && files.item(0)"
          :src="preview(files.item(0)!).value"
          alt="Upload preview"
          :class="[
            sizeClasses,
            'rounded-full object-cover object-center border-4 border-muted-200 dark:border-muted-800 bg-muted-200 dark:bg-muted-700/60'
          ]"
        >
        <img
          v-else-if="currentAvatar"
          :src="currentAvatar"
          alt="Current avatar"
          :class="[
            sizeClasses,
            'rounded-full object-cover object-center border-4 border-muted-200 dark:border-muted-800'
          ]"
        >
        <div
          v-else
          :class="[
            sizeClasses,
            'rounded-full bg-muted-200 dark:bg-muted-700/60 border-4 border-muted-200 dark:border-muted-800 flex items-center justify-center'
          ]"
        >
          <Icon :name="iconSizeClasses.includes('size-16') ? 'ph:user-duotone' : 'ph:user-duotone'" :class="iconSizeClasses" class="text-muted-400" />
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
    
    <div v-if="showUploadButton" class="flex items-center justify-center gap-2">
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
</template>

