<script setup lang="ts">
import { computed, ref, watch } from '#imports'
import type { PaymentRevenueMetrics, PaymentRevenuePoint } from '~/types/payments'

interface PaymentRevenueChartProps {
  datasets?: Record<string, PaymentRevenuePoint[]>
  metrics?: PaymentRevenueMetrics | null
  isLoading?: boolean
}

const props = withDefaults(defineProps<PaymentRevenueChartProps>(), {
  datasets: () => ({}),
  metrics: null,
  isLoading: false,
})

const periodOptions = computed(() => Object.keys(props.datasets).length > 0 ? Object.keys(props.datasets) : ['Daily'])
const activePeriod = ref(periodOptions.value[0])

watch(periodOptions, (next) => {
  if (!next.includes(activePeriod.value)) {
    activePeriod.value = next[0]
  }
})

const datasetForActivePeriod = computed(() => props.datasets[activePeriod.value] ?? [])

const maxRevenue = computed(() => {
  if (datasetForActivePeriod.value.length === 0) {
    return 0
  }
  return Math.max(
    ...datasetForActivePeriod.value.map(item => Math.max(item.revenue, item.target)),
  )
})

const toCurrency = (value: number, currency = 'USD') =>
  value.toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 0 })

const progressHeight = (value: number) => {
  if (maxRevenue.value === 0) {
    return '0%'
  }
  return `${(value / maxRevenue.value) * 100}%`
}

const revenueMetrics = computed(() => props.metrics ?? {
  mrr: { value: 0, change: '0%' },
  averageOrderValue: { value: 0, currency: 'USD' },
  refundRatio: { value: 0, change: '0%' },
  netRevenuePace: { value: 0, currency: 'USD', timeframe: 'last 24 hours', progress: 0 },
})
</script>

