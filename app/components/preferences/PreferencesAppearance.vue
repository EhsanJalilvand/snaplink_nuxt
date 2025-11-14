<script setup lang="ts">
import { ref, watch } from '#imports'
import { usePreferencesAppearance } from '~/composables/usePreferencesAppearance'
import { useWorkspaceTheme } from '~/composables/useWorkspaceTheme'

const props = defineProps<{
  workspaceId?: string | null
}>()

const {
  settings,
  isLoading,
  isSaving,
  error,
  colorPresets,
  themeOptions,
  fontOptions,
  saveSettings,
  updateSetting,
  uploadLogo,
  deleteLogo,
} = usePreferencesAppearance(props.workspaceId)

const logoFile = ref<File | null>(null)
const logoPreview = ref<string | null>(null)
const isUploadingLogo = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const { applyTheme } = useWorkspaceTheme()

watch(
  () => props.workspaceId,
  () => {
    logoFile.value = null
    logoPreview.value = null
  },
)

watch(
  settings,
  (newSettings) => {
    if (newSettings) {
      applyTheme({ ...newSettings })
    }
  },
  { immediate: true, deep: true },
)

const handleLogoSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    logoFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      logoPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleChooseFile = () => {
  fileInputRef.value?.click()
}

const handleLogoUpload = async () => {
  if (!logoFile.value) {
    console.warn('[PreferencesAppearance] No file selected')
    return
  }

  console.log('[PreferencesAppearance] Uploading logo...', { file: logoFile.value.name })
  isUploadingLogo.value = true
  try {
    await uploadLogo(logoFile.value)
    logoFile.value = null
    logoPreview.value = null
    console.log('[PreferencesAppearance] Logo uploaded successfully')
  } catch (error) {
    console.error('[PreferencesAppearance] Logo upload failed:', error)
  } finally {
    isUploadingLogo.value = false
  }
}

const handleLogoDelete = async () => {
  isUploadingLogo.value = true
  try {
    await deleteLogo()
    logoPreview.value = null
  } finally {
    isUploadingLogo.value = false
  }
}

const handlePresetClick = (value: string) => {
  updateSetting('primaryColor', value)
}

const handleThemeSelect = (value: string) => {
  updateSetting('theme', value as typeof settings.value.theme)
}

const handleSave = async () => {
  console.log('[PreferencesAppearance] Saving settings...', { settings: settings.value })
  try {
    await saveSettings()
    console.log('[PreferencesAppearance] Settings saved successfully')
  } catch (error) {
    console.error('[PreferencesAppearance] Save failed:', error)
  }
}
</script>

<template>
  <div class="space-y-6">
    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached appearance presets
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

    <!-- Color Settings -->
    <div class="bg-white dark:bg-muted-800 rounded-lg border border-muted-200 dark:border-muted-700 p-6">
      <div class="mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Color Scheme
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Choose your primary color and theme preferences
        </BaseParagraph>
      </div>

      <div class="space-y-6">
        <!-- Primary Color -->
        <TairoFormGroup
          label="Primary Color"
          sublabel="Select your brand color"
        >
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="preset in colorPresets"
              :key="preset.value"
              type="button"
              class="size-10 rounded-lg border-2 transition-all"
              :class="
                settings.primaryColor === preset.value
                  ? 'border-primary-600 dark:border-primary-400 scale-110'
                  : 'border-muted-300 dark:border-muted-600 hover:scale-105'
              "
              :style="{ backgroundColor: preset.value }"
              @click="handlePresetClick(preset.value)"
            >
              <span class="sr-only">{{ preset.name }}</span>
            </button>
          </div>
        </TairoFormGroup>

        <!-- Theme -->
        <TairoFormGroup
          label="Theme"
          sublabel="Choose your preferred theme"
        >
          <div class="flex gap-2">
            <button
              v-for="option in themeOptions"
              :key="option.value"
              type="button"
              class="px-4 py-2 rounded-lg border transition-all text-sm font-medium"
              :class="
                settings.theme === option.value
                  ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
              "
              :disabled="isLoading"
              @click="handleThemeSelect(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </TairoFormGroup>
      </div>
    </div>

    <!-- Font Family -->
    <div class="bg-white dark:bg-muted-800 rounded-lg border border-muted-200 dark:border-muted-700 p-6">
      <TairoFormGroup
        label="Font Family"
      >
        <BaseSelect
          v-model="settings.fontFamily"
          rounded="lg"
        >
          <BaseSelectItem
            v-for="option in fontOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </BaseSelectItem>
        </BaseSelect>
      </TairoFormGroup>
    </div>

    <!-- Logo Upload -->
    <div class="bg-white dark:bg-muted-800 rounded-lg border border-muted-200 dark:border-muted-700 p-6">
      <div class="mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Workspace Logo
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Upload a logo for your workspace
        </BaseParagraph>
      </div>

      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <div class="relative">
            <div
              v-if="logoPreview || settings.logoUrl"
              class="size-24 rounded-lg border border-muted-200 dark:border-muted-700 overflow-hidden bg-muted-50 dark:bg-muted-900"
            >
              <img
                :src="logoPreview || settings.logoUrl"
                alt="Workspace logo"
                class="w-full h-full object-cover"
              >
            </div>
            <div
              v-else
              class="size-24 rounded-lg border border-muted-200 dark:border-muted-700 flex items-center justify-center bg-muted-50 dark:bg-muted-900"
            >
              <Icon name="solar:gallery-linear" class="size-8 text-muted-400" />
            </div>
          </div>

          <div class="flex-1 space-y-2">
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleLogoSelect"
            >
            <div class="flex gap-2">
              <BaseButton
                variant="outline"
                size="sm"
                :disabled="isUploadingLogo || !props.workspaceId"
                @click="handleChooseFile"
              >
                <Icon name="ph:upload" class="size-4" />
                <span>Choose File</span>
              </BaseButton>
              <BaseButton
                v-if="logoFile"
                variant="primary"
                size="sm"
                :loading="isUploadingLogo"
                :disabled="!props.workspaceId"
                @click="handleLogoUpload"
              >
                <Icon name="ph:check" class="size-4" />
                <span>Upload</span>
              </BaseButton>
              <BaseButton
                v-if="settings.logoUrl && !logoFile"
                variant="ghost"
                size="sm"
                color="danger"
                :loading="isUploadingLogo"
                :disabled="!props.workspaceId"
                @click="handleLogoDelete"
              >
                <Icon name="ph:trash" class="size-4" />
                <span>Remove</span>
              </BaseButton>
            </div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Recommended size: 512x512px. Max file size: 5MB
            </BaseText>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end">
      <BaseButton
        variant="primary"
        :loading="isSaving"
        :disabled="isSaving || isLoading || !props.workspaceId"
        @click="handleSave"
      >
        <Icon name="ph:check" class="size-4" />
        <span>Save Changes</span>
      </BaseButton>
    </div>
  </div>
</template>

