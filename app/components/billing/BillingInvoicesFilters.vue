<script setup lang="ts">
import type { BillingInvoiceStatus } from '~/types/billing'

const props = defineProps<{
  modelValue: 'all' | BillingInvoiceStatus
  filters: Array<{ label: string; value: 'all' | BillingInvoiceStatus }>
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: 'all' | BillingInvoiceStatus): void
}>()

const updateValue = (value: 'all' | BillingInvoiceStatus) => {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <BaseButton
      v-for="filter in filters"
      :key="filter.value"
      :variant="modelValue === filter.value ? 'primary' : 'outline'"
      size="sm"
      :disabled="disabled"
      @click="updateValue(filter.value)"
    >
      {{ filter.label }}
    </BaseButton>
  </div>
</template>
