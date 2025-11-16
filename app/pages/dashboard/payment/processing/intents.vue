<script setup lang="ts">
import { callOnce, ref, computed, watch } from '#imports'
import { usePaymentProcessing } from '~/composables/usePaymentProcessing'
import GatewayStatusBadge from '~/components/payment/GatewayStatusBadge.vue'
import type { ProcessingFilters, PaymentIntentStatus } from '~/types/payment-processing'

definePageMeta({
  title: 'Payment Intents',
  layout: 'dashboard',
})

const router = useRouter()
const { isLoading, error, fetchIntents, cancelIntent } = usePaymentProcessing()

const intents = ref<any[]>([])
const filters = ref<ProcessingFilters>({
  search: '',
  status: 'all',
  dateRange: undefined,
  gatewayId: undefined,
  currency: undefined,
  minAmount: undefined,
  maxAmount: undefined,
})

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Succeeded', value: 'succeeded' },
  { label: 'Failed', value: 'failed' },
  { label: 'Canceled', value: 'canceled' },
  { label: 'Refunded', value: 'refunded' },
]

const loadIntents = async () => {
  intents.value = await fetchIntents(filters.value)
}

callOnce(() => loadIntents())

watch(() => filters.value, () => {
  loadIntents()
}, { deep: true })

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USDC' ? 'USD' : currency,
  }).format(amount)
}

const handleCancel = async (id: string) => {
  const success = await cancelIntent(id)
  if (success) {
    loadIntents()
  }
}
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
          Payment Intents
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          Manage and monitor payment intent requests
        </BaseParagraph>
      </div>
    </div>

    <!-- Filters -->
    <BaseCard class="p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TairoFormGroup label="Search">
          <TairoInput
            v-model="filters.search"
            placeholder="Search by ID, customer..."
            icon="solar:magnifier-bold-duotone"
            size="lg"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Status">
          <TairoSelect
            v-model="filters.status"
            size="lg"
          >
            <BaseSelectItem
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>

        <TairoFormGroup label="Currency">
          <TairoSelect
            v-model="filters.currency"
            size="lg"
            placeholder="All Currencies"
          >
            <BaseSelectItem value="">
              All Currencies
            </BaseSelectItem>
            <BaseSelectItem value="USD">
              USD
            </BaseSelectItem>
            <BaseSelectItem value="EUR">
              EUR
            </BaseSelectItem>
            <BaseSelectItem value="USDC">
              USDC
            </BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>

        <TairoFormGroup label="Gateway">
          <TairoSelect
            v-model="filters.gatewayId"
            size="lg"
            placeholder="All Gateways"
          >
            <BaseSelectItem value="">
              All Gateways
            </BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>
      </div>
    </BaseCard>

    <!-- Table -->
    <BaseCard class="p-6">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  ID
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Amount
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Status
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Gateway
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Customer
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Created
                </BaseText>
              </th>
              <th class="px-4 py-3 text-right">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Actions
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
              v-else-if="intents.length === 0"
              class="border-b border-muted-100 dark:border-muted-900"
            >
              <td colspan="7" class="px-4 py-12 text-center">
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  No payment intents found
                </BaseText>
              </td>
            </tr>
            <tr
              v-else
              v-for="intent in intents.slice(0, 10)"
              :key="intent.id"
              class="border-b border-muted-100 dark:border-muted-900"
            >
              <td class="px-4 py-3">
                <BaseText size="sm" class="font-mono text-muted-700 dark:text-muted-300">
                  {{ intent.id.substring(0, 8) }}...
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                  {{ formatCurrency(intent.amount || 0, intent.currency || 'USD') }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseChip
                  size="xs"
                  :color="intent.status === 'succeeded' ? 'success' : intent.status === 'failed' ? 'danger' : 'warning'"
                  variant="pastel"
                >
                  {{ intent.status }}
                </BaseChip>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-700 dark:text-muted-300">
                  Gateway {{ intent.gatewayId?.substring(0, 8) || 'N/A' }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-700 dark:text-muted-300">
                  {{ intent.customerEmail || 'N/A' }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  {{ intent.createdAt ? new Date(intent.createdAt).toLocaleDateString() : 'N/A' }}
                </BaseText>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <BaseButton
                    v-if="intent.status === 'pending' || intent.status === 'processing'"
                    size="sm"
                    variant="ghost"
                    color="danger"
                    @click="handleCancel(intent.id)"
                  >
                    <Icon name="solar:close-circle-bold-duotone" class="size-4" />
                    Cancel
                  </BaseButton>
                </div>
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
        Failed to load intents
      </template>
      <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
        {{ error }}
      </BaseParagraph>
    </BaseAlert>
  </div>
</template>

