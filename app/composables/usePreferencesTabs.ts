import { computed, useState } from '#imports'
import type { PreferencesTab, PreferencesTabId } from '~/types/preferences'

const TABS: PreferencesTab[] = [
  {
    id: 'appearance',
    label: 'Appearance',
    icon: 'solar:palette-linear',
  },
  {
    id: 'team',
    label: 'Team',
    icon: 'solar:users-group-linear',
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    icon: 'solar:api-linear',
  },
]

export const usePreferencesTabs = () => {
  const activeTab = useState<PreferencesTabId>('snaplink:preferences-active-tab', () => 'appearance')

  const tabs = computed(() => TABS)

  const setActiveTab = (tabId: PreferencesTabId) => {
    activeTab.value = tabId
  }

  return {
    tabs,
    activeTab,
    setActiveTab,
  }
}
