<script setup lang="ts">
import { useUrlShortenerAnalytics } from '~/composables/useUrlShortenerAnalytics'

const props = defineProps<{
  selectedIds: string[]
  reportType: 'links' | 'collections'
  period: string
}>()

const { fetchOverview } = useUrlShortenerAnalytics()

const isLoading = ref(false)
const error = ref<string | null>(null)

const stats = ref({
  totalClicks: 0,
  uniqueClicks: 0,
  avgClicksPerDay: 0,
  clickThroughRate: 0,
})

const clicksOverTime = ref<Array<{ date: string; clicks: number; unique: number }>>([])
const topLinks = ref<Array<{ shortUrl: string; clicks: number }>>([])

const maxClicks = computed(() => {
  if (clicksOverTime.value.length === 0) return 1
  return Math.max(...clicksOverTime.value.map(d => d.clicks), 1)
})

const loadData = async () => {
  isLoading.value = true
  error.value = null

  try {
    const data = await fetchOverview(props.selectedIds, props.period)
    
    if (data) {
      stats.value = {
        totalClicks: data.stats.totalClicks,
        uniqueClicks: data.stats.uniqueClicks,
        avgClicksPerDay: data.stats.avgClicksPerDay,
        clickThroughRate: data.stats.clickThroughRate,
      }
      
      clicksOverTime.value = data.clicksOverTime.map(item => ({
        date: item.date,
        clicks: item.clicks,
        unique: item.uniqueClicks,
      }))
      
      topLinks.value = data.topLinks.map(link => ({
        shortUrl: link.shortUrl,
        clicks: link.clicks,
      }))
    } else {
      // Fallback to empty data
      stats.value = {
        totalClicks: 0,
        uniqueClicks: 0,
        avgClicksPerDay: 0,
        clickThroughRate: 0,
      }
      clicksOverTime.value = []
      topLinks.value = []
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load analytics data'
  } finally {
    isLoading.value = false
  }
}

watch([() => props.selectedIds, () => props.period], () => {
  loadData()
}, { immediate: true })
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
        <BaseText v-if="stats.totalClicks > 0" size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
          {{ Math.round((stats.uniqueClicks / stats.totalClicks) * 100) }}% unique rate
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
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
          Average per day
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
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
          Unique clicks rate
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

    <!-- Top Links -->
    <BaseCard v-if="topLinks.length > 0" class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Top Performing Links
      </BaseHeading>
      <div class="space-y-3">
        <div
          v-for="(link, index) in topLinks.slice(0, 5)"
          :key="index"
          class="flex items-center justify-between p-4 border border-muted-200 dark:border-muted-700 rounded-lg"
        >
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
                {{ link.shortUrl }}
              </BaseHeading>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Rank #{index + 1}
              </BaseText>
            </div>
          </div>
          <div class="text-right">
            <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
              {{ link.clicks.toLocaleString() }}
            </BaseText>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              clicks
            </BaseText>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center p-12">
      <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <!-- Error State -->
    <BaseCard v-if="error" class="p-6">
      <div class="text-center text-danger-600 dark:text-danger-400">
        {{ error }}
      </div>
    </BaseCard>
  </div>
</template>

