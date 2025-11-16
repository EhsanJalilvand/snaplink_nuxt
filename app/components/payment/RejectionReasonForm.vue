<script setup lang="ts">
import type { RejectionReason, RejectionPredefinedReason } from '~/types/payment-gateway'

interface Props {
  modelValue: RejectionReason | null
  label?: string
  required?: boolean
  showFreeText?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Rejection Reason',
  required: true,
  showFreeText: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: RejectionReason | null]
}>()

const predefinedReasons: Array<{
  value: RejectionPredefinedReason
  label: string
  description: string
}> = [
  {
    value: 'incomplete_docs',
    label: 'Incomplete Documentation',
    description: 'Required documents are missing or incomplete',
  },
  {
    value: 'high_risk',
    label: 'High Risk Profile',
    description: 'Business profile indicates high risk level',
  },
  {
    value: 'compliance_issue',
    label: 'Compliance Issue',
    description: 'Does not meet regulatory compliance requirements',
  },
  {
    value: 'invalid_info',
    label: 'Invalid Information',
    description: 'Provided information is incorrect or cannot be verified',
  },
  {
    value: 'business_not_allowed',
    label: 'Business Type Not Allowed',
    description: 'Business category is not permitted on our platform',
  },
  {
    value: 'sanctions_match',
    label: 'Sanctions Match',
    description: 'Matches against sanctions or restricted party lists',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason (please specify below)',
  },
]

const localReason = ref<RejectionReason>({
  predefined: props.modelValue?.predefined || 'other',
  freeText: props.modelValue?.freeText || '',
})

const showFreeTextField = computed(() => {
  return props.showFreeText && (localReason.value.predefined === 'other' || localReason.value.freeText)
})

const errors = ref<{
  predefined?: string
  freeText?: string
}>({})

const validate = () => {
  errors.value = {}
  
  if (props.required && !localReason.value.predefined) {
    errors.value.predefined = 'Please select a rejection reason'
    return false
  }
  
  if (localReason.value.predefined === 'other' && !localReason.value.freeText?.trim()) {
    errors.value.freeText = 'Please provide a reason'
    return false
  }
  
  if (localReason.value.freeText && localReason.value.freeText.length > 1000) {
    errors.value.freeText = 'Reason must be less than 1000 characters'
    return false
  }
  
  return true
}

const updatePredefined = (value: RejectionPredefinedReason) => {
  localReason.value.predefined = value
  if (value !== 'other') {
    localReason.value.freeText = ''
  }
  emit('update:modelValue', localReason.value)
  errors.value.predefined = undefined
}

const updateFreeText = (value: string) => {
  localReason.value.freeText = value
  emit('update:modelValue', localReason.value)
  errors.value.freeText = undefined
}

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    localReason.value = { ...newValue }
  }
}, { deep: true, immediate: true })

defineExpose({
  validate,
  errors: readonly(errors),
})
</script>

<template>
  <div class="space-y-4">
    <!-- Predefined Reasons -->
    <TairoFormGroup
      :label="label"
      :required="required"
      :error="errors.predefined"
    >
      <div class="space-y-2">
        <button
          v-for="reason in predefinedReasons"
          :key="reason.value"
          type="button"
          class="w-full rounded-xl border p-4 text-left transition-all"
          :class="[
            localReason.predefined === reason.value
              ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
              : 'border-muted-200 hover:border-primary-300 dark:border-muted-700 dark:hover:border-primary-700',
            errors.predefined ? 'border-danger-500' : '',
          ]"
          @click="updatePredefined(reason.value)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <Icon
                  :name="localReason.predefined === reason.value ? 'solar:check-circle-bold-duotone' : 'solar:circle-bold-duotone'"
                  class="size-5 shrink-0"
                  :class="localReason.predefined === reason.value ? 'text-primary-500' : 'text-muted-400'"
                />
                <BaseText
                  size="sm"
                  weight="medium"
                  class="text-muted-900 dark:text-white"
                >
                  {{ reason.label }}
                </BaseText>
              </div>
              <BaseParagraph
                size="xs"
                class="mt-1 text-muted-500 dark:text-muted-400"
              >
                {{ reason.description }}
              </BaseParagraph>
            </div>
          </div>
        </button>
      </div>
    </TairoFormGroup>

    <!-- Free Text Field -->
    <TairoFormGroup
      v-if="showFreeTextField"
      label="Additional Details"
      :required="localReason.predefined === 'other'"
      :error="errors.freeText"
      :sublabel="localReason.predefined === 'other' ? 'Please provide a detailed explanation' : 'Optional: Add any additional context or notes'"
    >
      <textarea
        :value="localReason.freeText"
        rows="4"
        placeholder="Enter rejection reason details..."
        class="w-full rounded-lg border border-muted-200 bg-white px-4 py-3 text-sm text-muted-800 placeholder:text-muted-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-muted-700 dark:bg-muted-900 dark:text-muted-100 dark:placeholder:text-muted-500"
        :class="errors.freeText ? 'border-danger-500' : ''"
        @input="updateFreeText(($event.target as HTMLTextAreaElement).value)"
      />
      <div
        v-if="localReason.freeText"
        class="mt-1 text-xs text-muted-500"
      >
        {{ localReason.freeText.length }} / 1000 characters
      </div>
    </TairoFormGroup>
  </div>
</template>

