<script setup lang="ts">
defineProps<{
  selectedIds: string[]
  reportType: 'links' | 'collections'
  period: string
}>()

// Device type data
const deviceTypes = ref([
  { type: 'Mobile', clicks: 75420, percentage: 60, icon: 'solar:smartphone-linear' },
  { type: 'Desktop', clicks: 37800, percentage: 30, icon: 'solar:computer-linear' },
  { type: 'Tablet', clicks: 12627, percentage: 10, icon: 'solar:tablet-linear' },
])

// Operating systems
const operatingSystems = ref([
  { os: 'iOS', clicks: 45200, percentage: 36, icon: 'logos:apple' },
  { os: 'Android', clicks: 30220, percentage: 24, icon: 'logos:android-icon' },
  { os: 'Windows', clicks: 28900, percentage: 23, icon: 'logos:microsoft-windows' },
  { os: 'macOS', clicks: 15200, percentage: 12, icon: 'logos:apple' },
  { os: 'Linux', clicks: 6327, percentage: 5, icon: 'logos:linux-tux' },
])

// Browsers
const browsers = ref([
  { browser: 'Chrome', clicks: 58900, percentage: 47, icon: 'logos:chrome' },
  { browser: 'Safari', clicks: 34200, percentage: 27, icon: 'logos:safari' },
  { browser: 'Firefox', clicks: 18900, percentage: 15, icon: 'logos:firefox' },
  { browser: 'Edge', clicks: 9800, percentage: 8, icon: 'logos:microsoft-edge' },
  { browser: 'Other', clicks: 4047, percentage: 3, icon: 'solar:global-linear' },
])

const maxDeviceClicks = computed(() => Math.max(...deviceTypes.value.map(d => d.clicks)))
const maxOSClicks = computed(() => Math.max(...operatingSystems.value.map(o => o.clicks)))
const maxBrowserClicks = computed(() => Math.max(...browsers.value.map(b => b.clicks)))
</script>

<template>
  <div class="space-y-6">
    <!-- Device Type -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Device Type
      </BaseHeading>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="device in deviceTypes"
          :key="device.type"
          class="p-4 border border-muted-200 dark:border-muted-700 rounded-lg hover:bg-muted-50 dark:hover:bg-muted-800/50 transition-colors"
        >
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <Icon :name="device.icon" class="size-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <BaseHeading
                as="h4"
                size="sm"
                weight="semibold"
                class="text-muted-900 dark:text-muted-100"
              >
                {{ device.type }}
              </BaseHeading>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                {{ device.percentage }}% of total
              </BaseText>
            </div>
          </div>
          <BaseHeading
            as="h3"
            size="2xl"
            weight="bold"
            class="text-muted-900 dark:text-muted-100 mb-2"
          >
            {{ device.clicks.toLocaleString() }}
          </BaseHeading>
          <div class="h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary-500 rounded-full transition-all"
              :style="{ width: `${device.percentage}%` }"
            />
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Operating Systems -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Operating Systems
      </BaseHeading>
      <div class="space-y-4">
        <div
          v-for="os in operatingSystems"
          :key="os.os"
          class="flex items-center justify-between p-4 border border-muted-200 dark:border-muted-700 rounded-lg hover:bg-muted-50 dark:hover:bg-muted-800/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-muted-100 dark:bg-muted-800">
              <Icon :name="os.icon" class="size-5 text-muted-600 dark:text-muted-400" />
            </div>
            <div>
              <BaseHeading
                as="h4"
                size="sm"
                weight="semibold"
                class="text-muted-900 dark:text-muted-100"
              >
                {{ os.os }}
              </BaseHeading>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                {{ os.percentage }}% of total
              </BaseText>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
              {{ os.clicks.toLocaleString() }}
            </BaseText>
            <div class="w-24 h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-success-500 rounded-full transition-all"
                :style="{ width: `${os.percentage}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Browsers -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Browsers
      </BaseHeading>
      <div class="h-64 flex items-end justify-between gap-2">
        <div
          v-for="browser in browsers"
          :key="browser.browser"
          class="flex-1 flex flex-col items-center gap-2 group"
        >
          <div
            class="w-full bg-info-500 rounded-t transition-all hover:bg-info-600 cursor-pointer"
            :style="{ height: `${(browser.clicks / maxBrowserClicks) * 100}%` }"
            :title="`${browser.browser}: ${browser.clicks} clicks (${browser.percentage}%)`"
          />
          <div class="text-center">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400 line-clamp-1">
              {{ browser.browser }}
            </BaseText>
            <BaseText size="xs" weight="semibold" class="text-muted-900 dark:text-muted-100 mt-1">
              {{ browser.percentage }}%
            </BaseText>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

