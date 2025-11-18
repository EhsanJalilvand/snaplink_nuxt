import { computed, toRefs, watch } from '#imports'
import type {
  PaymentGatewayCompliance,
  PaymentGatewayConnection,
  PaymentGatewayEventOption,
  PaymentGatewayReportItem,
  PaymentGatewayResponse,
  PaymentGatewayWebhookConfig,
} from '~/types/payment-gateway'
import { useWorkspace } from './useWorkspace'

interface PaymentGatewayState {
  connections: PaymentGatewayConnection[]
  webhook: PaymentGatewayWebhookConfig
  compliance: PaymentGatewayCompliance
  report: PaymentGatewayReportItem[]
  events: PaymentGatewayEventOption[]
  isLoading: boolean
  error: string | null
  lastFetchedAt?: number
}

const initialState = (): PaymentGatewayState => ({
  connections: [],
  webhook: {
    url: '',
    secret: '',
    retries: 3,
    events: [],
  },
  compliance: {
    maxTransaction: 0,
    dailyVolume: 0,
    allowedCurrencies: [],
    riskProfile: 'Standard',
  },
  report: [],
  events: [],
  isLoading: false,
  error: null,
  lastFetchedAt: undefined,
})

export const usePaymentGateway = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const security = useSecurity()
  const { currentWorkspaceId } = useWorkspace()

  const state = useState<PaymentGatewayState>('snaplink:payment-gateway', initialState)

  const setStateFromResponse = (payload: PaymentGatewayResponse) => {
    state.value.connections = payload.connections
    state.value.webhook = payload.webhook
    state.value.compliance = payload.compliance
    state.value.report = payload.report
    state.value.events = payload.events
    state.value.lastFetchedAt = Date.now()
    state.value.error = null
  }

  const fetchGateway = async (options: { force?: boolean } = {}) => {
    if (state.value.isLoading) {
      return
    }

    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentGateway] Workspace ID is required')
      }
      return
    }

    if (!options.force && state.value.lastFetchedAt) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentGateway] Fetching gateway from API...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/gateway`,
        })
      }

      const response = await api.get<PaymentGatewayResponse>(`/api/payment/workspaces/${workspaceId}/gateway`, {
        base: 'gateway',
        validate: (payload): payload is PaymentGatewayResponse =>
          typeof payload === 'object' && payload !== null && 'connections' in payload,
        retry: 1,
        timeout: 15000,
        quiet: false,
      })

      if (response && Array.isArray(response.connections)) {
        setStateFromResponse(response)
      } else {
        // API returned empty or invalid data
        setStateFromResponse({
          connections: [],
          webhook: { url: '', secret: '', retries: 3, events: [] },
          compliance: { maxTransaction: 0, dailyVolume: 0, allowedCurrencies: [], riskProfile: 'Standard' },
          report: [],
          events: [],
        })
      }
    } catch (error) {
      if (import.meta.dev) {
        console.error('[usePaymentGateway] Failed to load gateway configuration', error)
      }
      state.value.error = 'Unable to load gateway configuration. Please try again.'
      // Keep existing data if available, otherwise reset to empty state
      if (state.value.connections.length === 0) {
        setStateFromResponse({
          connections: [],
          webhook: { url: '', secret: '', retries: 3, events: [] },
          compliance: { maxTransaction: 0, dailyVolume: 0, allowedCurrencies: [], riskProfile: 'Standard' },
          report: [],
          events: [],
        })
      }
    } finally {
      state.value.isLoading = false
    }
  }

  const toggleConnection = (connectionId: string) => {
    const connection = state.value.connections.find((item) => item.id === connectionId)
    if (!connection) {
      return
    }

    connection.status = connection.status === 'active' ? 'standby' : 'active'

    toasts.add({
      title: connection.status === 'active' ? 'Gateway reactivated' : 'Gateway put on standby',
      description: connection.status === 'active'
        ? 'Traffic will resume through this processor.'
        : 'Processor moved to standby. No new payments will route here.',
      icon: connection.status === 'active' ? 'ph:play-circle' : 'ph:pause-circle',
      color: connection.status === 'active' ? 'success' : 'warning',
      progress: true,
    })
  }

  const copyWebhookSecret = async () => {
    if (!import.meta.client || !navigator.clipboard) {
      toasts.add({
        title: 'Copy unavailable',
        description: 'Clipboard API is not available in this context.',
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      return false
    }

    await navigator.clipboard.writeText(state.value.webhook.secret)

    toasts.add({
      title: 'Signing secret copied',
      description: 'Use this secret to verify webhook authenticity.',
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })
    return true
  }

  const validateAndSetWebhookUrl = (url: string) => {
    const sanitized = security.validateUrl(url, {
      allowedProtocols: ['http', 'https'],
    })

    if (!sanitized) {
      toasts.add({
        title: 'Invalid callback URL',
        description: 'Please enter a valid HTTPS endpoint.',
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      return
    }

    state.value.webhook.url = sanitized
  }

  const toggleWebhookEvent = (event: string, enabled: boolean) => {
    const events = state.value.webhook.events
    if (enabled && !events.includes(event)) {
      events.push(event)
    } else if (!enabled) {
      state.value.webhook.events = events.filter((item) => item !== event)
    }
  }

  const setWebhookRetries = (retries: number) => {
    state.value.webhook.retries = Math.max(0, Math.min(retries, 10))
  }

  const removeAllowedCurrency = (currency: string) => {
    state.value.compliance.allowedCurrencies = state.value.compliance.allowedCurrencies.filter(
      (item) => item !== currency,
    )
  }

  const addAllowedCurrency = (currency: string) => {
    if (!currency || state.value.compliance.allowedCurrencies.includes(currency)) {
      return
    }
    state.value.compliance.allowedCurrencies.push(currency)
  }

  const setRiskProfile = (profile: string) => {
    state.value.compliance.riskProfile = profile
  }

  const setComplianceValue = <K extends keyof PaymentGatewayCompliance>(key: K, value: PaymentGatewayCompliance[K]) => {
    state.value.compliance[key] = value
  }

  const isLoading = computed(() => state.value.isLoading)
  const error = computed(() => state.value.error)

  // Watch for workspace changes and refresh data
  watch(
    currentWorkspaceId,
    (newWorkspaceId, previousWorkspaceId) => {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentGateway] Workspace changed', {
          from: previousWorkspaceId,
          to: newWorkspaceId,
        })
      }

      if (!newWorkspaceId) {
        // Clear state if no workspace selected
        Object.assign(state.value, initialState())
        return
      }

      // If workspace changed, reset state and fetch new data
      if (newWorkspaceId !== previousWorkspaceId) {
        if (import.meta.dev) {
          // eslint-disable-next-line no-console
          console.warn('[usePaymentGateway] Resetting state and fetching new data for workspace:', newWorkspaceId)
        }
        Object.assign(state.value, initialState())
        fetchGateway({ force: true })
      }
    },
    { immediate: false },
  )

  return {
    ...toRefs(state.value),
    isLoading,
    error,
    fetchGateway,
    toggleConnection,
    copyWebhookSecret,
    validateAndSetWebhookUrl,
    toggleWebhookEvent,
    setWebhookRetries,
    removeAllowedCurrency,
    addAllowedCurrency,
    setRiskProfile,
    setComplianceValue,
  }
}
