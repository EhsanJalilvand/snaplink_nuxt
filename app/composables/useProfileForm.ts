import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { computed, ref } from '#imports'
import { useNuiToasts } from '#imports'
import { useApi } from './useApi'
import { useSecurity } from './useSecurity'
import { useUserData } from './useUserData'
import { useAuth } from './useAuth'
import type { ProfileFormValues, ProfileUpdateResponse } from '~/types/profile'

const VALIDATION_TEXT = {
  FIRSTNAME_REQUIRED: 'First name is required',
  FIRSTNAME_TOO_LONG: 'First name is too long',
  LASTNAME_TOO_LONG: 'Last name is too long',
}

const schema = z.object({
  firstName: z
    .string()
    .min(1, VALIDATION_TEXT.FIRSTNAME_REQUIRED)
    .max(100, VALIDATION_TEXT.FIRSTNAME_TOO_LONG),
  lastName: z
    .string()
    .max(100, VALIDATION_TEXT.LASTNAME_TOO_LONG)
    .optional()
    .transform((value) => value || ''),
})

export const useProfileForm = () => {
  const toasts = useNuiToasts()
  const api = useApi()
  const security = useSecurity()
  const { user, refreshUser } = useUserData()
  const { checkAuth } = useAuth()

  const isSuccess = ref(false)

  const initialValues = computed<ProfileFormValues>(() => ({
    firstName: user.value?.firstName ?? '',
    lastName: user.value?.lastName ?? '',
  }))

  const handleSuccess = async () => {
    await refreshUser()
    await checkAuth()

    toasts.add({
      title: 'Profile updated',
      description: 'Your profile information is now in sync.',
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })

    isSuccess.value = true
    setTimeout(() => {
      isSuccess.value = false
    }, 3000)
  }

  const submit = async (values: ProfileFormValues, setFieldError: (field: keyof ProfileFormValues, message: string) => void) => {
    isSuccess.value = false

    try {
      const payload: ProfileFormValues = {
        firstName: values.firstName,
        lastName: values.lastName?.trim() || undefined,
      }

      const response = await api.put<ProfileUpdateResponse, ProfileFormValues>('/auth/profile', payload, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
      })

      if (response?.success) {
        await handleSuccess()
      }
    } catch (error: any) {
      const dataErrors = error?.data as Array<{ path: string[]; message: string }> | undefined
      if (Array.isArray(dataErrors)) {
        dataErrors.forEach((item) => {
          const field = item.path?.[0] as keyof ProfileFormValues | undefined
          if (field) {
            setFieldError(field, item.message)
          }
        })
      }

      toasts.add({
        title: 'Update failed',
        description: security.escapeHtml(error?.message ?? 'Unable to update profile at this time.'),
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
    }
  }

  return {
    schema: toTypedSchema(schema),
    initialValues,
    submit,
    isSuccess,
  }
}
