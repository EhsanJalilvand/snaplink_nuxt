import { ref } from '#imports'
import { useApi } from './useApi'
import { useNuiToasts } from '#imports'
import type { GatewayApprovalPayload, MerchantGateway } from '~/types/payment-gateway'

export const usePaymentGatewayApproval = (gatewayId: string) => {
  const api = useApi()
  const toasts = useNuiToasts()

  const isApproving = ref(false)
  const isRejecting = ref(false)
  const error = ref<string | null>(null)

  const approveGateway = async (notes?: string): Promise<MerchantGateway | null> => {
    if (isApproving.value || !gatewayId) return null

    isApproving.value = true
    error.value = null

    try {
      const payload: GatewayApprovalPayload = {
        approved: true,
        notes,
      }

      const response = await api.post<{ data: MerchantGateway }>(
        `/gateways/${gatewayId}/approve`,
        payload,
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      toasts.add({
        title: 'Gateway approved',
        description: 'The gateway has been approved successfully.',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })

      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to approve gateway'
      toasts.add({
        title: 'Approval failed',
        description: error.value,
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      return null
    } finally {
      isApproving.value = false
    }
  }

  const rejectGateway = async (reason: GatewayApprovalPayload['reason'], notes?: string): Promise<MerchantGateway | null> => {
    if (isRejecting.value || !gatewayId) return null

    isRejecting.value = true
    error.value = null

    try {
      const payload: GatewayApprovalPayload = {
        approved: false,
        reason,
        notes,
      }

      const response = await api.post<{ data: MerchantGateway }>(
        `/gateways/${gatewayId}/reject`,
        payload,
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      toasts.add({
        title: 'Gateway rejected',
        description: 'The gateway has been rejected.',
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })

      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to reject gateway'
      toasts.add({
        title: 'Rejection failed',
        description: error.value,
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      return null
    } finally {
      isRejecting.value = false
    }
  }

  const suspendGateway = async (reason?: string): Promise<MerchantGateway | null> => {
    if (isApproving.value || !gatewayId) return null

    isApproving.value = true
    error.value = null

    try {
      const response = await api.post<{ data: MerchantGateway }>(
        `/gateways/${gatewayId}/suspend`,
        { reason },
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      toasts.add({
        title: 'Gateway suspended',
        description: 'The gateway has been suspended.',
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })

      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to suspend gateway'
      toasts.add({
        title: 'Suspension failed',
        description: error.value,
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      return null
    } finally {
      isApproving.value = false
    }
  }

  const activateGateway = async (): Promise<MerchantGateway | null> => {
    if (isApproving.value || !gatewayId) return null

    isApproving.value = true
    error.value = null

    try {
      const response = await api.post<{ data: MerchantGateway }>(
        `/gateways/${gatewayId}/activate`,
        {},
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      toasts.add({
        title: 'Gateway activated',
        description: 'The gateway has been activated successfully.',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })

      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to activate gateway'
      toasts.add({
        title: 'Activation failed',
        description: error.value,
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      return null
    } finally {
      isApproving.value = false
    }
  }

  return {
    isApproving: readonly(isApproving),
    isRejecting: readonly(isRejecting),
    error: readonly(error),
    approveGateway,
    rejectGateway,
    suspendGateway,
    activateGateway,
  }
}

