import { computed, useState } from '#imports'
import type { PreferencesTab, PreferencesTabId } from '~/types/preferences'

const TABS: PreferencesTab[] = [
  {
    id: 'appearance',
    label: 'Appearance',
    icon: 'solar:palette-linear',
  },
  {
    id: 'domains',
    label: 'Domains',
    icon: 'solar:global-linear',
  },
  {
    id: 'permissions',
    label: 'Permissions',
    icon: 'solar:shield-check-linear',
  },
  {
    id: 'team',
    label: 'Team',
    icon: 'ph:users',
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    icon: 'ph:code',
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
