<script setup lang="ts">
import { callOnce, computed } from '#imports'
import { useAccountSettings } from '~/composables/useAccountSettings'

definePageMeta({
  title: 'Account Settings',
  layout: 'dashboard',
})

const { user: sharedUser, userDisplayName } = useUserData()

const {
  twoFactor,
  isLoading,
  error,
  overview,
  statusLabel,
  statusColor,
  fetchTwoFactorStatus,
} = useAccountSettings()

await callOnce(() => fetchTwoFactorStatus())

const avatarUrl = computed(() => sharedUser.value?.avatar ?? null)
const email = computed(() => sharedUser.value?.email ?? null)
const emailVerified = computed(() => sharedUser.value?.emailVerified ?? false)
</script>

<template>
  <div class="space-y-8 py-6">
    <SettingsOverviewHeader
      title="Account Settings"
      subtitle="Manage personal information, review security posture, and streamline workspace preferences."
    />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <SettingsProfileSummary
        class="lg:col-span-2"
        :display-name="userDisplayName"
        :email="email"
        :avatar-url="avatarUrl"
        :email-verified="emailVerified"
      />

      <SettingsSecuritySummary
        :two-factor-enabled="twoFactor.enabled"
        :is-loading="isLoading"
        :status-label="statusLabel"
        :status-color="statusColor"
      />
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <SettingsSummaryGrid
        title="Profile management"
        description="Customize how you show up across SnapLink."
        :links="overview.profile"
      />
      <SettingsSummaryGrid
        title="Security controls"
        description="Stay ahead of account threats with layered defenses."
        :links="overview.security"
      />
    </div>

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached security status
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>
  </div>
</template>
