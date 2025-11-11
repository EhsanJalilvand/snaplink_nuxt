<script setup lang="ts">
import { callOnce, computed, onMounted, ref } from '#imports'
import CreateLinkWizard from '~/components/url-shortener/CreateLinkWizard.vue'
import DashboardHeroCard from '~/components/dashboard/DashboardHeroCard.vue'
import DashboardStatsGrid from '~/components/dashboard/DashboardStatsGrid.vue'
import DashboardQuickActions from '~/components/dashboard/DashboardQuickActions.vue'
import DashboardClicksChart from '~/components/dashboard/DashboardClicksChart.vue'
import DashboardServicesOverview from '~/components/dashboard/DashboardServicesOverview.vue'
import DashboardRecentActivity from '~/components/dashboard/DashboardRecentActivity.vue'
import DashboardTopLinks from '~/components/dashboard/DashboardTopLinks.vue'
import { useDashboardOverview } from '~/composables/useDashboardOverview'
import type { DashboardQuickAction, DashboardTopLink } from '~/types/dashboard'

definePageMeta({
  title: 'Dashboard - SnapLink',
  layout: 'dashboard',
})

const router = useRouter()
const { user, userDisplayName, refreshUser } = useUserData()
const toaster = useNuiToasts()

const {
  stats,
  services,
  activities,
  topLinks,
  clicks,
  quickActions,
  maxClicks,
  isLoading,
  error,
  fetchOverview,
} = useDashboardOverview()

callOnce(() => fetchOverview())

onMounted(async () => {
  await refreshUser()
})

const showCreateWizard = ref(false)

const heroName = computed(() => user.value?.firstName || userDisplayName.value || '')

const handleQuickAction = (action: DashboardQuickAction) => {
  if (action.type === 'openWizard') {
    showCreateWizard.value = true
    return
  }

  if (action.type === 'route' && action.to) {
    router.push(action.to)
  }
}

const handleServicesViewAll = () => {
  router.push('/dashboard/url-shortener/overview')
}

const handleActivityViewAll = () => {
  router.push('/dashboard/url-shortener/overview')
}

const handleTopLinksViewAll = () => {
  router.push('/dashboard/url-shortener/links')
}

const handleTopLinkOpen = (link: DashboardTopLink) => {
  router.push({
    path: '/dashboard/url-shortener/links',
    query: {
      search: link.shortUrl,
    },
  })
}

const handleLinkCreated = async (payload: { shortUrl: string }) => {
  toaster.add({
    title: 'Link created',
    description: `Link ${payload.shortUrl} created successfully!`,
    icon: 'ph:check',
    color: 'success',
    progress: true,
  })
  await fetchOverview({ force: true })
}
</script>

<template>
  <div class="space-y-6 py-6">
    <DashboardHeroCard
      :user-name="heroName"
      @create-link="showCreateWizard = true"
      @view-analytics="router.push('/dashboard/url-shortener/overview')"
    />

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached dashboard data
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

    <DashboardStatsGrid :stats="stats" :is-loading="isLoading" />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <DashboardQuickActions
        class="lg:col-span-1"
        :actions="quickActions"
        :is-loading="isLoading"
        @select="handleQuickAction"
      />
      <DashboardClicksChart
        class="lg:col-span-2"
        :points="clicks"
        :max-value="maxClicks"
        :is-loading="isLoading"
      />
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <DashboardServicesOverview
        class="lg:col-span-2"
        :services="services"
        :is-loading="isLoading"
        view-all-to="/dashboard/url-shortener/overview"
        @view-all="handleServicesViewAll"
      />
      <DashboardRecentActivity
        :activities="activities"
        :is-loading="isLoading"
        @view-all="handleActivityViewAll"
      />
    </div>

    <DashboardTopLinks
      :links="topLinks"
      :is-loading="isLoading"
      @view-all="handleTopLinksViewAll"
      @open-link="handleTopLinkOpen"
    />

    <CreateLinkWizard
      v-model:open="showCreateWizard"
      @created="handleLinkCreated"
    />
  </div>
</template>
