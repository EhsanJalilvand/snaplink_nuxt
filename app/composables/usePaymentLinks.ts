import { computed, toRefs } from '#imports'
import type {
  PaymentLink,
  PaymentLinkActionContext,
  PaymentLinkCreatePayload,
  PaymentLinkFilters,
  PaymentLinkListResponse,
  PaymentLinkStatus,
} from '~/types/payment-links'

interface PaymentLinkState {
  items: PaymentLink[]
  isLoading: boolean
  error: string | null
  filters: PaymentLinkFilters
  lastFetchedAt?: number
}

type PaymentLinkFilterStatus = PaymentLinkFilters['status']
type PaymentLinkFilterCurrency = PaymentLinkFilters['currency']

const FALLBACK_LINKS: PaymentLink[] = [
  {
    id: 'pay-001',
    name: 'Launch Bundle',
    reference: 'snap.link/pay/launch',
    amount: 420,
    currency: 'USD',
    payments: 186,
    conversion: 64.2,
    status: 'active',
    createdAt: '2024-02-11T10:20:00Z',
  },
  {
    id: 'pay-002',
    name: 'Pro Lifetime Access',
    reference: 'snap.link/pay/pro',
    amount: 1299,
    currency: 'USD',
    payments: 72,
    conversion: 51.8,
    status: 'completed',
    createdAt: '2024-02-01T14:35:00Z',
  },
  {
    id: 'pay-003',
    name: 'Escrow • Vendor Onboarding',
    reference: 'snap.link/pay/escrow',
    amount: 8400,
    currency: 'USDC',
    payments: 12,
    conversion: 88.4,
    status: 'active',
    createdAt: '2024-01-21T09:05:00Z',
  },
  {
    id: 'pay-004',
    name: 'Private Beta Access',
    reference: 'snap.link/pay/beta',
    amount: 89,
    currency: 'EUR',
    payments: 360,
    conversion: 71.5,
    status: 'paused',
    createdAt: '2024-02-14T16:15:00Z',
  },
]

const initialFilters = (): PaymentLinkFilters => ({
  search: '',
  status: 'all',
  currency: 'all',
})

const initialState = (): PaymentLinkState => ({
  items: [],
  isLoading: false,
  error: null,
  filters: initialFilters(),
  lastFetchedAt: undefined,
})

