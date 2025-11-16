<script setup lang="ts">
import type { ApiKey } from '~/types/payment-gateway'

interface Props {
  apiKey: ApiKey
  showSecret?: boolean
  canRegenerate?: boolean
  canDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSecret: false,
  canRegenerate: false,
  canDelete: false,
})

const emit = defineEmits<{
  copy: [value: string]
  regenerate: [id: string]
  delete: [id: string]
  toggleActive: [id: string]
}>()

const toaster = useNuiToasts()

const maskedSecret = computed(() => {
  if (props.showSecret) {
    return props.apiKey.secret
  }
  return `${props.apiKey.secret.substring(0, 8)}${'•'.repeat(20)}${props.apiKey.secret.substring(props.apiKey.secret.length - 4)}`
})

const modeConfig = {
  sandbox: {
    label: 'Sandbox',
    color: 'warning',
    icon: 'solar:test-tube-minimalistic-bold-duotone',
  },
  live: {
    label: 'Live',
    color: 'success',
    icon: 'solar:rocket-2-bold-duotone',
  },
} as const

const copyToClipboard = async (value: string, type: 'key' | 'secret') => {
  if (!import.meta.client || !navigator.clipboard) {
    toaster.add({
      title: 'Copy unavailable',
      description: 'Clipboard API is not available',
      icon: 'ph:warning',
      color: 'warning',
      progress: true,
    })
    return
  }

  try {
    await navigator.clipboard.writeText(value)
    emit('copy', value)
    toaster.add({
      title: 'Copied!',
      description: `${type === 'key' ? 'API Key' : 'Secret'} copied to clipboard`,
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })
  } catch (error) {
    toaster.add({
      title: 'Copy failed',
      description: 'Unable to copy to clipboard',
      icon: 'ph:warning',
      color: 'warning',
      progress: true,
    })
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const handleRegenerate = () => {
  emit('regenerate', props.apiKey.id)
}

const handleDelete = () => {
  emit('delete', props.apiKey.id)
}

const handleToggleActive = () => {
  emit('toggleActive', props.apiKey.id)
}
</script>

<template>
  <BaseCard
    class="border border-muted-200/80 bg-white/80 p-6 dark:border-muted-700/60 dark:bg-muted-900/40"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 space-y-4">
        <!-- Header -->
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 items-center justify-center rounded-lg border-2"
            :class="[
              props.apiKey.isActive
                ? `border-${modeConfig[apiKey.mode].color}-200 bg-${modeConfig[apiKey.mode].color}-50 dark:border-${modeConfig[apiKey.mode].color}-800 dark:bg-${modeConfig[apiKey.mode].color}-900/20`
                : 'border-muted-200 bg-muted-50 dark:border-muted-700 dark:bg-muted-800',
            ]"
          >
            <Icon
              :name="modeConfig[apiKey.mode].icon"
              class="size-5"
              :class="props.apiKey.isActive ? `text-${modeConfig[apiKey.mode].color}-500` : 'text-muted-400'"
            />
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <BaseHeading
                as="h4"
                size="sm"
                weight="semibold"
                class="text-muted-900 dark:text-white"
              >
                {{ apiKey.name }}
              </BaseHeading>
              <BaseChip
                size="xs"
                :color="modeConfig[apiKey.mode].color"
                variant="pastel"
              >
                {{ modeConfig[apiKey.mode].label }}
              </BaseChip>
              <BaseChip
                v-if="!apiKey.isActive"
                size="xs"
                color="muted"
                variant="pastel"
              >
                Inactive
              </BaseChip>
            </div>
            <BaseText size="xs" class="mt-0.5 text-muted-500 dark:text-muted-400">
              Created {{ formatDate(apiKey.createdAt) }}
            </BaseText>
          </div>
        </div>

        <!-- API Key -->
        <TairoFormGroup label="API Key" class="mb-0">
          <div class="flex items-center gap-2 rounded-xl border border-muted-200 bg-muted-50 px-4 py-3 font-mono text-xs text-muted-700 dark:border-muted-700 dark:bg-muted-800 dark:text-muted-200">
            <span class="flex-1 truncate">{{ apiKey.key }}</span>
            <BaseButton
              size="sm"
              variant="ghost"
              icon
              class="shrink-0 rounded-full"
              @click="copyToClipboard(apiKey.key, 'key')"
            >
              <Icon name="ph:copy" class="size-4" />
            </BaseButton>
          </div>
        </TairoFormGroup>

        <!-- Secret -->
        <TairoFormGroup label="Secret Key" class="mb-0">
          <div class="flex items-center gap-2 rounded-xl border border-muted-200 bg-muted-50 px-4 py-3 font-mono text-xs text-muted-700 dark:border-muted-700 dark:bg-muted-800 dark:text-muted-200">
            <span class="flex-1 truncate">{{ maskedSecret }}</span>
            <BaseButton
              v-if="showSecret"
              size="sm"
              variant="ghost"
              icon
              class="shrink-0 rounded-full"
            >
              <Icon name="ph:eye-slash" class="size-4" />
            </BaseButton>
            <BaseButton
              size="sm"
              variant="ghost"
              icon
              class="shrink-0 rounded-full"
              @click="copyToClipboard(apiKey.secret, 'secret')"
            >
              <Icon name="ph:copy" class="size-4" />
            </BaseButton>
          </div>
        </TairoFormGroup>

        <!-- Metadata -->
        <div class="grid grid-cols-2 gap-4 pt-2">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Last Used
            </BaseText>
            <BaseText size="sm" weight="medium" class="mt-0.5 text-muted-700 dark:text-muted-300">
              {{ formatDate(apiKey.lastUsedAt) }}
            </BaseText>
          </div>
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Expires
            </BaseText>
            <BaseText size="sm" weight="medium" class="mt-0.5 text-muted-700 dark:text-muted-300">
              {{ apiKey.expiresAt ? formatDate(apiKey.expiresAt) : 'Never' }}
            </BaseText>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex shrink-0 flex-col gap-2">
        <BaseSwitchBall
          :model-value="apiKey.isActive"
          variant="primary"
          @update:model-value="handleToggleActive"
        />
        <BaseDropdown
          flavor="context"
          label="Actions"
          orientation="end"
        >
          <BaseDropdownItem
            v-if="canRegenerate"
            @click="handleRegenerate"
          >
            <Icon name="solar:refresh-bold-duotone" class="size-4" />
            <span>Regenerate</span>
          </BaseDropdownItem>
          <BaseDropdownItem
            v-if="canDelete"
            @click="handleDelete"
          >
            <Icon name="solar:trash-bin-minimalistic-bold-duotone" class="size-4" />
            <span>Delete</span>
          </BaseDropdownItem>
        </BaseDropdown>
      </div>
    </div>
  </BaseCard>
</template>

