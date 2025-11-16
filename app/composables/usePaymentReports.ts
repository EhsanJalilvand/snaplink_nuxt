import { ref } from '#imports'
import { useApi } from './useApi'
import { useWorkspace } from './useWorkspace'
import type { SalesReport, SettlementReport, RiskReport, ReportFilters } from '~/types/payment-reports'

export const usePaymentReports = () => {
  const api = useApi()
  const { currentWorkspaceId } = useWorkspace()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchSalesReport = async (filters: ReportFilters): Promise<SalesReport | null> => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentReports] Workspace ID is required')
      }
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentReports] Fetching sales report...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/reports/sales`,
        })
      }

      const response = await api.get<{ data: SalesReport }>(
        `/api/payment/workspaces/${workspaceId}/reports/sales`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
          quiet: false,
        }
      )

      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch sales report'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const fetchSettlementReport = async (filters: ReportFilters): Promise<SettlementReport | null> => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentReports] Workspace ID is required')
      }
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentReports] Fetching settlement report...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/reports/settlements`,
        })
      }

      const response = await api.get<{ data: SettlementReport }>(
        `/api/payment/workspaces/${workspaceId}/reports/settlements`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
          quiet: false,
        }
      )

      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch settlement report'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const fetchRiskReport = async (filters: ReportFilters): Promise<RiskReport | null> => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentReports] Workspace ID is required')
      }
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentReports] Fetching risk report...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/reports/risk`,
        })
      }

      const response = await api.get<{ data: RiskReport }>(
        `/api/payment/workspaces/${workspaceId}/reports/risk`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
          quiet: false,
        }
      )

      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch risk report'
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchSalesReport,
    fetchSettlementReport,
    fetchRiskReport,
  }
}

