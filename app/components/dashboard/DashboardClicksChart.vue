<script setup lang="ts">
import type { DashboardClicksPoint } from '~/types/dashboard'

const props = defineProps<{
  points: DashboardClicksPoint[]
  maxValue: number
  isLoading?: boolean
}>()

const barHeight = (value: number) => {
  if (!props.maxValue || props.maxValue <= 0) {
    return '4%'
  }

  const ratio = value / props.maxValue
  return `${Math.max(4, Math.min(100, Math.round(ratio * 100)))}%`
}
</script>

<template>
  <BaseCard class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-900 dark:text-muted-100"
        >
          Clicks Over Time
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Last 7 days
        </BaseParagraph>
      </div>
      <BaseButton
        size="sm"
        variant="ghost"
        to="/dashboard/url-shortener/overview"
      >
        View All
        <Icon name="lucide:chevron-right" class="size-4" />
      </BaseButton>
    </div>

    <div v-if="isLoading" class="flex h-48 items-end gap-2">
      <div
        v-for="placeholder in 7"
        :key="`clicks-placeholder-${placeholder}`"
        class="flex-1 animate-pulse rounded-t-lg bg-primary-200/60 dark:bg-primary-900/40"
        :style="{ height: `${Math.max(8, placeholder * 10)}%` }"
      />
    </div>

    <div
      v-else
      class="flex h-48 items-end justify-between gap-2"
    >
      <div
        v-for="point in points"
        :key="point.day"
        class="group flex flex-1 flex-col items-center gap-2"
      >
        <div class="relative flex h-full w-full items-end">
          <div
            class="relative w-full rounded-t-lg bg-gradient-to-t from-primary-500 to-primary-400 transition-all duration-300 group-hover:from-primary-600 group-hover:to-primary-500 group-hover:shadow-lg"
            :style="{ height: barHeight(point.clicks) }"
          >
            <div class="pointer-events-none absolute -top-8 start-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-muted-900 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-muted-100 dark:text-muted-900">
              {{ point.clicks.toLocaleString() }} clicks
            </div>
          </div>
        </div>
        <BaseText size="xs" weight="medium" class="text-muted-500 dark:text-muted-400">
          {{ point.day }}
        </BaseText>
      </div>
    </div>
  </BaseCard>
</template>

