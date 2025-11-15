<script setup lang="ts">
import { ref } from '#imports'
import { usePreferencesDomains } from '~/composables/usePreferencesDomains'

const props = defineProps<{
  workspaceId?: string | null
}>()

const {
  settings,
  isLoading,
  isSaving,
  isValidating,
  error,
  saveSettings,
  validateDomain,
  updateSetting,
} = usePreferencesDomains(props.workspaceId)

const subdomainError = ref<string | null>(null)
const customDomainError = ref<string | null>(null)

const handleSubdomainChange = async (value: string) => {
  updateSetting('subdomain', value || undefined)
  subdomainError.value = null

  if (value) {
    const validation = await validateDomain(value, settings.value.customDomain)
    if (!validation.isValid) {
      subdomainError.value = validation.errorMessage || 'Invalid subdomain'
    }
  }
}

const handleCustomDomainChange = async (value: string) => {
  updateSetting('customDomain', value || undefined)
  customDomainError.value = null

  if (value) {
    const validation = await validateDomain(settings.value.subdomain, value)
    if (!validation.isValid) {
      customDomainError.value = validation.errorMessage || 'Invalid domain'
    } else {
      updateSetting('domainVerified', validation.isVerified)
    }
  }
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
        Unable to load domain settings
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

    <!-- Domain Settings -->
    <div class="bg-white dark:bg-muted-800 rounded-lg border border-muted-200 dark:border-muted-700 p-6">
      <div class="mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Domain Configuration
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Configure your workspace domain settings
        </BaseParagraph>
      </div>

      <div class="space-y-6">
        <!-- Subdomain Section -->
        <TairoFormGroup
          label="Subdomain"
          sublabel="Choose a unique subdomain (e.g., yourworkspace.snaplink.io)"
        >
          <div>
            <div class="flex items-center gap-2 w-full">
              <TairoInput
                :model-value="settings.subdomain"
                type="text"
                placeholder="yourworkspace"
                icon="solar:global-linear"
                size="lg"
                class="flex-1"
                :disabled="isLoading || isValidating"
                @update:model-value="handleSubdomainChange"
              />
              <div class="px-3 h-12 border border-muted-200 dark:border-muted-700 rounded-md bg-muted-50 dark:bg-muted-900 flex items-center">
                <span class="text-sm font-medium text-muted-600 dark:text-muted-400">.snaplink.io</span>
              </div>
            </div>
            <div class="mt-2">
              <BaseText
                v-if="subdomainError"
                size="xs"
                class="text-danger-500"
              >
                {{ subdomainError }}
              </BaseText>
              <BaseText
                v-else
                size="xs"
                class="text-muted-500 dark:text-muted-400"
              >
                Only lowercase letters, numbers, and hyphens are allowed. Must be 3-63 characters.
              </BaseText>
            </div>
          </div>
        </TairoFormGroup>

        <!-- Custom Domain Section -->
        <TairoFormGroup
          label="Custom Domain"
          sublabel="Use your own domain (e.g., links.yourdomain.com)"
        >
          <div>
            <div class="flex items-center gap-2 w-full">
              <TairoInput
                :model-value="settings.customDomain"
                type="text"
                placeholder="links.yourdomain.com"
                icon="solar:global-linear"
                size="lg"
                class="flex-1"
                :disabled="isLoading || isValidating"
                @update:model-value="handleCustomDomainChange"
              />
              <div class="px-3 h-12 border border-transparent rounded-md flex items-center opacity-0 pointer-events-none">
                <span class="text-sm font-medium">.snaplink.io</span>
              </div>
            </div>
            <div class="mt-2">
              <BaseText
                v-if="customDomainError"
                size="xs"
                class="text-danger-500"
              >
                {{ customDomainError }}
              </BaseText>
              <BaseText
                v-else-if="settings.customDomain && settings.domainVerified"
                size="xs"
                class="text-success-500"
              >
                Domain verified successfully
              </BaseText>
              <BaseText
                v-else-if="settings.customDomain && !settings.domainVerified"
                size="xs"
                class="text-warning-500"
              >
                Domain needs verification. Please configure DNS records.
              </BaseText>
              <BaseText
                v-else
                size="xs"
                class="text-muted-500 dark:text-muted-400"
              >
                Enter your custom domain. DNS verification will be required.
              </BaseText>
            </div>
          </div>
        </TairoFormGroup>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end">
      <BaseButton
        variant="primary"
        :loading="isSaving || isValidating"
        :disabled="isSaving || isLoading || isValidating"
        @click="handleSave"
      >
        <Icon name="ph:check" class="size-4" />
        <span>Save Changes</span>
      </BaseButton>
    </div>
  </div>
</template>
