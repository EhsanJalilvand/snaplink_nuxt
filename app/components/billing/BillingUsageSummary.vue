<script setup lang="ts">
const props = defineProps<{
  clicks: number
  apiCalls: number
  isLoading?: boolean
}>()

defineOptions({
  name: 'BillingUsageSummary',
})

const formatNumber = (value: number) => value.toLocaleString()
</script>

<template>
  <BaseCard class="p-6">
    <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-muted-100">
      This Month
    </BaseHeading>
    <BaseText size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
      Track current cycle consumption across core products.
    </BaseText>

    <div class="mt-6 space-y-6">
      <div>
        <div class="flex items-center justify-between text-xs">
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">URL Clicks</BaseText>
          <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
            <span v-if="isLoading" class="inline-block h-4 w-12 rounded bg-muted-200/80 animate-pulse dark:bg-muted-800/60" />
            <template v-else>{{ formatNumber(clicks) }}</template>
          </BaseText>
        </div>
        <div class="mt-2 h-2 overflow-hidden rounded-full bg-muted-200 dark:bg-muted-700">
          <div
            class="h-full rounded-full bg-primary-500 transition-all"
            :style="{ width: `${Math.min((clicks / 150000) * 100, 100)}%` }"
          />
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between text-xs">
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">API Calls</BaseText>
          <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
            <span v-if="isLoading" class="inline-block h-4 w-12 rounded bg-muted-200/80 animate-pulse dark:bg-muted-800/60" />
            <template v-else>{{ formatNumber(apiCalls) }}</template>
          </BaseText>
        </div>
        <div class="mt-2 h-2 overflow-hidden rounded-full bg-muted-200 dark:bg-muted-700">
          <div
            class="h-full rounded-full bg-success-500 transition-all"
            :style="{ width: `${Math.min((apiCalls / 60000) * 100, 100)}%` }"
          />
        </div>
      </div>
    </div>
  </BaseCard>
</template>
