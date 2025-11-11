import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { computed, ref } from '#imports'
import { useApi } from './useApi'
import { useSecurity } from './useSecurity'
import { useNuiToasts } from '#imports'
import type { PasswordChangePayload, PasswordChangeResponse } from '~/types/security'

const VALIDATION_TEXT = {
  LENGTH: 'Password must be at least 8 characters with letters and numbers',
  MATCH: 'Passwords do not match',
  LETTER: 'Password must contain at least one letter',
  NUMBER: 'Password must contain at least one number',
}

const schema = z
  .object({
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasPassword = Boolean(data.newPassword || data.confirmPassword)
    if (!hasPassword) {
      return
    }

    if (!data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_TEXT.LENGTH,
        path: ['newPassword'],
      })
      return
    }

    if (data.newPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_TEXT.LENGTH,
        path: ['newPassword'],
      })
    }

    if (!/[A-Za-z]/.test(data.newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_TEXT.LETTER,
        path: ['newPassword'],
      })
    }

    if (!/[0-9]/.test(data.newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_TEXT.NUMBER,
        path: ['newPassword'],
      })
    }

    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_TEXT.MATCH,
        path: ['confirmPassword'],
      })
    }
  })

export type PasswordFormValues = z.infer<typeof schema>

export const useSecurityPassword = () => {
  const api = useApi()
  const security = useSecurity()
  const toasts = useNuiToasts()

  const isSuccess = ref(false)

  const initialValues = computed<PasswordFormValues>(() => ({
    newPassword: '',
    confirmPassword: '',
  }))

  const onSuccess = () => {
    toasts.add({
      title: 'Password updated',
      description: 'Your password has been changed successfully.',
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })
    isSuccess.value = true
    setTimeout(() => {
      isSuccess.value = false
    }, 3000)
  }

  const submit = async (
    payload: PasswordFormValues,
    helpers: { resetForm: () => void; setFieldError: (field: keyof PasswordFormValues, message: string) => void },
  ) => {
    try {
      if (!payload.newPassword) {
        helpers.resetForm()
        return
      }

      const requestBody: PasswordChangePayload = {
        newPassword: payload.newPassword,
        confirmPassword: payload.confirmPassword ?? '',
      }

      const response = await api.put<PasswordChangeResponse, PasswordChangePayload>('/auth/change-password', requestBody, {
        base: 'internal',
        requiresAuth: true,
        quiet: true,
      })

      if (response?.success) {
        helpers.resetForm()
        onSuccess()
      }
    } catch (error: any) {
      const validationErrors = error?.data as Array<{ path: string[]; message: string }> | undefined
      if (Array.isArray(validationErrors)) {
        validationErrors.forEach((issue) => {
          const field = issue.path?.[0] as keyof PasswordFormValues | undefined
          if (field) {
            helpers.setFieldError(field, issue.message)
          }
        })
      }

      toasts.add({
        title: 'Unable to update password',
        description: security.escapeHtml(error?.message ?? 'Please try again later.'),
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
