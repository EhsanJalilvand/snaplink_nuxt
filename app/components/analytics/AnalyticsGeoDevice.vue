<script setup lang="ts">
defineProps<{
  selectedIds: string[]
  reportType: 'links' | 'collections'
  period: string
}>()

// Geo-Device correlations - TODO: Replace with API call
const geoDeviceData = ref([
  {
    location: 'Tehran, Iran',
    device: 'Mobile',
    peakHour: '08:00',
    clicks: 12500,
    percentage: 42,
    icon: 'solar:smartphone-linear',
  },
  {
    location: 'New York, USA',
    device: 'Desktop',
    peakHour: '14:00',
    clicks: 9800,
    percentage: 33,
    icon: 'solar:computer-linear',
  },
  {
    location: 'London, UK',
    device: 'Mobile',
    peakHour: '12:00',
    clicks: 7600,
    percentage: 25,
    icon: 'solar:smartphone-linear',
  },
  {
    location: 'Tokyo, Japan',
    device: 'Mobile',
    peakHour: '20:00',
    clicks: 6200,
    percentage: 21,
    icon: 'solar:smartphone-linear',
  },
  {
    location: 'Berlin, Germany',
    device: 'Desktop',
    peakHour: '16:00',
    clicks: 5400,
    percentage: 18,
    icon: 'solar:computer-linear',
  },
])

// Device distribution by location
const deviceByLocation = ref([
  {
    location: 'Tehran',
    mobile: 12500,
    desktop: 3200,
    tablet: 800,
  },
  {
    location: 'New York',
    mobile: 6500,
    desktop: 9800,
    tablet: 1200,
  },
  {
    location: 'London',
    mobile: 7600,
    desktop: 4200,
    tablet: 600,
  },
])

const maxGeoDeviceClicks = computed(() => Math.max(...geoDeviceData.value.map(g => g.clicks)))
</script>

<template>
  <div class="space-y-6">
    <!-- Geo-Device Correlations -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Geo-Device Insights
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
        Discover how users from different locations interact with your links on different devices
      </BaseParagraph>
      <div class="space-y-4">
        <div
          v-for="item in geoDeviceData"
          :key="item.location"
          class="p-4 border border-muted-200 dark:border-muted-700 rounded-lg hover:bg-muted-50 dark:hover:bg-muted-800/50 transition-colors"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Icon :name="item.icon" class="size-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <BaseHeading
                  as="h4"
                  size="sm"
                  weight="semibold"
                  class="text-muted-900 dark:text-muted-100 mb-1"
                >
                  {{ item.location }}
                </BaseHeading>
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  Peak activity: {{ item.peakHour }} on {{ item.device }}
                </BaseText>
              </div>
            </div>
            <div class="text-right">
              <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                {{ item.clicks.toLocaleString() }}
              </BaseText>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                {{ item.percentage }}% of total
              </BaseText>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Device: {{ item.device }}
              </BaseText>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Peak Hour: {{ item.peakHour }}
              </BaseText>
            </div>
            <div class="h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary-500 rounded-full transition-all"
                :style="{ width: `${item.percentage}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Device Distribution by Location -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Device Distribution by Location
      </BaseHeading>
      <div class="space-y-6">
        <div
          v-for="location in deviceByLocation"
          :key="location.location"
          class="space-y-3"
        >
          <div class="flex items-center justify-between">
            <BaseHeading
              as="h4"
              size="sm"
              weight="semibold"
              class="text-muted-900 dark:text-muted-100"
            >
              {{ location.location }}
            </BaseHeading>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Total: {{ (location.mobile + location.desktop + location.tablet).toLocaleString() }}
            </BaseText>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon name="solar:smartphone-linear" class="size-4 text-muted-400" />
                <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                  Mobile
                </BaseText>
              </div>
              <div class="flex items-center gap-3">
                <BaseText size="xs" weight="semibold" class="text-muted-900 dark:text-muted-100">
                  {{ location.mobile.toLocaleString() }}
                </BaseText>
                <div class="w-32 h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary-500 rounded-full"
                    :style="{ width: `${(location.mobile / (location.mobile + location.desktop + location.tablet)) * 100}%` }"
                  />
                </div>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon name="solar:computer-linear" class="size-4 text-muted-400" />
                <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                  Desktop
                </BaseText>
              </div>
              <div class="flex items-center gap-3">
                <BaseText size="xs" weight="semibold" class="text-muted-900 dark:text-muted-100">
                  {{ location.desktop.toLocaleString() }}
                </BaseText>
                <div class="w-32 h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-success-500 rounded-full"
                    :style="{ width: `${(location.desktop / (location.mobile + location.desktop + location.tablet)) * 100}%` }"
                  />
                </div>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon name="solar:tablet-linear" class="size-4 text-muted-400" />
                <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                  Tablet
                </BaseText>
              </div>
              <div class="flex items-center gap-3">
                <BaseText size="xs" weight="semibold" class="text-muted-900 dark:text-muted-100">
                  {{ location.tablet.toLocaleString() }}
                </BaseText>
                <div class="w-32 h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-info-500 rounded-full"
                    :style="{ width: `${(location.tablet / (location.mobile + location.desktop + location.tablet)) * 100}%` }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

