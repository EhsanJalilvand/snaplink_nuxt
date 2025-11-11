<script setup lang="ts">
import type { PaymentConversionMetric } from '~/types/payments'

interface PaymentConversionMetricsProps {
  metrics?: PaymentConversionMetric[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<PaymentConversionMetricsProps>(), {
  metrics: () => [],
  isLoading: false,
})

const trendIcon = (metric: PaymentConversionMetric) =>
  metric.status === 'decrease' ? 'ph:arrow-down-right' : 'ph:arrow-up-right'

const progressWidth = (metric: PaymentConversionMetric) => `${Math.min(Math.max(metric.progress ?? 0, 0), 100)}%`

const metricValue = (value: string) => value
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
          Conversion Metrics
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Optimize every step of the checkout funnel with actionable telemetry.
        </BaseParagraph>
      </div>
      <BaseButton size="sm" variant="outline" color="primary">
        Export report
      </BaseButton>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <BaseCard
        v-for="metric in props.metrics"
        :key="metric.label"
        class="border border-muted-200/80 bg-white/70 p-5 dark:border-muted-700/50 dark:bg-muted-900/30"
      >
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          <span v-if="isLoading" class="block h-4 w-32 animate-pulse rounded bg-muted-200/60 dark:bg-muted-800/50" />
          <template v-else>
            {{ metric.label }}
          </template>
        </BaseText>
        <div class="mt-3 flex items-end justify-between">
          <BaseHeading
            as="h4"
            size="xl"
            weight="bold"
            class="text-muted-900 dark:text-white"
          >
            <span v-if="isLoading" class="block h-7 w-16 animate-pulse rounded bg-muted-200/70 dark:bg-muted-800/60" />
            <template v-else>
              {{ metricValue(metric.value) }}
            </template>
          </BaseHeading>
          <BaseChip
            :color="metric.status === 'decrease' ? 'danger' : 'success'"
            size="xs"
          >
            <Icon
              :name="trendIcon(metric)"
              class="size-3"
            />
            <span>{{ metric.change }}</span>
          </BaseChip>
        </div>
        <BaseParagraph size="xs" class="mt-2 text-muted-500 dark:text-muted-400">
          <span v-if="isLoading" class="block h-4 w-full animate-pulse rounded bg-muted-200/50 dark:bg-muted-800/40" />
          <template v-else>
            {{ metric.description }}
          </template>
        </BaseParagraph>
        <div class="mt-4 h-2 rounded-full bg-muted-200 dark:bg-muted-700">
          <div
            class="h-full rounded-full bg-primary-500 transition-all duration-500"
            :style="{ width: progressWidth(metric) }"
          />
        </div>
      </BaseCard>
    </div>
  </BaseCard>
</template>

