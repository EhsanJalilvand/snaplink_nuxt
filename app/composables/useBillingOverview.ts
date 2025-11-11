import { computed, toRefs, useState } from '#imports'
import { useApi } from './useApi'
import type { BillingOverviewData, BillingOverviewResponse, BillingStatus } from '~/types/billing'

interface BillingOverviewState {
  data: BillingOverviewData | null
  isLoading: boolean
  error: string | null
}

const FALLBACK_DATA: BillingOverviewData = {
  balance: 1250.5,
  status: 'active',
  monthlyUsage: {
    clicks: 125_000,
    apiCalls: 45_000,
  },
  usageChart: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    clicks: [28_000, 32_000, 35_000, 30_000],
    apiCalls: [10_000, 12_000, 11_000, 12_000],
  },
}

const initialState = (): BillingOverviewState => ({
  data: null,
  isLoading: false,
  error: null,
})

export const useBillingOverview = () => {
  const api = useApi()

  const state = useState<BillingOverviewState>('snaplink:billing-overview', initialState)

  const setData = (payload: BillingOverviewData) => {
    state.value.data = payload
    state.value.error = null
  }

  const fetchOverview = async () => {
    if (state.value.isLoading) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<BillingOverviewResponse>('/billing/overview', {
        base: 'gateway',
        validate: (payload): payload is BillingOverviewResponse =>
          typeof payload === 'object' && payload !== null && 'data' in payload,
        retry: 1,
        timeout: 15000,
        quiet: true,
      })

      if (response?.data) {
        setData(response.data)
      } else {
        setData(FALLBACK_DATA)
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useBillingOverview] Falling back to static data', error)
      }
      state.value.error = 'Unable to load billing overview. Showing cached data.'
      setData(FALLBACK_DATA)
    } finally {
      state.value.isLoading = false
    }
  }

  const balance = computed(() => state.value.data?.balance ?? FALLBACK_DATA.balance)
  const status = computed(() => state.value.data?.status ?? FALLBACK_DATA.status)
  const monthlyUsage = computed(() => state.value.data?.monthlyUsage ?? FALLBACK_DATA.monthlyUsage)
  const usageChart = computed(() => state.value.data?.usageChart ?? FALLBACK_DATA.usageChart)

  const statusConfig = computed(() => {
    const currentStatus = status.value
    const map: Record<BillingStatus, { label: string; color: string; icon: string; description: string }> = {
      active: {
        label: 'Active',
        color: 'success',
        icon: 'ph:check-circle',
        description: 'Your account is active and running smoothly.',
      },
      suspended: {
        label: 'Suspended',
        color: 'danger',
        icon: 'ph:warning',
        description: 'Your account has been suspended.',
      },
      low: {
        label: 'Low Balance',
        color: 'warning',
        icon: 'ph:warning',
        description: 'Your balance is running low. Please add credit soon.',
      },
    }
    return map[currentStatus] ?? map.active
  })

  return {
    ...toRefs(state.value),
    balance,
    status,
    monthlyUsage,
    usageChart,
    statusConfig,
    fetchOverview,
  }
}
