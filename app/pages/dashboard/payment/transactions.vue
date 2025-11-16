<script setup lang="ts">
import { ref, computed, watch } from '#imports'
import { usePaymentProcessing } from '~/composables/usePaymentProcessing'
import GatewayStatusBadge from '~/components/payment/GatewayStatusBadge.vue'
import type { ProcessingFilters } from '~/types/payment-processing'

definePageMeta({
  title: 'Transactions',
  layout: 'dashboard',
})

const router = useRouter()
const { isLoading, error, fetchIntents, fetchSessions, fetchConfirmations, fetchRefunds, fetchDisputes, cancelIntent } = usePaymentProcessing()

const intents = ref<any[]>([])
const sessions = ref<any[]>([])
const confirmations = ref<any[]>([])
const refunds = ref<any[]>([])
const disputes = ref<any[]>([])

const filters = ref<ProcessingFilters>({
  search: '',
  status: 'all',
  dateRange: undefined,
  gatewayId: undefined,
  currency: 'all',
  minAmount: undefined,
  maxAmount: undefined,
})

const typeFilter = ref<'all' | 'intent' | 'session' | 'confirmation' | 'refund' | 'dispute'>('all')

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Succeeded', value: 'succeeded' },
  { label: 'Failed', value: 'failed' },
  { label: 'Canceled', value: 'canceled' },
  { label: 'Refunded', value: 'refunded' },
]

const loadAll = async () => {
  await Promise.all([
    fetchIntents(filters.value).then(r => intents.value = r),
    fetchSessions(filters.value).then(r => sessions.value = r),
    fetchConfirmations(filters.value).then(r => confirmations.value = r),
    fetchRefunds(filters.value).then(r => refunds.value = r),
    fetchDisputes(filters.value).then(r => disputes.value = r),
  ])
}

// Always fetch on mount to ensure API call is made
onMounted(async () => {
  if (import.meta.dev) {
    // eslint-disable-next-line no-console
    console.warn('[transactions.vue] onMounted - calling loadAll()')
  }
  await loadAll()
})

watch(() => filters.value, () => {
  loadAll()
}, { deep: true })

const allTransactions = computed(() => {
  const all: any[] = []
  
  if (typeFilter.value === 'all' || typeFilter.value === 'intent') {
    intents.value.forEach(item => {
      all.push({ ...item, type: 'intent', typeLabel: 'Intent' })
    })
  }
  
  if (typeFilter.value === 'all' || typeFilter.value === 'session') {
    sessions.value.forEach(item => {
      all.push({ ...item, type: 'session', typeLabel: 'Session' })
    })
  }
  
  if (typeFilter.value === 'all' || typeFilter.value === 'confirmation') {
    confirmations.value.forEach(item => {
      all.push({ ...item, type: 'confirmation', typeLabel: 'Confirmation' })
    })
  }
  
  if (typeFilter.value === 'all' || typeFilter.value === 'refund') {
    refunds.value.forEach(item => {
      all.push({ ...item, type: 'refund', typeLabel: 'Refund' })
    })
  }
  
  if (typeFilter.value === 'all' || typeFilter.value === 'dispute') {
    disputes.value.forEach(item => {
      all.push({ ...item, type: 'dispute', typeLabel: 'Dispute' })
    })
  }
  
  return all.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.timestamp || 0).getTime()
    const dateB = new Date(b.createdAt || b.timestamp || 0).getTime()
    return dateB - dateA
  }).slice(0, 50)
})

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USDC' ? 'USD' : currency,
  }).format(amount)
}

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    succeeded: 'success',
    completed: 'success',
    confirmed: 'success',
    pending: 'warning',
    processing: 'warning',
    active: 'warning',
    failed: 'danger',
    canceled: 'muted',
    expired: 'muted',
    refunded: 'info',
    disputed: 'danger',
  }
  return statusMap[status] || 'muted'
}

