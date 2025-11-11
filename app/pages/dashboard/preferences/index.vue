<script setup lang="ts">
import { computed } from '#imports'
import PreferencesAppearance from '~/components/preferences/PreferencesAppearance.vue'
import PreferencesTeam from '~/components/preferences/PreferencesTeam.vue'
import PreferencesWebhooks from '~/components/preferences/PreferencesWebhooks.vue'
import PreferencesPageHeader from '~/components/preferences/PreferencesPageHeader.vue'
import PreferencesTabsNav from '~/components/preferences/PreferencesTabsNav.vue'
import { usePreferencesTabs } from '~/composables/usePreferencesTabs'
import type { PreferencesTabId } from '~/types/preferences'

definePageMeta({
  title: 'Preferences',
  layout: 'dashboard',
})

const { tabs, activeTab, setActiveTab } = usePreferencesTabs()

const componentMap: Record<PreferencesTabId, any> = {
  appearance: PreferencesAppearance,
  team: PreferencesTeam,
  webhooks: PreferencesWebhooks,
}

const activeComponent = computed(() => componentMap[activeTab.value])

const updateTab = (value: PreferencesTabId) => {
  setActiveTab(value)
}
</script>

<template>
  <div class="space-y-6 py-6">
    <PreferencesPageHeader />

    <PreferencesTabsNav
      :tabs="tabs"
      :model-value="activeTab"
      @update:model-value="updateTab"
    />

    <div class="mt-6">
      <Suspense>
        <component :is="activeComponent" />
      </Suspense>
    </div>
  </div>
</template>

