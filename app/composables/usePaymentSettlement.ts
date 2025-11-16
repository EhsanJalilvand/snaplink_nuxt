import { ref, readonly } from '#imports'
import { useApi } from './useApi'
import type { SettlementLog, SettlementFee, EscrowTransaction } from '~/types/payment-settlement'

export const usePaymentSettlement = () => {
  const api = useApi()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchSettlementLogs = async (gatewayId?: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: SettlementLog[] }>(
        '/settlements/logs',
        {
          base: 'gateway',
          requiresAuth: true,
          params: gatewayId ? { gatewayId } : {},
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
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: SettlementFee[] }>(
        '/settlements/fees',
        {
          base: 'gateway',
          requiresAuth: true,
          params: transactionId ? { transactionId } : {},
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
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: EscrowTransaction[] }>(
        '/settlements/escrow',
        {
          base: 'gateway',
          requiresAuth: true,
          params: gatewayId ? { gatewayId } : {},
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

