<script setup lang="ts">
interface PaymentLinkBasicInfo {
  title: string
  description: string
  amountType: 'fixed' | 'open'
  amount: number
  currency: string
  category?: string
}

interface Props {
  modelValue: PaymentLinkBasicInfo
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: PaymentLinkBasicInfo]
}>()

const form = ref<PaymentLinkBasicInfo>({
  title: props.modelValue?.title || '',
  description: props.modelValue?.description || '',
  amountType: props.modelValue?.amountType || 'fixed',
  amount: props.modelValue?.amount || 0,
  currency: props.modelValue?.currency || 'USD',
  category: props.modelValue?.category || '',
})

const currencies = [
  { label: 'USD • United States Dollar', value: 'USD' },
  { label: 'EUR • Euro', value: 'EUR' },
  { label: 'GBP • British Pound', value: 'GBP' },
  { label: 'USDC • USD Coin', value: 'USDC' },
]

const categories = [
  { label: 'Product Sale', value: 'product' },
  { label: 'Service Fee', value: 'service' },
  { label: 'Donation', value: 'donation' },
  { label: 'Subscription', value: 'subscription' },
  { label: 'Invoice', value: 'invoice' },
  { label: 'Other', value: 'other' },
]

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
        Basic Information
      </BaseHeading>
      <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
        Set up the basic details for your payment link.
      </BaseParagraph>
    </div>

    <TairoFormGroup label="Title" required>
      <TairoInput
        v-model="form.title"
        type="text"
        placeholder="e.g., Launch Bundle"
        icon="solar:tag-bold-duotone"
        size="lg"
      />
    </TairoFormGroup>

    <TairoFormGroup label="Description" sublabel="Optional description for your payment link">
      <textarea
        v-model="form.description"
        rows="3"
        placeholder="Describe what this payment is for..."
        class="w-full rounded-lg border border-muted-200 bg-white px-4 py-3 text-sm text-muted-800 placeholder:text-muted-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-muted-700 dark:bg-muted-900 dark:text-muted-100 dark:placeholder:text-muted-500"
      />
    </TairoFormGroup>

    <TairoFormGroup label="Amount Type" required>
      <div class="grid grid-cols-2 gap-4">
        <button
          type="button"
          class="flex h-full flex-col gap-3 rounded-xl border p-4 text-left transition hover:border-primary-400"
          :class="form.amountType === 'fixed'
            ? 'border-primary-500 bg-primary-50/70 dark:border-primary-400 dark:bg-primary-900/20'
            : 'border-muted-200 dark:border-muted-700'"
          @click="form.amountType = 'fixed'"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-muted-900 dark:text-white">
              Fixed Amount
            </span>
            <Icon
              v-if="form.amountType === 'fixed'"
              name="solar:check-circle-bold-duotone"
              class="size-5 text-primary-500"
            />
          </div>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            Customer pays a specific amount
          </BaseParagraph>
        </button>

        <button
          type="button"
          class="flex h-full flex-col gap-3 rounded-xl border p-4 text-left transition hover:border-primary-400"
          :class="form.amountType === 'open'
            ? 'border-primary-500 bg-primary-50/70 dark:border-primary-400 dark:bg-primary-900/20'
            : 'border-muted-200 dark:border-muted-700'"
          @click="form.amountType = 'open'"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-muted-900 dark:text-white">
              Open Amount
            </span>
            <Icon
              v-if="form.amountType === 'open'"
              name="solar:check-circle-bold-duotone"
              class="size-5 text-primary-500"
            />
          </div>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            Customer enters their own amount
          </BaseParagraph>
        </button>
      </div>
    </TairoFormGroup>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <TairoFormGroup
        v-if="form.amountType === 'fixed'"
        label="Amount"
        required
      >
        <TairoInput
          v-model.number="form.amount"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          icon="solar:dollar-minimalistic-bold-duotone"
          size="lg"
        />
      </TairoFormGroup>

      <TairoFormGroup label="Currency" required>
        <TairoSelect
          v-model="form.currency"
          icon="solar:money-bag-bold-duotone"
          size="lg"
        >
          <BaseSelectItem
            v-for="currency in currencies"
            :key="currency.value"
            :value="currency.value"
          >
            {{ currency.label }}
          </BaseSelectItem>
        </TairoSelect>
      </TairoFormGroup>

      <TairoFormGroup label="Category" sublabel="Optional category for organization">
        <TairoSelect
          v-model="form.category"
          icon="solar:folder-bold-duotone"
          size="lg"
        >
          <BaseSelectItem value="">
            None
          </BaseSelectItem>
          <BaseSelectItem
            v-for="cat in categories"
            :key="cat.value"
            :value="cat.value"
          >
            {{ cat.label }}
          </BaseSelectItem>
        </TairoSelect>
      </TairoFormGroup>
    </div>
  </div>
</template>

