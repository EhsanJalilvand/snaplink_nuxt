<script setup lang="ts">
import { callOnce, computed } from '#imports'
import { useBillingOverview } from '~/composables/useBillingOverview'

definePageMeta({
  title: 'Billing Overview',
  layout: 'dashboard',
})

const toaster = useNuiToasts()

const {
  balance,
  statusConfig,
  monthlyUsage,
  usageChart,
  isLoading,
  error,
  fetchOverview,
} = useBillingOverview()

const fallbackStatus = {
  label: 'Active',
  description: 'Your account is active and running smoothly.',
  color: 'success',
  icon: 'ph:check-circle',
}

const statusDetails = computed(() => statusConfig?.value ?? fallbackStatus)
const usageDetails = computed(() => monthlyUsage?.value ?? { clicks: 0, apiCalls: 0 })
const chartDetails = computed(() => usageChart?.value ?? { labels: [], clicks: [], apiCalls: [] })

callOnce(() => fetchOverview())

const handleAddCredit = () => {
  toaster.add({
    title: 'Add credit',
    description: 'Credit addition workflow coming soon.',
    icon: 'ph:info',
    color: 'info',
    progress: true,
  })
}
</script>

<template>
  <div class="space-y-6 py-6">
    <BillingOverviewHeader
      :status-label="statusDetails.label"
      :status-description="statusDetails.description"
      :status-color="statusDetails.color"
      :status-icon="statusDetails.icon"
      @add-credit="handleAddCredit"
    />

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached billing telemetry
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <BillingBalanceCard
        class="lg:col-span-2"
        :balance="balance.value ?? 0"
        :status-label="statusDetails.label"
        :status-description="statusDetails.description"
        :status-color="statusDetails.color"
        :status-icon="statusDetails.icon"
        :is-loading="isLoading.value"
      />
      <BillingUsageSummary
        :clicks="usageDetails.clicks"
        :api-calls="usageDetails.apiCalls"
        :is-loading="isLoading.value"
      />
    </div>

    <BillingUsageChart
      :labels="chartDetails.labels"
      :clicks="chartDetails.clicks"
      :api-calls="chartDetails.apiCalls"
      :is-loading="isLoading.value"
    />
  </div>
</template>

