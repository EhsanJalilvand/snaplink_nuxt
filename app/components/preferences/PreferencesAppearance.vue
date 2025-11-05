<script setup lang="ts">
import { ref } from 'vue'
import { useNuiToasts } from '#imports'

const toaster = useNuiToasts()

// Appearance settings state
const settings = ref({
  primaryColor: '#6366f1',
  theme: 'light',
  fontFamily: 'Inter',
  borderRadius: 'md',
  animationSpeed: 'normal',
})

const colorPresets = [
  { name: 'Primary', value: '#6366f1' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f59e0b' },
]

const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Auto', value: 'auto' },
]

const fontFamilyOptions = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Open Sans', value: 'Open Sans' },
]

const borderRadiusOptions = [
  { label: 'None', value: 'none' },
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
]

const animationSpeedOptions = [
  { label: 'Fast', value: 'fast' },
  { label: 'Normal', value: 'normal' },
  { label: 'Slow', value: 'slow' },
]

const isSaving = ref(false)

const handleSave = async () => {
  isSaving.value = true
  try {
    // TODO: API call to save appearance settings
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toaster.add({
      title: 'Success',
      description: 'Appearance settings saved successfully!',
      icon: 'ph:check',
      progress: true,
    })
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to save appearance settings',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
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
          <div class="flex items-center gap-4">
            <div class="flex-1">
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
                  @click="settings.primaryColor = preset.value"
                >
                  <span class="sr-only">{{ preset.name }}</span>
                </button>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model="settings.primaryColor"
                type="color"
                class="size-10 rounded-lg border border-muted-300 dark:border-muted-600 cursor-pointer"
              >
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                {{ settings.primaryColor }}
              </BaseText>
            </div>
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
              @click="settings.theme = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </TairoFormGroup>
      </div>
    </div>

    <!-- Typography & Layout -->
    <div class="bg-white dark:bg-muted-800 rounded-lg border border-muted-200 dark:border-muted-700 p-6">
      <div class="mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Typography & Layout
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Customize fonts and layout preferences
        </BaseParagraph>
      </div>

      <div class="space-y-6">
        <!-- Font Family -->
        <TairoFormGroup
          label="Font Family"
          sublabel="Choose your preferred font"
        >
          <TairoSelect
            v-model="settings.fontFamily"
            icon="solar:text-linear"
            rounded="lg"
          >
            <BaseSelectItem
              v-for="option in fontFamilyOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>

        <!-- Border Radius -->
        <TairoFormGroup
          label="Border Radius"
          sublabel="Adjust the roundness of elements"
        >
          <div class="flex gap-2">
            <button
              v-for="option in borderRadiusOptions"
              :key="option.value"
              type="button"
              class="px-4 py-2 rounded-lg border transition-all text-sm font-medium"
              :class="
                settings.borderRadius === option.value
                  ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
              "
              @click="settings.borderRadius = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </TairoFormGroup>

        <!-- Animation Speed -->
        <TairoFormGroup
          label="Animation Speed"
          sublabel="Control the speed of UI animations"
        >
          <div class="flex gap-2">
            <button
              v-for="option in animationSpeedOptions"
              :key="option.value"
              type="button"
              class="px-4 py-2 rounded-lg border transition-all text-sm font-medium"
              :class="
                settings.animationSpeed === option.value
                  ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
              "
              @click="settings.animationSpeed = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </TairoFormGroup>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end">
      <BaseButton
        variant="primary"
        :loading="isSaving"
        :disabled="isSaving"
        @click="handleSave"
      >
        <Icon name="ph:check" class="size-4" />
        <span>Save Changes</span>
      </BaseButton>
    </div>
  </div>
</template>

