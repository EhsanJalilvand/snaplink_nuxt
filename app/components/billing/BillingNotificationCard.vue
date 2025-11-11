<script setup lang="ts">
import type { BillingNotificationChannels } from '~/types/billing'

const props = defineProps<{
  modelValue: BillingNotificationChannels
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: BillingNotificationChannels): void
}>()

const updateValue = (patch: Partial<BillingNotificationChannels>) => {
  emit('update:modelValue', {
    ...props.modelValue,
    ...patch,
  })
}
</script>

<template>
  <BaseCard class="p-6">
    <div class="mb-6">
      <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-muted-100">
        Billing alerts
      </BaseHeading>
      <BaseParagraph size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
        Choose how your team is informed about payment lifecycle events.
      </BaseParagraph>
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between rounded-xl border border-muted-200/70 bg-muted-50 px-4 py-3 dark:border-muted-700 dark:bg-muted-900/40">
        <div>
          <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-muted-100">
            Email notifications
          </BaseText>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            Send statements and payment receipts to your inbox.
          </BaseParagraph>
        </div>
        <BaseSwitchBall
          :model-value="modelValue.email"
          variant="primary"
          size="sm"
          :disabled="disabled"
          @update:model-value="updateValue({ email: $event })"
        />
      </div>

      <div class="flex items-center justify-between rounded-xl border border-muted-200/70 bg-muted-50 px-4 py-3 dark:border-muted-700 dark:bg-muted-900/40">
        <div>
          <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-muted-100">
            Webhook notifications
          </BaseText>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            Forward billing events to automation pipelines.
          </BaseParagraph>
        </div>
        <BaseSwitchBall
          :model-value="modelValue.webhook"
          variant="primary"
          size="sm"
          :disabled="disabled"
          @update:model-value="updateValue({ webhook: $event })"
        />
      </div>
    </div>
  </BaseCard>
</template>
