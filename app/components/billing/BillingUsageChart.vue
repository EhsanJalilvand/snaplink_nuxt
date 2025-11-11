<script setup lang="ts">
import { computed } from '#imports'

defineOptions({
  name: 'BillingUsageChart',
})

const props = defineProps<{
  labels: string[]
  clicks: number[]
  apiCalls: number[]
  isLoading?: boolean
}>()

const maxClicks = computed(() => Math.max(...props.clicks, 1))
const maxApiCalls = computed(() => Math.max(...props.apiCalls, 1))
</script>

<template>
  <BaseCard class="p-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-muted-100">
          Usage Trends
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Compare weekly link traffic and API consumption.
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-4 text-xs text-muted-500 dark:text-muted-400">
        <div class="flex items-center gap-2">
          <span class="size-3 rounded-full bg-primary-500" />
          <span>Clicks</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="size-3 rounded-full bg-success-500" />
          <span>API calls</span>
        </div>
      </div>
    </div>

    <div class="mt-6 h-64">
      <div v-if="isLoading" class="h-full w-full rounded-xl bg-muted-200/80 animate-pulse dark:bg-muted-800/60" />
      <div v-else class="flex h-full items-end justify-between gap-4">
        <div
          v-for="(label, index) in labels"
          :key="label"
          class="flex flex-1 flex-col items-center gap-2"
        >
          <div class="flex w-full flex-col justify-end gap-1">
            <div
              class="rounded-t-lg bg-primary-500"
              :style="{ height: `${(clicks[index] / maxClicks) * 100}%` }"
            />
            <div
              class="rounded-t-lg bg-success-500"
              :style="{ height: `${(apiCalls[index] / maxApiCalls) * 100}%` }"
            />
          </div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            {{ label }}
          </BaseText>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
