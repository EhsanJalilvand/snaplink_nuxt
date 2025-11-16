<script setup lang="ts">
import { ref } from '#imports'
import { usePaymentReports } from '~/composables/usePaymentReports'
import RiskIndicator from '~/components/payment/RiskIndicator.vue'
import type { ReportFilters } from '~/types/payment-reports'

definePageMeta({
  title: 'Risk Reports',
  layout: 'dashboard',
})

const { isLoading, error, fetchRiskReport } = usePaymentReports()

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
const riskLevelFilter = ref<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')

const loadReport = async () => {
  report.value = await fetchRiskReport(filters.value)
}

// Always fetch on mount to ensure API call is made
onMounted(async () => {
  if (import.meta.dev) {
    // eslint-disable-next-line no-console
    console.warn('[reports/risk.vue] onMounted - calling loadReport()')
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

watch(() => filters.value, () => {
  loadReport()
}, { deep: true })
</script>

<template>
  <div class="space-y-6 py-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-white"
        >
          Risk Reports
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          Monitor risk factors, flagged transactions, and compliance metrics
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
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
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

        <TairoFormGroup label="Risk Level">
          <TairoSelect
            v-model="riskLevelFilter"
            size="lg"
          >
            <BaseSelectItem value="all">
              All Levels
            </BaseSelectItem>
            <BaseSelectItem value="low">
              Low
            </BaseSelectItem>
            <BaseSelectItem value="medium">
              Medium
            </BaseSelectItem>
            <BaseSelectItem value="high">
              High
            </BaseSelectItem>
            <BaseSelectItem value="critical">
              Critical
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
          class="grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          <BaseCard class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  Total Transactions
                </BaseText>
                <BaseHeading
                  as="h3"
                  size="xl"
                  weight="bold"
                  class="mt-1 text-muted-900 dark:text-white"
                >
                  {{ (report.totalTransactions || 0).toLocaleString() }}
                </BaseHeading>
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
                  Flagged Transactions
                </BaseText>
                <BaseHeading
                  as="h3"
                  size="xl"
                  weight="bold"
                  class="mt-1 text-danger-600 dark:text-danger-400"
                >
                  {{ (report.flaggedTransactions || 0).toLocaleString() }}
                </BaseHeading>
              </div>
              <div class="flex size-12 items-center justify-center rounded-full bg-danger-50 dark:bg-danger-900/20">
                <Icon
                  name="solar:danger-triangle-bold-duotone"
                  class="size-6 text-danger-500"
                />
              </div>
            </div>
          </BaseCard>

          <BaseCard class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  Average Risk Score
                </BaseText>
                <BaseHeading
                  as="h3"
                  size="xl"
                  weight="bold"
                  class="mt-1 text-muted-900 dark:text-white"
                >
                  {{ report.averageRiskScore || 'N/A' }}
                </BaseHeading>
              </div>
              <div class="flex size-12 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-900/20">
                <Icon
                  name="solar:shield-warning-bold-duotone"
                  class="size-6 text-warning-500"
                />
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          <BaseCard
            v-for="i in 3"
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

          <!-- Flagged Transactions Table -->
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
                Flagged Transactions
              </BaseHeading>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-muted-200 dark:border-muted-800">
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Transaction ID
                      </BaseText>
                    </th>
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Amount
                      </BaseText>
                    </th>
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Risk Level
                      </BaseText>
                    </th>
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Risk Score
                      </BaseText>
                    </th>
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Flags
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
                      <td colspan="6" class="px-4 py-4">
                        <div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" />
                      </td>
                    </tr>
                  </template>
                  <tr
                    v-else-if="!report?.flaggedTransactions || report.flaggedTransactions.length === 0"
                    key="empty-flagged"
                    class="border-b border-muted-100 dark:border-muted-900"
                  >
                    <td colspan="6" class="px-4 py-12 text-center">
                      <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                        No flagged transactions found
                      </BaseText>
                    </td>
                  </tr>
                  <template v-else>
                    <tr
                      v-for="(transaction, i) in (report.flaggedTransactions || []).slice(0, 10)"
                      :key="transaction.id || `flagged-${i}`"
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
                      <RiskIndicator
                        :level="transaction.riskLevel || 'medium'"
                        size="sm"
                      />
                    </td>
                    <td class="px-4 py-3">
                      <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                        {{ transaction.riskScore || 'N/A' }}
                      </BaseText>
                    </td>
                    <td class="px-4 py-3">
                      <BaseChip
                        size="xs"
                        color="danger"
                        variant="pastel"
                      >
                        {{ transaction.flagsCount || 0 }} flags
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

          <!-- Country Breakdown -->
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
                Risk by Country
              </BaseHeading>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-muted-200 dark:border-muted-800">
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Country
                      </BaseText>
                    </th>
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Transactions
                      </BaseText>
                    </th>
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Flagged
                      </BaseText>
                    </th>
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Avg Risk Score
                      </BaseText>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <template v-if="isLoading">
                    <tr
                      v-for="i in 5"
                      :key="`loading-country-${i}`"
                      class="border-b border-muted-100 dark:border-muted-900"
                    >
                      <td colspan="4" class="px-4 py-4">
                        <div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" />
                      </td>
                    </tr>
                  </template>
                  <tr
                    v-else-if="!report?.countryBreakdown || report.countryBreakdown.length === 0"
                    key="empty-country"
                    class="border-b border-muted-100 dark:border-muted-900"
                  >
                    <td colspan="4" class="px-4 py-12 text-center">
                      <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                        No country data available
                      </BaseText>
                    </td>
                  </tr>
                  <template v-else>
                    <tr
                      v-for="(country, i) in (report.countryBreakdown || []).slice(0, 10)"
                      :key="country.country || `country-${i}`"
                      class="border-b border-muted-100 dark:border-muted-900"
                    >
                    <td class="px-4 py-3">
                      <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                        {{ country.country || 'Unknown' }}
                      </BaseText>
                    </td>
                    <td class="px-4 py-3">
                      <BaseText size="sm" class="text-muted-700 dark:text-muted-300">
                        {{ (country.transactionCount || 0).toLocaleString() }}
                      </BaseText>
                    </td>
                    <td class="px-4 py-3">
                      <BaseText size="sm" class="text-danger-600 dark:text-danger-400">
                        {{ (country.flaggedCount || 0).toLocaleString() }}
                      </BaseText>
                    </td>
                    <td class="px-4 py-3">
                      <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                        {{ country.averageRiskScore || 'N/A' }}
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
            <div v-if="isLoading" class="h-80 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
              <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
            </div>
            <div
              v-else-if="report?.riskDistribution && report.riskDistribution.length > 0"
              class="flex items-center justify-center gap-8"
            >
              <svg
                class="size-80"
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
                  v-for="(risk, index) in report.riskDistribution"
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
                    :stroke-dashoffset="-(2 * Math.PI * 80 * (report.riskDistribution.slice(0, index).reduce((sum, r) => sum + (r.percentage || 0), 0) / 100))"
                    class="transition-all duration-500 hover:opacity-80"
                    transform="rotate(-90 100 100)"
                  />
                </template>
              </svg>
              <div class="space-y-3">
                <div
                  v-for="(risk, index) in report.riskDistribution"
                  :key="index"
                  class="flex items-center gap-3"
                >
                  <div
                    class="size-4 rounded-full"
                    :style="{ backgroundColor: risk.level === 'low' ? '#10b981' : risk.level === 'medium' ? '#f59e0b' : risk.level === 'high' ? '#ef4444' : '#dc2626' }"
                  />
                  <div class="flex-1">
                    <BaseText size="sm" weight="medium" class="text-muted-700 dark:text-muted-300 capitalize">
                      {{ risk.level || 'Unknown' }}
                    </BaseText>
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                      {{ risk.count || 0 }} transactions ({{ (risk.percentage || 0).toFixed(1) }}%)
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
                  name="solar:pie-chart-2-bold-duotone"
                  class="size-16 mx-auto mb-3 text-muted-400"
                />
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  No risk distribution data available
                </BaseText>
              </div>
            </div>
          </BaseCard>

          <!-- Top Risk Factors Bar Chart -->
          <BaseCard class="p-6">
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
            <div v-if="isLoading" class="h-80 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
              <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
            </div>
            <div
              v-else-if="report?.riskFactors && report.riskFactors.length > 0"
              class="space-y-4"
            >
              <div
                v-for="(factor, index) in report.riskFactors.slice(0, 8)"
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
                    :style="{ width: `${Math.max(2, (factor.count || 0) / (report.riskFactors[0]?.count || 1) * 100)}%` }"
                  >
                    <BaseText
                      v-if="(factor.count || 0) / (report.riskFactors[0]?.count || 1) * 100 > 15"
                      size="xs"
                      class="font-semibold text-white"
                    >
                      {{ factor.count || 0 }}
                    </BaseText>
                  </div>
                  <BaseText
                    v-if="(factor.count || 0) / (report.riskFactors[0]?.count || 1) * 100 <= 15"
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
              class="h-80 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50"
            >
              <div class="text-center">
                <Icon
                  name="solar:chart-bold-duotone"
                  class="size-16 mx-auto mb-3 text-muted-400"
                />
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  No risk factors data available
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
            <div v-if="isLoading" class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
              <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
            </div>
            <div
              v-else-if="report?.riskScoreTrend && report.riskScoreTrend.length > 0"
              class="relative h-64 rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50/30 dark:bg-muted-900/30 p-6"
            >
              <div class="flex h-full items-end justify-between gap-2">
                <div
                  v-for="(point, index) in report.riskScoreTrend"
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
