import type { AccountSettingsOverview, SettingsSummaryLink, TwoFactorStatus } from '~/types/settings'
import { computed, toRefs, useState } from '#imports'
import { useApi } from './useApi'

interface AccountSettingsState {
  twoFactor: TwoFactorStatus
  isLoading: boolean
  error: string | null
  overview: AccountSettingsOverview
}

const FALLBACK_TWO_FACTOR: TwoFactorStatus = {
  enabled: false,
}

const PROFILE_LINKS: SettingsSummaryLink[] = [
  {
    label: 'Profile picture',
    description: 'Update your avatar and public photo',
    to: '/dashboard/accountsettings/profile',
    icon: 'solar:user-rounded-linear',
  },
  {
    label: 'Personal information',
    description: 'Edit your name and contact details',
    to: '/dashboard/accountsettings/profile',
    icon: 'solar:pen-linear',
  },
]

const SECURITY_LINKS: SettingsSummaryLink[] = [
  {
    label: 'Password',
    description: 'Change your password and recovery options',
    to: '/dashboard/accountsettings/security',
    icon: 'solar:shield-keyhole-linear',
  },
  {
    label: 'Two-factor authentication',
    description: 'Add another layer of security with OTP codes',
    to: '/dashboard/accountsettings/security',
    icon: 'solar:lock-password-linear',
  },
]

function initialState(): AccountSettingsState {
  return {
    twoFactor: FALLBACK_TWO_FACTOR,
    isLoading: false,
    error: null,
    overview: {
      profile: PROFILE_LINKS,
      security: SECURITY_LINKS,
    },
  }
}

export const useAccountSettings = () => {
  const api = useApi()
  const state = useState<AccountSettingsState>('snaplink:account-settings', initialState)

  async function fetchTwoFactorStatus() {
    if (state.value.isLoading) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<{ success?: boolean; enabled?: boolean; updated_at?: string }>(
        '/auth/two-factor/status',
        {
          path: '/auth/two-factor/status',
          base: 'internal',
          requiresAuth: true,
          quiet: true,
          retry: 0,
          timeout: 7000,
        },
      )

      const enabled = Boolean(response?.enabled)
      state.value.twoFactor = {
        enabled,
        lastUpdated: response?.updated_at,
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useAccountSettings] Unable to fetch 2FA status', error)
      }
      state.value.error = 'Unable to verify 2FA status. Showing cached information.'
      state.value.twoFactor = {
        ...state.value.twoFactor,
        enabled: FALLBACK_TWO_FACTOR.enabled,
      }
    } finally {
      state.value.isLoading = false
    }
  }

  const statusLabel = computed(() =>
    state.value.twoFactor.enabled ? 'Two-factor authentication is enabled' : 'Two-factor authentication is disabled',
  )

  const statusColor = computed(() => (state.value.twoFactor.enabled ? 'success' : 'warning'))

  return {
    ...toRefs(state.value),
    statusLabel,
    statusColor,
    fetchTwoFactorStatus,
  }
}
