<script setup lang="ts">
definePageMeta({
  title: 'SnapLink Dashboard',
  layout: 'default',
})

// Mock data for demonstration
const stats = ref([
  {
    title: 'Total Links',
    value: '1,234',
    change: '+12%',
    changeType: 'positive',
    icon: 'solar:link-linear',
  },
  {
    title: 'Total Clicks',
    value: '45,678',
    change: '+8%',
    changeType: 'positive',
    icon: 'solar:mouse-linear',
  },
  {
    title: 'Active Links',
    value: '567',
    change: '+3%',
    changeType: 'positive',
    icon: 'solar:check-circle-linear',
  },
  {
    title: 'Conversion Rate',
    value: '12.5%',
    change: '-2%',
    changeType: 'negative',
    icon: 'solar:chart-linear',
  },
])

const recentLinks = ref([
  {
    id: 1,
    originalUrl: 'https://example.com/very-long-url-that-needs-to-be-shortened',
    shortUrl: 'snap.ly/abc123',
    clicks: 234,
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    originalUrl: 'https://another-example.com/another-very-long-url',
    shortUrl: 'snap.ly/def456',
    clicks: 89,
    createdAt: '2024-01-14',
  },
  {
    id: 3,
    originalUrl: 'https://third-example.com/yet-another-long-url',
    shortUrl: 'snap.ly/ghi789',
    clicks: 156,
    createdAt: '2024-01-13',
  },
])
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Welcome Section -->
    <div class="bg-white dark:bg-muted-800 rounded-lg p-6 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-muted-900 dark:text-muted-100">
            Welcome to SnapLink
          </h1>
          <p class="text-muted-600 dark:text-muted-400 mt-1">
            Your professional URL shortener and analytics platform
          </p>
        </div>
        <BaseButton size="lg" variant="primary">
          <Icon name="solar:add-circle-linear" class="size-5" />
          <span>Create New Link</span>
        </BaseButton>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="stat in stats"
        :key="stat.title"
        class="bg-white dark:bg-muted-800 rounded-lg p-6 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-600 dark:text-muted-400">
              {{ stat.title }}
            </p>
            <p class="text-2xl font-bold text-muted-900 dark:text-muted-100 mt-1">
              {{ stat.value }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Icon :name="stat.icon" class="size-8 text-primary-500" />
            <div class="text-right">
              <p
                class="text-sm font-medium"
                :class="stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'"
              >
                {{ stat.change }}
              </p>
              <p class="text-xs text-muted-500 dark:text-muted-400">
                vs last month
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Links -->
    <div class="bg-white dark:bg-muted-800 rounded-lg shadow-sm">
      <div class="p-6 border-b border-muted-200 dark:border-muted-700">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-muted-900 dark:text-muted-100">
            Recent Links
          </h2>
          <BaseButton size="sm" variant="ghost">
            View All
          </BaseButton>
        </div>
      </div>
      <div class="p-6">
        <div class="space-y-4">
          <div
            v-for="link in recentLinks"
            :key="link.id"
            class="flex items-center justify-between p-4 bg-muted-50 dark:bg-muted-700 rounded-lg"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-muted-900 dark:text-muted-100 truncate">
                {{ link.originalUrl }}
              </p>
              <p class="text-sm text-primary-600 dark:text-primary-400 mt-1">
                {{ link.shortUrl }}
              </p>
            </div>
            <div class="flex items-center gap-4 ml-4">
              <div class="text-right">
                <p class="text-sm font-medium text-muted-900 dark:text-muted-100">
                  {{ link.clicks }}
                </p>
                <p class="text-xs text-muted-500 dark:text-muted-400">
                  clicks
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-muted-900 dark:text-muted-100">
                  {{ link.createdAt }}
                </p>
                <p class="text-xs text-muted-500 dark:text-muted-400">
                  created
                </p>
              </div>
              <BaseButton size="sm" variant="ghost">
                <Icon name="lucide:more-horizontal" class="size-4" />
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-muted-800 rounded-lg p-6 shadow-sm">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
            <Icon name="solar:link-linear" class="size-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 class="font-semibold text-muted-900 dark:text-muted-100">
              Create Link
            </h3>
            <p class="text-sm text-muted-600 dark:text-muted-400">
              Shorten any URL instantly
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-muted-800 rounded-lg p-6 shadow-sm">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
            <Icon name="solar:chart-2-linear" class="size-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 class="font-semibold text-muted-900 dark:text-muted-100">
              View Analytics
            </h3>
            <p class="text-sm text-muted-600 dark:text-muted-400">
              Track performance metrics
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-muted-800 rounded-lg p-6 shadow-sm">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
            <Icon name="solar:upload-linear" class="size-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 class="font-semibold text-muted-900 dark:text-muted-100">
              Bulk Import
            </h3>
            <p class="text-sm text-muted-600 dark:text-muted-400">
              Import multiple URLs
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
