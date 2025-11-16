import { ref, readonly } from '#imports'
import { useApi } from './useApi'
import { useWorkspace } from './useWorkspace'
import type { SettlementLog, SettlementFee, EscrowTransaction } from '~/types/payment-settlement'

export const usePaymentSettlement = () => {
  const api = useApi()
  const { currentWorkspaceId } = useWorkspace()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchSettlementLogs = async (gatewayId?: string) => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentSettlement] Workspace ID is required')
      }
      return []
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentSettlement] Fetching settlement logs...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/settlements/logs`,
        })
      }

      const response = await api.get<{ data: SettlementLog[] }>(
        `/api/payment/workspaces/${workspaceId}/settlements/logs`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: gatewayId ? { gatewayId } : {},
          quiet: false,
        }
      )

      return response.data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch settlement logs'
      return []
    } finally {
      isLoading.value = false
    }
  }

  const fetchSettlementFees = async (transactionId?: string) => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentSettlement] Workspace ID is required')
      }
      return []
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentSettlement] Fetching settlement fees...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/settlements/fees`,
        })
      }

      const response = await api.get<{ data: SettlementFee[] }>(
        `/api/payment/workspaces/${workspaceId}/settlements/fees`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: transactionId ? { transactionId } : {},
          quiet: false,
        }
      )

      return response.data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch settlement fees'
      return []
    } finally {
      isLoading.value = false
    }
  }

  const fetchEscrowTransactions = async (gatewayId?: string) => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentSettlement] Workspace ID is required')
      }
      return []
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentSettlement] Fetching escrow transactions...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/settlements/escrow`,
        })
      }

      const response = await api.get<{ data: EscrowTransaction[] }>(
        `/api/payment/workspaces/${workspaceId}/settlements/escrow`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: gatewayId ? { gatewayId } : {},
          quiet: false,
        }
      )

      return response.data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch escrow transactions'
      return []
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchSettlementLogs,
    fetchSettlementFees,
    fetchEscrowTransactions,
  }
}

