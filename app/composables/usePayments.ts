import { computed, toRefs, watch } from '#imports'
import type {
  PaymentOverviewData,
  PaymentOverviewResponse,
  PaymentRevenueDataset,
  PaymentStatusItem,
} from '~/types/payments'
import { useWorkspace } from './useWorkspace'

interface PaymentState {
  overview: PaymentOverviewData | null
  isLoadingOverview: boolean
  overviewError: string | null
}

const FALLBACK_OVERVIEW: PaymentOverviewData = {
  summary: {
    total: 45230.78,
    pending: 8240.15,
    available: 36990.63,
  },
  trends: {
    total: { value: '+12.4%', direction: 'up' },
    pending: { value: '-4.1%', direction: 'down' },
    available: { value: '+9.8%', direction: 'up' },
  },
  status: [
    {
      label: 'Successful',
      value: 1824,
      amount: 28450.12,
      trend: '+6.2%',
      color: 'success',
      icon: 'solar:check-circle-bold-duotone',
    },
    {
      label: 'Pending',
      value: 312,
      amount: 4820.33,
      trend: '-1.4%',
      color: 'warning',
      icon: 'solar:clock-circle-bold-duotone',
    },
    {
      label: 'Failed',
      value: 96,
      amount: 920.41,
      trend: '-0.9%',
      color: 'danger',
      icon: 'solar:close-circle-bold-duotone',
    },
  ],
  insights: [
    {
      label: 'Average settlement time',
      description: '2m 41s from initiation to merchant wallet.',
      icon: 'solar:card-send-bold-duotone',
    },
    {
      label: 'Approval rate',
      description: '96% of payments complete without manual review.',
      icon: 'solar:graph-new-bold-duotone',
    },
    {
      label: 'Fraud escalation',
      description: '11 cases pending review & automated rule tuning.',
      icon: 'solar:shield-check-bold-duotone',
    },
  ],
  revenue: [
    {
      period: 'Daily',
      points: [
        { label: 'Mon', revenue: 4820, target: 4500 },
        { label: 'Tue', revenue: 5120, target: 4600 },
        { label: 'Wed', revenue: 5640, target: 4750 },
        { label: 'Thu', revenue: 5980, target: 4900 },
        { label: 'Fri', revenue: 6320, target: 5050 },
        { label: 'Sat', revenue: 6840, target: 5200 },
        { label: 'Sun', revenue: 7120, target: 5300 },
      ],
    },
    {
      period: 'Weekly',
      points: [
        { label: 'Week 1', revenue: 23840, target: 22000 },
        { label: 'Week 2', revenue: 25410, target: 22800 },
        { label: 'Week 3', revenue: 26840, target: 23600 },
        { label: 'Week 4', revenue: 27920, target: 24400 },
      ],
    },
    {
      period: 'Monthly',
      points: [
        { label: 'Jan', revenue: 85640, target: 82000 },
        { label: 'Feb', revenue: 91220, target: 87000 },
        { label: 'Mar', revenue: 97840, target: 92000 },
        { label: 'Apr', revenue: 104220, target: 98000 },
        { label: 'May', revenue: 112430, target: 102000 },
      ],
    },
  ],
  revenueMetrics: {
    mrr: {
      value: 128540,
      change: '+8.6%',
    },
    averageOrderValue: {
      value: 164,
      currency: 'USD',
    },
    refundRatio: {
      value: 1.8,
      change: '-0.3%',
    },
    netRevenuePace: {
      value: 4250,
      currency: 'USD',
      timeframe: 'last 6 hours',
      progress: 72,
    },
  },
  performance: [
    {
      id: 'perf-link-1',
      name: 'Annual Summit Pass',
      type: 'product',
      revenue: 18240,
      conversionRate: 6.8,
      trend: '+2.1%',
      sku: 'SUB-ANNUAL',
    },
    {
      id: 'perf-link-2',
      name: 'Premium Checkout Link',
      type: 'link',
      revenue: 14310,
      conversionRate: 5.4,
      trend: '+1.4%',
      payments: 281,
      status: 'Live',
    },
    {
      id: 'perf-link-3',
      name: 'AI Onboarding Workshop',
      type: 'product',
      revenue: 12860,
      conversionRate: 4.9,
      trend: '+0.9%',
      sku: 'WRK-ONBOARD',
    },
  ],
  quickActions: [
    {
      id: 'create-link',
      label: 'Create payment link',
      description: 'Launch a new payment flow in under 60 seconds.',
      icon: 'solar:link-circle-bold-duotone',
      accent: 'primary',
    },
    {
      id: 'open-gateway',
      label: 'Configure gateway',
      description: 'Update credentials, currencies, or risk controls.',
      icon: 'solar:settings-bold-duotone',
      accent: 'info',
    },
    {
      id: 'open-payouts',
      label: 'Schedule payouts',
      description: 'Manage settlement frequency and recipient wallets.',
      icon: 'solar:wallet-bold-duotone',
      accent: 'success',
    },
  ],
  activities: [
    {
      id: 'activity-1',
      title: 'New high-value payment completed',
      description: 'Checkout Link • $1,240.00 • Verified device',
      timestamp: '3m ago',
      icon: 'solar:card-send-bold-duotone',
      color: 'success',
    },
    {
      id: 'activity-2',
      title: 'Gateway FX rate updated',
      description: 'US ➝ EUR • +0.4% spread • Scheduled sync',
      timestamp: '1h ago',
      icon: 'solar:globe-bold-duotone',
      color: 'info',
    },
    {
      id: 'activity-3',
      title: 'Dispute response submitted',
      description: 'Ticket #9812 • Evidence package uploaded',
      timestamp: '2h ago',
      icon: 'solar:shield-bold-duotone',
      color: 'warning',
    },
  ],
  alerts: [
    {
      id: 'alert-1',
      title: 'Settlement delay detected',
      description: 'Bank partner ETA +12h for USD wires. Notify finance.',
      severity: 'warning',
      icon: 'solar:clock-circle-bold-duotone',
      timestamp: '3 mins ago',
    },
    {
      id: 'alert-2',
      title: 'Gateway credential rotation due',
      description: 'Primary Stripe credentials expire in 3 days.',
      severity: 'danger',
      icon: 'solar:key-bold-duotone',
      timestamp: '18 mins ago',
    },
  ],
  conversions: [
    {
      label: 'Checkout completion',
      value: '68.4%',
      change: '+4.2%',
      status: 'increase',
      progress: 68.4,
      description: 'Completed payments / initiated sessions',
    },
    {
      label: 'Mobile wallet adoption',
      value: '42.7%',
      change: '+2.1%',
      status: 'increase',
      progress: 42.7,
      description: 'Share of mobile wallet payments vs card',
    },
    {
      label: 'Gateway decline rate',
      value: '2.4%',
      change: '-0.6%',
      status: 'decrease',
      progress: 2.4,
      description: 'Declined transactions relative to attempts',
    },
  ],
}

