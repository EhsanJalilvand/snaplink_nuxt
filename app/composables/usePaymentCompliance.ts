import { ref, readonly } from '#imports'
import { useApi } from './useApi'
import type { ComplianceFilters } from '~/types/payment-compliance'

export const usePaymentCompliance = () => {
  const api = useApi()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchKYCList = async (filters: ComplianceFilters) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: any[] }>(
        '/compliance/kyc',
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
        }
      )

      return response.data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch KYC list'
      return []
    } finally {
      isLoading.value = false
    }
  }

  const fetchKYBList = async (filters: ComplianceFilters) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: any[] }>(
        '/compliance/kyb',
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
        }
      )

      return response.data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch KYB list'
      return []
    } finally {
      isLoading.value = false
    }
  }

  const fetchAML = async (filters: ComplianceFilters) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: any[] }>(
        '/compliance/aml',
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
        }
      )

      return response.data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch AML checks'
      return []
    } finally {
      isLoading.value = false
    }
  }

  const fetchRiskScores = async (filters: ComplianceFilters) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: any[] }>(
        '/compliance/risk-scores',
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
        }
      )

      return response.data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch risk scores'
      return []
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchKYCList,
    fetchKYBList,
    fetchAML,
    fetchRiskScores,
  }
}

