<script setup lang="ts">
import type { BillingUsageSummary } from '~/types/billing'

const props = defineProps<{
  summary: BillingUsageSummary
  isLoading?: boolean
}>()

const formatCurrency = (value: number, currency: string) => {
  if (currency === 'MULTI') {
    return `$${value.toFixed(2)}`
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `$${value.toFixed(2)}`
  }
}
</script>

<template>
  <BaseCard class="p-6">
    <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-muted-100">
      Usage Summary
    </BaseHeading>
    <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
      Aggregated metrics across the current billing window.
    </BaseParagraph>

    <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
      <div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          Active modules
        </BaseText>
        <div class="mt-2 h-9">
          <div
            v-if="isLoading"
            class="h-full w-16 rounded-lg bg-muted-200/80 animate-pulse dark:bg-muted-800/60"
          />
          <BaseHeading
            v-else
            as="h3"
            size="2xl"
            weight="bold"
            class="text-muted-900 dark:text-muted-100"
          >
            {{ summary.moduleCount }}
          </BaseHeading>
        </div>
      </div>

      <div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          Tracked metrics
        </BaseText>
        <div class="mt-2 h-9">
          <div
            v-if="isLoading"
            class="h-full w-16 rounded-lg bg-muted-200/80 animate-pulse dark:bg-muted-800/60"
          />
          <BaseHeading
            v-else
            as="h3"
            size="2xl"
            weight="bold"
            class="text-muted-900 dark:text-muted-100"
          >
            {{ summary.metricCount }}
          </BaseHeading>
        </div>
      </div>

      <div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          Average utilization
        </BaseText>
        <div class="mt-2 h-9">
          <div
            v-if="isLoading"
            class="h-full w-16 rounded-lg bg-muted-200/80 animate-pulse dark:bg-muted-800/60"
          />
          <BaseHeading
            v-else
            as="h3"
            size="2xl"
            weight="bold"
            class="text-muted-900 dark:text-muted-100"
          >
            {{ summary.averageUtilization.toFixed(0) }}%
          </BaseHeading>
        </div>
      </div>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
      <div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          Customer spend
        </BaseText>
        <div class="mt-2 h-9">
          <div
            v-if="isLoading"
            class="h-full w-24 rounded-lg bg-muted-200/80 animate-pulse dark:bg-muted-800/60"
          />
          <BaseHeading
            v-else
            as="h3"
            size="xl"
            weight="bold"
            class="text-muted-900 dark:text-muted-100"
          >
            {{ formatCurrency(summary.totalCustomerCost, summary.currency) }}
          </BaseHeading>
        </div>
      </div>

      <div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          Vendor cost
        </BaseText>
        <div class="mt-2 h-9">
          <div
            v-if="isLoading"
            class="h-full w-24 rounded-lg bg-muted-200/80 animate-pulse dark:bg-muted-800/60"
          />
          <BaseHeading
            v-else
            as="h3"
            size="xl"
            weight="bold"
            class="text-muted-900 dark:text-muted-100"
          >
            {{ formatCurrency(summary.totalVendorCost, summary.currency) }}
          </BaseHeading>
        </div>
      </div>

      <div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          Gross margin
        </BaseText>
        <div class="mt-2 h-9">
          <div
            v-if="isLoading"
            class="h-full w-24 rounded-lg bg-muted-200/80 animate-pulse dark:bg-muted-800/60"
          />
          <BaseHeading
            v-else
            as="h3"
            size="xl"
            weight="bold"
            class="text-success-600 dark:text-success-400"
          >
            {{ formatCurrency(summary.grossMargin, summary.currency) }}
            <span class="text-sm text-success-500 dark:text-success-400">
              ({{ summary.grossMarginPercent.toFixed(1) }}%)
            </span>
          </BaseHeading>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