const handleCancel = async (id: string) => {
  const success = await cancelIntent(id)
  if (success) {
    loadAll()
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
          All Transactions
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          View and manage all payment transactions in one place
        </BaseParagraph>
      </div>
    </div>

    <!-- Filters -->
    <BaseCard class="p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TairoFormGroup label="Type">
          <TairoSelect
            v-model="typeFilter"
            size="lg"
          >
            <BaseSelectItem value="all">All Types</BaseSelectItem>
            <BaseSelectItem value="intent">Intents</BaseSelectItem>
            <BaseSelectItem value="session">Sessions</BaseSelectItem>
            <BaseSelectItem value="confirmation">Confirmations</BaseSelectItem>
            <BaseSelectItem value="refund">Refunds</BaseSelectItem>
            <BaseSelectItem value="dispute">Disputes</BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>

        <TairoFormGroup label="Search">
          <TairoInput
            v-model="filters.search"
            placeholder="Search by ID..."
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
            <BaseSelectItem value="all">All Currencies</BaseSelectItem>
            <BaseSelectItem value="USD">USD</BaseSelectItem>
            <BaseSelectItem value="EUR">EUR</BaseSelectItem>
            <BaseSelectItem value="USDC">USDC</BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>
      </div>
    </BaseCard>

    <!-- Summary Stats -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Intents
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ intents.length }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
            <Icon name="solar:card-send-bold-duotone" class="size-6 text-primary-500" />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Sessions
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ sessions.length }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-info-50 dark:bg-info-900/20">
            <Icon name="solar:card-send-bold-duotone" class="size-6 text-info-500" />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Confirmations
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ confirmations.length }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/20">
            <Icon name="solar:check-circle-bold-duotone" class="size-6 text-success-500" />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Refunds
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ refunds.length }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-900/20">
            <Icon name="solar:refresh-bold-duotone" class="size-6 text-warning-500" />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Disputes
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ disputes.length }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-danger-50 dark:bg-danger-900/20">
            <Icon name="solar:danger-triangle-bold-duotone" class="size-6 text-danger-500" />
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Transactions Table -->
    <BaseCard class="p-6">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Type
                </BaseText>
              </th>
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
                  Date
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Actions
                </BaseText>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="isLoading">
              <tr
                v-for="i in 5"
                :key="`loading-${i}`"
                class="border-b border-muted-100 dark:border-muted-900"
              >
                <td colspan="6" class="px-4 py-4">
                  <div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" />
                </td>
              </tr>
            </template>
            <tr
              v-else-if="allTransactions.length === 0"
              key="empty-transactions"
              class="border-b border-muted-100 dark:border-muted-900"
            >
              <td colspan="6" class="px-4 py-12 text-center">
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  No transactions found
                </BaseText>
              </td>
            </tr>
            <template v-else>
              <tr
                v-for="(transaction, index) in allTransactions"
                :key="transaction.id || `transaction-${index}`"
                class="border-b border-muted-100 dark:border-muted-900"
              >
                <td class="px-4 py-3">
                  <BaseChip size="xs" :color="transaction.type === 'intent' ? 'primary' : transaction.type === 'confirmation' ? 'success' : transaction.type === 'refund' ? 'warning' : transaction.type === 'dispute' ? 'danger' : 'info'" variant="pastel">
                    {{ transaction.typeLabel }}
                  </BaseChip>
                </td>
                <td class="px-4 py-3">
                  <BaseText size="sm" class="font-mono text-muted-700 dark:text-muted-300">
                    {{ transaction.id?.substring(0, 12) || 'N/A' }}...
                  </BaseText>
                </td>
                <td class="px-4 py-3">
                  <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                    {{ formatCurrency(transaction.amount || 0, transaction.currency || 'USD') }}
                  </BaseText>
                </td>
                <td class="px-4 py-3">
                  <BaseChip size="xs" :color="getStatusColor(transaction.status)" variant="pastel">
                    {{ transaction.status || 'unknown' }}
                  </BaseChip>
                </td>
                <td class="px-4 py-3">
                  <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                    {{ transaction.createdAt || transaction.timestamp ? new Date(transaction.createdAt || transaction.timestamp).toLocaleDateString() : 'N/A' }}
                  </BaseText>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <BaseButton
                      v-if="transaction.type === 'intent' && transaction.status === 'pending'"
                      size="xs"
                      variant="ghost"
                      color="danger"
                      @click="handleCancel(transaction.id)"
                    >
                      Cancel
                    </BaseButton>
                    <BaseButton
                      v-if="transaction.type === 'confirmation'"
                      size="xs"
                      variant="ghost"
                      color="primary"
                    >
                      Receipt
                    </BaseButton>
                  </div>
                </td>
              </tr>
            </template>
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
        Failed to load transactions
      </template>
      <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
        {{ error }}
      </BaseParagraph>
    </BaseAlert>
  </div>
</template>

