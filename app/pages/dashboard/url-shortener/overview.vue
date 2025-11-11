<script setup lang="ts">
import { callOnce, computed, watch } from '#imports'
import ShortenerOverviewToolbar from '~/components/url-shortener/ShortenerOverviewToolbar.vue'
import ShortenerStatsCards from '~/components/url-shortener/ShortenerStatsCards.vue'
import ShortenerClicksTrend from '~/components/url-shortener/ShortenerClicksTrend.vue'
import ShortenerTopLinksTable from '~/components/url-shortener/ShortenerTopLinksTable.vue'
import ShortenerTopReferrers from '~/components/url-shortener/ShortenerTopReferrers.vue'
import ShortenerUserComposition from '~/components/url-shortener/ShortenerUserComposition.vue'

definePageMeta({
  title: 'URL Shortener Overview',
  layout: 'dashboard',
})

const {
  stats,
  clicksOverTime,
  topLinks,
  topReferrers,
  userStats,
  totalUsers,
  newUserRatio,
  returningUserRatio,
  period,
  isLoading,
  error,
  fetchOverview,
  setPeriod,
} = useUrlShortenerOverview()

await callOnce(() => fetchOverview())

watch(period, () => {
  fetchOverview({ force: true })
})

const periodOptions = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last year', value: '1y' },
]

const periodModel = computed({
  get: () => period.value,
  set: (value: string) => setPeriod(value),
})
</script>

<template>
  <div class="space-y-6 py-6">
    <ShortenerOverviewToolbar v-model:period="periodModel" :options="periodOptions" />

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached analytics
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

    <ShortenerStatsCards :stats="stats" :is-loading="isLoading" />

    <ShortenerClicksTrend :points="clicksOverTime" :is-loading="isLoading" />

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <ShortenerTopLinksTable :links="topLinks" :is-loading="isLoading" />
      <ShortenerTopReferrers :referrers="topReferrers" :is-loading="isLoading" />
    </div>

    <ShortenerUserComposition
      :stats="userStats"
      :total="totalUsers"
      :new-ratio="newUserRatio"
      :returning-ratio="returningUserRatio"
      :is-loading="isLoading"
    />
  </div>
</template>

