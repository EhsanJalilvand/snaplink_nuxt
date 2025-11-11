import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { computed, reactive, ref } from '#imports'
import { useNuiToasts } from '#imports'
import { useApi } from './useApi'
import { useSecurity } from './useSecurity'
import type {
  SecurityPasswordFormValues,
  SecurityPasswordResponse,
  TwoFactorSetupResponse,
  TwoFactorStatus,
  TwoFactorStatusResponse,
  TwoFactorVerifyResponse,
} from '~/types/security'

const PASSWORD_VALIDATION = {
  MIN_LENGTH: 'Password must be at least 8 characters with letters and numbers',
  MUST_MATCH: 'Passwords do not match',
  LETTER_REQUIRED: 'Password must contain at least one letter',
  NUMBER_REQUIRED: 'Password must contain at least one number',
}

const passwordSchema = z
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
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['newPassword'], message: PASSWORD_VALIDATION.MIN_LENGTH })
      return
    }

    if (data.newPassword.length < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['newPassword'], message: PASSWORD_VALIDATION.MIN_LENGTH })
    }

    if (!/[A-Za-z]/.test(data.newPassword)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['newPassword'], message: PASSWORD_VALIDATION.LETTER_REQUIRED })
    }

    if (!/[0-9]/.test(data.newPassword)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['newPassword'], message: PASSWORD_VALIDATION.NUMBER_REQUIRED })
    }

    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: PASSWORD_VALIDATION.MUST_MATCH })
    }
  })

interface TwoFactorWizardStep {
  id: number
  meta: {
    name: string
    title: string
    subtitle?: string
  }
}

interface TwoFactorWizardState {
  steps: TwoFactorWizardStep[]
  currentStepId: number
  show: boolean
  loading: boolean
  data: {
    qrCode: string
    secret: string
    flowId: string
    csrfToken: string
    verifyCode: string
  }
  errors: Record<string, string>
}

const WIZARD_STEPS: TwoFactorWizardState['steps'] = [
  {
    id: 0,
    meta: {
      name: 'Scan QR Code',
      title: 'Scan QR Code',
      subtitle: 'Open your authenticator app and scan the QR code below',
    },
  },
  {
    id: 1,
    meta: {
      name: 'Verify Code',
      title: 'Enter Verification Code',
      subtitle: 'Enter the 6-digit code from your authenticator app',
    },
  },
  {
    id: 2,
    meta: {
      name: 'Success',
      title: '2FA Enabled Successfully!',
      subtitle: 'Your account is now protected with two-factor authentication',
    },
  },
]

const initialWizardState = (): TwoFactorWizardState => ({
  steps: WIZARD_STEPS,
  currentStepId: 0,
  show: false,
  loading: false,
  data: {
    qrCode: '',
    secret: '',
    flowId: '',
    csrfToken: '',
    verifyCode: '',
  },
  errors: {},
})