<template>
  <BaseCard class="p-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-900 dark:text-white"
        >
          Revenue Performance
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Track gross volume against planned targets.
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-2 rounded-full border border-muted-200 bg-muted-100/60 p-1 text-xs dark:border-muted-700 dark:bg-muted-900/50">
        <button
          v-for="period in periodOptions"
          :key="period"
          type="button"
          class="rounded-full px-3 py-1.5 font-medium transition-all"
          :class="[
            activePeriod === period
              ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30'
              : 'text-muted-500 hover:text-muted-800 dark:text-muted-400 dark:hover:text-muted-200',
          ]"
          @click="activePeriod = period"
        >
          {{ period }}
        </button>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-5">
      <div class="lg:col-span-4">
        <div class="flex h-64 items-end gap-3">
          <div
            v-for="item in datasetForActivePeriod"
            :key="item.label"
            class="flex-1"
          >
            <div class="flex h-full flex-col justify-end gap-2 rounded-t-2xl bg-gradient-to-t from-primary-500/20 via-primary-500/30 to-primary-500/10 p-3">
              <div class="flex flex-col gap-2">
                <div class="flex items-baseline justify-between text-xs">
                  <span class="font-medium text-primary-600 dark:text-primary-300">
                    <span v-if="isLoading" class="block h-4 w-16 animate-pulse rounded bg-primary-500/30" />
                    <template v-else>
                      {{ toCurrency(item.revenue) }}
                    </template>
                  </span>
                  <span class="text-muted-400">
                    <span v-if="isLoading" class="block h-4 w-16 animate-pulse rounded bg-muted-300/60 dark:bg-muted-700/60" />
                    <template v-else>
                      Target {{ toCurrency(item.target) }}
                    </template>
                  </span>
                </div>
                <div class="relative h-32 overflow-hidden rounded-full border border-primary-100/50 dark:border-primary-900/40">
                  <div
                    class="absolute bottom-0 start-0 w-full rounded-full bg-primary-500 transition-all duration-500"
                    :style="{ height: progressHeight(item.revenue) }"
                  />
                  <div
                    class="absolute inset-x-0 bottom-0 m-1 rounded-full border border-dashed border-primary-200 dark:border-primary-800"
                    :style="{ height: progressHeight(item.target) }"
                  />
                </div>
              </div>
            </div>
            <BaseText size="xs" class="mt-2 text-center text-muted-500 dark:text-muted-400">
              {{ item.label }}
            </BaseText>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-500 dark:text-muted-400">
          <div class="flex items-center gap-2">
            <div class="size-3 rounded-full bg-primary-500" />
            <span>Actual revenue</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="size-3 rounded-full border border-dashed border-primary-300 dark:border-primary-700" />
            <span>Target</span>
          </div>
        </div>
      </div>

      <div class="space-y-4 rounded-2xl border border-muted-200 bg-muted-50/60 p-5 dark:border-muted-700 dark:bg-muted-900/40">
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            MRR
          </BaseText>
          <BaseHeading
            as="h4"
            size="lg"
            weight="semibold"
            class="mt-1 text-muted-900 dark:text-white"
          >
            <span v-if="isLoading" class="block h-6 w-24 animate-pulse rounded bg-muted-200/80 dark:bg-muted-800/60" />
            <template v-else>
              {{ toCurrency(revenueMetrics.mrr.value) }}
            </template>
          </BaseHeading>
          <BaseChip color="success" size="xs" class="mt-2">
            <Icon name="ph:trend-up" class="size-3" />
            <span>{{ revenueMetrics.mrr.change }}</span>
          </BaseChip>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between rounded-xl border border-success-200 bg-success-50/60 p-3 dark:border-success-900/40 dark:bg-success-900/20">
            <div>
              <BaseText size="xs" class="text-success-600 dark:text-success-300">Average order value</BaseText>
              <BaseHeading as="h5" size="md" weight="bold" class="text-success-700 dark:text-success-200">
                <span v-if="isLoading" class="block h-6 w-16 animate-pulse rounded bg-success-500/30" />
                <template v-else>
                  {{ toCurrency(revenueMetrics.averageOrderValue.value, revenueMetrics.averageOrderValue.currency) }}
                </template>
              </BaseHeading>
            </div>
            <Icon name="solar:bag-smile-bold-duotone" class="size-8 text-success-500 dark:text-success-300" />
          </div>

          <div class="flex items-center justify-between rounded-xl border border-info-200 bg-info-50/60 p-3 dark:border-info-900/40 dark:bg-info-900/20">
            <div>
              <BaseText size="xs" class="text-info-600 dark:text-info-300">Refund ratio</BaseText>
              <BaseHeading as="h5" size="md" weight="bold" class="text-info-700 dark:text-info-200">
                <span v-if="isLoading" class="block h-6 w-12 animate-pulse rounded bg-info-500/30" />
                <template v-else>
                  {{ revenueMetrics.refundRatio.value }}%
                </template>
              </BaseHeading>
            </div>
            <Icon name="solar:shield-check-bold-duotone" class="size-8 text-info-500 dark:text-info-300" />
          </div>

          <div class="rounded-xl border border-muted-200 bg-white/60 p-3 dark:border-muted-700 dark:bg-muted-800/40">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Net revenue pace
            </BaseText>
            <div class="mt-2 flex items-end gap-2">
              <BaseHeading as="h5" size="lg" weight="bold" class="text-muted-900 dark:text-white">
                <span v-if="isLoading" class="block h-6 w-20 animate-pulse rounded bg-muted-200/80 dark:bg-muted-800/60" />
                <template v-else>
                  {{ toCurrency(revenueMetrics.netRevenuePace.value, revenueMetrics.netRevenuePace.currency) }}
                </template>
              </BaseHeading>
              <BaseText size="xs" class="text-muted-400">
                {{ revenueMetrics.netRevenuePace.timeframe }}
              </BaseText>
            </div>
            <div class="mt-3 h-1.5 rounded-full bg-muted-200 dark:bg-muted-700">
              <div
                class="h-full rounded-full bg-primary-500 transition-all duration-500"
                :style="{ width: `${revenueMetrics.netRevenuePace.progress}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

