<script setup lang="ts">
import { callOnce } from '#imports'
import { useBillingUsage } from '~/composables/useBillingUsage'

definePageMeta({
  title: 'Usage',
  layout: 'dashboard',
})

const {
  period,
  periodOptions,
  usageItems,
  summary,
  isLoading,
  error,
  fetchUsage,
} = useBillingUsage()

callOnce(() => fetchUsage())

const handlePeriodChange = async (value: typeof period.value) => {
  period.value = value
  await fetchUsage(value)
}
</script>

<template>
  <div class="space-y-6 py-6">
    <BillingUsageHeader
      :period="period"
      :options="periodOptions"
      @update:period="handlePeriodChange"
    />

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached usage metrics
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

    <BillingUsageGrid
      :items="usageItems"
      :is-loading="isLoading"
    />

    <BillingUsageTotals
      :summary="summary"
      :is-loading="isLoading"
    />
  </div>
</template>