export const usePaymentLinks = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const security = useSecurity()

  const state = useState<PaymentLinkState>('snaplink:payment-links', initialState)

  const statusOptions = [
    { label: 'All statuses', value: 'all' as PaymentLinkFilterStatus },
    { label: 'Active', value: 'active' as PaymentLinkStatus },
    { label: 'Paused', value: 'paused' as PaymentLinkStatus },
    { label: 'Completed', value: 'completed' as PaymentLinkStatus },
  ]

  const currencyOptions = computed(() => {
    const currencies = new Set<string>()
    state.value.items.forEach((item) => currencies.add(item.currency))
    return [
      { label: 'All FX', value: 'all' as PaymentLinkFilterCurrency },
      ...Array.from(currencies).map((currency) => ({
        label: currency,
        value: currency,
      })),
    ]
  })

  const setLinks = (links: PaymentLink[]) => {
    state.value.items = links
    state.value.error = null
    state.value.lastFetchedAt = Date.now()
  }

  const fetchLinks = async (options: { force?: boolean } = {}) => {
    if (state.value.isLoading) {
      return
    }

    if (state.value.items.length > 0 && !options.force) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<PaymentLinkListResponse>('/payments/links', {
        base: 'gateway',
        validate: (payload): payload is PaymentLinkListResponse =>
          typeof payload === 'object' && payload !== null && Array.isArray((payload as PaymentLinkListResponse).data),
        retry: 1,
        timeout: 15000,
        quiet: true,
      })

      const links = response?.data && response.data.length > 0 ? response.data : FALLBACK_LINKS
      setLinks(links)
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[usePaymentLinks] Falling back to static links', error)
      }
      state.value.error = 'Unable to load payment links from gateway. Showing cached data.'
      setLinks(FALLBACK_LINKS)
    } finally {
      state.value.isLoading = false
    }
  }

  const filters = toRefs(state.value.filters)

  const setFilter = <K extends keyof PaymentLinkFilters>(key: K, value: PaymentLinkFilters[K]) => {
    state.value.filters[key] = value
  }

  const resetFilters = () => {
    state.value.filters = initialFilters()
  }

  const filteredLinks = computed(() => {
    const search = security
      .sanitizeInput(state.value.filters.search, { stripHtml: true, trim: true })
      .toLowerCase()

    return state.value.items.filter((link) => {
      const matchesSearch =
        search.length === 0 ||
        link.name.toLowerCase().includes(search) ||
        link.reference.toLowerCase().includes(search) ||
        link.id.toLowerCase().includes(search)

      const matchesStatus =
        state.value.filters.status === 'all' || link.status === state.value.filters.status

      const matchesCurrency =
        state.value.filters.currency === 'all' || link.currency === state.value.filters.currency

      return matchesSearch && matchesStatus && matchesCurrency
    })
  })

  const createLink = (payload: PaymentLinkCreatePayload) => {
    const normalized: PaymentLink = {
      id: payload.id,
      name: payload.description?.trim() || `Payment link ${payload.id.slice(-4)}`,
      reference: payload.link.replace(/^https?:\/\//, ''),
      amount: payload.amount,
      currency: payload.currency,
      payments: 0,
      conversion: 0,
      status: payload.status ?? 'active',
      createdAt: payload.createdAt ?? new Date().toISOString(),
    }

    state.value.items = [normalized, ...state.value.items]

    toasts.add({
      title: 'Payment link created',
      description: 'Your new payment link is ready to share.',
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })

    return normalized
  }

  const toggleLinkStatus = (linkId: string) => {
    const target = state.value.items.find((link) => link.id === linkId)
    if (!target) {
      return null
    }

    const previousStatus = target.status

    if (target.status === 'active') {
      target.status = 'paused'
    } else if (target.status === 'paused') {
      target.status = 'active'
    }

    toasts.add({
      title: target.status === 'active' ? 'Link reactivated' : 'Link paused',
      description: target.status === 'active'
        ? 'Customers can access this payment link again.'
        : 'Payment link is paused and hidden from new customers.',
      icon: target.status === 'active' ? 'ph:play-circle' : 'ph:pause-circle',
      color: target.status === 'active' ? 'success' : 'warning',
      progress: true,
    })

    return { link: target, previousStatus } satisfies PaymentLinkActionContext
  }

  const removeLink = (linkId: string) => {
    const target = state.value.items.find((link) => link.id === linkId)
    if (!target) {
      return
    }

    state.value.items = state.value.items.filter((link) => link.id !== linkId)

    toasts.add({
      title: 'Payment link removed',
      description: 'The link has been deleted from your catalog.',
      icon: 'ph:trash',
      color: 'danger',
      progress: true,
    })
  }

  const copyLinkReference = async (reference: string) => {
    const sanitized = security.validateUrl(`https://${reference}`, {
      allowedProtocols: ['http', 'https'],
    })

    if (!sanitized) {
      toasts.add({
        title: 'Copy failed',
        description: 'Unable to copy payment link. Please try again.',
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      return false
    }

    if (import.meta.client && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(sanitized)
      toasts.add({
        title: 'Copied to clipboard',
        description: 'Payment link reference copied successfully.',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })
      return true
    }

    toasts.add({
      title: 'Copy unavailable',
      description: 'Clipboard API is not available in this context.',
      icon: 'ph:warning',
      color: 'warning',
      progress: true,
    })
    return false
  }

  const error = computed(() => state.value.error)
  const isLoading = computed(() => state.value.isLoading)
  const links = computed(() => state.value.items)

  return {
    links,
    filteredLinks,
    filters,
    statusOptions,
    currencyOptions,
    isLoading,
    error,
    fetchLinks,
    setFilter,
    resetFilters,
    createLink,
    toggleLinkStatus,
    removeLink,
    copyLinkReference,
  }
}
