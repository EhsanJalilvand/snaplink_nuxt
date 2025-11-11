<script setup lang="ts">
import type { BillingUsagePeriod } from '~/types/billing'

const props = defineProps<{
  period: BillingUsagePeriod
  options: Array<{ label: string; value: BillingUsagePeriod }>
}>()

const emit = defineEmits<{
  (e: 'update:period', value: BillingUsagePeriod): void
}>()

const handleUpdate = (value: BillingUsagePeriod) => {
  emit('update:period', value)
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <BaseHeading
        as="h1"
        size="2xl"
        weight="bold"
        class="text-muted-900 dark:text-muted-100"
      >
        Usage
      </BaseHeading>
      <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
        Monitor consumption per product and stay ahead of limits.
      </BaseParagraph>
    </div>

    <TairoSelect
      :model-value="period"
      icon="solar:calendar-linear"
      rounded="lg"
      size="sm"
      class="w-44"
      @update:model-value="handleUpdate($event as BillingUsagePeriod)"
    >
      <BaseSelectItem
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </BaseSelectItem>
    </TairoSelect>
  </div>
</template>
