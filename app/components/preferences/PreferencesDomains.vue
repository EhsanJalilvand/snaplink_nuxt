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

    <!-- Subdomain Settings -->
    <div class="bg-white dark:bg-muted-800 rounded-lg border border-muted-200 dark:border-muted-700 p-6">
      <div class="mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Subdomain
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Set a custom subdomain for your workspace (e.g., yourworkspace.snaplink.io)
        </BaseParagraph>
      </div>

      <div class="space-y-4">
        <TairoFormGroup
          label="Subdomain"
          sublabel="Choose a unique subdomain"
        >
          <div class="flex items-center gap-2">
            <TairoInput
              :model-value="settings.subdomain"
              type="text"
              placeholder="yourworkspace"
              icon="solar:global-linear"
              rounded="lg"
              :disabled="isLoading || isValidating"
              @update:model-value="handleSubdomainChange"
            >
              <template #trailing>
                <span class="text-sm text-muted-500">.snaplink.io</span>
              </template>
            </TairoInput>
          </div>
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
        </TairoFormGroup>
      </div>
    </div>

    <!-- Custom Domain Settings -->
    <div class="bg-white dark:bg-muted-800 rounded-lg border border-muted-200 dark:border-muted-700 p-6">
      <div class="mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Custom Domain
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Use your own domain for your workspace (e.g., links.yourdomain.com)
        </BaseParagraph>
      </div>

      <div class="space-y-4">
        <TairoFormGroup
          label="Custom Domain"
          sublabel="Enter your custom domain"
        >
          <TairoInput
            :model-value="settings.customDomain"
            type="text"
            placeholder="links.yourdomain.com"
            icon="solar:global-linear"
            rounded="lg"
            :disabled="isLoading || isValidating"
            @update:model-value="handleCustomDomainChange"
          />
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
