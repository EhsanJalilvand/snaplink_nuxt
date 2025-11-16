<script setup lang="ts">
import { callOnce, ref, watch, computed } from '#imports'
import { usePaymentSettlement } from '~/composables/usePaymentSettlement'
import type { SettlementFee } from '~/types/payment-settlement'

definePageMeta({
  title: 'Settlement Fees',
  layout: 'dashboard',
})

const { isLoading, error, fetchSettlementFees } = usePaymentSettlement()

const fees = ref<SettlementFee[]>([])
const search = ref('')
const feeTypeFilter = ref<'all' | SettlementFee['feeType']>('all')
const transactionIdFilter = ref<string>('')

const loadFees = async () => {
  fees.value = await fetchSettlementFees(transactionIdFilter.value || undefined)
}

callOnce(() => loadFees())

watch([feeTypeFilter, transactionIdFilter], () => {
  loadFees()
})

const filteredFees = computed(() => {
  let result = fees.value

  if (feeTypeFilter.value !== 'all') {
    result = result.filter(fee => fee.feeType === feeTypeFilter.value)
  }

  if (search.value) {
    const searchLower = search.value.toLowerCase()
    result = result.filter(fee =>
      fee.transactionId.toLowerCase().includes(searchLower) ||
      fee.id.toLowerCase().includes(searchLower) ||
      fee.description?.toLowerCase().includes(searchLower)
    )
  }

  return result
})

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USDC' ? 'USD' : currency,
  }).format(amount)
}

const feeTypeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Processing', value: 'processing' },
  { label: 'Gateway', value: 'gateway' },
  { label: 'Platform', value: 'platform' },
  { label: 'Refund', value: 'refund' },
  { label: 'Dispute', value: 'dispute' },
]
</script>

<template>
  <div class="space-y-6 py-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-white"
        >
          Settlement Fees
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          View detailed fee breakdown for all settlements
        </BaseParagraph>
      </div>
      <BaseButton
        variant="outline"
        color="primary"
      >
        <Icon name="solar:download-bold-duotone" class="size-4" />
        Export Fees
      </BaseButton>
    </div>

    <!-- Filters -->
    <BaseCard class="p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TairoFormGroup label="Search">
          <TairoInput
            v-model="search"
            placeholder="Search by transaction ID..."
            icon="solar:magnifier-bold-duotone"
            size="lg"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Fee Type">
          <TairoSelect
            v-model="feeTypeFilter"
            size="lg"
          >
            <BaseSelectItem
              v-for="option in feeTypeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>

        <TairoFormGroup label="Transaction ID">
          <TairoInput
            v-model="transactionIdFilter"
            placeholder="Filter by transaction ID..."
            size="lg"
          />
        </TairoFormGroup>
      </div>
    </BaseCard>

    <!-- Stats -->
    <div
      v-if="!isLoading && filteredFees.length > 0"
      class="grid grid-cols-1 gap-4 md:grid-cols-4"
    >
      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Total Fees
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ formatCurrency(filteredFees.reduce((sum, fee) => sum + fee.amount, 0), 'USD') }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-900/20">
            <Icon
              name="solar:tag-price-bold-duotone"
              class="size-6 text-warning-500"
            />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Processing Fees
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ formatCurrency(filteredFees.filter(f => f.feeType === 'processing').reduce((sum, fee) => sum + fee.amount, 0), 'USD') }}
            </BaseHeading>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Gateway Fees
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ formatCurrency(filteredFees.filter(f => f.feeType === 'gateway').reduce((sum, fee) => sum + fee.amount, 0), 'USD') }}
            </BaseHeading>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Fee Count
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ filteredFees.length }}
            </BaseHeading>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Table -->
    <BaseCard class="p-6">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Fee ID
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Transaction ID
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Fee Type
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Amount
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Rate
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Description
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Applied At
                </BaseText>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-if="isLoading"
              v-for="i in 5"
              :key="i"
              class="border-b border-muted-100 dark:border-muted-900"
            >
              <td colspan="7" class="px-4 py-4">
                <div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" />
              </td>
            </tr>
            <tr
              v-else-if="filteredFees.length === 0"
              class="border-b border-muted-100 dark:border-muted-900"
            >
              <td colspan="7" class="px-4 py-12 text-center">
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  No fees found
                </BaseText>
              </td>
            </tr>
            <tr
              v-else
              v-for="fee in filteredFees.slice(0, 20)"
              :key="fee.id"
              class="border-b border-muted-100 dark:border-muted-900"
            >
              <td class="px-4 py-3">
                <BaseText size="sm" class="font-mono text-muted-700 dark:text-muted-300">
                  {{ fee.id.substring(0, 8) }}...
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="font-mono text-muted-700 dark:text-muted-300">
                  {{ fee.transactionId.substring(0, 12) }}...
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseChip
                  size="xs"
                  :color="fee.feeType === 'processing' ? 'primary' : fee.feeType === 'gateway' ? 'info' : fee.feeType === 'platform' ? 'warning' : 'danger'"
                  variant="pastel"
                >
                  {{ fee.feeType }}
                </BaseChip>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                  {{ formatCurrency(fee.amount, fee.currency) }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-700 dark:text-muted-300">
                  {{ fee.rate ? `${fee.rate}%` : 'N/A' }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-700 dark:text-muted-300">
                  {{ fee.description }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  {{ fee.appliedAt ? new Date(fee.appliedAt).toLocaleDateString() : 'N/A' }}
                </BaseText>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- Error State -->
    <BaseAlert
      v-if="error"
      color="danger"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Failed to load fees
      </template>
      <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
        {{ error }}
      </BaseParagraph>
    </BaseAlert>
  </div>
</template>

