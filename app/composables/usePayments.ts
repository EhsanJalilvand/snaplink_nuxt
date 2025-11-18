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
        // API returned empty data
        setOverviewData(null)
      }
    } catch (error) {
      if (import.meta.dev) {
        console.error('[usePayments] Failed to load payment overview', error)
      }
      state.value.overviewError = 'Unable to load payment overview from gateway. Please try again.'
      // Keep existing data if available, otherwise set to null
      if (!state.value.overview) {
        setOverviewData(null)
      }
    } finally {
      state.value.isLoadingOverview = false
    }
  }

  const overview = computed(() => state.value.overview)
  const revenueByPeriod = computed(() => overview.value ? mapRevenueByPeriod(overview.value.revenue) : {})
  const statusTotal = computed(() => overview.value ? totalStatusTransactions(overview.value.status) : 0)

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
