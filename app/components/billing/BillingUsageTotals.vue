<script setup lang="ts">
import type { BillingUsageSummaryMetrics } from '~/types/billing'

const props = defineProps<{
  summary: BillingUsageSummaryMetrics
  isLoading?: boolean
}>()
</script>

<template>
  <BaseCard class="p-6">
    <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-muted-100">
      Total Usage Summary
    </BaseHeading>
    <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
      Snapshot across the selected window.
    </BaseParagraph>

    <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
      <div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          Total services used
        </BaseText>
        <div class="mt-2 h-9">
          <div
            v-if="isLoading"
            class="h-full w-16 rounded-lg bg-muted-200/80 animate-pulse dark:bg-muted-800/60"
          />
          <BaseHeading v-else as="h3" size="2xl" weight="bold" class="text-muted-900 dark:text-muted-100">
            {{ summary.totalServices }}
          </BaseHeading>
        </div>
      </div>

      <div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          Total cost this period
        </BaseText>
        <div class="mt-2 h-9">
          <div
            v-if="isLoading"
            class="h-full w-24 rounded-lg bg-muted-200/80 animate-pulse dark:bg-muted-800/60"
          />
          <BaseHeading v-else as="h3" size="2xl" weight="bold" class="text-muted-900 dark:text-muted-100">
            ${{ summary.totalCost.toFixed(2) }}
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
          <BaseHeading v-else as="h3" size="2xl" weight="bold" class="text-muted-900 dark:text-muted-100">
            {{ summary.averageUtilization }}%
          </BaseHeading>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
