import { ref, readonly } from '#imports'
import { useApi } from './useApi'
import { useWorkspace } from './useWorkspace'
import type { ComplianceFilters } from '~/types/payment-compliance'

export const usePaymentCompliance = () => {
  const api = useApi()
  const { currentWorkspaceId } = useWorkspace()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchKYCList = async (filters: ComplianceFilters) => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentCompliance] Workspace ID is required')
      }
      return []
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentCompliance] Fetching KYC list...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/compliance/kyc`,
        })
      }

      const response = await api.get<{ data: any[] }>(
        `/api/payment/workspaces/${workspaceId}/compliance/kyc`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
          quiet: false,
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
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentCompliance] Workspace ID is required')
      }
      return []
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentCompliance] Fetching KYB list...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/compliance/kyb`,
        })
      }

      const response = await api.get<{ data: any[] }>(
        `/api/payment/workspaces/${workspaceId}/compliance/kyb`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
          quiet: false,
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
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentCompliance] Workspace ID is required')
      }
      return []
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentCompliance] Fetching AML checks...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/compliance/aml`,
        })
      }

      const response = await api.get<{ data: any[] }>(
        `/api/payment/workspaces/${workspaceId}/compliance/aml`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
          quiet: false,
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
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentCompliance] Workspace ID is required')
      }
      return []
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentCompliance] Fetching risk scores...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/compliance/risk-scores`,
        })
      }

      const response = await api.get<{ data: any[] }>(
        `/api/payment/workspaces/${workspaceId}/compliance/risk-scores`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
          quiet: false,
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

