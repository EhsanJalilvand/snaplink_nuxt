<script setup lang="ts">
import CreateLinkWizard from '~/components/url-shortener/CreateLinkWizard.vue'

definePageMeta({
  title: 'Dashboard - SnapLink',
  layout: 'dashboard',
})

const router = useRouter()
const { user, userDisplayName, refreshUser } = useUserData()
const toaster = useNuiToasts()

// Refresh user data on mount
onMounted(async () => {
  await refreshUser()
})

const showCreateWizard = ref(false)

// Main Stats
const mainStats = ref([
  {
    title: 'Total Links',
    value: '1,234',
    change: '+12.5%',
    changeType: 'positive',
    icon: 'solar:link-linear',
    color: 'primary',
    link: '/dashboard/url-shortener/links',
  },
  {
    title: 'Total Clicks',
    value: '45.6K',
    change: '+8.2%',
    changeType: 'positive',
    icon: 'solar:mouse-linear',
    color: 'success',
    link: '/dashboard/url-shortener/overview',
  },
  {
    title: 'Collections',
    value: '28',
    change: '+5',
    changeType: 'positive',
    icon: 'solar:folder-linear',
    color: 'info',
    link: '/dashboard/url-shortener/collections',
  },
  {
    title: 'Revenue',
    value: '$2,450',
    change: '+15.3%',
    changeType: 'positive',
    icon: 'solar:wallet-linear',
    color: 'warning',
    link: '/dashboard/billing/overview',
  },
])

// Quick Actions
const quickActions = ref([
  {
    title: 'Create Link',
    description: 'Shorten any URL instantly',
    icon: 'solar:link-linear',
    color: 'primary',
    action: () => {
      showCreateWizard.value = true
    },
  },
  {
    title: 'Create Collection',
    description: 'Organize your links',
    icon: 'solar:folder-linear',
    color: 'info',
    action: () => {
      router.push('/dashboard/url-shortener/collections')
    },
  },
  {
    title: 'View Analytics',
    description: 'Track performance',
    icon: 'solar:chart-2-linear',
    color: 'success',
    action: () => {
      router.push('/dashboard/url-shortener/overview')
    },
  },
  {
    title: 'Generate Report',
    description: 'Export your data',
    icon: 'solar:document-text-linear',
    color: 'warning',
    action: () => {
      router.push('/dashboard/url-shortener/reports')
    },
  },
])

// Services Overview
const services = ref([
  {
    name: 'URL Shortener',
    icon: 'solar:link-linear',
    count: 1234,
    color: 'primary',
    link: '/dashboard/url-shortener/overview',
  },
  {
    name: 'Survey Link',
    icon: 'solar:clipboard-list-linear',
    count: 0,
    color: 'info',
    link: '/dashboard/survey-link/overview',
    comingSoon: true,
  },
  {
    name: 'BioLink',
    icon: 'solar:user-id-linear',
    count: 0,
    color: 'success',
    link: '/dashboard/biolink/overview',
    comingSoon: true,
  },
  {
    name: 'PaymentLink',
    icon: 'solar:wallet-linear',
    count: 0,
    color: 'warning',
    link: '/dashboard/payment-link/overview',
    comingSoon: true,
  },
  {
    name: 'Quiz Link',
    icon: 'solar:document-text-linear',
    count: 0,
    color: 'purple',
    link: '/dashboard/quiz-link/overview',
    comingSoon: true,
  },
])

// Recent Activity
const recentActivity = ref([
  {
    id: 1,
    type: 'link_created',
    title: 'New link created',
    description: 'snap.ly/abc123',
    time: '2 minutes ago',
    icon: 'solar:link-linear',
    color: 'primary',
  },
  {
    id: 2,
    type: 'link_clicked',
    title: 'Link clicked 50 times',
    description: 'snap.ly/xyz789',
    time: '15 minutes ago',
    icon: 'solar:mouse-linear',
    color: 'success',
  },
  {
    id: 3,
    type: 'collection_created',
    title: 'Collection created',
    description: 'Marketing Campaigns',
    time: '1 hour ago',
    icon: 'solar:folder-linear',
    color: 'info',
  },
  {
    id: 4,
    type: 'report_generated',
    title: 'Report generated',
    description: 'Monthly analytics report',
    time: '3 hours ago',
    icon: 'solar:chart-2-linear',
    color: 'warning',
  },
])

