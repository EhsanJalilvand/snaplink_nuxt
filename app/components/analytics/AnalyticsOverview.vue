<script setup lang="ts">
defineProps<{
  selectedIds: string[]
  reportType: 'links' | 'collections'
  period: string
}>()

// Overview stats - TODO: Replace with API call
const stats = ref({
  totalClicks: 125847,
  uniqueClicks: 98432,
  avgClicksPerDay: 4194,
  clickThroughRate: 68.5,
  topLink: {
    shortUrl: 'snap.ly/abc123',
    clicks: 12500,
  },
})

// Clicks over time (last 30 days)
const clicksOverTime = ref([
  { date: '2024-01-01', clicks: 1250, unique: 980 },
  { date: '2024-01-02', clicks: 1420, unique: 1120 },
  { date: '2024-01-03', clicks: 1380, unique: 1080 },
  { date: '2024-01-04', clicks: 1560, unique: 1220 },
  { date: '2024-01-05', clicks: 1680, unique: 1320 },
  { date: '2024-01-06', clicks: 1890, unique: 1480 },
  { date: '2024-01-07', clicks: 2100, unique: 1650 },
])

const maxClicks = computed(() => Math.max(...clicksOverTime.value.map(d => d.clicks)))
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <BaseCard class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <Icon name="solar:mouse-linear" class="size-5 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-1">
          Total Clicks
        </BaseText>
        <BaseHeading
          as="h3"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-muted-100"
        >
          {{ stats.totalClicks.toLocaleString() }}
        </BaseHeading>
        <BaseText size="xs" class="text-success-600 dark:text-success-400 mt-2">
          +12.5% from last period
        </BaseText>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="p-2 rounded-lg bg-success-100 dark:bg-success-900/30">
            <Icon name="solar:user-id-linear" class="size-5 text-success-600 dark:text-success-400" />
          </div>
        </div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-1">
          Unique Clicks
        </BaseText>
        <BaseHeading
          as="h3"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-muted-100"
        >
          {{ stats.uniqueClicks.toLocaleString() }}
        </BaseHeading>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
          {{ Math.round((stats.uniqueClicks / stats.totalClicks) * 100) }}% unique rate
        </BaseText>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="p-2 rounded-lg bg-info-100 dark:bg-info-900/30">
            <Icon name="solar:calendar-linear" class="size-5 text-info-600 dark:text-info-400" />
          </div>
        </div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-1">
          Avg Clicks/Day
        </BaseText>
        <BaseHeading
          as="h3"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-muted-100"
        >
          {{ stats.avgClicksPerDay.toLocaleString() }}
        </BaseHeading>
        <BaseText size="xs" class="text-success-600 dark:text-success-400 mt-2">
          +8.2% from last period
        </BaseText>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="p-2 rounded-lg bg-warning-100 dark:bg-warning-900/30">
            <Icon name="solar:chart-linear" class="size-5 text-warning-600 dark:text-warning-400" />
          </div>
        </div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-1">
          Click-Through Rate
        </BaseText>
        <BaseHeading
          as="h3"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-muted-100"
        >
          {{ stats.clickThroughRate }}%
        </BaseHeading>
        <BaseText size="xs" class="text-success-600 dark:text-success-400 mt-2">
          +2.5% from last period
        </BaseText>
      </BaseCard>
    </div>

    <!-- Clicks Over Time Chart -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Clicks Over Time
      </BaseHeading>
      <div class="h-64 flex items-end justify-between gap-2">
        <div
          v-for="day in clicksOverTime"
          :key="day.date"
          class="flex-1 flex flex-col items-center gap-2 group"
        >
          <div class="w-full flex flex-col justify-end gap-1 h-full relative">
            <div
              class="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-600 cursor-pointer"
              :style="{ height: `${(day.clicks / maxClicks) * 100}%` }"
              :title="`${day.date}: ${day.clicks} clicks (${day.unique} unique)`"
            />
            <div
              class="w-full bg-success-500/70 rounded-t transition-all hover:bg-success-500 cursor-pointer"
              :style="{ height: `${(day.unique / maxClicks) * 100}%` }"
            />
          </div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            {{ new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
          </BaseText>
        </div>
      </div>
      <div class="flex items-center justify-center gap-4 mt-4">
        <div class="flex items-center gap-2">
          <div class="size-3 rounded-full bg-primary-500" />
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Total Clicks
          </BaseText>
        </div>
        <div class="flex items-center gap-2">
          <div class="size-3 rounded-full bg-success-500" />
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Unique Clicks
          </BaseText>
        </div>
      </div>
    </BaseCard>

    <!-- Top Link -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Top Performing Link
      </BaseHeading>
      <div class="flex items-center justify-between p-4 border border-muted-200 dark:border-muted-700 rounded-lg">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <Icon name="solar:link-linear" class="size-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <BaseHeading
              as="h4"
              size="sm"
              weight="semibold"
              class="text-muted-900 dark:text-muted-100 mb-1"
            >
              {{ stats.topLink.shortUrl }}
            </BaseHeading>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Most clicked link
            </BaseText>
          </div>
        </div>
        <div class="text-right">
          <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
            {{ stats.topLink.clicks.toLocaleString() }}
          </BaseText>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            clicks
          </BaseText>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

