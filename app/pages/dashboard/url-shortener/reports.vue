<script setup lang="ts">
import ShortenerReportsHeader from '~/components/url-shortener/ShortenerReportsHeader.vue'
import ShortenerReportsNav from '~/components/url-shortener/ShortenerReportsNav.vue'
import { useUrlShortenerReports } from '~/composables/useUrlShortenerReports'

definePageMeta({
  title: 'Advanced Analytics',
  layout: 'dashboard',
})

const {
  sections,
  period,
  activeSection,
  reportType,
  selectedIds,
  selectedSummary,
  setSection,
  setPeriod,
  navigateBack,
} = useUrlShortenerReports()

const periods = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last year', value: '1y' },
]
</script>

<template>
  <div class="space-y-6 py-6">
    <ShortenerReportsHeader
      :summary="selectedSummary"
      :period="period"
      :periods="periods"
      @update:period="setPeriod"
      @back="navigateBack"
    />

    <ShortenerReportsNav
      :sections="sections"
      :active="activeSection"
      @change="setSection"
    />

    <!-- Section Content -->
    <div class="mt-6">
      <LazyAnalyticsOverview
        v-if="activeSection === 'overview'"
        :selected-ids="selectedIds"
        :report-type="reportType"
        :period="period"
      />
      <LazyAnalyticsGeographicInsights
        v-if="activeSection === 'geographic'"
        :selected-ids="selectedIds"
        :report-type="reportType"
        :period="period"
      />
      <LazyAnalyticsDeviceTechnology
        v-if="activeSection === 'device'"
        :selected-ids="selectedIds"
        :report-type="reportType"
        :period="period"
      />
      <LazyAnalyticsReferralSource
        v-if="activeSection === 'referral'"
        :selected-ids="selectedIds"
        :report-type="reportType"
        :period="period"
      />
      <LazyAnalyticsUserBehavior
        v-if="activeSection === 'behavior'"
        :selected-ids="selectedIds"
        :report-type="reportType"
        :period="period"
      />
      <LazyAnalyticsGeoDevice
        v-if="activeSection === 'geodevice'"
        :selected-ids="selectedIds"
        :report-type="reportType"
        :period="period"
      />
    </div>
  </div>
</template>