// Top Performing Links
const topLinks = ref([
  {
    id: 1,
    shortUrl: 'snap.ly/abc123',
    originalUrl: 'https://example.com/very/long/url/path',
    clicks: 12500,
    change: '+12%',
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    shortUrl: 'snap.ly/xyz789',
    originalUrl: 'https://another-example.com/product/page',
    clicks: 8900,
    change: '+8%',
    createdAt: '2024-01-20',
  },
  {
    id: 3,
    shortUrl: 'snap.ly/def456',
    originalUrl: 'https://third-example.com/blog/post',
    clicks: 6750,
    change: '+5%',
    createdAt: '2024-02-01',
  },
])

// Clicks over time (last 7 days)
const clicksData = ref([
  { day: 'Mon', clicks: 1250 },
  { day: 'Tue', clicks: 1420 },
  { day: 'Wed', clicks: 1380 },
  { day: 'Thu', clicks: 1560 },
  { day: 'Fri', clicks: 1680 },
  { day: 'Sat', clicks: 1890 },
  { day: 'Sun', clicks: 2100 },
])

const maxClicks = computed(() => Math.max(...clicksData.value.map(d => d.clicks)))

const handleLinkCreated = (link: any) => {
  toaster.add({
    title: 'Link Created',
    description: `Link ${link.shortUrl} created successfully!`,
    icon: 'ph:check',
    progress: true,
  })
  // Refresh stats or add to list
}
</script>

