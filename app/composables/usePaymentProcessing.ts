import { ref, readonly } from '#imports'
import { useApi } from './useApi'
import { useNuiToasts } from '#imports'
import { useWorkspace } from './useWorkspace'
import type { PaymentIntent, PaymentSession, PaymentConfirmation, ProcessingFilters } from '~/types/payment-processing'

export const usePaymentProcessing = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const { currentWorkspaceId } = useWorkspace()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchIntents = async (filters: ProcessingFilters) => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentProcessing] Workspace ID is required')
      }
      return []
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentProcessing] Fetching intents...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/processing/intents`,
        })
      }

      const response = await api.get<{ data: PaymentIntent[] }>(
        `/api/payment/workspaces/${workspaceId}/processing/intents`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
          quiet: false,
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
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentProcessing] Workspace ID is required')
      }
      return []
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentProcessing] Fetching sessions...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/processing/sessions`,
        })
      }

      const response = await api.get<{ data: PaymentSession[] }>(
        `/api/payment/workspaces/${workspaceId}/processing/sessions`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
          quiet: false,
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
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentProcessing] Workspace ID is required')
      }
      return []
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentProcessing] Fetching confirmations...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/processing/confirmations`,
        })
      }

      const response = await api.get<{ data: PaymentConfirmation[] }>(
        `/api/payment/workspaces/${workspaceId}/processing/confirmations`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
          quiet: false,
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
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentProcessing] Workspace ID is required')
      }
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentProcessing] Canceling intent...', {
          workspaceId,
          intentId,
          endpoint: `/api/payment/workspaces/${workspaceId}/processing/intents/${intentId}/cancel`,
        })
      }

      await api.post(
        `/api/payment/workspaces/${workspaceId}/processing/intents/${intentId}/cancel`,
        {},
        {
          base: 'gateway',
          requiresAuth: true,
          quiet: false,
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
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentProcessing] Workspace ID is required')
      }
      return []
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentProcessing] Fetching refunds...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/processing/refunds`,
        })
      }

      const response = await api.get<{ data: any[] }>(
        `/api/payment/workspaces/${workspaceId}/processing/refunds`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
          quiet: false,
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
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentProcessing] Workspace ID is required')
      }
      return []
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentProcessing] Fetching disputes...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/processing/disputes`,
        })
      }

      const response = await api.get<{ data: any[] }>(
        `/api/payment/workspaces/${workspaceId}/processing/disputes`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
          quiet: false,
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

