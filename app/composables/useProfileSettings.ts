import { computed, ref, useNuiToasts } from '#imports'
import { useUserData } from './useUserData'
import { useAuth } from './useAuth'
import { useSecurity } from './useSecurity'
import type { FetchError } from 'ofetch'
import type { ProfileFormValues, ProfileValidationError } from '~/types/settings'
import { useApi } from './useApi'

export interface ProfileUpdateResult {
  validationErrors?: ProfileValidationError[]
}

export const useProfileSettings = () => {
  const api = useApi()
  const { user, refreshUser } = useUserData()
  const { checkAuth } = useAuth()
  const toasts = useNuiToasts()
  const security = useSecurity()

  const isSaving = ref(false)
  const error = ref<string | null>(null)

  const initialValues = computed<ProfileFormValues>(() => ({
    firstName: security.sanitizeInput(user.value?.firstName ?? '') || '',
    lastName: security.sanitizeInput(user.value?.lastName ?? '') || '',
  }))

  const updateProfile = async (values: ProfileFormValues): Promise<ProfileUpdateResult> => {
    if (isSaving.value) {
      return {}
    }

    isSaving.value = true
    error.value = null

    try {
      await api.put('/auth/profile', values, {
        base: 'internal',
        requiresAuth: true,
        quiet: true,
        retry: 0,
        timeout: 7000,
      })

      await refreshUser()
      await checkAuth()

      toasts.add({
        title: 'Profile updated',
        description: 'Your personal information is now up to date.',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })

      return {}
    } catch (err) {
      const fetchError = err as FetchError

      const validationErrors = (fetchError?.data as { errors?: ProfileValidationError[] } | undefined)?.errors

      if (validationErrors?.length) {
        return { validationErrors }
      }

      error.value = fetchError?.message ?? 'Failed to update profile.'

      toasts.add({
        title: 'Update failed',
        description: security.escapeHtml(error.value),
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })

      return {}
    } finally {
      isSaving.value = false
    }
  }

  return {
    user,
    initialValues,
    isSaving,
    error,
    updateProfile,
  }
}
