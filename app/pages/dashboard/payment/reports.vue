<script setup lang="ts">
import { computed, ref } from '#imports'
import { usePaymentReports } from '~/composables/usePaymentReports'
import type { ReportFilters } from '~/types/payment-reports'

definePageMeta({
  title: 'Reports',
  layout: 'dashboard',
})

const { isLoading: isLoadingSales, error: errorSales, fetchSalesReport } = usePaymentReports()
const { isLoading: isLoadingSettlements, error: errorSettlements, fetchSettlementReport } = usePaymentReports()
const { isLoading: isLoadingRisk, error: errorRisk, fetchRiskReport } = usePaymentReports()

const salesReport = ref<any>(null)
const settlementsReport = ref<any>(null)
const riskReport = ref<any>(null)

const filters = ref<ReportFilters>({
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
  groupBy: 'day',
})

const dateRangeOptions = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
  { label: 'Custom', value: 'custom' },
]

const selectedDateRange = ref(30)

const isLoading = computed(() => isLoadingSales.value || isLoadingSettlements.value || isLoadingRisk.value)

const loadAllReports = async () => {
  await Promise.all([
    fetchSalesReport(filters.value).then(r => salesReport.value = r),
    fetchSettlementReport(filters.value).then(r => settlementsReport.value = r),
    fetchRiskReport(filters.value).then(r => riskReport.value = r),
  ])
}

// Always fetch on mount to ensure API call is made
onMounted(async () => {
  if (import.meta.dev) {
    // eslint-disable-next-line no-console
    console.warn('[reports.vue] onMounted - calling loadAllReports()')
  }
  await loadAllReports()
})

const updateDateRange = (days: number | 'custom') => {
  if (days === 'custom') {
    selectedDateRange.value = 'custom'
    return
  }
  selectedDateRange.value = days
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)
  filters.value.dateRange = {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  }
  loadAllReports()
}

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USDC' ? 'USD' : currency,
  }).format(amount)
}

watch(() => filters.value, () => {
  loadAllReports()
}, { deep: true })
</script>

