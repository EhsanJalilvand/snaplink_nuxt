<script setup lang="ts">
import { callOnce } from '#imports'

import { usePreferencesAppearance } from '~/composables/usePreferencesAppearance'

const {
  settings,
  isLoading,
  isSaving,
  error,
  colorPresets,
  themeOptions,
  fontOptions,
  radiusOptions,
  animationOptions,
  fetchSettings,
  saveSettings,
  updateSetting,
} = usePreferencesAppearance()

await callOnce(() => fetchSettings())

const handlePresetClick = (value: string) => {
  updateSetting('primaryColor', value)
}

const handleThemeSelect = (value: string) => {
  updateSetting('theme', value as typeof settings.value.theme)
}

const handleBorderRadius = (value: string) => {
  updateSetting('borderRadius', value as typeof settings.value.borderRadius)
}

const handleAnimationSpeed = (value: string) => {
  updateSetting('animationSpeed', value as typeof settings.value.animationSpeed)
}

const handleSave = async () => {
  await saveSettings()
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
                  @click="handlePresetClick(preset.value)"
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
                :disabled="isLoading"
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
              :disabled="isLoading"
              @click="handleThemeSelect(option.value)"
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
              v-for="option in fontOptions"
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
              v-for="option in radiusOptions"
              :key="option.value"
              type="button"
              class="px-4 py-2 rounded-lg border transition-all text-sm font-medium"
              :class="
                settings.borderRadius === option.value
                  ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
              "
              :disabled="isLoading"
              @click="handleBorderRadius(option.value)"
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
              v-for="option in animationOptions"
              :key="option.value"
              type="button"
              class="px-4 py-2 rounded-lg border transition-all text-sm font-medium"
              :class="
                settings.animationSpeed === option.value
                  ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
              "
              :disabled="isLoading"
              @click="handleAnimationSpeed(option.value)"
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
        :disabled="isSaving || isLoading"
        @click="handleSave"
      >
        <Icon name="ph:check" class="size-4" />
        <span>Save Changes</span>
      </BaseButton>
    </div>
  </div>
</template>

