<script setup lang="ts">
import { useMultiStepForm } from '~/composables/multi-step-form'
import { usePaymentGatewayCreation } from '~/composables/usePaymentGatewayCreation'
import Step1BusinessInfo from '~/components/payment/GatewayWizard/Step1BusinessInfo.vue'
import Step2KYCKYB from '~/components/payment/GatewayWizard/Step2KYCKYB.vue'
import Step3APIConfig from '~/components/payment/GatewayWizard/Step3APIConfig.vue'
import Step4Summary from '~/components/payment/GatewayWizard/Step4Summary.vue'
import type { GatewayCreatePayload, KYCInfo, KYBInfo } from '~/types/payment-gateway'

definePageMeta({
  title: 'Create Gateway',
  layout: 'dashboard',
})

const router = useRouter()
const { payload, isLoading, error, createGateway, validate, reset } = usePaymentGatewayCreation()

const steps = [
  { id: 1, label: 'Business Info', icon: 'solar:buildings-bold-duotone' },
  { id: 2, label: 'KYC/KYB', icon: 'solar:document-bold-duotone' },
  { id: 3, label: 'API Config', icon: 'solar:settings-bold-duotone' },
  { id: 4, label: 'Review', icon: 'solar:check-circle-bold-duotone' },
]

const currentStep = ref(1)

const canGoNext = computed(() => currentStep.value < steps.length)
const canGoPrev = computed(() => currentStep.value > 1)

const nextStep = () => {
  if (currentStep.value < steps.length) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const goToStep = (step: number) => {
  if (step >= 1 && step <= steps.length) {
    currentStep.value = step
  }
}

const kyc = ref<KYCInfo>({
  status: 'not_started',
  documents: [],
})

const kyb = ref<KYBInfo>({
  status: 'not_started',
  documents: [],
})

const apiKeys = ref([])
const webhooks = ref([])

const handleSubmit = async () => {
  if (!validate()) {
    return
  }

  const gateway = await createGateway()
  if (gateway) {
    router.push(`/dashboard/payment/gateways/${gateway.id}`)
  }
}

const handleNext = () => {
  if (currentStep.value === 1) {
    // Validate business info
    if (!payload.value.name || !payload.value.businessInfo.legalName) {
      return
    }
  }
  if (currentStep.value < steps.length) {
    nextStep()
  }
}

const handlePrev = () => {
  if (currentStep.value > 1) {
    prevStep()
  }
}

onMounted(() => {
  reset()
})
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-6">
    <!-- Header -->
    <div class="mb-8">
      <BaseHeading
        as="h1"
        size="2xl"
        weight="bold"
        class="text-muted-900 dark:text-white"
      >
        Create Payment Gateway
      </BaseHeading>
      <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
        Set up a new payment gateway for your business
      </BaseParagraph>
    </div>

    <!-- Steps Progress -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="flex items-center"
        >
          <button
            type="button"
            class="flex flex-col items-center gap-2"
            :class="{ 'cursor-pointer': index < currentStep }"
            @click="index < currentStep ? goToStep(index + 1) : null"
          >
            <div
              class="flex size-12 items-center justify-center rounded-full border-2 transition"
              :class="[
                currentStep === step.id
                  ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                  : currentStep > step.id
                    ? 'border-success-500 bg-success-50 dark:border-success-400 dark:bg-success-900/20'
                    : 'border-muted-200 bg-muted-50 dark:border-muted-700 dark:bg-muted-800',
              ]"
            >
              <Icon
                :name="step.icon"
                class="size-6"
                :class="[
                  currentStep === step.id
                    ? 'text-primary-500'
                    : currentStep > step.id
                      ? 'text-success-500'
                      : 'text-muted-400',
                ]"
              />
            </div>
            <BaseText
              size="xs"
              weight="medium"
              :class="currentStep === step.id ? 'text-primary-600 dark:text-primary-400' : 'text-muted-500 dark:text-muted-400'"
            >
              {{ step.label }}
            </BaseText>
          </button>
          <div
            v-if="index < steps.length - 1"
            class="mx-4 h-0.5 w-16"
            :class="currentStep > step.id ? 'bg-success-500' : 'bg-muted-200 dark:bg-muted-700'"
          />
        </div>
      </div>
    </div>

    <!-- Step Content -->
    <BaseCard class="p-8">
      <Transition
        mode="out-in"
        enter-active-class="transition-all duration-300"
        enter-from-class="opacity-0 translate-x-4"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition-all duration-300"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 -translate-x-4"
      >
        <Step1BusinessInfo
          v-if="currentStep === 1"
          :model-value="payload.businessInfo"
          @update:model-value="payload.businessInfo = $event"
        />
        <Step2KYCKYB
          v-else-if="currentStep === 2"
          :kyc="kyc"
          :kyb="kyb"
          @update:kyc="kyc = $event"
          @update:kyb="kyb = $event"
        />
        <Step3APIConfig
          v-else-if="currentStep === 3"
          :api-keys="apiKeys"
          :webhooks="webhooks"
          @update:api-keys="apiKeys = $event"
          @update:webhooks="webhooks = $event"
        />
        <Step4Summary
          v-else-if="currentStep === 4"
          :gateway="{
            ...payload,
            compliance: {
              kyc,
              kyb,
              aml: { status: 'pending', checkedAt: new Date().toISOString() },
              riskScore: { value: 0, level: 'low', factors: [], calculatedAt: new Date().toISOString() },
              overallStatus: 'incomplete',
              lastUpdatedAt: new Date().toISOString(),
            },
            apiKeys,
            webhooks,
            ipWhitelist: [],
            auditLog: [],
          }"
        />
      </Transition>
    </BaseCard>

    <!-- Navigation -->
    <div class="mt-6 flex items-center justify-between">
      <BaseButton
        variant="outline"
        :disabled="!canGoPrev || isLoading"
        @click="handlePrev"
      >
        <Icon name="lucide:chevron-left" class="size-4" />
        Previous
      </BaseButton>

      <div v-if="error" class="flex-1 px-4">
        <BaseAlert color="danger" variant="pastel" size="sm">
          {{ error }}
        </BaseAlert>
      </div>

      <BaseButton
        v-if="currentStep < steps.length"
        variant="primary"
        :disabled="!canGoNext || isLoading"
        :loading="isLoading"
        @click="handleNext"
      >
        Next
        <Icon name="lucide:chevron-right" class="size-4" />
      </BaseButton>
      <BaseButton
        v-else
        variant="primary"
        :loading="isLoading"
        @click="handleSubmit"
      >
        Create Gateway
        <Icon name="solar:check-circle-bold-duotone" class="size-4" />
      </BaseButton>
    </div>
  </div>
</template>

