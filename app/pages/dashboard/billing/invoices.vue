<script setup lang="ts">
import { callOnce } from '#imports'
import { useBillingInvoices } from '~/composables/useBillingInvoices'

definePageMeta({
  title: 'Invoices',
  layout: 'dashboard',
})

const {
  status,
  filters,
  filteredInvoices,
  plan,
  isLoading,
  error,
  fetchInvoices,
  setStatus,
  getStatusConfig,
  handleDownload,
  handleExport,
  handleUpgradePlan,
  handleViewPricing,
} = useBillingInvoices()

callOnce(() => fetchInvoices())

const updateStatusFilter = (value: typeof status.value) => {
  setStatus(value)
}
</script>

<template>
  <div class="space-y-6 py-6">
    <BillingInvoicesHeader @export="handleExport" />

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached invoices
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

    <BillingInvoicesFilters
      :model-value="status"
      :filters="filters"
      :disabled="isLoading"
      @update:model-value="updateStatusFilter"
    />

    <BillingInvoicesTable
      :items="filteredInvoices"
      :is-loading="isLoading"
      :get-status-config="getStatusConfig"
      @download="handleDownload"
    />

    <BillingPlanCard
      :plan="plan"
      :is-loading="isLoading"
      @upgrade="handleUpgradePlan"
      @view-pricing="handleViewPricing"
    />
  </div>
</template>

