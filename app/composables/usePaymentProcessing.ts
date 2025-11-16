import { ref, readonly } from '#imports'
import { useApi } from './useApi'
import { useNuiToasts } from '#imports'
import type { PaymentIntent, PaymentSession, PaymentConfirmation, ProcessingFilters } from '~/types/payment-processing'

export const usePaymentProcessing = () => {
  const api = useApi()
  const toasts = useNuiToasts()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchIntents = async (filters: ProcessingFilters) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: PaymentIntent[] }>(
        '/processing/intents',
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
        }
      )

      return response.data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch payment intents'
      return []
    } finally {
      isLoading.value = false
    }
  }

  const fetchSessions = async (filters: ProcessingFilters) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: PaymentSession[] }>(
        '/processing/sessions',
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
        }
      )

      return response.data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch payment sessions'
      return []
    } finally {
      isLoading.value = false
    }
  }

  const fetchConfirmations = async (filters: ProcessingFilters) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: PaymentConfirmation[] }>(
        '/processing/confirmations',
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
        }
      )

      return response.data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch payment confirmations'
      return []
    } finally {
      isLoading.value = false
    }
  }

  const cancelIntent = async (intentId: string) => {
    isLoading.value = true
    error.value = null

    try {
      await api.post(
        `/processing/intents/${intentId}/cancel`,
        {},
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      toasts.add({
        title: 'Intent canceled',
        description: 'Payment intent has been canceled successfully.',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })

      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to cancel intent'
      toasts.add({
        title: 'Cancel failed',
        description: error.value,
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      return false
    } finally {
      isLoading.value = false
    }
  }

  const fetchRefunds = async (filters: ProcessingFilters) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: any[] }>(
        '/processing/refunds',
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
        }
      )

      return response.data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch refunds'
      return []
    } finally {
      isLoading.value = false
    }
  }

  const fetchDisputes = async (filters: ProcessingFilters) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: any[] }>(
        '/processing/disputes',
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
        }
      )

      return response.data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch disputes'
      return []
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchIntents,
    fetchSessions,
    fetchConfirmations,
    fetchRefunds,
    fetchDisputes,
    cancelIntent,
  }
}

