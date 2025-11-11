<script setup lang="ts">
import type { PaymentLinkFilters } from '~/types/payment-links'

const searchModel = defineModel<string>('search', { default: '' })
const statusModel = defineModel<PaymentLinkFilters['status']>('status', { default: 'all' })
const currencyModel = defineModel<PaymentLinkFilters['currency']>('currency', { default: 'all' })

const props = defineProps<{
  statusOptions: Array<{ label: string; value: PaymentLinkFilters['status'] }>
  currencyOptions: Array<{ label: string; value: PaymentLinkFilters['currency'] }>
}>()

const emit = defineEmits<{
  'create-link': []
}>()

const handleCreate = () => {
  emit('create-link')
}
</script>

<template>
  <TairoContentWrapper>
    <template #left>
      <TairoInput
        v-model="searchModel"
        icon="lucide:search"
        placeholder="Search links or IDs"
        rounded="lg"
      />
    </template>
    <template #right>
      <div class="flex items-center gap-2">
        <TairoSelect
          v-model="statusModel"
          icon="solar:filter-linear"
          rounded="lg"
          class="w-36"
        >
          <BaseSelectItem
            v-for="option in props.statusOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </BaseSelectItem>
        </TairoSelect>
        <TairoSelect
          v-model="currencyModel"
          icon="solar:money-bag-linear"
          rounded="lg"
          class="w-32"
        >
          <BaseSelectItem
            v-for="option in props.currencyOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </BaseSelectItem>
        </TairoSelect>
        <BaseButton variant="primary" @click="handleCreate">
          <Icon name="ph:plus" class="size-4" />
          New payment link
        </BaseButton>
      </div>
    </template>
  </TairoContentWrapper>
</template>
