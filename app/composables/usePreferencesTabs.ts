import { computed, useState } from '#imports'
import type { PreferencesTab, PreferencesTabId } from '~/types/preferences'
import { useTranslations } from './useTranslations'

export const usePreferencesTabs = () => {
  const activeTab = useState<PreferencesTabId>('snaplink:preferences-active-tab', () => 'appearance')
  const { t } = useTranslations()

  // Make tabs reactive to translations
  const tabs = computed<PreferencesTab[]>(() => {
    // Access t.value to make it reactive
    const translations = t.value
    return [
      {
        id: 'appearance',
        label: translations.preferences?.appearance || 'Appearance',
        icon: 'solar:palette-linear',
      },
      {
        id: 'domains',
        label: translations.preferences?.domains || 'Domains',
        icon: 'solar:global-linear',
      },
      {
        id: 'permissions',
        label: translations.preferences?.permissions || 'Permissions',
        icon: 'solar:shield-check-linear',
      },
      {
        id: 'team',
        label: translations.preferences?.team || 'Team',
        icon: 'ph:users',
      },
      {
        id: 'webhooks',
        label: translations.preferences?.webhooks || 'Webhooks',
        icon: 'ph:code',
      },
    ]
  })

  const setActiveTab = (tabId: PreferencesTabId) => {
    activeTab.value = tabId
  }

  return {
    tabs,
    activeTab,
    setActiveTab,
  }
}