<template>
  <div class="space-y-6 py-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-white"
        >
          Payment Reports
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          Comprehensive reports and analytics for sales, settlements, and risk
        </BaseParagraph>
      </div>
      <BaseButton
        variant="outline"
        color="primary"
      >
        <Icon name="solar:download-bold-duotone" class="size-4" />
        Export All Reports
      </BaseButton>
    </div>

    <!-- Filters -->
    <BaseCard class="p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
        <TairoFormGroup label="Date Range">
          <TairoSelect
            :model-value="selectedDateRange"
            size="lg"
            @update:model-value="updateDateRange"
          >
            <BaseSelectItem
              v-for="option in dateRangeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>

        <TairoFormGroup
          v-if="selectedDateRange === 'custom'"
          label="Start Date"
        >
          <TairoInput
            v-model="filters.dateRange.start"
            type="date"
            size="lg"
          />
        </TairoFormGroup>

        <TairoFormGroup
          v-if="selectedDateRange === 'custom'"
          label="End Date"
        >
          <TairoInput
            v-model="filters.dateRange.end"
            type="date"
            size="lg"
          />
        </TairoFormGroup>
      </div>
    </BaseCard>

    <!-- Sales Reports Section -->
    <div class="space-y-6">
      <BaseHeading
        as="h2"
        size="xl"
        weight="bold"
        class="text-muted-900 dark:text-white"
      >
        Sales Reports
      </BaseHeading>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Revenue Trends Line Chart -->
        <BaseCard class="p-6 lg:col-span-2">
          <div class="mb-4">
            <BaseHeading
              as="h3"
              size="md"
              weight="semibold"
              class="text-muted-900 dark:text-white"
            >
              Revenue Trends Over Time
            </BaseHeading>
            <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
              Track revenue changes over the selected period
            </BaseParagraph>
          </div>
          <div v-if="isLoadingSales" class="h-80 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
            <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
          </div>
          <div
            v-else-if="salesReport?.trends?.daily"
            class="relative h-80 rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50/30 dark:bg-muted-900/30 p-6"
          >
            <div class="flex h-full items-end justify-between gap-2">
              <div
                v-for="(point, index) in salesReport.trends.daily"
                :key="index"
                class="group relative flex-1"
              >
                <div class="relative flex h-full flex-col justify-end">
                  <div
                    class="relative w-full rounded-t-lg bg-gradient-to-t from-primary-600 via-primary-500 to-primary-400 transition-all duration-300 group-hover:from-primary-700 group-hover:via-primary-600 group-hover:to-primary-500 group-hover:shadow-lg group-hover:shadow-primary-500/50"
                    :style="{ height: `${Math.max(4, (point / (salesReport.trends.maxDaily || 1)) * 100)}%` }"
                  >
                    <div class="pointer-events-none absolute -top-10 start-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-muted-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-muted-100 dark:text-muted-900">
                      {{ formatCurrency(point, salesReport.currency || 'USD') }}
                    </div>
                  </div>
                  <BaseText size="xs" class="mt-2 text-center text-muted-500 dark:text-muted-400">
                    {{ salesReport.trends.labels?.[index] || `Day ${index + 1}` }}
                  </BaseText>
                </div>
              </div>
            </div>
          </div>
          <div
            v-else
            class="h-80 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50"
          >
            <div class="text-center">
              <Icon
                name="solar:chart-2-bold-duotone"
                class="size-16 mx-auto mb-3 text-muted-400"
              />
              <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                No revenue data available
              </BaseText>
            </div>
          </div>
        </BaseCard>

        <!-- Revenue by Currency Pie Chart -->
        <BaseCard class="p-6">
          <div class="mb-4">
            <BaseHeading
              as="h3"
              size="md"
              weight="semibold"
              class="text-muted-900 dark:text-white"
            >
              Revenue by Currency
            </BaseHeading>
            <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
              Distribution of revenue by currency type
            </BaseParagraph>
          </div>
          <div v-if="isLoadingSales" class="h-80 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
            <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
          </div>
          <div
            v-else-if="salesReport?.currencyBreakdown && salesReport.currencyBreakdown.length > 0"
            class="space-y-4"
          >
            <div class="flex items-center justify-center">
              <svg
                class="size-48"
                viewBox="0 0 200 200"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="40"
                  class="text-muted-200 dark:text-muted-800"
                />
                <template
                  v-for="(currency, index) in salesReport.currencyBreakdown"
                  :key="index"
                >
                  <circle
                    v-if="currency.percentage > 0"
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    :stroke="['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]"
                    stroke-width="40"
                    :stroke-dasharray="`${2 * Math.PI * 80 * (currency.percentage / 100)} ${2 * Math.PI * 80}`"
                    :stroke-dashoffset="-(2 * Math.PI * 80 * (salesReport.currencyBreakdown.slice(0, index).reduce((sum, c) => sum + (c.percentage || 0), 0) / 100))"
                    class="transition-all duration-500 hover:opacity-80"
                    transform="rotate(-90 100 100)"
                  />
                </template>
              </svg>
            </div>
            <div class="space-y-2">
              <div
                v-for="(currency, index) in salesReport.currencyBreakdown"
                :key="index"
                class="flex items-center gap-2"
              >
                <div
                  class="size-3 rounded-full"
                  :style="{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6] }"
                />
                <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                  {{ currency.currency || 'USD' }}: {{ (currency.percentage || 0).toFixed(1) }}%
                </BaseText>
              </div>
            </div>
          </div>
          <div
            v-else
            class="h-80 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50"
          >
            <div class="text-center">
              <Icon
                name="solar:pie-chart-2-bold-duotone"
                class="size-12 mx-auto mb-2 text-muted-400"
              />
              <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                No currency data available
              </BaseText>
            </div>
          </div>
        </BaseCard>

        <!-- Revenue by Gateway Bar Chart -->
        <BaseCard class="p-6 lg:col-span-3">
          <div class="mb-4">
            <BaseHeading
              as="h3"
              size="md"
              weight="semibold"
              class="text-muted-900 dark:text-white"
            >
              Revenue by Gateway
            </BaseHeading>
            <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
              Breakdown of revenue across different gateways
            </BaseParagraph>
          </div>
          <div v-if="isLoadingSales" class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
            <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
          </div>
          <div
            v-else-if="salesReport?.gatewayBreakdown && salesReport.gatewayBreakdown.length > 0"
            class="space-y-4"
          >
            <div
              v-for="(gateway, index) in salesReport.gatewayBreakdown.slice(0, 6)"
              :key="index"
              class="group relative"
            >
              <div class="mb-2 flex items-center justify-between">
                <BaseText size="sm" weight="medium" class="text-muted-700 dark:text-muted-300">
                  {{ gateway.name || 'Unknown Gateway' }}
                </BaseText>
                <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-white">
                  {{ formatCurrency(gateway.revenue || 0, salesReport.currency || 'USD') }}
                </BaseText>
              </div>
              <div class="relative h-8 w-full overflow-hidden rounded-full bg-muted-200 dark:bg-muted-800">
                <div
                  class="absolute inset-y-0 start-0 flex items-center justify-end rounded-full bg-gradient-to-r from-primary-500 to-primary-400 pr-2 transition-all duration-500 group-hover:from-primary-600 group-hover:to-primary-500 group-hover:shadow-md"
                  :style="{ width: `${Math.max(2, (gateway.revenue || 0) / (salesReport.gatewayBreakdown[0]?.revenue || 1) * 100)}%` }"
                >
                  <BaseText
                    v-if="(gateway.revenue || 0) / (salesReport.gatewayBreakdown[0]?.revenue || 1) * 100 > 15"
                    size="xs"
                    class="font-semibold text-white"
                  >
                    {{ ((gateway.revenue || 0) / (salesReport.totalRevenue || 1) * 100).toFixed(1) }}%
                  </BaseText>
                </div>
                <BaseText
                  v-if="(gateway.revenue || 0) / (salesReport.gatewayBreakdown[0]?.revenue || 1) * 100 <= 15"
                  size="xs"
                  class="absolute start-2 top-1/2 -translate-y-1/2 font-semibold text-muted-600 dark:text-muted-400"
                >
                  {{ ((gateway.revenue || 0) / (salesReport.totalRevenue || 1) * 100).toFixed(1) }}%
                </BaseText>
              </div>
            </div>
          </div>
          <div
            v-else
            class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50"
          >
            <div class="text-center">
              <Icon
                name="solar:chart-bold-duotone"
                class="size-12 mx-auto mb-2 text-muted-400"
              />
              <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                No gateway data available
              </BaseText>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Settlements Reports Section -->
    <div class="space-y-6">
      <BaseHeading
        as="h2"
        size="xl"
        weight="bold"
        class="text-muted-900 dark:text-white"
      >
        Settlements Reports
      </BaseHeading>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Settlement Amounts Line Chart -->
        <BaseCard class="p-6">
          <div class="mb-4">
            <BaseHeading
              as="h3"
              size="md"
              weight="semibold"
              class="text-muted-900 dark:text-white"
            >
              Settlement Amounts Over Time
            </BaseHeading>
            <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
              Track settlement amounts and trends
            </BaseParagraph>
          </div>
          <div v-if="isLoadingSettlements" class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
            <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
          </div>
          <div
            v-else-if="settlementsReport?.trends?.daily"
            class="relative h-64 rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50/30 dark:bg-muted-900/30 p-6"
          >
            <div class="flex h-full items-end justify-between gap-2">
              <div
                v-for="(point, index) in settlementsReport.trends.daily"
                :key="index"
                class="group relative flex-1"
              >
                <div class="relative flex h-full flex-col justify-end">
                  <div
                    class="relative w-full rounded-t-lg bg-gradient-to-t from-success-600 via-success-500 to-success-400 transition-all duration-300 group-hover:from-success-700 group-hover:via-success-600 group-hover:to-success-500 group-hover:shadow-lg group-hover:shadow-success-500/50"
                    :style="{ height: `${Math.max(4, (point / (settlementsReport.trends.maxDaily || 1)) * 100)}%` }"
                  >
                    <div class="pointer-events-none absolute -top-10 start-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-muted-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-muted-100 dark:text-muted-900">
                      {{ formatCurrency(point, settlementsReport.currency || 'USD') }}
                    </div>
                  </div>
                  <BaseText size="xs" class="mt-2 text-center text-muted-500 dark:text-muted-400">
                    {{ settlementsReport.trends.labels?.[index] || `Day ${index + 1}` }}
                  </BaseText>
                </div>
              </div>
            </div>
          </div>
          <div
            v-else
            class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50"
          >
            <div class="text-center">
              <Icon
                name="solar:chart-2-bold-duotone"
                class="size-12 mx-auto mb-2 text-muted-400"
              />
              <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                No settlement data available
              </BaseText>
            </div>
          </div>
        </BaseCard>

        <!-- Status Distribution Pie Chart -->
        <BaseCard class="p-6">
          <div class="mb-4">
            <BaseHeading
              as="h3"
              size="md"
              weight="semibold"
              class="text-muted-900 dark:text-white"
            >
              Status Distribution
            </BaseHeading>
            <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
              Distribution of settlements by status
            </BaseParagraph>
          </div>
          <div v-if="isLoadingSettlements" class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
            <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
          </div>
          <div
            v-else-if="settlementsReport?.statusBreakdown && settlementsReport.statusBreakdown.length > 0"
            class="flex items-center justify-center gap-6"
          >
            <svg
              class="size-48"
              viewBox="0 0 200 200"
            >
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="currentColor"
                stroke-width="40"
                class="text-muted-200 dark:text-muted-800"
              />
              <template
                v-for="(status, index) in settlementsReport.statusBreakdown"
                :key="index"
              >
                <circle
                  v-if="status.percentage > 0"
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  :stroke="status.status === 'completed' ? '#10b981' : status.status === 'pending' ? '#f59e0b' : status.status === 'failed' ? '#ef4444' : '#3b82f6'"
                  stroke-width="40"
                  :stroke-dasharray="`${2 * Math.PI * 80 * (status.percentage / 100)} ${2 * Math.PI * 80}`"
                  :stroke-dashoffset="-(2 * Math.PI * 80 * (settlementsReport.statusBreakdown.slice(0, index).reduce((sum, s) => sum + (s.percentage || 0), 0) / 100))"
                  class="transition-all duration-500 hover:opacity-80"
                  transform="rotate(-90 100 100)"
                />
              </template>
            </svg>
            <div class="space-y-2">
              <div
                v-for="(status, index) in settlementsReport.statusBreakdown"
                :key="index"
                class="flex items-center gap-2"
              >
                <div
                  class="size-3 rounded-full"
                  :style="{ backgroundColor: status.status === 'completed' ? '#10b981' : status.status === 'pending' ? '#f59e0b' : status.status === 'failed' ? '#ef4444' : '#3b82f6' }"
                />
                <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                  {{ status.status || 'Unknown' }}: {{ (status.percentage || 0).toFixed(1) }}%
                </BaseText>
              </div>
            </div>
          </div>
          <div
            v-else
            class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50"
          >
            <div class="text-center">
              <Icon
                name="solar:pie-chart-2-bold-duotone"
                class="size-12 mx-auto mb-2 text-muted-400"
              />
              <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                No status data available
              </BaseText>
            </div>
          </div>
        </BaseCard>

        <!-- Fees Breakdown Stacked Bar Chart -->
        <BaseCard class="p-6 lg:col-span-2">
          <div class="mb-4">
            <BaseHeading
              as="h3"
              size="md"
              weight="semibold"
              class="text-muted-900 dark:text-white"
            >
              Fees Breakdown
            </BaseHeading>
            <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
              Detailed breakdown of fees by type
            </BaseParagraph>
          </div>
          <div v-if="isLoadingSettlements" class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
            <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
          </div>
          <div
            v-else-if="settlementsReport?.feesBreakdown && settlementsReport.feesBreakdown.length > 0"
            class="space-y-3"
          >
            <div
              v-for="(fee, index) in settlementsReport.feesBreakdown.slice(0, 6)"
              :key="index"
              class="group relative"
            >
              <div class="mb-2 flex items-center justify-between">
                <BaseText size="sm" weight="medium" class="text-muted-700 dark:text-muted-300">
                  {{ fee.name || 'Unknown Fee' }}
                </BaseText>
                <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-white">
                  {{ formatCurrency(fee.total || 0, settlementsReport.currency || 'USD') }}
                </BaseText>
              </div>
              <div class="relative h-8 w-full overflow-hidden rounded-lg bg-muted-200 dark:bg-muted-800">
                <div class="absolute inset-0 flex">
                  <div
                    v-if="fee.processing"
                    class="bg-gradient-to-r from-danger-500 to-danger-400 transition-all duration-500 group-hover:from-danger-600 group-hover:to-danger-500 group-hover:shadow-md"
                    :style="{ width: `${(fee.processing / (fee.total || 1)) * 100}%` }"
                  />
                  <div
                    v-if="fee.gateway"
                    class="bg-gradient-to-r from-warning-500 to-warning-400 transition-all duration-500 group-hover:from-warning-600 group-hover:to-warning-500 group-hover:shadow-md"
                    :style="{ width: `${(fee.gateway / (fee.total || 1)) * 100}%` }"
                  />
                  <div
                    v-if="fee.platform"
                    class="bg-gradient-to-r from-info-500 to-info-400 transition-all duration-500 group-hover:from-info-600 group-hover:to-info-500 group-hover:shadow-md"
                    :style="{ width: `${(fee.platform / (fee.total || 1)) * 100}%` }"
                  />
                </div>
              </div>
            </div>
            <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-500 dark:text-muted-400">
              <div class="flex items-center gap-2">
                <div class="size-3 rounded bg-danger-500" />
                <span>Processing</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="size-3 rounded bg-warning-500" />
                <span>Gateway</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="size-3 rounded bg-info-500" />
                <span>Platform</span>
              </div>
            </div>
          </div>
          <div
            v-else
            class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50"
          >
            <div class="text-center">
              <Icon
                name="solar:chart-bold-duotone"
                class="size-12 mx-auto mb-2 text-muted-400"
              />
              <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                No fees data available
              </BaseText>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Risk Reports Section -->
    <div class="space-y-6">
      <BaseHeading
        as="h2"
        size="xl"
        weight="bold"
        class="text-muted-900 dark:text-white"
      >
        Risk Reports
      </BaseHeading>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Risk Distribution Pie Chart -->
        <BaseCard class="p-6">
          <div class="mb-4">
            <BaseHeading
              as="h3"
              size="md"
              weight="semibold"
              class="text-muted-900 dark:text-white"
            >
              Risk Distribution
            </BaseHeading>
            <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
              Distribution of transactions by risk level
            </BaseParagraph>
          </div>
          <div v-if="isLoadingRisk" class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
            <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
          </div>
          <div
            v-else-if="riskReport?.riskDistribution && riskReport.riskDistribution.length > 0"
            class="flex items-center justify-center gap-6"
          >
            <svg
              class="size-48"
              viewBox="0 0 200 200"
            >
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="currentColor"
                stroke-width="40"
                class="text-muted-200 dark:text-muted-800"
              />
              <template
                v-for="(risk, index) in riskReport.riskDistribution"
                :key="index"
              >
                <circle
                  v-if="risk.percentage > 0"
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  :stroke="risk.level === 'low' ? '#10b981' : risk.level === 'medium' ? '#f59e0b' : risk.level === 'high' ? '#ef4444' : '#dc2626'"
                  stroke-width="40"
                  :stroke-dasharray="`${2 * Math.PI * 80 * (risk.percentage / 100)} ${2 * Math.PI * 80}`"
                  :stroke-dashoffset="-(2 * Math.PI * 80 * (riskReport.riskDistribution.slice(0, index).reduce((sum, r) => sum + (r.percentage || 0), 0) / 100))"
                  class="transition-all duration-500 hover:opacity-80"
                  transform="rotate(-90 100 100)"
                />
              </template>
            </svg>
            <div class="space-y-2">
              <div
                v-for="(risk, index) in riskReport.riskDistribution"
                :key="index"
                class="flex items-center gap-2"
              >
                <div
                  class="size-3 rounded-full"
                  :style="{ backgroundColor: risk.level === 'low' ? '#10b981' : risk.level === 'medium' ? '#f59e0b' : risk.level === 'high' ? '#ef4444' : '#dc2626' }"
                />
                <BaseText size="xs" class="text-muted-600 dark:text-muted-400 capitalize">
                  {{ risk.level || 'Unknown' }}: {{ (risk.percentage || 0).toFixed(1) }}%
                </BaseText>
              </div>
            </div>
          </div>
          <div
            v-else
            class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50"
          >
            <div class="text-center">
              <Icon
                name="solar:pie-chart-2-bold-duotone"
                class="size-12 mx-auto mb-2 text-muted-400"
              />
              <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                No risk distribution data available
              </BaseText>
            </div>
          </div>
        </BaseCard>

        <!-- Risk Score Trend Line Chart -->
        <BaseCard class="p-6">
          <div class="mb-4">
            <BaseHeading
              as="h3"
              size="md"
              weight="semibold"
              class="text-muted-900 dark:text-white"
            >
              Risk Score Trend
            </BaseHeading>
            <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
              Average risk score over time
            </BaseParagraph>
          </div>
          <div v-if="isLoadingRisk" class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
            <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
          </div>
          <div
            v-else-if="riskReport?.riskScoreTrend && riskReport.riskScoreTrend.length > 0"
            class="relative h-64 rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50/30 dark:bg-muted-900/30 p-6"
          >
            <div class="flex h-full items-end justify-between gap-2">
              <div
                v-for="(point, index) in riskReport.riskScoreTrend"
                :key="index"
                class="group relative flex-1"
              >
                <div class="relative flex h-full flex-col justify-end">
                  <div
                    class="relative w-full rounded-t-lg bg-gradient-to-t from-warning-600 via-warning-500 to-warning-400 transition-all duration-300 group-hover:from-warning-700 group-hover:via-warning-600 group-hover:to-warning-500 group-hover:shadow-lg group-hover:shadow-warning-500/50"
                    :style="{ height: `${Math.max(4, (point.score / 100) * 100)}%` }"
                  >
                    <div class="pointer-events-none absolute -top-10 start-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-muted-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-muted-100 dark:text-muted-900">
                      Score: {{ point.score?.toFixed(1) || 0 }}
                    </div>
                  </div>
                  <BaseText size="xs" class="mt-2 text-center text-muted-500 dark:text-muted-400">
                    {{ point.label || `Day ${index + 1}` }}
                  </BaseText>
                </div>
              </div>
            </div>
          </div>
          <div
            v-else
            class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50"
          >
            <div class="text-center">
              <Icon
                name="solar:chart-2-bold-duotone"
                class="size-12 mx-auto mb-2 text-muted-400"
              />
              <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                No risk score trend data available
              </BaseText>
            </div>
          </div>
        </BaseCard>

        <!-- Top Risk Factors Bar Chart -->
        <BaseCard class="p-6 lg:col-span-2">
          <div class="mb-4">
            <BaseHeading
              as="h3"
              size="md"
              weight="semibold"
              class="text-muted-900 dark:text-white"
            >
              Top Risk Factors
            </BaseHeading>
            <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
              Most common risk factors identified in transactions
            </BaseParagraph>
          </div>
          <div v-if="isLoadingRisk" class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
            <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
          </div>
          <div
            v-else-if="riskReport?.riskFactors && riskReport.riskFactors.length > 0"
            class="space-y-3"
          >
            <div
              v-for="(factor, index) in riskReport.riskFactors.slice(0, 6)"
              :key="index"
              class="group relative"
            >
              <div class="mb-2 flex items-center justify-between">
                <BaseText size="sm" weight="medium" class="text-muted-700 dark:text-muted-300">
                  {{ factor.name || 'Unknown Factor' }}
                </BaseText>
                <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-white">
                  {{ factor.count || 0 }} occurrences
                </BaseText>
              </div>
              <div class="relative h-8 w-full overflow-hidden rounded-full bg-muted-200 dark:bg-muted-800">
                <div
                  class="absolute inset-y-0 start-0 flex items-center justify-end rounded-full bg-gradient-to-r from-warning-500 to-warning-400 pr-2 transition-all duration-500 group-hover:from-warning-600 group-hover:to-warning-500 group-hover:shadow-md"
                  :style="{ width: `${Math.max(2, (factor.count || 0) / (riskReport.riskFactors[0]?.count || 1) * 100)}%` }"
                >
                  <BaseText
                    v-if="(factor.count || 0) / (riskReport.riskFactors[0]?.count || 1) * 100 > 15"
                    size="xs"
                    class="font-semibold text-white"
                  >
                    {{ factor.count || 0 }}
                  </BaseText>
                </div>
                <BaseText
                  v-if="(factor.count || 0) / (riskReport.riskFactors[0]?.count || 1) * 100 <= 15"
                  size="xs"
                  class="absolute start-2 top-1/2 -translate-y-1/2 font-semibold text-muted-600 dark:text-muted-400"
                >
                  {{ factor.count || 0 }}
                </BaseText>
              </div>
            </div>
          </div>
          <div
            v-else
            class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50"
          >
            <div class="text-center">
              <Icon
                name="solar:chart-bold-duotone"
                class="size-12 mx-auto mb-2 text-muted-400"
              />
              <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                No risk factors data available
              </BaseText>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Error States -->
    <BaseAlert
      v-if="errorSales || errorSettlements || errorRisk"
      color="danger"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Failed to load some reports
      </template>
      <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
        {{ errorSales || errorSettlements || errorRisk }}
      </BaseParagraph>
    </BaseAlert>
  </div>
</template>

