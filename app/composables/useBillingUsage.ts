import { computed, toRefs, useState } from '#imports'
import type {
  BillingUsagePayload,
  BillingUsagePeriod,
  BillingUsageResponse,
  BillingUsageItem,
  BillingUsageSummaryMetrics,
} from '~/types/billing'
import { useApi } from './useApi'

interface BillingUsageState {
  period: BillingUsagePeriod
  items: BillingUsageItem[]
  summary: BillingUsageSummaryMetrics
  isLoading: boolean
  error: string | null
}

const FALLBACK_ITEMS: BillingUsageItem[] = [
  {
    id: 'usage-url-clicks',
    service: 'URL Click',
    icon: 'solar:link-linear',
    current: 125_000,
    limit: 200_000,
    cost: 12.5,
    color: 'primary',
  },
  {
    id: 'usage-payment',
    service: 'Payment Service',
    icon: 'solar:card-linear',
    current: 850,
    limit: 1_000,
    cost: 42.5,
    color: 'success',
  },
  {
    id: 'usage-bio',
    service: 'Bio Service',
    icon: 'solar:user-id-linear',
    current: 320,
    limit: 500,
    cost: 16,
    color: 'info',
  },
  {
    id: 'usage-survey',
    service: 'Survey Service',
    icon: 'solar:document-linear',
    current: 1_250,
    limit: 2_000,
    cost: 25,
    color: 'warning',
  },
  {
    id: 'usage-api',
    service: 'API Call',
    icon: 'solar:api-linear',
    current: 45_000,
    limit: 100_000,
    cost: 22.5,
    color: 'purple',
  },
  {
    id: 'usage-webhook',
    service: 'Webhook',
    icon: 'solar:webhook-linear',
    current: 5_600,
    limit: 10_000,
    cost: 5.6,
    color: 'orange',
  },
]

const FALLBACK_SUMMARY: BillingUsageSummaryMetrics = {
  totalServices: FALLBACK_ITEMS.length,
  totalCost: FALLBACK_ITEMS.reduce((total, item) => total + item.cost, 0),
  averageUtilization:
    Math.round(
      FALLBACK_ITEMS.reduce(
        (total, item) => total + Math.min((item.current / item.limit) * 100, 100),
        0,
      ) / FALLBACK_ITEMS.length,
    ),
}

const initialState = (): BillingUsageState => ({
  period: 'month',
  items: [],
  summary: FALLBACK_SUMMARY,
  isLoading: false,
  error: null,
})

const periodOptions = [
  { label: 'This Month', value: 'month' as BillingUsagePeriod },
  { label: 'This Week', value: 'week' as BillingUsagePeriod },
  { label: 'This Year', value: 'year' as BillingUsagePeriod },
]

const computeSummary = (items: BillingUsageItem[]): BillingUsageSummaryMetrics => {
  if (items.length === 0) {
    return {
      totalServices: 0,
      totalCost: 0,
      averageUtilization: 0,
    }
  }

  const totalCost = items.reduce((total, item) => total + item.cost, 0)
  const averageUtilization = Math.round(
    items.reduce((total, item) => total + Math.min((item.current / item.limit) * 100, 100), 0) /
      items.length,
  )

  return {
    totalServices: items.length,
    totalCost,
    averageUtilization,
  }
}

const getPercentage = (item: BillingUsageItem) => Math.min((item.current / item.limit) * 100, 100)

const getMeterColor = (percentage: number) => {
  if (percentage >= 90) return 'danger'
  if (percentage >= 70) return 'warning'
  return 'success'
}

export const useBillingUsage = () => {
  const api = useApi()
  const state = useState<BillingUsageState>('snaplink:billing-usage', initialState)

  const setStateFromPayload = (payload: BillingUsagePayload) => {
    state.value.period = payload.period
    state.value.items = payload.items
    state.value.summary = payload.summary ?? computeSummary(payload.items)
    state.value.error = null
  }

  const fetchUsage = async (period: BillingUsagePeriod = state.value.period) => {
    if (state.value.isLoading) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<BillingUsageResponse>('/billing/usage', {
        base: 'gateway',
        validate: (payload): payload is BillingUsageResponse =>
          typeof payload === 'object' && payload !== null && 'data' in payload,
        retry: 1,
        timeout: 15000,
        quiet: true,
        query: { period },
      })

      if (response?.data?.items?.length) {
        setStateFromPayload(response.data)
      } else {
        setStateFromPayload({ period, items: FALLBACK_ITEMS, summary: FALLBACK_SUMMARY })
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useBillingUsage] Falling back to static usage data', error)
      }
      state.value.error = 'Unable to load usage telemetry. Showing cached data.'
      setStateFromPayload({ period, items: FALLBACK_ITEMS, summary: FALLBACK_SUMMARY })
    } finally {
      state.value.isLoading = false
    }
  }

  const decoratedItems = computed(() =>
    state.value.items.map((item) => {
      const percentage = getPercentage(item)
      return {
        ...item,
        percentage,
        meterColor: getMeterColor(percentage),
      }
    }),
  )

  return {
    ...toRefs(state.value),
    periodOptions,
    usageItems: decoratedItems,
    fetchUsage,
    getPercentage,
    getMeterColor,
    computeSummary,
  }
}
