import { readonly } from 'vue'

export interface TwoFAWizardData {
  qrCode: string
  secret: string
  flowId: string
  csrfToken: string
  verifyCode: string
}

export interface TwoFAWizardStep {
  id: number
  meta: {
    name: string
    title: string
    subtitle?: string
  }
  validate?: (data: TwoFAWizardData) => boolean | Promise<boolean>
}

export function use2FAWizard() {
  const steps: TwoFAWizardStep[] = [
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
      validate: (data) => {
        return !!data.verifyCode && data.verifyCode.length === 6
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

  const currentStepId = ref(0)
  const totalSteps = computed(() => steps.length)
  const currentStep = computed(() => steps[currentStepId.value])
  const progress = computed(() => ((currentStepId.value + 1) / totalSteps.value) * 100)
  const isLastStep = computed(() => currentStepId.value === totalSteps.value - 1)

  const data = ref<TwoFAWizardData>({
    qrCode: '',
    secret: '',
    flowId: '',
    csrfToken: '',
    verifyCode: '',
  })

  const loading = ref(false)
  const errors = ref<Record<string, string>>({})

  function getStep(id: number) {
    return steps[id]
  }

  function getNextStep() {
    return getStep(currentStepId.value + 1)
  }

  function getPrevStep() {
    return getStep(currentStepId.value - 1)
  }

  async function goToStep(stepId: number) {
    if (stepId >= 0 && stepId < totalSteps.value) {
      currentStepId.value = stepId
    }
  }

  async function nextStep() {
    const step = currentStep.value
    if (step?.validate) {
      const isValid = await step.validate(data.value)
      if (!isValid) {
        errors.value.verifyCode = 'Please enter a valid 6-digit code'
        return false
      }
    }

    if (currentStepId.value < totalSteps.value - 1) {
      currentStepId.value++
      errors.value = {}
      return true
    }
    return false
  }

  function prevStep() {
    if (currentStepId.value > 0) {
      currentStepId.value--
      errors.value = {}
    }
  }

  function reset() {
    currentStepId.value = 0
    data.value = {
      qrCode: '',
      secret: '',
      flowId: '',
      csrfToken: '',
      verifyCode: '',
    }
    errors.value = {}
    loading.value = false
  }

  function setData(newData: Partial<TwoFAWizardData>) {
    data.value = { ...data.value, ...newData }
  }

  return {
    steps,
    totalSteps,
    currentStepId: readonly(currentStepId),
    currentStep,
    progress,
    isLastStep,
    data: readonly(data),
    loading: readonly(loading),
    errors: readonly(errors),
    getStep,
    getNextStep,
    getPrevStep,
    goToStep,
    nextStep,
    prevStep,
    reset,
    setData,
    setLoading: (value: boolean) => { loading.value = value },
    setError: (field: string, message: string) => { errors.value[field] = message },
    clearError: (field?: string) => {
      if (field) {
        delete errors.value[field]
      } else {
        errors.value = {}
      }
    },
  }
}