const mapRevenueByPeriod = (datasets: PaymentRevenueDataset[]) => {
  return datasets.reduce<Record<string, PaymentRevenueDataset['points']>>((acc, dataset) => {
    acc[dataset.period] = dataset.points
    return acc
  }, {})
}

const totalStatusTransactions = (status: PaymentStatusItem[]) =>
  status.reduce((sum, item) => sum + item.value, 0)

export const usePayments = () => {
  const api = useApi()
  const { currentWorkspaceId } = useWorkspace()

  const state = useState<PaymentState>('snaplink:payments', () => ({
    overview: null,
    isLoadingOverview: false,
    overviewError: null,
  }))

  const setOverviewData = (data: PaymentOverviewData) => {
    state.value.overview = data
    state.value.overviewError = null
  }

  const fetchOverview = async (options: { force?: boolean } = {}) => {
    if (state.value.isLoadingOverview) {
      return
    }

    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePayments] Workspace ID is required')
      }
      return
    }

    if (state.value.overview && !options.force) {
      return
    }

    state.value.isLoadingOverview = true
    state.value.overviewError = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePayments] Fetching overview from API...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/overview`,
        })
      }

      const response = await api.get<PaymentOverviewResponse>(`/api/payment/workspaces/${workspaceId}/overview`, {
        base: 'gateway',
        validate: (payload): payload is PaymentOverviewResponse =>
          typeof payload === 'object' && payload !== null && 'data' in payload,
        retry: 2,
        timeout: 20000,
        quiet: false,
      })

      if (response?.data) {
        setOverviewData(response.data)
      } else {
        setOverviewData(FALLBACK_OVERVIEW)
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[usePayments] Falling back to static overview data', error)
      }
      state.value.overviewError = 'Unable to load payment overview from gateway. Showing cached data.'
      setOverviewData(FALLBACK_OVERVIEW)
    } finally {
      state.value.isLoadingOverview = false
    }
  }

  const overview = computed(() => state.value.overview ?? FALLBACK_OVERVIEW)
  const revenueByPeriod = computed(() => mapRevenueByPeriod(overview.value.revenue))
  const statusTotal = computed(() => totalStatusTransactions(overview.value.status))

  // Watch for workspace changes and refresh data
  watch(
    currentWorkspaceId,
    (newWorkspaceId, previousWorkspaceId) => {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePayments] Workspace changed', {
          from: previousWorkspaceId,
          to: newWorkspaceId,
        })
      }

      if (!newWorkspaceId) {
        // Clear state if no workspace selected
        state.value.overview = null
        state.value.overviewError = null
        return
      }

      // If workspace changed, reset state and fetch new data
      if (newWorkspaceId !== previousWorkspaceId) {
        if (import.meta.dev) {
          // eslint-disable-next-line no-console
          console.warn('[usePayments] Resetting state and fetching new data for workspace:', newWorkspaceId)
        }
        state.value.overview = null
        state.value.overviewError = null
        fetchOverview({ force: true })
      }
    },
    { immediate: false },
  )

  return {
    ...toRefs(state.value),
    overview,
    revenueByPeriod,
    statusTotal,
    fetchOverview,
  }
}
