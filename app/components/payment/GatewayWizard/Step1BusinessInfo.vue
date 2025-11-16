<script setup lang="ts">
import type { GatewayCreatePayload } from '~/types/payment-gateway'

interface Props {
  modelValue: GatewayCreatePayload['businessInfo']
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: GatewayCreatePayload['businessInfo']]
}>()

const businessInfo = ref<GatewayCreatePayload['businessInfo']>({
  legalName: props.modelValue?.legalName || '',
  displayName: props.modelValue?.displayName || '',
  category: props.modelValue?.category || '',
  businessType: props.modelValue?.businessType || '',
  website: props.modelValue?.website || '',
  country: props.modelValue?.country || '',
})

const businessCategories = [
  { label: 'E-commerce', value: 'ecommerce' },
  { label: 'SaaS / Software', value: 'saas' },
  { label: 'Marketplace', value: 'marketplace' },
  { label: 'Digital Services', value: 'digital_services' },
  { label: 'Physical Products', value: 'physical_products' },
  { label: 'Financial Services', value: 'financial_services' },
  { label: 'Education', value: 'education' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Other', value: 'other' },
]

const businessTypes = [
  { label: 'Sole Proprietorship', value: 'sole_proprietorship' },
  { label: 'Partnership', value: 'partnership' },
  { label: 'LLC', value: 'llc' },
  { label: 'Corporation', value: 'corporation' },
  { label: 'Non-profit', value: 'nonprofit' },
  { label: 'Other', value: 'other' },
]

const countries = [
  { label: 'United States', value: 'US' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'Canada', value: 'CA' },
  { label: 'Australia', value: 'AU' },
  { label: 'Germany', value: 'DE' },
  { label: 'France', value: 'FR' },
  { label: 'Netherlands', value: 'NL' },
  { label: 'Singapore', value: 'SG' },
  { label: 'Other', value: 'other' },
]

watch(businessInfo, (newValue) => {
  emit('update:modelValue', { ...newValue })
}, { deep: true, immediate: true })

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    businessInfo.value = { ...newValue }
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
        Business Information
      </BaseHeading>
      <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
        Tell us about your business. This information is required for compliance and verification.
      </BaseParagraph>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <TairoFormGroup
        label="Legal Business Name"
        required
        sublabel="Official registered name of your business"
      >
        <TairoInput
          v-model="businessInfo.legalName"
          type="text"
          placeholder="Acme Corporation Inc."
          icon="solar:buildings-bold-duotone"
          size="lg"
        />
      </TairoFormGroup>

      <TairoFormGroup
        label="Display Name"
        required
        sublabel="Name shown to customers (can be different from legal name)"
      >
        <TairoInput
          v-model="businessInfo.displayName"
          type="text"
          placeholder="Acme Corp"
          icon="solar:tag-bold-duotone"
          size="lg"
        />
      </TairoFormGroup>

      <TairoFormGroup
        label="Business Category"
        required
        sublabel="Primary category of your business"
      >
        <TairoSelect
          v-model="businessInfo.category"
          icon="solar:folder-bold-duotone"
          size="lg"
        >
          <BaseSelectItem
            v-for="cat in businessCategories"
            :key="cat.value"
            :value="cat.value"
          >
            {{ cat.label }}
          </BaseSelectItem>
        </TairoSelect>
      </TairoFormGroup>

      <TairoFormGroup
        label="Business Type"
        required
        sublabel="Legal structure of your business"
      >
        <TairoSelect
          v-model="businessInfo.businessType"
          icon="solar:document-bold-duotone"
          size="lg"
        >
          <BaseSelectItem
            v-for="type in businessTypes"
            :key="type.value"
            :value="type.value"
          >
            {{ type.label }}
          </BaseSelectItem>
        </TairoSelect>
      </TairoFormGroup>

      <TairoFormGroup
        label="Website"
        sublabel="Your business website URL (optional)"
      >
        <TairoInput
          v-model="businessInfo.website"
          type="url"
          placeholder="https://example.com"
          icon="solar:global-bold-duotone"
          size="lg"
        />
      </TairoFormGroup>

      <TairoFormGroup
        label="Country"
        required
        sublabel="Country where your business is registered"
      >
        <TairoSelect
          v-model="businessInfo.country"
          icon="solar:flag-bold-duotone"
          size="lg"
        >
          <BaseSelectItem
            v-for="country in countries"
            :key="country.value"
            :value="country.value"
          >
            {{ country.label }}
          </BaseSelectItem>
        </TairoSelect>
      </TairoFormGroup>
    </div>
  </div>
</template>

