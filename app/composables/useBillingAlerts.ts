import { computed, toRefs, useState } from '#imports'
import type {
  BillingAlertSettings,
  BillingAlertsResponse,
  BillingLowBalanceAlertSettings,
  BillingNotificationChannels,
  BillingSpendingLimitSettings,
} from '~/types/billing'
import { useApi } from './useApi'
import { useNuiToasts } from '#imports'
import { useSecurity } from './useSecurity'

interface BillingAlertsState {
  settings: BillingAlertSettings | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

const FALLBACK_SETTINGS: BillingAlertSettings = {
  lowBalanceAlert: {
    enabled: true,
    threshold: 50,
    email: true,
    webhook: false,
  },
  spendingLimit: {
    enabled: false,
    monthlyLimit: 500,
  },
  billingAlerts: {
    email: true,
    webhook: false,
  },
}

const initialState = (): BillingAlertsState => ({
  settings: null,
  isLoading: false,
  isSaving: false,
  error: null,
})

export const useBillingAlerts = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const security = useSecurity()
  const state = useState<BillingAlertsState>('snaplink:billing-alerts', initialState)

  const deepClone = <T>(input: T): T => {
    if (typeof structuredClone === 'function') {
      return structuredClone(input)
    }
    return JSON.parse(JSON.stringify(input)) as T
  }

  const setSettings = (settings: BillingAlertSettings) => {
    state.value.settings = deepClone(settings)
    state.value.error = null
  }

  const fetchAlerts = async () => {
    if (state.value.isLoading) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<BillingAlertsResponse>('/billing/alerts', {
        base: 'gateway',
        validate: (payload): payload is BillingAlertsResponse =>
          typeof payload === 'object' && payload !== null && 'data' in payload,
        retry: 1,
        timeout: 15000,
        quiet: true,
      })

      if (response?.data) {
        setSettings(response.data)
      } else {
        setSettings(FALLBACK_SETTINGS)
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useBillingAlerts] Falling back to static alert settings', error)
      }
      state.value.error = 'Unable to load billing alerts. Showing cached data.'
      setSettings(FALLBACK_SETTINGS)
    } finally {
      state.value.isLoading = false
    }
  }

  const sanitizeNumber = (value: number) => {
    const safe = Number.parseFloat(String(value))
    return Number.isFinite(safe) ? safe : 0
  }

  const updateLowBalance = (payload: Partial<BillingLowBalanceAlertSettings>) => {
    if (!state.value.settings) {
      return
    }
    state.value.settings.lowBalanceAlert = {
      ...state.value.settings.lowBalanceAlert,
      ...payload,
      threshold: payload.threshold !== undefined ? sanitizeNumber(payload.threshold) : state.value.settings.lowBalanceAlert.threshold,
    }
  }

  const updateSpendingLimit = (payload: Partial<BillingSpendingLimitSettings>) => {
    if (!state.value.settings) {
      return
    }
    state.value.settings.spendingLimit = {
      ...state.value.settings.spendingLimit,
      ...payload,
      monthlyLimit: payload.monthlyLimit !== undefined ? sanitizeNumber(payload.monthlyLimit) : state.value.settings.spendingLimit.monthlyLimit,
    }
  }

  const updateBillingAlerts = (payload: Partial<BillingNotificationChannels>) => {
    if (!state.value.settings) {
      return
    }
    state.value.settings.billingAlerts = {
      ...state.value.settings.billingAlerts,
      ...payload,
    }
  }

  const saveSettings = async () => {
    if (!state.value.settings || state.value.isSaving) {
      return
    }

    state.value.isSaving = true

    try {
      await api.post('/billing/alerts', state.value.settings, {
        base: 'gateway',
        quiet: true,
        retry: 1,
        timeout: 15000,
      })

      toasts.add({
        title: 'Alert settings saved',
        description: 'Your alert preferences are now up to date.',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })
    } catch (error) {
      if (import.meta.dev) {
        console.error('[useBillingAlerts] Failed to save alert settings', error)
      }
      toasts.add({
        title: 'Save failed',
        description: security.escapeHtml((error as Error)?.message ?? 'Unable to persist alert settings.'),
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
    } finally {
      state.value.isSaving = false
    }
  }

  const settings = computed(() => state.value.settings ?? FALLBACK_SETTINGS)

  return {
    ...toRefs(state.value),
    settings,
    fetchAlerts,
    updateLowBalance,
    updateSpendingLimit,
    updateBillingAlerts,
    saveSettings,
  }
}
