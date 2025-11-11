<script setup lang="ts">
import { computed } from '#imports'
import type { ShortenerClicksPoint } from '~/types/url-shortener'

interface Props {
  points: ShortenerClicksPoint[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const maxClicks = computed(() => {
  if (!props.points.length) {
    return 0
  }
  return Math.max(...props.points.map(point => point.clicks))
})

const normalizedPoints = computed(() => {
  const max = maxClicks.value || 1
  return props.points.map(point => ({
    ...point,
    percentage: Math.round((point.clicks / max) * 100),
  }))
})
</script>

<template>
  <BaseCard class="p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
          Clicks over time
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Trend line for the selected reporting period.
        </BaseParagraph>
      </div>
    </div>

    <div class="mt-6">
      <div v-if="isLoading" class="space-y-2">
        <div
          v-for="index in 6"
          :key="`click-skeleton-${index}`"
          class="h-4 w-full rounded-full bg-muted-200/80 animate-pulse dark:bg-muted-800/60"
        />
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="point in normalizedPoints"
          :key="point.date"
          class="space-y-1"
        >
          <div class="flex items-center justify-between">
            <BaseText size="xs" class="font-mono text-muted-500 dark:text-muted-400">
              {{ point.date }}
            </BaseText>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              {{ point.clicks.toLocaleString() }} clicks
            </BaseText>
          </div>
          <div class="h-2 rounded-full bg-muted-200 dark:bg-muted-800">
            <div
              class="h-full rounded-full bg-primary-500 transition-all duration-500"
              :style="{ width: `${point.percentage}%` }"
            />
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
