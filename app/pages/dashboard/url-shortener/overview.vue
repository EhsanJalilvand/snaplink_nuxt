<script setup lang="ts">
definePageMeta({
  title: 'URL Shortener Overview',
  layout: 'dashboard',
})

// Stats data
const stats = ref({
  totalClicks: 125847,
  totalLinks: 342,
  activeLinks: 289,
  avgClicksPerLink: 435,
})

// Click over time data (last 30 days)
const clicksOverTime = ref([
  { date: '2024-01-01', clicks: 1250 },
  { date: '2024-01-02', clicks: 1420 },
  { date: '2024-01-03', clicks: 1380 },
  { date: '2024-01-04', clicks: 1560 },
  { date: '2024-01-05', clicks: 1680 },
  { date: '2024-01-06', clicks: 1890 },
  { date: '2024-01-07', clicks: 2100 },
])

// Top links
const topLinks = ref([
  {
    id: '1',
    shortUrl: 'snap.ly/abc123',
    originalUrl: 'https://example.com/very/long/url',
    clicks: 12500,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    shortUrl: 'snap.ly/xyz789',
    originalUrl: 'https://example.com/another/long/url',
    clicks: 8900,
    createdAt: '2024-01-20',
  },
  {
    id: '3',
    shortUrl: 'snap.ly/def456',
    originalUrl: 'https://example.com/yet/another/url',
    clicks: 6750,
    createdAt: '2024-02-01',
  },
  {
    id: '4',
    shortUrl: 'snap.ly/ghi321',
    originalUrl: 'https://example.com/more/urls',
    clicks: 5420,
    createdAt: '2024-02-10',
  },
  {
    id: '5',
    shortUrl: 'snap.ly/jkl654',
    originalUrl: 'https://example.com/final/url',
    clicks: 4200,
    createdAt: '2024-02-15',
  },
])

// Top referrers
const topReferrers = ref([
  { source: 'Direct', clicks: 45200, percentage: 36 },
  { source: 'Google', clicks: 38900, percentage: 31 },
  { source: 'Facebook', clicks: 21500, percentage: 17 },
  { source: 'Twitter', clicks: 12800, percentage: 10 },
  { source: 'LinkedIn', clicks: 7447, percentage: 6 },
])

// New vs Returning users
const userStats = ref({
  new: 45200,
  returning: 80647,
})

const period = ref('30d')
const periods = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last year', value: '1y' },
]
</script>

