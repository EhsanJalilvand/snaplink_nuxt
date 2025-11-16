<script setup lang="ts">
import { callOnce, computed, ref } from '#imports'
import { usePaymentReports } from '~/composables/usePaymentReports'
import type { ReportFilters } from '~/types/payment-reports'

definePageMeta({
  title: 'Settlement Reports',
  layout: 'dashboard',
})

const router = useRouter()
const { isLoading, error, fetchSettlementReport } = usePaymentReports()

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
const statusFilter = ref<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all')

const loadReport = async () => {
  report.value = await fetchSettlementReport(filters.value)
}

callOnce(() => loadReport())

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
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-white"
        >
          Settlement Reports
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          Monitor settlement amounts, fees, and processing status
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

        <TairoFormGroup label="Status">
          <TairoSelect
            v-model="statusFilter"
            size="lg"
          >
            <BaseSelectItem value="all">
              All Status
            </BaseSelectItem>
            <BaseSelectItem value="pending">
              Pending
            </BaseSelectItem>
            <BaseSelectItem value="processing">
              Processing
            </BaseSelectItem>
            <BaseSelectItem value="completed">
              Completed
            </BaseSelectItem>
            <BaseSelectItem value="failed">
              Failed
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
                  Total Settlements
                </BaseText>
                <BaseHeading
                  as="h3"
                  size="xl"
                  weight="bold"
                  class="mt-1 text-muted-900 dark:text-white"
                >
                  {{ formatCurrency(report.totalSettlements || 0, report.currency || 'USD') }}
                </BaseHeading>
              </div>
              <div class="flex size-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/20">
                <Icon
                  name="solar:wallet-money-bold-duotone"
                  class="size-6 text-success-500"
                />
              </div>
            </div>
          </BaseCard>

          <BaseCard class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  Total Fees
                </BaseText>
                <BaseHeading
                  as="h3"
                  size="xl"
                  weight="bold"
                  class="mt-1 text-muted-900 dark:text-white"
                >
                  {{ formatCurrency(report.totalFees || 0, report.currency || 'USD') }}
                </BaseHeading>
              </div>
              <div class="flex size-12 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-900/20">
                <Icon
                  name="solar:tag-price-bold-duotone"
                  class="size-6 text-warning-500"
                />
              </div>
            </div>
          </BaseCard>

          <BaseCard class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  Net Amount
                </BaseText>
                <BaseHeading
                  as="h3"
                  size="xl"
                  weight="bold"
                  class="mt-1 text-muted-900 dark:text-white"
                >
                  {{ formatCurrency(report.netAmount || 0, report.currency || 'USD') }}
                </BaseHeading>
              </div>
              <div class="flex size-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
                <Icon
                  name="solar:money-bag-bold-duotone"
                  class="size-6 text-primary-500"
                />
              </div>
            </div>
          </BaseCard>

          <BaseCard class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  Settlement Count
                </BaseText>
                <BaseHeading
                  as="h3"
                  size="xl"
                  weight="bold"
                  class="mt-1 text-muted-900 dark:text-white"
                >
                  {{ (report.settlementCount || 0).toLocaleString() }}
                </BaseHeading>
              </div>
              <div class="flex size-12 items-center justify-center rounded-full bg-info-50 dark:bg-info-900/20">
                <Icon
                  name="solar:document-bold-duotone"
                  class="size-6 text-info-500"
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

          <!-- Settlement Table -->
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
                Recent Settlements
              </BaseHeading>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-muted-200 dark:border-muted-800">
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Batch ID
                      </BaseText>
                    </th>
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Amount
                      </BaseText>
                    </th>
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Fees
                      </BaseText>
                    </th>
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Net Amount
                      </BaseText>
                    </th>
                    <th class="px-4 py-3 text-left">
                      <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                        Status
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
                    v-else-if="!report?.settlements || report.settlements.length === 0"
                    key="empty-settlements"
                    class="border-b border-muted-100 dark:border-muted-900"
                  >
                    <td colspan="6" class="px-4 py-12 text-center">
                      <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                        No settlements found
                      </BaseText>
                    </td>
                  </tr>
                  <template v-else>
                    <tr
                      v-for="(settlement, i) in (report.settlements || []).slice(0, 10)"
                      :key="settlement.id || `settlement-${i}`"
                      class="border-b border-muted-100 dark:border-muted-900"
                    >
                    <td class="px-4 py-3">
                      <BaseText size="sm" class="font-mono text-muted-700 dark:text-muted-300">
                        {{ settlement.batchId || `BATCH-${1000 + i}` }}
                      </BaseText>
                    </td>
                    <td class="px-4 py-3">
                      <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                        {{ formatCurrency(settlement.amount || 0, settlement.currency || 'USD') }}
                      </BaseText>
                    </td>
                    <td class="px-4 py-3">
                      <BaseText size="sm" class="text-muted-700 dark:text-muted-300">
                        {{ formatCurrency(settlement.fees || 0, settlement.currency || 'USD') }}
                      </BaseText>
                    </td>
                    <td class="px-4 py-3">
                      <BaseText size="sm" weight="medium" class="text-success-600 dark:text-success-400">
                        {{ formatCurrency(settlement.netAmount || 0, settlement.currency || 'USD') }}
                      </BaseText>
                    </td>
                    <td class="px-4 py-3">
                      <BaseChip
                        size="xs"
                        :color="settlement.status === 'completed' ? 'success' : settlement.status === 'failed' ? 'danger' : 'warning'"
                        variant="pastel"
                      >
                        {{ settlement.status || 'Processing' }}
                      </BaseChip>
                    </td>
                    <td class="px-4 py-3">
                      <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                        {{ settlement.settlementDate ? new Date(settlement.settlementDate).toLocaleDateString() : new Date().toLocaleDateString() }}
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
                Track settlement amounts and trends over the selected period
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
                      class="relative w-full rounded-t-lg bg-gradient-to-t from-success-600 via-success-500 to-success-400 transition-all duration-300 group-hover:from-success-700 group-hover:via-success-600 group-hover:to-success-500 group-hover:shadow-lg group-hover:shadow-success-500/50"
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
                  No settlement data available
                </BaseText>
              </div>
            </div>
          </BaseCard>

          <!-- Fees Breakdown Stacked Bar Chart -->
          <BaseCard class="p-6">
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
                Detailed breakdown of fees by type and gateway
              </BaseParagraph>
            </div>
            <div v-if="isLoading" class="h-80 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
              <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
            </div>
            <div
              v-else-if="report?.feesBreakdown && report.feesBreakdown.length > 0"
              class="space-y-4"
            >
              <div
                v-for="(fee, index) in report.feesBreakdown.slice(0, 8)"
                :key="index"
                class="group relative"
              >
                <div class="mb-2 flex items-center justify-between">
                  <BaseText size="sm" weight="medium" class="text-muted-700 dark:text-muted-300">
                    {{ fee.name || 'Unknown Fee' }}
                  </BaseText>
                  <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-white">
                    {{ formatCurrency(fee.total || 0, report.currency || 'USD') }}
                  </BaseText>
                </div>
                <div class="relative h-10 w-full overflow-hidden rounded-lg bg-muted-200 dark:bg-muted-800">
                  <div class="absolute inset-0 flex">
                    <div
                      v-if="fee.processing"
                      class="bg-gradient-to-r from-danger-500 to-danger-400 transition-all duration-500 group-hover:from-danger-600 group-hover:to-danger-500 group-hover:shadow-md"
                      :style="{ width: `${(fee.processing / (fee.total || 1)) * 100}%` }"
                      :title="`Processing: ${formatCurrency(fee.processing, report.currency || 'USD')}`"
                    />
                    <div
                      v-if="fee.gateway"
                      class="bg-gradient-to-r from-warning-500 to-warning-400 transition-all duration-500 group-hover:from-warning-600 group-hover:to-warning-500 group-hover:shadow-md"
                      :style="{ width: `${(fee.gateway / (fee.total || 1)) * 100}%` }"
                      :title="`Gateway: ${formatCurrency(fee.gateway, report.currency || 'USD')}`"
                    />
                    <div
                      v-if="fee.platform"
                      class="bg-gradient-to-r from-info-500 to-info-400 transition-all duration-500 group-hover:from-info-600 group-hover:to-info-500 group-hover:shadow-md"
                      :style="{ width: `${(fee.platform / (fee.total || 1)) * 100}%` }"
                      :title="`Platform: ${formatCurrency(fee.platform, report.currency || 'USD')}`"
                    />
                  </div>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <BaseText
                      v-if="fee.total > 0"
                      size="xs"
                      class="font-semibold text-muted-900 dark:text-white"
                    >
                      {{ formatCurrency(fee.total, report.currency || 'USD') }}
                    </BaseText>
                  </div>
                </div>
              </div>
              <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-500 dark:text-muted-400">
                <div class="flex items-center gap-2">
                  <div class="size-3 rounded bg-danger-500" />
                  <span>Processing Fees</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="size-3 rounded bg-warning-500" />
                  <span>Gateway Fees</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="size-3 rounded bg-info-500" />
                  <span>Platform Fees</span>
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
                  No fees data available
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
            <div v-if="isLoading" class="h-64 flex items-center justify-center rounded-lg border border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-900/50">
              <div class="h-full w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
            </div>
            <div
              v-else-if="report?.statusBreakdown && report.statusBreakdown.length > 0"
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
                  v-for="(status, index) in report.statusBreakdown"
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
                    :stroke-dashoffset="-(2 * Math.PI * 80 * (report.statusBreakdown.slice(0, index).reduce((sum, s) => sum + (s.percentage || 0), 0) / 100))"
                    class="transition-all duration-500 hover:opacity-80"
                    transform="rotate(-90 100 100)"
                  />
                </template>
              </svg>
              <div class="space-y-3">
                <div
                  v-for="(status, index) in report.statusBreakdown"
                  :key="index"
                  class="flex items-center gap-3"
                >
                  <div
                    class="size-4 rounded-full"
                    :style="{ backgroundColor: status.status === 'completed' ? '#10b981' : status.status === 'pending' ? '#f59e0b' : status.status === 'failed' ? '#ef4444' : '#3b82f6' }"
                  />
                  <div class="flex-1">
                    <BaseText size="sm" weight="medium" class="text-muted-700 dark:text-muted-300">
                      {{ status.status || 'Unknown' }}
                    </BaseText>
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                      {{ status.count || 0 }} settlements ({{ (status.percentage || 0).toFixed(1) }}%)
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
                  No status data available
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
