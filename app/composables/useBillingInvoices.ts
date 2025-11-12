import { computed, toRefs, useState } from '#imports'
import type {
  BillingInvoicePayload,
  BillingInvoiceStatus,
  BillingInvoicesResponse,
  BillingPlanInfo,
  BillingInvoiceItem,
} from '~/types/billing'
import { useApi } from './useApi'
import { useNuiToasts } from '#imports'

interface BillingInvoicesState {
  items: BillingInvoiceItem[]
  plan: BillingPlanInfo | null
  isLoading: boolean
  error: string | null
  status: 'all' | BillingInvoiceStatus
}

const initialState = (): BillingInvoicesState => ({
  items: [],
  plan: null,
  isLoading: false,
  error: null,
  status: 'all',
})

const statusFilters: Array<{ label: string; value: 'all' | BillingInvoiceStatus }> = [
  { label: 'All', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
]

const statusConfigMap: Record<
  BillingInvoiceStatus,
  { label: string; color: string; icon: string }
> = {
  paid: {
    label: 'Paid',
    color: 'success',
    icon: 'ph:check-circle',
  },
  pending: {
    label: 'Pending',
    color: 'warning',
    icon: 'ph:clock',
  },
  failed: {
    label: 'Failed',
    color: 'danger',
    icon: 'ph:x-circle',
  },
}

export const useBillingInvoices = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const state = useState<BillingInvoicesState>('snaplink:billing-invoices', initialState)

  const setStateFromPayload = (payload: BillingInvoicePayload | null | undefined) => {
    state.value.items = payload?.items ?? []
    state.value.plan = payload?.plan ?? null
    state.value.error = null
  }

  const fetchInvoices = async () => {
    if (state.value.isLoading) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<BillingInvoicesResponse>('/billing/invoices', {
        base: 'gateway',
        validate: (payload): payload is BillingInvoicesResponse =>
          typeof payload === 'object' && payload !== null && 'data' in payload,
        retry: 1,
        timeout: 15000,
        quiet: true,
      })

      if (response?.data) {
        setStateFromPayload(response.data)
      } else {
        setStateFromPayload(null)
      }
    } catch (error) {
      state.value.error = 'Unable to load invoices. Please try again.'
    } finally {
      state.value.isLoading = false
    }
  }

  const filteredInvoices = computed(() => {
    if (state.value.status === 'all') {
      return state.value.items
    }
    return state.value.items.filter((invoice) => invoice.status === state.value.status)
  })

  const setStatus = (status: 'all' | BillingInvoiceStatus) => {
    state.value.status = status
  }

  const getStatusConfig = (status: BillingInvoiceStatus) => statusConfigMap[status]

  const handleDownload = (invoice: BillingInvoiceItem) => {
    toasts.add({
      title: 'Download invoice',
      description: `Downloading ${invoice.id}…`,
      icon: 'ph:download',
      progress: true,
    })
  }

  const handleExport = () => {
    toasts.add({
      title: 'Export invoices',
      description: 'A detailed statement will be available soon.',
      icon: 'ph:tray-arrow-down',
      progress: true,
    })
  }

  const handleUpgradePlan = () => {
    toasts.add({
      title: 'Upgrade coming soon',
      description: 'Plan upgrades will be available after billing integration.',
      icon: 'ph:rocket-launch',
      color: 'info',
      progress: true,
    })
  }

  const handleViewPricing = () => {
    toasts.add({
      title: 'Pricing docs',
      description: 'Full pricing sheet is being refreshed. Check back shortly.',
      icon: 'ph:info',
      progress: true,
    })
  }

  return {
    ...toRefs(state.value),
    filters: statusFilters,
    filteredInvoices,
    fetchInvoices,
    setStatus,
    getStatusConfig,
    handleDownload,
    handleExport,
    handleUpgradePlan,
    handleViewPricing,
  }
}