<template>
  <div class="space-y-6 py-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          URL Shortener Overview
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Monitor your link performance and analytics
        </BaseParagraph>
      </div>
      <TairoSelect
        v-model="period"
        icon="solar:calendar-linear"
        rounded="lg"
        size="sm"
        class="w-40"
      >
        <BaseSelectItem
          v-for="p in periods"
          :key="p.value"
          :value="p.value"
        >
          {{ p.label }}
        </BaseSelectItem>
      </TairoSelect>
    </div>

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
            <Icon name="solar:link-linear" class="size-5 text-success-600 dark:text-success-400" />
          </div>
        </div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-1">
          Total Links
        </BaseText>
        <BaseHeading
          as="h3"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-muted-100"
        >
          {{ stats.totalLinks.toLocaleString() }}
        </BaseHeading>
        <BaseText size="xs" class="text-success-600 dark:text-success-400 mt-2">
          +8 new this week
        </BaseText>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="p-2 rounded-lg bg-info-100 dark:bg-info-900/30">
            <Icon name="solar:check-circle-linear" class="size-5 text-info-600 dark:text-info-400" />
          </div>
        </div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-1">
          Active Links
        </BaseText>
        <BaseHeading
          as="h3"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-muted-100"
        >
          {{ stats.activeLinks }}
        </BaseHeading>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
          {{ Math.round((stats.activeLinks / stats.totalLinks) * 100) }}% of total
        </BaseText>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="p-2 rounded-lg bg-warning-100 dark:bg-warning-900/30">
            <Icon name="solar:chart-linear" class="size-5 text-warning-600 dark:text-warning-400" />
          </div>
        </div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-1">
          Avg Clicks/Link
        </BaseText>
        <BaseHeading
          as="h3"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-muted-100"
        >
          {{ stats.avgClicksPerLink }}
        </BaseHeading>
        <BaseText size="xs" class="text-success-600 dark:text-success-400 mt-2">
          +5.2% from last period
        </BaseText>
      </BaseCard>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Clicks Over Time -->
      <BaseCard class="p-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-6"
        >
          Clicks Over Time
        </BaseHeading>
        <!-- Simple Chart -->
        <div class="h-64 flex items-end justify-between gap-2">
          <div
            v-for="(day, index) in clicksOverTime"
            :key="day.date"
            class="flex-1 flex flex-col items-center gap-2"
          >
            <div
              class="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-600"
              :style="{ height: `${(day.clicks / 2100) * 100}%` }"
              :title="`${day.date}: ${day.clicks} clicks`"
            />
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              {{ new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
            </BaseText>
          </div>
        </div>
      </BaseCard>

      <!-- New vs Returning Users -->
      <BaseCard class="p-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-6"
        >
          New vs Returning Users
        </BaseHeading>
        <div class="space-y-4">
          <div>
            <div class="flex items-center justify-between mb-2">
              <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                New Users
              </BaseText>
              <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                {{ userStats.new.toLocaleString() }}
              </BaseText>
            </div>
            <div class="h-3 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary-500 rounded-full"
                :style="{ width: `${(userStats.new / (userStats.new + userStats.returning)) * 100}%` }"
              />
            </div>
          </div>
          <div>
            <div class="flex items-center justify-between mb-2">
              <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                Returning Users
              </BaseText>
              <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                {{ userStats.returning.toLocaleString() }}
              </BaseText>
            </div>
            <div class="h-3 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-success-500 rounded-full"
                :style="{ width: `${(userStats.returning / (userStats.new + userStats.returning)) * 100}%` }"
              />
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Top Links and Referrers -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Top Links -->
      <BaseCard class="p-6">
        <div class="flex items-center justify-between mb-6">
          <BaseHeading
            as="h3"
            size="md"
            weight="semibold"
            class="text-muted-800 dark:text-muted-100"
          >
            Top Links
          </BaseHeading>
          <BaseButton
            variant="ghost"
            size="sm"
            to="/dashboard/url-shortener/links"
          >
            View All
            <Icon name="lucide:arrow-right" class="size-4" />
          </BaseButton>
        </div>
        <div class="space-y-4">
          <div
            v-for="(link, index) in topLinks"
            :key="link.id"
            class="flex items-center justify-between p-4 border border-muted-200 dark:border-muted-700 rounded-lg hover:bg-muted-50 dark:hover:bg-muted-800/50 transition-colors"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div class="flex items-center justify-center size-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold text-sm shrink-0">
                {{ index + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <BaseHeading
                  as="h4"
                  size="sm"
                  weight="semibold"
                  class="text-muted-900 dark:text-muted-100 mb-1"
                >
                  {{ link.shortUrl }}
                </BaseHeading>
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 truncate">
                  {{ link.originalUrl }}
                </BaseParagraph>
              </div>
            </div>
            <div class="flex items-center gap-4 ml-4">
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
        </div>
      </BaseCard>

      <!-- Top Referrers -->
      <BaseCard class="p-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-6"
        >
          Top Referrers
        </BaseHeading>
        <div class="space-y-4">
          <div
            v-for="referrer in topReferrers"
            :key="referrer.source"
            class="space-y-2"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon name="solar:link-linear" class="size-4 text-muted-400" />
                <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
                  {{ referrer.source }}
                </BaseText>
              </div>
              <div class="flex items-center gap-3">
                <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                  {{ referrer.clicks.toLocaleString() }}
                </BaseText>
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  {{ referrer.percentage }}%
                </BaseText>
              </div>
            </div>
            <div class="h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-info-500 rounded-full transition-all"
                :style="{ width: `${referrer.percentage}%` }"
              />
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

