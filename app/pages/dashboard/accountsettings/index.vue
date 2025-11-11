<script setup lang="ts">
import { computed } from '#imports'
import { useAccountSettings } from '~/composables/useAccountSettings'

definePageMeta({
  title: 'Account Settings',
  layout: 'dashboard',
})

const { user: sharedUser, userDisplayName } = useUserData()

const { overview } = useAccountSettings()

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

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SettingsProfileSummary
        class="lg:col-span-2"
        :display-name="userDisplayName"
        :email="email"
        :avatar-url="avatarUrl"
        :email-verified="emailVerified"
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
  </div>
</template>
