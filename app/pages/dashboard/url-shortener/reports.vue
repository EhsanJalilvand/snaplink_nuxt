<script setup lang="ts">
definePageMeta({
  title: 'Advanced Analytics',
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()

// Get selected items from query params
const reportType = computed(() => route.query.type as 'links' | 'collections' || 'links')
const selectedIds = computed(() => {
  const ids = route.query.ids as string || ''
  return ids.split(',').filter(Boolean)
})

// Report data - TODO: Replace with API call based on selectedIds
const reportData = ref({
  type: reportType.value,
  selectedIds: selectedIds.value,
  period: '30d',
})

const activeSection = ref<'overview' | 'geographic' | 'device' | 'referral' | 'behavior' | 'geodevice'>('overview')

const sections = [
  {
    id: 'overview' as const,
    label: 'Overview',
    icon: 'solar:chart-2-linear',
  },
  {
    id: 'geographic' as const,
    label: 'Geographic Insights',
    icon: 'solar:map-point-linear',
  },
  {
    id: 'device' as const,
    label: 'Device & Technology',
    icon: 'solar:smartphone-linear',
  },
  {
    id: 'referral' as const,
    label: 'Referral & Source',
    icon: 'solar:link-linear',
  },
  {
    id: 'behavior' as const,
    label: 'User Behavior',
    icon: 'solar:users-group-linear',
  },
  {
    id: 'geodevice' as const,
    label: 'Geo-Device Insights',
    icon: 'solar:global-linear',
  },
]

const period = ref('30d')
const periods = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last year', value: '1y' },
]

// Get selected items info
const selectedItemsInfo = computed(() => {
  if (reportType.value === 'links') {
    return `${selectedIds.value.length} link(s) selected`
  }
  return `${selectedIds.value.length} collection(s) selected`
})
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
          Advanced Analytics
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          {{ selectedItemsInfo }} • Detailed insights and analytics
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-3">
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
        <BaseButton
          variant="outline"
          size="sm"
          @click="router.back()"
        >
          <Icon name="lucide:arrow-left" class="size-4" />
          <span>Back</span>
        </BaseButton>
      </div>
    </div>

    <!-- Section Navigation -->
    <div class="border-b border-muted-200 dark:border-muted-800">
      <div class="flex gap-2 overflow-x-auto">
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          class="relative px-4 py-3 text-sm font-medium transition-colors duration-200 whitespace-nowrap"
          :class="
            activeSection === section.id
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-muted-500 dark:text-muted-400 hover:text-muted-700 dark:hover:text-muted-300'
          "
          @click="activeSection = section.id"
        >
          <div class="flex items-center gap-2">
            <Icon :name="section.icon" class="size-4" />
            <span>{{ section.label }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Section Content -->
    <div class="mt-6">
      <AnalyticsOverview
        v-if="activeSection === 'overview'"
        :selected-ids="selectedIds"
        :report-type="reportType"
        :period="period"
      />
      <AnalyticsGeographicInsights
        v-if="activeSection === 'geographic'"
        :selected-ids="selectedIds"
        :report-type="reportType"
        :period="period"
      />
      <AnalyticsDeviceTechnology
        v-if="activeSection === 'device'"
        :selected-ids="selectedIds"
        :report-type="reportType"
        :period="period"
      />
      <AnalyticsReferralSource
        v-if="activeSection === 'referral'"
        :selected-ids="selectedIds"
        :report-type="reportType"
        :period="period"
      />
      <AnalyticsUserBehavior
        v-if="activeSection === 'behavior'"
        :selected-ids="selectedIds"
        :report-type="reportType"
        :period="period"
      />
      <AnalyticsGeoDevice
        v-if="activeSection === 'geodevice'"
        :selected-ids="selectedIds"
        :report-type="reportType"
        :period="period"
      />
    </div>
  </div>
</template>

