import { ref, readonly } from '#imports'
import { useApi } from './useApi'
import { useNuiToasts } from '#imports'
import type { MerchantGateway, GatewayFilters } from '~/types/payment-gateway'

export const usePaymentGatewaysList = () => {
  const api = useApi()
  const toasts = useNuiToasts()

  const gateways = ref<MerchantGateway[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchGateways = async (filters?: GatewayFilters) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: MerchantGateway[] }>(
        '/gateways',
        {
          base: 'gateway',
          requiresAuth: true,
          params: filters,
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

