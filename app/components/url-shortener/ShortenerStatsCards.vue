<script setup lang="ts">
import { computed } from '#imports'
import type { ShortenerStats } from '~/types/url-shortener'

interface Props {
  stats: ShortenerStats
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const cards = computed(() => [
  {
    label: 'Total Clicks',
    value: props.stats.totalClicks,
    icon: 'solar:mouse-linear',
    accent: 'primary',
    helper: '+12.5% from last period',
  },
  {
    label: 'Total Links',
    value: props.stats.totalLinks,
    icon: 'solar:link-linear',
    accent: 'success',
    helper: '+8 new this week',
  },
  {
    label: 'Active Links',
    value: props.stats.activeLinks,
    icon: 'solar:check-circle-linear',
    accent: 'info',
    helper: `${props.stats.totalLinks > 0 ? Math.round((props.stats.activeLinks / props.stats.totalLinks) * 100) : 0}% of total`,
  },
  {
    label: 'Avg Clicks / Link',
    value: props.stats.avgClicksPerLink,
    icon: 'solar:chart-linear',
    accent: 'warning',
    helper: 'Performance vs previous period',
  },
])

const accentClass = (accent: string) => {
  switch (accent) {
    case 'success':
      return 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-300'
    case 'info':
      return 'bg-info-100 dark:bg-info-900/30 text-info-600 dark:text-info-300'
    case 'warning':
      return 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-300'
    default:
      return 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300'
  }
}

const formatNumber = (value: number) => value.toLocaleString()
</script>

<template>
  <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
    <BaseCard
      v-for="card in cards"
      :key="card.label"
      class="p-6"
    >
      <div class="flex items-center justify-between mb-4">
        <div :class="['p-2 rounded-lg', accentClass(card.accent)]">
          <Icon :name="card.icon" class="size-5" />
        </div>
      </div>
      <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-1">
        {{ card.label }}
      </BaseText>
      <div class="min-h-[2.5rem]">
        <div
          v-if="isLoading"
          class="h-7 w-24 rounded bg-muted-200/80 animate-pulse dark:bg-muted-800/60"
        />
        <BaseHeading
          v-else
          as="h3"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-muted-100"
        >
          {{ formatNumber(card.value) }}
        </BaseHeading>
      </div>
      <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
        {{ card.helper }}
      </BaseText>
    </BaseCard>
  </div>
</template>