export const useSecuritySettings = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const security = useSecurity()

  const isPasswordSuccess = ref(false)
  const twoFactor = ref<TwoFactorStatus>({ enabled: false })
  const twoFactorLoading = ref(false)
  const twoFactorSetupLoading = ref(false)

  const wizard = reactive(initialWizardState())

  const passwordSchemaTyped = toTypedSchema(passwordSchema)
  const passwordInitialValues: SecurityPasswordFormValues = {
    newPassword: '',
    confirmPassword: '',
  }

  const wizardTotalSteps = computed(() => wizard.steps.length)
  const wizardCurrentStep = computed(() => wizard.steps[wizard.currentStepId])
  const wizardIsLastStep = computed(() => wizard.currentStepId === wizard.steps.length - 1)

  const resetWizard = () => {
    Object.assign(wizard, initialWizardState())
  }

  const closeWizard = () => {
    wizard.show = false
    wizard.loading = false
    wizard.currentStepId = 0
    wizard.data = {
      qrCode: '',
      secret: '',
      flowId: '',
      csrfToken: '',
      verifyCode: '',
    }
    wizard.errors = {}
  }

  const fetchTwoFactorStatus = async () => {
    twoFactorLoading.value = true
    try {
      const response = await api.get<TwoFactorStatusResponse>('/auth/two-factor/status', {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
      })

      if (response?.success) {
        twoFactor.value = {
          enabled: response.enabled,
          updatedAt: response.updated_at,
        }
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useSecuritySettings] Failed to fetch 2FA status', error)
      }
      toasts.add({
        title: 'Security status unavailable',
        description: 'Unable to verify two-factor status. Showing cached state.',
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      twoFactor.value = {
        ...twoFactor.value,
        enabled: false,
      }
    } finally {
      twoFactorLoading.value = false
    }
  }

  const handlePasswordSubmit = async (
    values: SecurityPasswordFormValues,
    setFieldError: (field: keyof SecurityPasswordFormValues, message: string) => void,
  ) => {
    isPasswordSuccess.value = false

    if (!values.newPassword) {
      isPasswordSuccess.value = true
      return
    }

    try {
      const response = await api.put<SecurityPasswordResponse, SecurityPasswordFormValues>('/auth/change-password', values, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
      })

      if (response?.success) {
        toasts.add({
          title: 'Password updated',
          description: 'Your password was changed successfully.',
          icon: 'ph:check',
          color: 'success',
          progress: true,
        })
        isPasswordSuccess.value = true
        return
      }

      toasts.add({
        title: 'Update failed',
        description: 'Unable to confirm password change. Please try again later.',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
    } catch (error: any) {
      const dataErrors = error?.data as Array<{ path: string[]; message: string }> | undefined
      if (Array.isArray(dataErrors)) {
        dataErrors.forEach((item) => {
          const field = item.path?.[0] as keyof SecurityPasswordFormValues | undefined
          if (field) {
            setFieldError(field, item.message)
          }
        })
        return
      }

      const description = security.escapeHtml(
        error?.data?.message ?? error?.statusMessage ?? error?.message ?? 'Failed to update password.',
      )

      setFieldError('newPassword', description)
      toasts.add({
        title: 'Update failed',
        description,
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
    }
  }

  const startTwoFactorSetup = async () => {
    twoFactorSetupLoading.value = true
    wizard.errors = {}

    try {
      const response = await api.post<TwoFactorSetupResponse>('/auth/two-factor/setup', {}, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
      })

      if (response?.success) {
        if (response.configured) {
          toasts.add({
            title: 'Already enabled',
            description: 'Two-factor authentication is already active on your account.',
            icon: 'ph:info',
            color: 'info',
            progress: true,
          })
          await fetchTwoFactorStatus()
          return
        }

        wizard.data = {
          qrCode: response.qrCode ?? '',
          secret: response.secret ?? '',
          flowId: response.flowId,
          csrfToken: response.csrfToken,
          verifyCode: '',
        }
        wizard.currentStepId = 0
        wizard.show = true
      }
    } catch (error: any) {
      const description = security.escapeHtml(error?.message ?? 'Failed to initiate 2FA setup.')
      toasts.add({
        title: 'Setup failed',
        description,
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
    } finally {
      twoFactorSetupLoading.value = false
    }
  }

  const verifyTwoFactorCode = async () => {
    if (!wizard.data.verifyCode || wizard.data.verifyCode.length !== 6) {
      wizard.errors = { ...wizard.errors, verifyCode: 'Please enter a valid 6-digit code' }
      return
    }

    wizard.loading = true
    wizard.errors = {}

    try {
      const response = await api.post<TwoFactorVerifyResponse>('/auth/two-factor/verify', {
        flow: wizard.data.flowId,
        code: wizard.data.verifyCode,
        csrf_token: wizard.data.csrfToken,
      }, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
      })

      if (response?.success) {
        toasts.add({
          title: 'Two-factor enabled',
          description: 'Authenticator app successfully linked to your account.',
          icon: 'ph:check',
          color: 'success',
          progress: true,
        })

        wizard.currentStepId = 2
        twoFactor.value.enabled = true

        setTimeout(() => {
          closeWizard()
        }, 2000)
      } else {
        wizard.errors = { verifyCode: 'Failed to verify TOTP code. Try again.' }
      }
    } catch (error: any) {
      const description = security.escapeHtml(error?.message ?? 'Failed to verify code.')
      wizard.errors = { verifyCode: description }
      toasts.add({
        title: 'Verification failed',
        description,
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
    } finally {
      wizard.loading = false
      wizard.data.verifyCode = ''
    }
  }

  const toggleTwoFactor = async () => {
    if (twoFactor.value.enabled) {
      twoFactorLoading.value = true
      try {
        const response = await api.put('/auth/two-factor', { enabled: false }, {
          base: 'gateway',
          requiresAuth: true,
          quiet: true,
          timeout: 7000,
        })

        if ((response as any)?.success) {
          twoFactor.value.enabled = false
          toasts.add({
            title: 'Two-factor disabled',
            description: 'Authenticator requirement removed from your account.',
            icon: 'ph:check',
            progress: true,
          })
        }
      } catch (error: any) {
        const description = security.escapeHtml(error?.message ?? 'Failed to disable two-factor authentication.')
        toasts.add({
          title: 'Disable failed',
          description,
          icon: 'ph:warning',
          color: 'danger',
          progress: true,
        })
      } finally {
        twoFactorLoading.value = false
      }
    } else {
      await startTwoFactorSetup()
    }
  }

  const copySecret = async () => {
    if (!wizard.data.secret || !import.meta.client) {
      return
    }

    try {
      await navigator.clipboard.writeText(wizard.data.secret)
      toasts.add({
        title: 'Secret copied',
        description: 'Secret code copied to your clipboard.',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })
    } catch {
      toasts.add({
        title: 'Copy failed',
        description: 'Unable to copy the secret code. Copy manually instead.',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
    }
  }

  const nextWizardStep = () => {
    if (wizard.currentStepId < wizard.steps.length - 1) {
      wizard.currentStepId += 1
    }
  }

  const previousWizardStep = () => {
    if (wizard.currentStepId > 0) {
      wizard.currentStepId -= 1
    }
  }

  const updateVerifyCode = (value: string) => {
    wizard.data.verifyCode = value
  }

  return {
    passwordSchema: passwordSchemaTyped,
    passwordInitialValues,
    handlePasswordSubmit,
    isPasswordSuccess,
    twoFactor,
    twoFactorLoading,
    twoFactorSetupLoading,
    fetchTwoFactorStatus,
    toggleTwoFactor,
    startTwoFactorSetup,
    verifyTwoFactorCode,
    copySecret,
    updateVerifyCode,
    nextWizardStep,
    previousWizardStep,
    closeWizard,
    wizard,
    wizardTotalSteps,
    wizardCurrentStep,
    wizardIsLastStep,
  }
}
