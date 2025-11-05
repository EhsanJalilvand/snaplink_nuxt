<script setup lang="ts">
import { use2FAWizard } from '~/composables/use2FAWizard'

const props = withDefaults(
  defineProps<{
    qrCode?: string
    secret?: string
    flowId?: string
    csrfToken?: string
  }>(),
  {
    qrCode: '',
    secret: '',
    flowId: '',
    csrfToken: '',
  },
)

const emits = defineEmits<{
  close: []
  verify: [code: string]
}>()

const wizard = use2FAWizard()
const toaster = useNuiToasts()

// Initialize wizard with props
onMounted(() => {
  if (props.qrCode) {
    wizard.setData({
      qrCode: props.qrCode,
      secret: props.secret || '',
      flowId: props.flowId || '',
      csrfToken: props.csrfToken || '',
    })
    wizard.goToStep(0)
  }
})

// Copy secret to clipboard
const copySecret = async () => {
  if (wizard.data.value.secret) {
    try {
      await navigator.clipboard.writeText(wizard.data.value.secret)
      toaster.add({
        title: 'Copied',
        description: 'Secret code copied to clipboard',
        icon: 'ph:check',
        progress: true,
      })
    } catch (error) {
      toaster.add({
        title: 'Error',
        description: 'Failed to copy secret code',
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
    }
  }
}

// Handle verify button click
const handleVerify = () => {
  if (wizard.data.value.verifyCode && wizard.data.value.verifyCode.length === 6) {
    emits('verify', wizard.data.value.verifyCode)
  }
}

// Handle continue button
const handleContinue = async () => {
  const success = await wizard.nextStep()
  if (!success) {
    wizard.setError('verifyCode', 'Please enter a valid 6-digit code')
  }
}

// Handle wizard close
const handleClose = () => {
  wizard.reset()
  emits('close')
}
</script>

<template>
  <div class="flex h-full flex-col bg-white dark:bg-muted-900">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-muted-200 p-6 dark:border-muted-700">
      <div class="flex items-center gap-3">
        <Icon name="ph:shield-check" class="size-6 text-primary-500" />
        <div>
          <BaseHeading as="h3" size="lg" weight="semibold">
            Setup Two-Factor Authentication
          </BaseHeading>
          <BaseParagraph size="xs" class="text-muted-500">
            Step {{ wizard.currentStepId + 1 }} of {{ wizard.totalSteps }}
          </BaseParagraph>
        </div>
      </div>
      <!-- Progress Steps -->
      <div class="flex items-center gap-2">
        <div
          v-for="(step, index) in wizard.steps"
          :key="step.id"
          class="flex items-center"
        >
          <div
            class="flex size-8 items-center justify-center rounded-full border-2 transition-colors"
            :class="index <= wizard.currentStepId
              ? 'border-primary-500 bg-primary-500 text-white'
              : 'border-muted-300 text-muted-400 dark:border-muted-700'"
          >
            <Icon
              v-if="index < wizard.currentStepId"
              name="ph:check"
              class="size-4"
            />
            <span v-else class="text-sm font-medium">{{ index + 1 }}</span>
          </div>
          <div
            v-if="index < wizard.totalSteps - 1"
            class="h-0.5 w-8 transition-colors"
            :class="index < wizard.currentStepId
              ? 'bg-primary-500'
              : 'bg-muted-300 dark:bg-muted-700'"
          />
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="space-y-6">
        <!-- Step 1: QR Code -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-4"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-4"
        >
          <div v-if="wizard.currentStepId === 0" key="step-0" class="space-y-6">
            <div class="text-center">
              <BaseHeading as="h4" size="md" weight="medium" class="mb-2">
                {{ wizard.currentStep.meta.title }}
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500">
                {{ wizard.currentStep.meta.subtitle }}
              </BaseParagraph>
            </div>

            <!-- QR Code -->
            <div class="flex flex-col items-center justify-center">
              <div v-if="wizard.data.value.qrCode" class="rounded-lg border border-muted-200 bg-white p-6 dark:border-muted-700 dark:bg-muted-800">
                <img :src="wizard.data.value.qrCode" alt="TOTP QR Code" class="mx-auto max-w-xs">
              </div>
              <div v-else class="flex h-64 items-center justify-center rounded-lg border border-muted-200 bg-muted-50 dark:border-muted-700 dark:bg-muted-800">
                <BaseParagraph size="sm" class="text-muted-500">
                  Loading QR code...
                </BaseParagraph>
              </div>
            </div>

            <!-- Manual Entry (if secret is available) -->
            <div v-if="wizard.data.value.secret" class="rounded-lg border border-muted-200 bg-muted-50 p-4 dark:border-muted-700 dark:bg-muted-800">
              <BaseHeading as="h4" size="sm" weight="medium" class="mb-2">
                Can't scan? Enter this code manually
              </BaseHeading>
              <div class="flex items-center gap-2">
                <code class="flex-1 rounded bg-white px-3 py-2 text-sm font-mono dark:bg-muted-900">{{ wizard.data.value.secret }}</code>
                <BaseButton
                  size="sm"
                  variant="pastel"
                  @click="copySecret"
                >
                  <Icon name="ph:copy" class="size-4" />
                </BaseButton>
              </div>
            </div>

            <!-- Instructions -->
            <div class="rounded-lg border border-muted-200 bg-muted-50 p-4 dark:border-muted-700 dark:bg-muted-800">
              <BaseHeading as="h4" size="sm" weight="medium" class="mb-2">
                Popular Authenticator Apps
              </BaseHeading>
              <ul class="space-y-2 text-sm text-muted-600 dark:text-muted-400">
                <li class="flex items-center gap-2">
                  <Icon name="ph:check" class="size-4 text-primary-500" />
                  <span>Google Authenticator</span>
                </li>
                <li class="flex items-center gap-2">
                  <Icon name="ph:check" class="size-4 text-primary-500" />
                  <span>Microsoft Authenticator</span>
                </li>
                <li class="flex items-center gap-2">
                  <Icon name="ph:check" class="size-4 text-primary-500" />
                  <span>Authy</span>
                </li>
              </ul>
            </div>
          </div>
        </Transition>

        <!-- Step 2: Verify Code -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-4"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-4"
        >
          <div v-if="wizard.currentStepId === 1" key="step-1" class="space-y-6">
            <div class="text-center">
              <BaseHeading as="h4" size="md" weight="medium" class="mb-2">
                {{ wizard.currentStep.meta.title }}
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500">
                {{ wizard.currentStep.meta.subtitle }}
              </BaseParagraph>
            </div>

            <div class="flex justify-center">
              <div class="w-full max-w-xs">
                <BaseField
                  label="Verification Code"
                  description="Enter the code from your authenticator app"
                  :error="wizard.errors.verifyCode"
                >
                  <TairoInput
                    v-model="wizard.data.value.verifyCode"
                    type="text"
                    placeholder="000000"
                    maxlength="6"
                    pattern="[0-9]{6}"
                    autocomplete="off"
                    rounded="lg"
                    icon="ph:key"
                    class="text-center text-2xl font-mono tracking-widest"
                    @keyup.enter="handleVerify"
                  />
                </BaseField>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Step 3: Success -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div v-if="wizard.currentStepId === 2" key="step-2" class="space-y-6">
            <div class="text-center">
              <div class="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/20">
                <Icon name="ph:check-circle-fill" class="size-12 text-success-600 dark:text-success-400" />
              </div>
              <BaseHeading as="h4" size="md" weight="medium" class="mb-2">
                {{ wizard.currentStep.meta.title }}
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500">
                {{ wizard.currentStep.meta.subtitle }}
              </BaseParagraph>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between border-t border-muted-200 p-6 dark:border-muted-700">
      <BaseButton
        v-if="wizard.currentStepId > 0 && wizard.currentStepId < 2"
        variant="pastel"
        @click="wizard.prevStep"
      >
        <Icon name="ph:arrow-left" class="size-4" />
        <span>Previous</span>
      </BaseButton>
      <div v-else />

      <div class="flex items-center gap-2">
        <BaseButton
          v-if="!wizard.isLastStep"
          variant="pastel"
          @click="handleClose"
        >
          Cancel
        </BaseButton>
        <BaseButton
          v-if="wizard.currentStepId === 0"
          variant="primary"
          @click="handleContinue"
        >
          <span>Continue</span>
          <Icon name="ph:arrow-right" class="size-4" />
        </BaseButton>
        <BaseButton
          v-if="wizard.currentStepId === 1"
          variant="primary"
          :loading="wizard.loading"
          :disabled="!wizard.data.value.verifyCode || wizard.data.value.verifyCode.length !== 6"
          @click="handleVerify"
        >
          <Icon name="ph:check" class="size-4" />
          <span>Verify & Enable</span>
        </BaseButton>
        <BaseButton
          v-if="wizard.currentStepId === 2"
          variant="primary"
          @click="handleClose"
        >
          <span>Done</span>
          <Icon name="ph:check" class="size-4" />
        </BaseButton>
      </div>
    </div>
  </div>
</template>

