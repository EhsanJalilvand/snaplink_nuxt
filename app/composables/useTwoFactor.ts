import { computed, reactive, ref } from '#imports'
import { useApi } from './useApi'
import { useSecurity } from './useSecurity'
import { useNuiToasts } from '#imports'
import type {
  TwoFactorStatusResponse,
  TwoFactorSetupResponse,
  TwoFactorTogglePayload,
  TwoFactorToggleResponse,
  TwoFactorVerifyPayload,
  TwoFactorVerifyResponse,
} from '~/types/security'

export type TwoFactorStep = 0 | 1 | 2

interface TwoFactorWizardState {
  qrCode: string
  secret: string
  flowId: string
  csrfToken: string
  verifyCode: string
}

export const useTwoFactor = () => {
  const api = useApi()
  const security = useSecurity()
  const toasts = useNuiToasts()

  const status = ref<{ enabled: boolean; lastUpdated?: string }>({ enabled: false })
  const isStatusLoading = ref(false)
  const statusError = ref<string | null>(null)

  const wizardOpen = ref(false)
  const wizardStep = ref<TwoFactorStep>(0)
  const wizardLoading = ref(false)
  const wizardErrors = reactive<Record<string, string>>({})

  const wizardState = reactive<TwoFactorWizardState>({
    qrCode: '',
    secret: '',
    flowId: '',
    csrfToken: '',
    verifyCode: '',
  })

  const resetWizard = () => {
    wizardStep.value = 0
    wizardLoading.value = false
    Object.assign(wizardErrors, {})
    Object.assign(wizardState, {
      qrCode: '',
      secret: '',
      flowId: '',
      csrfToken: '',
      verifyCode: '',
    })
  }

  const closeWizard = () => {
    wizardOpen.value = false
    resetWizard()
  }

  const fetchStatus = async () => {
    if (isStatusLoading.value) {
      return
    }

    isStatusLoading.value = true
    statusError.value = null

    try {
      const response = await api.get<TwoFactorStatusResponse>('/auth/two-factor/status', {
        path: '/auth/two-factor/status',
        base: 'internal',
        requiresAuth: true,
        quiet: true,
        retry: 0,
        timeout: 7000,
      })

      if (response?.success) {
        status.value = {
          enabled: response.enabled,
          lastUpdated: response.updated_at,
        }
      } else {
        status.value = { enabled: false }
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useTwoFactor] Failed to fetch status', error)
      }
      statusError.value = 'Unable to verify 2FA status. Showing cached value.'
      status.value = { enabled: false }
    } finally {
      isStatusLoading.value = false
    }
  }

  const startSetup = async () => {
    wizardLoading.value = true
    wizardErrors.verifyCode = ''

    try {
      const response = await api.post<TwoFactorSetupResponse>('/auth/two-factor/setup', {}, {
        path: '/auth/two-factor/setup',
        base: 'internal',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
      })

      if (response?.success) {
        if (response.configured) {
          toasts.add({
            title: 'Already enabled',
            description: 'Two-factor authentication is already active for this account.',
            icon: 'ph:info',
            progress: true,
          })
          await fetchStatus()
          return
        }

        if (response.qrCode && response.flowId && response.csrfToken) {
          Object.assign(wizardState, {
            qrCode: response.qrCode,
            secret: response.secret ?? '',
            flowId: response.flowId,
            csrfToken: response.csrfToken,
            verifyCode: '',
          })

          wizardStep.value = 0
          wizardOpen.value = true
        } else {
          throw new Error('Failed to initialize two-factor setup. Please retry.')
        }
      }
    } catch (error: any) {
      toasts.add({
        title: 'Setup failed',
        description: security.escapeHtml(error?.message ?? 'Could not start two-factor setup.'),
        icon: 'ph:warning',
        progress: true,
      })
    } finally {
      wizardLoading.value = false
    }
  }

  const verifyCode = async () => {
    if (!wizardState.verifyCode || wizardState.verifyCode.length !== 6) {
      wizardErrors.verifyCode = 'Please enter a valid 6-digit code'
      return
    }

    wizardLoading.value = true
    wizardErrors.verifyCode = ''

    try {
      const payload: TwoFactorVerifyPayload = {
        flow: wizardState.flowId,
        code: wizardState.verifyCode,
        csrf_token: wizardState.csrfToken,
      }

      const response = await api.post<TwoFactorVerifyResponse, TwoFactorVerifyPayload>('/auth/two-factor/verify', payload, {
        path: '/auth/two-factor/verify',
        base: 'internal',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
      })

      if (response?.success) {
        toasts.add({
          title: 'Two-factor enabled',
          description: 'Authenticator codes are now required on sign-in.',
          icon: 'ph:check',
          progress: true,
        })

        wizardStep.value = 2
        await fetchStatus()

        setTimeout(() => {
          closeWizard()
        }, 2400)
      } else {
        wizardErrors.verifyCode = 'Verification code was rejected. Try again.'
      }
    } catch (error: any) {
      wizardErrors.verifyCode = security.escapeHtml(error?.message ?? 'Failed to verify code.')
      toasts.add({
        title: 'Verification failed',
        description: wizardErrors.verifyCode,
        icon: 'ph:warning',
        progress: true,
      })
    } finally {
      wizardLoading.value = false
    }
  }

  const disable = async () => {
    isStatusLoading.value = true
    try {
      const payload: TwoFactorTogglePayload = { enabled: false }
      const response = await api.put<TwoFactorToggleResponse, TwoFactorTogglePayload>('/auth/two-factor', payload, {
        path: '/auth/two-factor',
        base: 'internal',
        requiresAuth: true,
        quiet: false, // Don't be quiet so we can see errors
        timeout: 7000,
      })

      if (response?.success) {
        // Immediately update local state optimistically
        status.value.enabled = false
        
        // Fetch actual status from backend to verify
        await fetchStatus()
        
        // Check if status is still enabled after fetch (backend didn't actually disable it)
        if (status.value.enabled) {
          toasts.add({
            title: 'Disable failed',
            description: 'Two-factor authentication could not be disabled. Please try again or contact support.',
            icon: 'ph:warning',
            progress: true,
          })
          return
        }
        
        toasts.add({
          title: 'Two-factor disabled',
          description: 'Authenticator prompts have been turned off.',
          icon: 'ph:check',
          progress: true,
        })
      } else {
        // Response was not successful
        await fetchStatus()
        toasts.add({
          title: 'Disable failed',
          description: 'Could not disable 2FA. Please try again.',
          icon: 'ph:warning',
          progress: true,
        })
      }
    } catch (error: any) {
      // Fetch status to ensure UI reflects actual state
      await fetchStatus()
      
      toasts.add({
        title: 'Disable failed',
        description: security.escapeHtml(error?.message ?? 'Could not disable 2FA. Please try again.'),
        icon: 'ph:warning',
        progress: true,
      })
    } finally {
      isStatusLoading.value = false
    }
  }

  const copySecret = async () => {
    if (!wizardState.secret) {
      return
    }

    try {
      await navigator.clipboard.writeText(wizardState.secret)
      toasts.add({
        title: 'Copied to clipboard',
        description: 'TOTP secret copied successfully.',
        icon: 'ph:clipboard-text',
        progress: true,
      })
    } catch (error) {
      toasts.add({
        title: 'Copy failed',
        description: 'Unable to copy secret. Copy it manually instead.',
        icon: 'ph:warning',
        progress: true,
      })
    }
  }

  const maskedSecret = computed(() => {
    if (!wizardState.secret) {
      return ''
    }
    return wizardState.secret.replace(/.(?=.{4})/g, '*')
  })

  return {
    status,
    isStatusLoading,
    statusError,
    fetchStatus,
    startSetup,
    disable,
    wizard: {
      open: wizardOpen,
      step: wizardStep,
      loading: wizardLoading,
      errors: wizardErrors,
      state: wizardState,
      maskedSecret,
    },
    verifyCode,
    closeWizard,
    copySecret,
  }
}
