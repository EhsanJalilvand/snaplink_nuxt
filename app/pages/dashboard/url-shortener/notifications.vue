<script setup lang="ts">
import { callOnce, computed } from '#imports'
import ShortenerNotificationsHeader from '~/components/url-shortener/ShortenerNotificationsHeader.vue'
import ShortenerNotificationsLinkClicks from '~/components/url-shortener/ShortenerNotificationsLinkClicks.vue'
import ShortenerNotificationsLinkStatus from '~/components/url-shortener/ShortenerNotificationsLinkStatus.vue'
import ShortenerNotificationsReports from '~/components/url-shortener/ShortenerNotificationsReports.vue'
import { useUrlShortenerNotifications } from '~/composables/useUrlShortenerNotifications'
import type { ShortenerNotificationSettings } from '~/types/url-shortener'

definePageMeta({
  title: 'Notifications',
  layout: 'dashboard',
})

const {
  settings,
  isLoading,
  isSaving,
  error,
  fetchSettings,
  setThreshold,
  setDailySummaryTime,
  setWeeklyReportDay,
  toggleChannel,
  saveSettings,
  linkClickEnabled,
  dailySummaryEnabled,
  weeklyReportEnabled,
} = useUrlShortenerNotifications()

await callOnce(() => fetchSettings())

const weekDays = [
  { label: 'Monday', value: 'monday' },
  { label: 'Tuesday', value: 'tuesday' },
  { label: 'Wednesday', value: 'wednesday' },
  { label: 'Thursday', value: 'thursday' },
  { label: 'Friday', value: 'friday' },
  { label: 'Saturday', value: 'saturday' },
  { label: 'Sunday', value: 'sunday' },
]

const linkClickSettings = computed(() => settings.value.linkClick)
const linkExpiredSettings = computed(() => settings.value.linkExpired)
const linkLimitSettings = computed(() => settings.value.linkReachedLimit)
const dailySummarySettings = computed(() => settings.value.dailySummary)
const weeklyReportSettings = computed(() => settings.value.weeklyReport)

const handleToggleChannel = (
  section: keyof ShortenerNotificationSettings,
  channel: 'email' | 'webhook',
  value: boolean,
) => {
  toggleChannel(section, channel, value)
}
</script>

<template>
  <div class="space-y-6 py-6">
    <ShortenerNotificationsHeader :is-saving="isSaving" @save="saveSettings" />

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached notification preferences
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

    <ShortenerNotificationsLinkClicks
      :email="linkClickSettings.email"
      :webhook="linkClickSettings.webhook"
      :threshold="linkClickSettings.threshold"
      @update:email="(value) => handleToggleChannel('linkClick', 'email', value)"
      @update:webhook="(value) => handleToggleChannel('linkClick', 'webhook', value)"
      @update:threshold="setThreshold"
    />

    <ShortenerNotificationsLinkStatus
      :expired="linkExpiredSettings"
      :limit="linkLimitSettings"
      @update:expired-email="(value) => handleToggleChannel('linkExpired', 'email', value)"
      @update:limit-email="(value) => handleToggleChannel('linkReachedLimit', 'email', value)"
      @update:limit-webhook="(value) => handleToggleChannel('linkReachedLimit', 'webhook', value)"
    />

    <ShortenerNotificationsReports
      :daily-email="dailySummarySettings.email"
      :daily-time="dailySummarySettings.time"
      :weekly-email="weeklyReportSettings.email"
      :weekly-day="weeklyReportSettings.day"
      :weekdays="weekDays"
      @update:daily-email="(value) => handleToggleChannel('dailySummary', 'email', value)"
      @update:daily-time="setDailySummaryTime"
      @update:weekly-email="(value) => handleToggleChannel('weeklyReport', 'email', value)"
      @update:weekly-day="setWeeklyReportDay"
    />
  </div>
</template>

