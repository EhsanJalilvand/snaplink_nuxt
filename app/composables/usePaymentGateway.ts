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

const FALLBACK_STATE: Omit<PaymentGatewayState, 'isLoading' | 'error' | 'lastFetchedAt'> = {
  connections: [
    {
      id: 'gw-1',
      name: 'Stripe US',
      status: 'active',
      mode: 'Live',
      volumeShare: 45,
      lastSync: '3 mins ago',
      latency: '184 ms',
    },
    {
      id: 'gw-2',
      name: 'Adyen EU',
      status: 'active',
      mode: 'Live',
      volumeShare: 28,
      lastSync: '12 mins ago',
      latency: '212 ms',
    },
    {
      id: 'gw-3',
      name: 'Circle USDC',
      status: 'standby',
      mode: 'Sandbox',
      volumeShare: 17,
      lastSync: '58 mins ago',
      latency: '164 ms',
    },
  ],
  webhook: {
    url: 'https://api.snaplink.app/webhooks/payment',
    secret: 'whsec_live_4f98d1f0c1',
    retries: 3,
    events: ['payment.success', 'payment.failed', 'payment.refunded'],
  },
  compliance: {
    maxTransaction: 25000,
    dailyVolume: 250000,
    allowedCurrencies: ['USD', 'EUR', 'USDC'],
    riskProfile: 'Adaptive',
  },
  report: [
    {
      id: '#TX-8453',
      gateway: 'Stripe US',
      method: 'Card • Visa',
      amount: 480.65,
      currency: 'USD',
      status: 'Captured',
      createdAt: '2024-02-14T12:42:00Z',
    },
    {
      id: '#TX-8452',
      gateway: 'Adyen EU',
      method: 'iDEAL',
      amount: 189,
      currency: 'EUR',
      status: 'Settled',
      createdAt: '2024-02-14T12:05:00Z',
    },
    {
      id: '#TX-8451',
      gateway: 'Circle USDC',
      method: 'Crypto • USDC',
      amount: 5600,
      currency: 'USDC',
      status: 'Pending',
      createdAt: '2024-02-14T11:20:00Z',
    },
  ],
  events: [
    { label: 'Payment successful', value: 'payment.success' },
    { label: 'Payment failed', value: 'payment.failed' },
    { label: 'Payment pending', value: 'payment.pending' },
    { label: 'Refund requested', value: 'payment.refund.requested' },
    { label: 'Refund processed', value: 'payment.refunded' },
    { label: 'Dispute opened', value: 'payment.dispute.opened' },
  ],
}

const initialState = (): PaymentGatewayState => ({
  ...structuredClone(FALLBACK_STATE),
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

      if (response && Array.isArray(response.connections) && response.connections.length > 0) {
        setStateFromResponse(response)
      } else {
        setStateFromResponse({ ...FALLBACK_STATE })
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[usePaymentGateway] Falling back to static gateway data', error)
      }
      state.value.error = 'Unable to load gateway configuration. Showing cached data.'
      setStateFromResponse({ ...FALLBACK_STATE })
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
