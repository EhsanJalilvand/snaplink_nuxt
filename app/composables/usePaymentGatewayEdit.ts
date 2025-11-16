import { ref, computed } from '#imports'
import { useApi } from './useApi'
import { useNuiToasts } from '#imports'
import type { GatewayUpdatePayload, MerchantGateway } from '~/types/payment-gateway'

export const usePaymentGatewayEdit = (gatewayId: string) => {
  const api = useApi()
  const toasts = useNuiToasts()

  const gateway = ref<MerchantGateway | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  const fetchGateway = async () => {
    if (isLoading.value || !gatewayId) return

    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: MerchantGateway }>(
        `/gateways/${gatewayId}`,
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      gateway.value = response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch gateway'
      toasts.add({
        title: 'Failed to load',
        description: error.value,
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
    } finally {
      isLoading.value = false
    }
  }

  const updateGateway = async (updates: GatewayUpdatePayload): Promise<boolean> => {
    if (isSaving.value || !gatewayId) return false

    isSaving.value = true
    error.value = null

    try {
      const response = await api.put<{ data: MerchantGateway }>(
        `/gateways/${gatewayId}`,
        updates,
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      gateway.value = response.data

      toasts.add({
        title: 'Gateway updated',
        description: 'Your gateway has been updated successfully.',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })

      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to update gateway'
      toasts.add({
        title: 'Update failed',
        description: error.value,
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      return false
    } finally {
      isSaving.value = false
    }
  }

  const deleteGateway = async (): Promise<boolean> => {
    if (isSaving.value || !gatewayId) return false

    isSaving.value = true
    error.value = null

    try {
      await api.delete(
        `/gateways/${gatewayId}`,
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      toasts.add({
        title: 'Gateway deleted',
        description: 'Your gateway has been deleted successfully.',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })

      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to delete gateway'
      toasts.add({
        title: 'Deletion failed',
        description: error.value,
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    gateway: readonly(gateway),
    isLoading: readonly(isLoading),
    isSaving: readonly(isSaving),
    error: readonly(error),
    fetchGateway,
    updateGateway,
    deleteGateway,
  }
}

