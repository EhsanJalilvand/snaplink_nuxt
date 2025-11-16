import { ref } from '#imports'
import { useApi } from './useApi'
import type { SalesReport, SettlementReport, RiskReport, ReportFilters } from '~/types/payment-reports'

export const usePaymentReports = () => {
  const api = useApi()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchSalesReport = async (filters: ReportFilters): Promise<SalesReport | null> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: SalesReport }>(
        '/reports/sales',
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
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
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: SettlementReport }>(
        '/reports/settlements',
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
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
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: RiskReport }>(
        '/reports/risk',
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
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

