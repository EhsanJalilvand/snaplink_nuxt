<script setup lang="ts">
import { computed, ref } from '#imports'
import { usePaymentReports } from '~/composables/usePaymentReports'
import type { ReportFilters } from '~/types/payment-reports'

definePageMeta({
  title: 'Sales Reports',
  layout: 'dashboard',
})

const router = useRouter()
const { isLoading, error, fetchSalesReport } = usePaymentReports()

const report = ref<any>(null)
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

const loadReport = async () => {
  report.value = await fetchSalesReport(filters.value)
}

// Always fetch on mount to ensure API call is made
onMounted(async () => {
  if (import.meta.dev) {
    // eslint-disable-next-line no-console
    console.warn('[reports/sales.vue] onMounted - calling loadReport()')
  }
  await loadReport()
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
  loadReport()
}

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USDC' ? 'USD' : currency,
  }).format(amount)
}

const formatPercentage = (value: number) => {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

watch(() => filters.value, () => {
  loadReport()
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
          Sales Reports
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          Track revenue, transactions, and performance metrics
        </BaseParagraph>
      </div>
      <BaseButton
        variant="outline"
        color="primary"
      >
        <Icon name="solar:download-bold-duotone" class="size-4" />
        Export Report
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

        <TairoFormGroup label="Gateway">
          <TairoSelect
            v-model="filters.gatewayId"
            size="lg"
            placeholder="All Gateways"
          >
            <BaseSelectItem value="">
              All Gateways
            </BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>

        <TairoFormGroup label="Currency">
          <TairoSelect
            v-model="filters.currency"
            size="lg"
            placeholder="All Currencies"
          >
            <BaseSelectItem value="">
              All Currencies
            </BaseSelectItem>
            <BaseSelectItem value="USD">
              USD
            </BaseSelectItem>
            <BaseSelectItem value="EUR">
              EUR
            </BaseSelectItem>
            <BaseSelectItem value="USDC">
              USDC
            </BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>
      </div>
    </BaseCard>

    <!-- Tabs -->
    <TairoContentWrapperTabbed
      :labels="['Overview', 'Charts']"
      shape="rounded"
    >
      <template #left>
        <!-- Stats Cards -->
        <div
          v-if="!isLoading && report"
          class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <BaseCard class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  Total Revenue
                </BaseText>
                <BaseHeading
                  as="h3"
                  size="xl"
                  weight="bold"
                  class="mt-1 text-muted-900 dark:text-white"
                >
                  {{ formatCurrency(report.totalRevenue || 0, report.currency || 'USD') }}
                </BaseHeading>
                <div class="mt-2 flex items-center gap-1">
                  <Icon
                    name="solar:arrow-up-bold-duotone"
                    class="size-4 text-success-500"
                  />
                  <BaseText size="xs" class="text-success-600 dark:text-success-400">
                    {{ formatPercentage(report.trends?.revenue || 0) }}
                  </BaseText>
                </div>
              </div>
              <div class="flex size-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/20">
                <Icon
                  name="solar:dollar-minimalistic-bold-duotone"
                  class="size-6 text-success-500"
                />
              </div>
            </div>
          </BaseCard>

          <BaseCard class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  Transactions
                </BaseText>
                <BaseHeading
                  as="h3"
                  size="xl"
                  weight="bold"
                  class="mt-1 text-muted-900 dark:text-white"
                >
                  {{ (report.transactionCount || 0).toLocaleString() }}
                </BaseHeading>
                <div class="mt-2 flex items-center gap-1">
                  <Icon
                    name="solar:arrow-up-bold-duotone"
                    class="size-4 text-success-500"
                  />
                  <BaseText size="xs" class="text-success-600 dark:text-success-400">
                    {{ formatPercentage(report.trends?.transactions || 0) }}
                  </BaseText>
                </div>
              </div>
              <div class="flex size-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
                <Icon
                  name="solar:graph-up-bold-duotone"
                  class="size-6 text-primary-500"
                />
              </div>
            </div>
          </BaseCard>

          <BaseCard class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  Avg Transaction
                </BaseText>
                <BaseHeading
                  as="h3"
                  size="xl"
                  weight="bold"
                  class="mt-1 text-muted-900 dark:text-white"
                >
                  {{ formatCurrency(report.averageTransactionValue || 0, report.currency || 'USD') }}
                </BaseHeading>
              </div>
              <div class="flex size-12 items-center justify-center rounded-full bg-info-50 dark:bg-info-900/20">
                <Icon
                  name="solar:chart-bold-duotone"
                  class="size-6 text-info-500"
                />
              </div>
            </div>
          </BaseCard>

          <BaseCard class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  Period
                </BaseText>
                <BaseHeading
                  as="h3"
                  size="xl"
                  weight="bold"
                  class="mt-1 text-muted-900 dark:text-white"
                >
                  {{ report.period || '30 days' }}
                </BaseHeading>
              </div>
              <div class="flex size-12 items-center justify-center rounded-full bg-muted-100 dark:bg-muted-800">
                <Icon
                  name="solar:calendar-bold-duotone"
                  class="size-6 text-muted-500"
                />
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <BaseCard
            v-for="i in 4"
            :key="i"
            class="p-6"
          >
            <div class="h-20 animate-pulse rounded-lg bg-muted-200 dark:bg-muted-800" />
          </BaseCard>
        </div>
      </template>

      <!-- Tab 1: Overview -->
      <template #tab-1>
        <div class="space-y-6">
          <!-- Stats Cards are shown above in left slot -->

          <!-- Top Transactions Table -->
          <BaseCard
            v-if="!isLoading && report"
            class="p-6"
          >
            <div class="mb-4 flex items-center justify-between">
              <BaseHeading
                as="h3"
                size="md"
                weight="semibold"
                class="text-muted-900 dark:text-white"
              >
                Recent Transactions
              </BaseHeading>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-muted-200 dark:border-muted-800">
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        ID
                      </BaseText>
                    </th>
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Amount
                      </BaseText>
                    </th>
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Gateway
                      </BaseText>
                    </th>
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Currency
                      </BaseText>
                    </th>
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Date
                      </BaseText>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <template v-if="isLoading">
                    <tr
                      v-for="i in 5"
                      :key="`loading-${i}`"
                      class="border-b border-muted-100 dark:border-muted-900"
                    >
                      <td colspan="5" class="px-4 py-4">
                        <div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" />
                      </td>
                    </tr>
                  </template>
                  <tr
                    v-else-if="!report?.transactions || report.transactions.length === 0"
                    key="empty-transactions"
                    class="border-b border-muted-100 dark:border-muted-900"
                  >
                    <td colspan="5" class="px-4 py-12 text-center">
                      <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                        No transactions found
                      </BaseText>
                    </td>
                  </tr>
                  <template v-else>
                    <tr
                      v-for="(transaction, i) in (report.transactions || []).slice(0, 10)"
                      :key="transaction.id || `transaction-${i}`"
                      class="border-b border-muted-100 dark:border-muted-900"
                    >
                    <td class="px-4 py-3">
                      <BaseText size="sm" class="font-mono text-muted-700 dark:text-muted-300">
                        {{ transaction.id?.substring(0, 12) || `#TX-${1000 + i}` }}
                      </BaseText>
                    </td>
                    <td class="px-4 py-3">
                      <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                        {{ formatCurrency(transaction.amount || 0, transaction.currency || 'USD') }}
                      </BaseText>
                    </td>
                    <td class="px-4 py-3">
                      <BaseText size="sm" class="text-muted-700 dark:text-muted-300">
                        {{ transaction.gatewayId?.substring(0, 8) || `Gateway ${i + 1}` }}
                      </BaseText>
                    </td>
                    <td class="px-4 py-3">
                      <BaseChip size="xs" color="primary" variant="pastel">
                        {{ transaction.currency || 'USD' }}
                      </BaseChip>
                    </td>
                    <td class="px-4 py-3">
                      <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                        {{ transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : new Date().toLocaleDateString() }}
                      </BaseText>
                    </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </BaseCard>
        </div>
      </template>

      <!-- Tab 2: Charts -->
      <template #tab-2>
        <div class="space-y-6">
          <!-- Revenue Trends Line Chart -->
          <BaseCard class="p-6">
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
            <div v-if="isLoading" class="h-80 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
              <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
            </div>
            <div
              v-else-if="report?.trends?.daily"
              class="relative h-80 rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50/30 dark:bg-muted-900/30 p-6"
            >
              <div class="flex h-full items-end justify-between gap-2">
                <div
                  v-for="(point, index) in report.trends.daily"
                  :key="index"
                  class="group relative flex-1"
                >
                  <div class="relative flex h-full flex-col justify-end">
                    <div
                      class="relative w-full rounded-t-lg bg-gradient-to-t from-primary-600 via-primary-500 to-primary-400 transition-all duration-300 group-hover:from-primary-700 group-hover:via-primary-600 group-hover:to-primary-500 group-hover:shadow-lg group-hover:shadow-primary-500/50"
                      :style="{ height: `${Math.max(4, (point / (report.trends.maxDaily || 1)) * 100)}%` }"
                    >
                      <div class="pointer-events-none absolute -top-10 start-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-muted-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-muted-100 dark:text-muted-900">
                        {{ formatCurrency(point, report.currency || 'USD') }}
                      </div>
                    </div>
                    <BaseText size="xs" class="mt-2 text-center text-muted-500 dark:text-muted-400">
                      {{ report.trends.labels?.[index] || `Day ${index + 1}` }}
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

          <!-- Charts Row -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Revenue by Gateway -->
            <BaseCard class="p-6">
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
              <div v-if="isLoading" class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
                <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
              </div>
              <div
                v-else-if="report?.gatewayBreakdown && report.gatewayBreakdown.length > 0"
                class="space-y-4"
              >
                <div
                  v-for="(gateway, index) in report.gatewayBreakdown.slice(0, 6)"
                  :key="index"
                  class="group relative"
                >
                  <div class="mb-2 flex items-center justify-between">
                    <BaseText size="sm" weight="medium" class="text-muted-700 dark:text-muted-300">
                      {{ gateway.name || 'Unknown Gateway' }}
                    </BaseText>
                    <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-white">
                      {{ formatCurrency(gateway.revenue || 0, report.currency || 'USD') }}
                    </BaseText>
                  </div>
                  <div class="relative h-8 w-full overflow-hidden rounded-full bg-muted-200 dark:bg-muted-800">
                    <div
                      class="absolute inset-y-0 start-0 flex items-center justify-end rounded-full bg-gradient-to-r from-primary-500 to-primary-400 pr-2 transition-all duration-500 group-hover:from-primary-600 group-hover:to-primary-500 group-hover:shadow-md"
                      :style="{ width: `${Math.max(2, (gateway.revenue || 0) / (report.gatewayBreakdown[0]?.revenue || 1) * 100)}%` }"
                    >
                      <BaseText
                        v-if="(gateway.revenue || 0) / (report.gatewayBreakdown[0]?.revenue || 1) * 100 > 15"
                        size="xs"
                        class="font-semibold text-white"
                      >
                        {{ ((gateway.revenue || 0) / (report.totalRevenue || 1) * 100).toFixed(1) }}%
                      </BaseText>
                    </div>
                    <BaseText
                      v-if="(gateway.revenue || 0) / (report.gatewayBreakdown[0]?.revenue || 1) * 100 <= 15"
                      size="xs"
                      class="absolute start-2 top-1/2 -translate-y-1/2 font-semibold text-muted-600 dark:text-muted-400"
                    >
                      {{ ((gateway.revenue || 0) / (report.totalRevenue || 1) * 100).toFixed(1) }}%
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

            <!-- Revenue by Currency -->
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
              <div v-if="isLoading" class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
                <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
              </div>
              <div
                v-else-if="report?.currencyBreakdown && report.currencyBreakdown.length > 0"
                class="flex items-center justify-center gap-8"
              >
                <svg
                  class="size-64"
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
                    v-for="(currency, index) in report.currencyBreakdown"
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
                      :stroke-dashoffset="-(2 * Math.PI * 80 * (report.currencyBreakdown.slice(0, index).reduce((sum, c) => sum + (c.percentage || 0), 0) / 100))"
                      class="transition-all duration-500 hover:opacity-80"
                      transform="rotate(-90 100 100)"
                    />
                  </template>
                </svg>
                <div class="space-y-3">
                  <div
                    v-for="(currency, index) in report.currencyBreakdown"
                    :key="index"
                    class="flex items-center gap-3"
                  >
                    <div
                      class="size-4 rounded-full"
                      :style="{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6] }"
                    />
                    <div class="flex-1">
                      <BaseText size="sm" weight="medium" class="text-muted-700 dark:text-muted-300">
                        {{ currency.currency || 'USD' }}
                      </BaseText>
                      <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                        {{ formatCurrency(currency.revenue || 0, currency.currency || 'USD') }} ({{ (currency.percentage || 0).toFixed(1) }}%)
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
                    name="solar:pie-chart-2-bold-duotone"
                    class="size-12 mx-auto mb-2 text-muted-400"
                  />
                  <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                    No currency data available
                  </BaseText>
                </div>
              </div>
            </BaseCard>
          </div>
        </div>
      </template>
    </TairoContentWrapperTabbed>

    <!-- Error State -->
    <BaseAlert
      v-if="error"
      color="danger"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Failed to load report
      </template>
      <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
        {{ error }}
      </BaseParagraph>
    </BaseAlert>
  </div>
</template>