<template>
  <div class="space-y-6 py-6">
    <!-- Hero Section -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-8 text-white shadow-xl">
      <div class="relative z-10">
      <div class="flex items-center justify-between">
        <div>
            <BaseHeading
              as="h1"
              size="2xl"
              weight="bold"
              class="text-white mb-2"
            >
              Welcome back{{ user ? `, ${user.firstName || userDisplayName}` : '' }}! 👋
            </BaseHeading>
            <BaseParagraph size="lg" class="text-white/90 mb-4">
              Here's what's happening with your links today
            </BaseParagraph>
            <div class="flex items-center gap-3">
              <BaseButton
                variant="white"
                size="lg"
                @click="showCreateWizard = true"
              >
                <Icon name="solar:add-circle-linear" class="size-5" />
                <span>Create Link</span>
              </BaseButton>
              <BaseButton
                variant="outline"
                size="lg"
                class="border-white/20 text-white hover:bg-white/10"
                to="/dashboard/url-shortener/overview"
              >
                <Icon name="solar:chart-2-linear" class="size-5" />
                <span>View Analytics</span>
              </BaseButton>
            </div>
          </div>
          <div class="hidden lg:block">
            <div class="flex size-32 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
              <Icon name="solar:infinity-linear" class="size-16 text-white/80" />
            </div>
          </div>
        </div>
      </div>
      <!-- Decorative elements -->
      <div class="absolute top-0 end-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 start-0 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
    </div>

    <!-- Main Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <NuxtLink
        v-for="stat in mainStats"
        :key="stat.title"
        :to="stat.link"
        class="group"
      >
        <BaseCard class="p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <div class="flex items-center justify-between mb-4">
            <div
              class="flex size-12 items-center justify-center rounded-xl"
              :class="{
                'bg-primary-100 dark:bg-primary-900/30': stat.color === 'primary',
                'bg-success-100 dark:bg-success-900/30': stat.color === 'success',
                'bg-info-100 dark:bg-info-900/30': stat.color === 'info',
                'bg-warning-100 dark:bg-warning-900/30': stat.color === 'warning',
              }"
            >
              <Icon
                :name="stat.icon"
                class="size-6"
                :class="{
                  'text-primary-600 dark:text-primary-400': stat.color === 'primary',
                  'text-success-600 dark:text-success-400': stat.color === 'success',
                  'text-info-600 dark:text-info-400': stat.color === 'info',
                  'text-warning-600 dark:text-warning-400': stat.color === 'warning',
                }"
              />
            </div>
            <div
              class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
              :class="
                stat.changeType === 'positive'
                  ? 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400'
                  : 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400'
              "
            >
              <Icon
                :name="stat.changeType === 'positive' ? 'solar:arrow-up-linear' : 'solar:arrow-down-linear'"
                class="size-3"
              />
              <span>{{ stat.change }}</span>
            </div>
          </div>
          <BaseText size="sm" weight="medium" class="text-muted-500 dark:text-muted-400 mb-1">
              {{ stat.title }}
          </BaseText>
          <BaseHeading
            as="h3"
            size="2xl"
            weight="bold"
            class="text-muted-900 dark:text-muted-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
          >
              {{ stat.value }}
          </BaseHeading>
        </BaseCard>
      </NuxtLink>
    </div>

    <!-- Quick Actions & Clicks Chart -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Quick Actions -->
      <div class="lg:col-span-1">
        <BaseCard class="p-6">
          <BaseHeading
            as="h3"
            size="md"
            weight="semibold"
            class="text-muted-900 dark:text-muted-100 mb-4"
          >
            Quick Actions
          </BaseHeading>
          <div class="space-y-3">
            <button
              v-for="action in quickActions"
              :key="action.title"
              type="button"
              class="w-full flex items-center gap-4 p-4 rounded-xl border border-muted-200 dark:border-muted-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 group"
              @click="action.action"
            >
              <div
                class="flex size-12 items-center justify-center rounded-xl shrink-0"
                :class="{
                  'bg-primary-100 dark:bg-primary-900/30': action.color === 'primary',
                  'bg-info-100 dark:bg-info-900/30': action.color === 'info',
                  'bg-success-100 dark:bg-success-900/30': action.color === 'success',
                  'bg-warning-100 dark:bg-warning-900/30': action.color === 'warning',
                }"
              >
                <Icon
                  :name="action.icon"
                  class="size-6"
                  :class="{
                    'text-primary-600 dark:text-primary-400': action.color === 'primary',
                    'text-info-600 dark:text-info-400': action.color === 'info',
                    'text-success-600 dark:text-success-400': action.color === 'success',
                    'text-warning-600 dark:text-warning-400': action.color === 'warning',
                  }"
                />
              </div>
              <div class="flex-1 text-left">
                <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {{ action.title }}
                </BaseText>
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-0.5">
                  {{ action.description }}
                </BaseParagraph>
              </div>
              <Icon name="lucide:chevron-right" class="size-4 text-muted-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
            </button>
          </div>
        </BaseCard>
      </div>

      <!-- Clicks Chart -->
      <div class="lg:col-span-2">
        <BaseCard class="p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <BaseHeading
                as="h3"
                size="md"
                weight="semibold"
                class="text-muted-900 dark:text-muted-100 mb-1"
              >
                Clicks Over Time
              </BaseHeading>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                Last 7 days
              </BaseParagraph>
            </div>
            <BaseButton
              size="sm"
              variant="ghost"
              to="/dashboard/url-shortener/overview"
            >
              View All
              <Icon name="lucide:chevron-right" class="size-4" />
            </BaseButton>
          </div>
          <div class="flex items-end justify-between gap-2 h-48">
            <div
              v-for="(data, index) in clicksData"
              :key="index"
              class="flex-1 flex flex-col items-center gap-2 group"
            >
              <div class="relative w-full h-full flex items-end">
                <div
                  class="w-full rounded-t-lg bg-gradient-to-t from-primary-500 to-primary-400 transition-all duration-300 group-hover:from-primary-600 group-hover:to-primary-500 group-hover:shadow-lg"
                  :style="{ height: `${(data.clicks / maxClicks) * 100}%` }"
                >
                  <div class="absolute -top-8 start-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-muted-900 dark:bg-muted-100 text-white dark:text-muted-900 text-xs font-semibold px-2 py-1 rounded whitespace-nowrap">
                    {{ data.clicks.toLocaleString() }} clicks
                  </div>
                </div>
              </div>
              <BaseText size="xs" weight="medium" class="text-muted-500 dark:text-muted-400">
                {{ data.day }}
              </BaseText>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Services & Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Services Overview -->
      <div class="lg:col-span-2">
        <BaseCard class="p-6">
          <div class="flex items-center justify-between mb-6">
            <BaseHeading
              as="h3"
              size="md"
              weight="semibold"
              class="text-muted-900 dark:text-muted-100"
            >
              Services Overview
            </BaseHeading>
            <BaseButton
              size="sm"
              variant="ghost"
            >
            View All
              <Icon name="lucide:chevron-right" class="size-4" />
          </BaseButton>
        </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <NuxtLink
              v-for="service in services"
              :key="service.name"
              :to="service.link"
              class="group"
            >
              <div
                class="p-6 rounded-xl border-2 transition-all duration-300"
                :class="
                  service.comingSoon
                    ? 'border-muted-200 dark:border-muted-700 bg-muted-50 dark:bg-muted-800/50 opacity-60 cursor-not-allowed'
                    : 'border-muted-200 dark:border-muted-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:shadow-lg'
                "
              >
                <div
                  class="flex size-14 items-center justify-center rounded-xl mb-4"
                  :class="{
                    'bg-primary-100 dark:bg-primary-900/30': service.color === 'primary',
                    'bg-info-100 dark:bg-info-900/30': service.color === 'info',
                    'bg-success-100 dark:bg-success-900/30': service.color === 'success',
                    'bg-warning-100 dark:bg-warning-900/30': service.color === 'warning',
                    'bg-purple-100 dark:bg-purple-900/30': service.color === 'purple',
                  }"
                >
                  <Icon
                    :name="service.icon"
                    class="size-7"
                    :class="{
                      'text-primary-600 dark:text-primary-400': service.color === 'primary',
                      'text-info-600 dark:text-info-400': service.color === 'info',
                      'text-success-600 dark:text-success-400': service.color === 'success',
                      'text-warning-600 dark:text-warning-400': service.color === 'warning',
                      'text-purple-600 dark:text-purple-400': service.color === 'purple',
                    }"
                  />
                </div>
                <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100 mb-1">
                  {{ service.name }}
                </BaseText>
                <div class="flex items-center gap-2">
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    {{ service.count.toLocaleString() }} items
                  </BaseText>
                  <BaseTag
                    v-if="service.comingSoon"
                    size="xs"
                    color="muted"
                  >
                    Soon
                  </BaseTag>
                </div>
              </div>
            </NuxtLink>
          </div>
        </BaseCard>
      </div>

      <!-- Recent Activity -->
      <div class="lg:col-span-1">
        <BaseCard class="p-6">
          <div class="flex items-center justify-between mb-6">
            <BaseHeading
              as="h3"
              size="md"
              weight="semibold"
              class="text-muted-900 dark:text-muted-100"
            >
              Recent Activity
            </BaseHeading>
            <BaseButton
              size="sm"
              variant="ghost"
              @click="router.push('/dashboard')"
            >
              View All
              <Icon name="lucide:chevron-right" class="size-4" />
            </BaseButton>
          </div>
        <div class="space-y-4">
          <div
              v-for="activity in recentActivity"
              :key="activity.id"
              class="flex items-start gap-3 p-3 rounded-lg hover:bg-muted-50 dark:hover:bg-muted-800/50 transition-colors"
          >
              <div
                class="flex size-10 items-center justify-center rounded-lg shrink-0"
                :class="{
                  'bg-primary-100 dark:bg-primary-900/30': activity.color === 'primary',
                  'bg-success-100 dark:bg-success-900/30': activity.color === 'success',
                  'bg-info-100 dark:bg-info-900/30': activity.color === 'info',
                  'bg-warning-100 dark:bg-warning-900/30': activity.color === 'warning',
                }"
              >
                <Icon
                  :name="activity.icon"
                  class="size-5"
                  :class="{
                    'text-primary-600 dark:text-primary-400': activity.color === 'primary',
                    'text-success-600 dark:text-success-400': activity.color === 'success',
                    'text-info-600 dark:text-info-400': activity.color === 'info',
                    'text-warning-600 dark:text-warning-400': activity.color === 'warning',
                  }"
                />
              </div>
              <div class="flex-1 min-w-0">
                <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-muted-100 mb-0.5">
                  {{ activity.title }}
                </BaseText>
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mb-1">
                  {{ activity.description }}
                </BaseParagraph>
                <BaseText size="xs" class="text-muted-400 dark:text-muted-500">
                  {{ activity.time }}
                </BaseText>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Top Performing Links -->
    <BaseCard class="p-6">
      <div class="flex items-center justify-between mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-900 dark:text-muted-100"
        >
          Top Performing Links
        </BaseHeading>
        <BaseButton
          size="sm"
          variant="ghost"
          to="/dashboard/url-shortener/links"
        >
          View All
          <Icon name="lucide:chevron-right" class="size-4" />
        </BaseButton>
      </div>
      <div class="space-y-3">
        <div
          v-for="(link, index) in topLinks"
          :key="link.id"
          class="flex items-center gap-4 p-4 rounded-xl border border-muted-200 dark:border-muted-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 group"
        >
          <div class="flex size-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold shrink-0">
            {{ index + 1 }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100 font-mono">
                {{ link.shortUrl }}
              </BaseText>
              <div
                class="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400"
              >
                <Icon name="solar:arrow-up-linear" class="size-3" />
                <span>{{ link.change }}</span>
          </div>
        </div>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 line-clamp-1">
              {{ link.originalUrl }}
            </BaseParagraph>
          </div>
          <div class="flex items-center gap-6 shrink-0">
            <div class="text-right">
              <BaseText size="sm" weight="bold" class="text-muted-900 dark:text-muted-100">
                {{ link.clicks.toLocaleString() }}
              </BaseText>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                clicks
              </BaseParagraph>
            </div>
            <BaseButton
              size="sm"
              variant="ghost"
              to="/dashboard/url-shortener/links"
            >
              <Icon name="lucide:arrow-right" class="size-4" />
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Create Link Wizard -->
    <CreateLinkWizard
      v-model:open="showCreateWizard"
      @created="handleLinkCreated"
    />
  </div>
</template>
