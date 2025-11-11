<script setup lang="ts">
import type { BillingSpendingLimitSettings } from '~/types/billing'

const props = defineProps<{
  modelValue: BillingSpendingLimitSettings
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: BillingSpendingLimitSettings): void
}>()

const updateValue = (patch: Partial<BillingSpendingLimitSettings>) => {
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
        Spending limit
      </BaseHeading>
      <BaseParagraph size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
        Automatically pause usage once monthly caps are reached.
      </BaseParagraph>
    </div>

    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-muted-100">
            Enable spending limit
          </BaseText>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            Suspend non-critical services once the cap is reached.
          </BaseParagraph>
        </div>
        <BaseSwitchBall
          :model-value="modelValue.enabled"
          variant="primary"
          :disabled="disabled"
          @update:model-value="updateValue({ enabled: $event })"
        />
      </div>

      <TairoFormGroup v-if="modelValue.enabled" label="Monthly limit" sublabel="Maximum spend across all products per month">
        <div class="flex items-center gap-2">
          <span class="text-muted-500 dark:text-muted-400">$</span>
          <TairoInput
            :model-value="modelValue.monthlyLimit"
            type="number"
            min="0"
            icon="solar:dollar-linear"
            rounded="lg"
            class="flex-1"
            :disabled="disabled"
            @update:model-value="updateValue({ monthlyLimit: Number($event) })"
          />
        </div>
      </TairoFormGroup>
    </div>
  </BaseCard>
</template>
