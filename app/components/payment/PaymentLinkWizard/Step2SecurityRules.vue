<script setup lang="ts">
interface PaymentLinkSecurityRules {
  linkType: 'one-time' | 'reusable'
  expirationDate?: string
  expirationTime?: string
  maxUsage?: number
  fraudLimitation?: {
    enabled: boolean
    maxPerIP?: number
    maxPerEmail?: number
    requireVerification?: boolean
  }
}

interface Props {
  modelValue: PaymentLinkSecurityRules
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: PaymentLinkSecurityRules]
}>()

const form = ref<PaymentLinkSecurityRules>({
  linkType: props.modelValue?.linkType || 'one-time',
  expirationDate: props.modelValue?.expirationDate,
  expirationTime: props.modelValue?.expirationTime,
  maxUsage: props.modelValue?.maxUsage,
  fraudLimitation: {
    enabled: props.modelValue?.fraudLimitation?.enabled || false,
    maxPerIP: props.modelValue?.fraudLimitation?.maxPerIP,
    maxPerEmail: props.modelValue?.fraudLimitation?.maxPerEmail,
    requireVerification: props.modelValue?.fraudLimitation?.requireVerification || false,
  },
})

watch(form, (newValue) => {
  emit('update:modelValue', { ...newValue })
}, { deep: true, immediate: true })

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    form.value = { ...newValue }
  }
}, { deep: true })
</script>

<template>
  <div class="space-y-6">
    <div>
      <BaseHeading
        as="h3"
        size="lg"
        weight="semibold"
        class="text-muted-900 dark:text-white"
      >
        Security Rules
      </BaseHeading>
      <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
        Configure security and usage limitations for your payment link.
      </BaseParagraph>
    </div>

    <TairoFormGroup label="Link Type" required>
      <div class="grid grid-cols-2 gap-4">
        <button
          type="button"
          class="flex h-full flex-col gap-3 rounded-xl border p-4 text-left transition hover:border-primary-400"
          :class="form.linkType === 'one-time'
            ? 'border-primary-500 bg-primary-50/70 dark:border-primary-400 dark:bg-primary-900/20'
            : 'border-muted-200 dark:border-muted-700'"
          @click="form.linkType = 'one-time'"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-muted-900 dark:text-white">
              One-Time
            </span>
            <Icon
              v-if="form.linkType === 'one-time'"
              name="solar:check-circle-bold-duotone"
              class="size-5 text-primary-500"
            />
          </div>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            Link expires after first successful payment
          </BaseParagraph>
        </button>

        <button
          type="button"
          class="flex h-full flex-col gap-3 rounded-xl border p-4 text-left transition hover:border-primary-400"
          :class="form.linkType === 'reusable'
            ? 'border-primary-500 bg-primary-50/70 dark:border-primary-400 dark:bg-primary-900/20'
            : 'border-muted-200 dark:border-muted-700'"
          @click="form.linkType = 'reusable'"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-muted-900 dark:text-white">
              Reusable
            </span>
            <Icon
              v-if="form.linkType === 'reusable'"
              name="solar:check-circle-bold-duotone"
              class="size-5 text-primary-500"
            />
          </div>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            Link can be used multiple times
          </BaseParagraph>
        </button>
      </div>
    </TairoFormGroup>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <TairoFormGroup label="Expiration Date" sublabel="Optional date when link expires">
        <TairoInput
          v-model="form.expirationDate"
          type="date"
          icon="solar:calendar-bold-duotone"
          size="lg"
        />
      </TairoFormGroup>

      <TairoFormGroup label="Expiration Time" sublabel="Time of day (if date is set)">
        <TairoInput
          v-model="form.expirationTime"
          type="time"
          icon="solar:clock-circle-bold-duotone"
          size="lg"
        />
      </TairoFormGroup>
    </div>

    <TairoFormGroup
      v-if="form.linkType === 'reusable'"
      label="Maximum Usage Count"
      sublabel="Maximum number of times this link can be used (0 = unlimited)"
    >
      <TairoInput
        v-model.number="form.maxUsage"
        type="number"
        min="0"
        placeholder="0"
        icon="solar:users-group-rounded-bold-duotone"
        size="lg"
      />
    </TairoFormGroup>

    <!-- Fraud Limitation -->
    <BaseCard class="border border-muted-200 bg-muted-50/50 p-6 dark:border-muted-700 dark:bg-muted-900/30">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
            Fraud Limitation
          </BaseText>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            Configure anti-fraud measures
          </BaseParagraph>
        </div>
        <BaseSwitchBall
          v-model="form.fraudLimitation.enabled"
          variant="primary"
        />
      </div>

      <div
        v-if="form.fraudLimitation.enabled"
        class="space-y-4"
      >
        <div class="grid grid-cols-2 gap-4">
          <TairoFormGroup label="Max Payments per IP" sublabel="Limit payments from same IP address">
            <TairoInput
              v-model.number="form.fraudLimitation.maxPerIP"
              type="number"
              min="0"
              placeholder="0"
              size="lg"
            />
          </TairoFormGroup>

          <TairoFormGroup label="Max Payments per Email" sublabel="Limit payments from same email">
            <TairoInput
              v-model.number="form.fraudLimitation.maxPerEmail"
              type="number"
              min="0"
              placeholder="0"
              size="lg"
            />
          </TairoFormGroup>
        </div>

        <div class="flex items-center justify-between rounded-xl border border-muted-200 bg-white px-4 py-3 dark:border-muted-700 dark:bg-muted-900">
          <div>
            <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
              Require Email Verification
            </BaseText>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              Require customers to verify their email before payment
            </BaseParagraph>
          </div>
          <BaseSwitchBall
            v-model="form.fraudLimitation.requireVerification"
            variant="primary"
          />
        </div>
      </div>
    </BaseCard>
  </div>
</template>

