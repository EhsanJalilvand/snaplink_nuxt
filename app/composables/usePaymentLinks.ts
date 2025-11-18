import { computed, toRefs, watch } from '#imports'
import type {
  PaymentLink,
  PaymentLinkActionContext,
  PaymentLinkCreatePayload,
  PaymentLinkFilters,
  PaymentLinkListResponse,
  PaymentLinkStatus,
} from '~/types/payment-links'
import { useWorkspace } from './useWorkspace'

interface PaymentLinkState {
  items: PaymentLink[]
  isLoading: boolean
  error: string | null
  filters: PaymentLinkFilters
  lastFetchedAt?: number
}

type PaymentLinkFilterStatus = PaymentLinkFilters['status']
type PaymentLinkFilterCurrency = PaymentLinkFilters['currency']

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
  const { currentWorkspaceId } = useWorkspace()

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
    if (import.meta.dev) {
      // eslint-disable-next-line no-console
      console.warn('[usePaymentLinks] fetchLinks called', {
        force: options.force,
        isLoading: state.value.isLoading,
        itemsCount: state.value.items.length,
        lastFetchedAt: state.value.lastFetchedAt,
      })
    }

    if (state.value.isLoading) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentLinks] Already loading, skipping...')
      }
      return
    }

    // Only skip if we have cached data and not forcing a refresh
    // But always attempt API call on first load (when lastFetchedAt is undefined)
    if (state.value.items.length > 0 && !options.force && state.value.lastFetchedAt) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentLinks] Skipping fetch - using cached data. Use force: true to refresh.')
      }
      return
    }

    if (import.meta.dev) {
      // eslint-disable-next-line no-console
      console.warn('[usePaymentLinks] Proceeding with API call...')
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const workspaceId = currentWorkspaceId.value
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentLinks] Checking workspaceId:', workspaceId)
      }
      if (!workspaceId) {
        const errorMsg = 'Workspace ID is required. Please select a workspace first.'
        if (import.meta.dev) {
          // eslint-disable-next-line no-console
          console.error('[usePaymentLinks]', errorMsg)
        }
        throw new Error(errorMsg)
      }

      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentLinks] Fetching payment links from API...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/payment-links`,
        })
      }

      const response = await api.get<PaymentLinkListResponse>(`/api/payment/workspaces/${workspaceId}/payment-links`, {
        base: 'gateway',
        validate: (payload): payload is PaymentLinkListResponse =>
          typeof payload === 'object' && payload !== null && 'data' in payload && Array.isArray((payload as any).data),
        retry: 1,
        timeout: 15000,
        quiet: false, // Changed to false to see errors
      })

      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentLinks] API response received:', response)
        // eslint-disable-next-line no-console
        console.warn('[usePaymentLinks] Raw API data:', JSON.stringify(response?.data, null, 2))
      }

      // Map API response to local PaymentLink format
      const mappedLinks: PaymentLink[] = (response?.data || []).map((link: any) => {
        if (import.meta.dev) {
          // eslint-disable-next-line no-console
          console.warn('[usePaymentLinks] Mapping link:', link)
        }
        return {
        id: link.id,
        name: link.title || link.name,
        reference: `snap.link/pay/${link.id.slice(-8)}`,
        amount: link.amount || 0,
        currency: link.currency || 'USD',
        payments: link.currentUsage || 0,
        conversion: link.maxUsage ? ((link.currentUsage || 0) / link.maxUsage) * 100 : 0,
        status: link.status === 'active' ? 'active' : link.status === 'paused' ? 'paused' : 'completed',
        createdAt: link.createdAt || link.created_at || new Date().toISOString(),
      }
      })

      // Always use API response, even if empty
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentLinks] Setting links from API:', mappedLinks.length, 'items')
        // eslint-disable-next-line no-console
        console.warn('[usePaymentLinks] Mapped links:', JSON.stringify(mappedLinks, null, 2))
      }
      setLinks(mappedLinks)
    } catch (error) {
      if (import.meta.dev) {
        console.error('[usePaymentLinks] API call failed:', error)
        console.error('[usePaymentLinks] Error details:', {
          message: (error as Error)?.message,
          stack: (error as Error)?.stack,
        })
      }
      
      // Show error and clear data if no cached data
      if (state.value.items.length === 0) {
        state.value.error = 'Unable to load payment links from gateway. Please try again.'
        setLinks([])
      } else {
        // Keep existing data and show error
        state.value.error = 'Unable to refresh payment links from gateway. Showing cached data.'
        if (import.meta.dev) {
          console.warn('[usePaymentLinks] Keeping existing cached data due to API error')
        }
      }
    } finally {
      state.value.isLoading = false
    }
  }

  const filters = computed({
    get: () => state.value.filters,
    set: (value: PaymentLinkFilters) => {
      state.value.filters = value
    },
  })

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

  const createLink = async (payload: PaymentLinkCreatePayload) => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      toasts.add({
        title: 'Error',
        description: 'Workspace ID is required',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      throw new Error('Workspace ID is required')
    }

    try {
      const response = await api.post<{ data: any }>(
        `/api/payment/workspaces/${workspaceId}/payment-links`,
        {
          title: payload.description?.trim() || `Payment link ${payload.id.slice(-4)}`,
          amount: payload.amount,
          currency: payload.currency,
          category: payload.category,
          description: payload.description,
          expirationDate: payload.expirationDate,
          maxUsage: payload.maxUsage,
          metadata: payload.metadata,
        },
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      const createdLink = response?.data
      const normalized: PaymentLink = {
        id: createdLink?.id || payload.id,
        name: createdLink?.title || payload.description?.trim() || `Payment link ${payload.id.slice(-4)}`,
        reference: `snap.link/pay/${(createdLink?.id || payload.id).slice(-8)}`,
        amount: createdLink?.amount || payload.amount,
        currency: createdLink?.currency || payload.currency,
        payments: createdLink?.currentUsage || 0,
        conversion: 0,
        status: createdLink?.status === 'active' ? 'active' : createdLink?.status === 'paused' ? 'paused' : 'completed',
        createdAt: createdLink?.createdAt || createdLink?.created_at || new Date().toISOString(),
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
    } catch (error: any) {
      toasts.add({
        title: 'Error creating payment link',
        description: error.message || 'Failed to create payment link',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      throw error
    }
  }

  const toggleLinkStatus = async (linkId: string) => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      toasts.add({
        title: 'Error',
        description: 'Workspace ID is required',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return null
    }

    const target = state.value.items.find((link) => link.id === linkId)
    if (!target) {
      return null
    }

    const previousStatus = target.status
    const newStatus = target.status === 'active' ? 'paused' : 'active'

    try {
      await api.put(
        `/api/payment/workspaces/${workspaceId}/payment-links/${linkId}`,
        {
          status: newStatus,
        },
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      target.status = newStatus

      toasts.add({
        title: newStatus === 'active' ? 'Link reactivated' : 'Link paused',
        description: newStatus === 'active'
          ? 'Customers can access this payment link again.'
          : 'Payment link is paused and hidden from new customers.',
        icon: newStatus === 'active' ? 'ph:play-circle' : 'ph:pause-circle',
        color: newStatus === 'active' ? 'success' : 'warning',
        progress: true,
      })

      return { link: target, previousStatus } satisfies PaymentLinkActionContext
    } catch (error: any) {
      toasts.add({
        title: 'Error updating link',
        description: error.message || 'Failed to update payment link status',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return null
    }
  }

  const removeLink = async (linkId: string) => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      toasts.add({
        title: 'Error',
        description: 'Workspace ID is required',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return
    }

    const target = state.value.items.find((link) => link.id === linkId)
    if (!target) {
      return
    }

    try {
      await api.delete(
        `/api/payment/workspaces/${workspaceId}/payment-links/${linkId}`,
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      state.value.items = state.value.items.filter((link) => link.id !== linkId)

      toasts.add({
        title: 'Payment link removed',
        description: 'The link has been deleted from your catalog.',
        icon: 'ph:trash',
        color: 'danger',
        progress: true,
      })
    } catch (error: any) {
      toasts.add({
        title: 'Error deleting link',
        description: error.message || 'Failed to delete payment link',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
    }
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

  // Watch for workspace changes and refresh data
  watch(
    currentWorkspaceId,
    (newWorkspaceId, previousWorkspaceId) => {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentLinks] Workspace changed', {
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
          console.warn('[usePaymentLinks] Resetting state and fetching new data for workspace:', newWorkspaceId)
        }
        Object.assign(state.value, initialState())
        fetchLinks({ force: true })
      }
    },
    { immediate: false },
  )

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
