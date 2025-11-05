<script setup lang="ts">
definePageMeta({
  title: 'Preferences',
  layout: 'dashboard',
})

const activeTab = ref<'appearance' | 'team' | 'webhooks'>('appearance')

const tabs = [
  {
    id: 'appearance' as const,
    label: 'Appearance',
    icon: 'solar:palette-linear',
  },
  {
    id: 'team' as const,
    label: 'Team',
    icon: 'solar:users-group-linear',
  },
  {
    id: 'webhooks' as const,
    label: 'Webhooks',
    icon: 'solar:api-linear',
  },
]
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
          Preferences
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Manage your workspace preferences and settings
        </BaseParagraph>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="border-muted-200 dark:border-muted-800 border-b">
      <div class="flex gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="relative px-4 py-3 text-sm font-medium transition-colors duration-200"
          :class="
            activeTab === tab.id
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-muted-500 dark:text-muted-400 hover:text-muted-700 dark:hover:text-muted-300'
          "
          @click="activeTab = tab.id"
        >
          <div class="flex items-center gap-2">
            <Icon :name="tab.icon" class="size-4" />
            <span>{{ tab.label }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="mt-6">
      <PreferencesAppearance v-if="activeTab === 'appearance'" />
      <PreferencesTeam v-if="activeTab === 'team'" />
      <PreferencesWebhooks v-if="activeTab === 'webhooks'" />
    </div>
  </div>
</template>

