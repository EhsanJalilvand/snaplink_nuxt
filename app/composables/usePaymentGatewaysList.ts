import { ref, readonly } from '#imports'
import { useApi } from './useApi'
import { useNuiToasts } from '#imports'
import { useWorkspace } from './useWorkspace'
import type { MerchantGateway, GatewayFilters } from '~/types/payment-gateway'

export const usePaymentGatewaysList = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const { currentWorkspaceId } = useWorkspace()

  const gateways = ref<MerchantGateway[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchGateways = async (filters?: GatewayFilters) => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentGatewaysList] Workspace ID is required')
      }
      return []
    }

    isLoading.value = true
    error.value = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentGatewaysList] Fetching gateways...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/gateways`,
        })
      }

      const response = await api.get<{ data: MerchantGateway[] }>(
        `/api/payment/workspaces/${workspaceId}/gateways`,
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
          quiet: false,
        }
      )

      gateways.value = response.data || []
      return gateways.value
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch gateways'
      toasts.add({
        title: 'Failed to load',
        description: error.value,
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      return []
    } finally {
      isLoading.value = false
    }
  }

  return {
    gateways: readonly(gateways),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchGateways,
  }
}

