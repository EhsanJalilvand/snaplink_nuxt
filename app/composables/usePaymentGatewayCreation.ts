import { ref, computed } from '#imports'
import { useApi } from './useApi'
import { useNuiToasts } from '#imports'
import type { GatewayCreatePayload, MerchantGateway } from '~/types/payment-gateway'

export const usePaymentGatewayCreation = () => {
  const api = useApi()
  const toasts = useNuiToasts()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const payload = ref<GatewayCreatePayload>({
    name: '',
    description: '',
    businessInfo: {
      legalName: '',
      displayName: '',
      category: '',
      businessType: '',
      website: '',
      country: '',
    },
    settings: {
      allowedCurrencies: ['USD'],
      maxTransactionAmount: 10000,
      dailyVolumeLimit: 100000,
      monthlyVolumeLimit: 1000000,
      riskProfile: 'adaptive',
      autoSettlement: true,
      settlementCurrency: 'USD',
    },
  })

  const createGateway = async (): Promise<MerchantGateway | null> => {
    if (isLoading.value) return null

    isLoading.value = true
    error.value = null

    try {
      const response = await api.post<{ data: MerchantGateway }>(
        '/gateways',
        payload.value,
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      toasts.add({
        title: 'Gateway created',
        description: 'Your gateway has been created successfully.',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })

      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to create gateway'
      toasts.add({
        title: 'Creation failed',
        description: error.value,
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      return null
    } finally {
      isLoading.value = false
    }
  }

  const validate = (): boolean => {
    if (!payload.value.name.trim()) {
      error.value = 'Gateway name is required'
      return false
    }
    if (!payload.value.businessInfo.legalName.trim()) {
      error.value = 'Legal business name is required'
      return false
    }
    if (!payload.value.businessInfo.displayName.trim()) {
      error.value = 'Display name is required'
      return false
    }
    if (!payload.value.businessInfo.category) {
      error.value = 'Business category is required'
      return false
    }
    if (!payload.value.businessInfo.businessType) {
      error.value = 'Business type is required'
      return false
    }
    if (!payload.value.businessInfo.country) {
      error.value = 'Country is required'
      return false
    }

    error.value = null
    return true
  }

  const reset = () => {
    payload.value = {
      name: '',
      description: '',
      businessInfo: {
        legalName: '',
        displayName: '',
        category: '',
        businessType: '',
        website: '',
        country: '',
      },
      settings: {
        allowedCurrencies: ['USD'],
        maxTransactionAmount: 10000,
        dailyVolumeLimit: 100000,
        monthlyVolumeLimit: 1000000,
        riskProfile: 'adaptive',
        autoSettlement: true,
        settlementCurrency: 'USD',
      },
    }
    error.value = null
  }

  return {
    payload,
    isLoading: readonly(isLoading),
    error: readonly(error),
    createGateway,
    validate,
    reset,
  }
}

