<script setup lang="ts">
import { computed, watch } from '#imports'
import PreferencesAppearance from '~/components/preferences/PreferencesAppearance.vue'
import PreferencesDomains from '~/components/preferences/PreferencesDomains.vue'
import PreferencesPermissions from '~/components/preferences/PreferencesPermissions.vue'
import PreferencesTeam from '~/components/preferences/PreferencesTeam.vue'
import PreferencesWebhooks from '~/components/preferences/PreferencesWebhooks.vue'
import PreferencesTabsNav from '~/components/preferences/PreferencesTabsNav.vue'
import { usePreferencesTabs } from '~/composables/usePreferencesTabs'
import type { PreferencesTabId } from '~/types/preferences'

const props = defineProps<{
  workspaceId?: string | null
}>()

const { tabs, activeTab, setActiveTab } = usePreferencesTabs()

const hasWorkspace = computed(() => !!props.workspaceId)

// Debug: Log workspaceId prop
watch(() => props.workspaceId, (newId) => {
  if (import.meta.dev) {
    console.log('[WorkspacePreferences] workspaceId prop changed:', newId)
  }
}, { immediate: true })

const componentMap: Record<PreferencesTabId, any> = {
  appearance: PreferencesAppearance,
  domains: PreferencesDomains,
  permissions: PreferencesPermissions,
  team: PreferencesTeam,
  webhooks: PreferencesWebhooks,
}

const activeComponent = computed(() => componentMap[activeTab.value])

const updateTab = (value: PreferencesTabId) => {
  setActiveTab(value)
}
</script>

<template>
  <div
    v-if="hasWorkspace"
    class="space-y-6"
  >
    <PreferencesTabsNav
      :tabs="tabs"
      :model-value="activeTab"
      @update:model-value="updateTab"
    />

    <div class="mt-6">
      <Suspense>
        <component
          :is="activeComponent"
          :workspace-id="workspaceId"
          :key="`${activeTab}-${workspaceId || 'none'}`"
        />
      </Suspense>
    </div>
  </div>
</template>
