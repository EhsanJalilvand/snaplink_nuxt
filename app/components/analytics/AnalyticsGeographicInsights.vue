<script setup lang="ts">
defineProps<{
  selectedIds: string[]
  reportType: 'links' | 'collections'
  period: string
}>()

// Clicks by country - TODO: Replace with API call
const clicksByCountry = ref([
  { country: 'United States', code: 'US', clicks: 45200, percentage: 36, flag: '🇺🇸' },
  { country: 'United Kingdom', code: 'GB', clicks: 28900, percentage: 23, flag: '🇬🇧' },
  { country: 'Germany', code: 'DE', clicks: 21500, percentage: 17, flag: '🇩🇪' },
  { country: 'France', code: 'FR', clicks: 12800, percentage: 10, flag: '🇫🇷' },
  { country: 'Canada', code: 'CA', clicks: 9800, percentage: 8, flag: '🇨🇦' },
  { country: 'Australia', code: 'AU', clicks: 7647, percentage: 6, flag: '🇦🇺' },
])

// Region growth trend
const regionGrowthTrend = ref([
  { region: 'North America', clicks: 55000, growth: 12.5 },
  { region: 'Europe', clicks: 63200, growth: 8.3 },
  { region: 'Asia Pacific', clicks: 15600, growth: 15.2 },
  { region: 'Latin America', clicks: 8500, growth: 22.1 },
  { region: 'Middle East & Africa', clicks: 2547, growth: 18.5 },
])

// Time zone analysis
const timeZoneAnalysis = ref([
  { timezone: 'UTC-5 (EST)', clicks: 28500, percentage: 23 },
  { timezone: 'UTC+0 (GMT)', clicks: 34200, percentage: 27 },
  { timezone: 'UTC+1 (CET)', clicks: 28900, percentage: 23 },
  { timezone: 'UTC+8 (CST)', clicks: 18900, percentage: 15 },
  { timezone: 'UTC+9 (JST)', clicks: 12547, percentage: 10 },
  { timezone: 'Other', clicks: 2800, percentage: 2 },
])

const maxCountryClicks = computed(() => Math.max(...clicksByCountry.value.map(c => c.clicks)))
const maxRegionClicks = computed(() => Math.max(...regionGrowthTrend.value.map(r => r.clicks)))
const maxTimezoneClicks = computed(() => Math.max(...timeZoneAnalysis.value.map(t => t.clicks)))
</script>

<template>
  <div class="space-y-6">
    <!-- Clicks by Country -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Clicks by Country
      </BaseHeading>
      <div class="space-y-4">
        <div
          v-for="country in clicksByCountry"
          :key="country.code"
          class="space-y-2"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ country.flag }}</span>
              <div>
                <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
                  {{ country.country }}
                </BaseText>
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  {{ country.code }}
                </BaseText>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                {{ country.clicks.toLocaleString() }}
              </BaseText>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                {{ country.percentage }}%
              </BaseText>
            </div>
          </div>
          <div class="h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary-500 rounded-full transition-all"
              :style="{ width: `${country.percentage}%` }"
            />
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Region Growth Trend -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Region Growth Trend
      </BaseHeading>
      <div class="space-y-4">
        <div
          v-for="region in regionGrowthTrend"
          :key="region.region"
          class="space-y-2"
        >
          <div class="flex items-center justify-between">
            <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
              {{ region.region }}
            </BaseText>
            <div class="flex items-center gap-4">
              <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                {{ region.clicks.toLocaleString() }}
              </BaseText>
              <BaseChip
                :color="region.growth > 10 ? 'success' : 'info'"
                size="sm"
              >
                <Icon
                  :name="region.growth > 10 ? 'ph:trend-up' : 'ph:trend-down'"
                  class="size-3"
                />
                <span>{{ region.growth > 0 ? '+' : '' }}{{ region.growth }}%</span>
              </BaseChip>
            </div>
          </div>
          <div class="h-3 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-success-500 rounded-full transition-all"
              :style="{ width: `${(region.clicks / maxRegionClicks) * 100}%` }"
            />
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Time Zone Analysis -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Time Zone Analysis
      </BaseHeading>
      <div class="h-64 flex items-end justify-between gap-2">
        <div
          v-for="tz in timeZoneAnalysis"
          :key="tz.timezone"
          class="flex-1 flex flex-col items-center gap-2 group"
        >
          <div
            class="w-full bg-info-500 rounded-t transition-all hover:bg-info-600 cursor-pointer"
            :style="{ height: `${(tz.clicks / maxTimezoneClicks) * 100}%` }"
            :title="`${tz.timezone}: ${tz.clicks} clicks (${tz.percentage}%)`"
          />
          <div class="text-center">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400 line-clamp-2">
              {{ tz.timezone }}
            </BaseText>
            <BaseText size="xs" weight="semibold" class="text-muted-900 dark:text-muted-100 mt-1">
              {{ tz.percentage }}%
            </BaseText>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

