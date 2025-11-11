<script setup lang="ts">
import type { BillingLowBalanceAlertSettings } from '~/types/billing'

const props = defineProps<{
  modelValue: BillingLowBalanceAlertSettings
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: BillingLowBalanceAlertSettings): void
}>()

const updateValue = (patch: Partial<BillingLowBalanceAlertSettings>) => {
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
        Low balance notification
      </BaseHeading>
      <BaseParagraph size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
        Trigger alerts when your prepaid credits reach a safety threshold.
      </BaseParagraph>
    </div>

    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-muted-100">
            Enable low balance alert
          </BaseText>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            Receive proactive notifications before credits run out.
          </BaseParagraph>
        </div>
        <BaseSwitchBall
          :model-value="modelValue.enabled"
          variant="primary"
          :disabled="disabled"
          @update:model-value="updateValue({ enabled: $event })"
        />
      </div>

      <div v-if="modelValue.enabled" class="space-y-5">
        <TairoFormGroup label="Alert threshold" sublabel="Balance amount that will trigger notifications">
          <div class="flex items-center gap-2">
            <span class="text-muted-500 dark:text-muted-400">$</span>
            <TairoInput
              :model-value="modelValue.threshold"
              type="number"
              min="0"
              icon="solar:dollar-linear"
              rounded="lg"
              class="flex-1"
              :disabled="disabled"
              @update:model-value="updateValue({ threshold: Number($event) })"
            />
          </div>
        </TairoFormGroup>

        <div class="space-y-4">
          <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-muted-100">
            Notification method
          </BaseText>

          <div class="flex items-center justify-between rounded-xl border border-muted-200/70 bg-muted-50 px-4 py-3 dark:border-muted-700 dark:bg-muted-900/40">
            <div class="flex items-center gap-3">
              <Icon name="solar:letter-linear" class="size-4 text-primary-500" />
              <BaseText size="sm" class="text-muted-600 dark:text-muted-400">Email</BaseText>
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
            <div class="flex items-center gap-3">
              <Icon name="solar:webhook-linear" class="size-4 text-info-500" />
              <BaseText size="sm" class="text-muted-600 dark:text-muted-400">Webhook</BaseText>
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
      </div>
    </div>
  </BaseCard>
</template>
