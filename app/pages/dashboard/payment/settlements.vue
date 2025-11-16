<script setup lang="ts">
import { ref, watch, computed } from '#imports'
import { usePaymentSettlement } from '~/composables/usePaymentSettlement'
import type { SettlementLog, SettlementStatus, SettlementFee, EscrowTransaction, EscrowStatus } from '~/types/payment-settlement'

definePageMeta({
  title: 'Settlements',
  layout: 'dashboard',
})

const { isLoading, error, fetchSettlementLogs, fetchSettlementFees, fetchEscrowTransactions } = usePaymentSettlement()

const logs = ref<SettlementLog[]>([])
const fees = ref<SettlementFee[]>([])
const escrows = ref<EscrowTransaction[]>([])

const search = ref('')
const statusFilter = ref<'all' | SettlementStatus>('all')
const gatewayIdFilter = ref<string>('')
const typeFilter = ref<'logs' | 'fees' | 'escrow'>('logs')

const loadAll = async () => {
  await Promise.all([
    fetchSettlementLogs(gatewayIdFilter.value || undefined).then(r => logs.value = r),
    fetchSettlementFees(gatewayIdFilter.value || undefined).then(r => fees.value = r),
    fetchEscrowTransactions(gatewayIdFilter.value || undefined).then(r => escrows.value = r),
  ])
}

// Always fetch on mount to ensure API call is made
onMounted(async () => {
  if (import.meta.dev) {
    // eslint-disable-next-line no-console
    console.warn('[settlements.vue] onMounted - calling loadAll()')
  }
  await loadAll()
})

watch([statusFilter, gatewayIdFilter], () => {
  loadAll()
})

const filteredLogs = computed(() => {
  let result = logs.value
  if (statusFilter.value !== 'all') {
    result = result.filter(log => log.status === statusFilter.value)
  }
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    result = result.filter(log =>
      log.batchId.toLowerCase().includes(searchLower) ||
      log.id.toLowerCase().includes(searchLower)
    )
  }
  return result
})

const filteredFees = computed(() => {
  let result = fees.value
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    result = result.filter(fee =>
      fee.transactionId.toLowerCase().includes(searchLower) ||
      fee.id.toLowerCase().includes(searchLower)
    )
  }
  return result
})

const filteredEscrows = computed(() => {
  let result = escrows.value
  if (statusFilter.value !== 'all') {
    result = result.filter(escrow => escrow.status === statusFilter.value)
  }
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    result = result.filter(escrow =>
      escrow.paymentId.toLowerCase().includes(searchLower) ||
      escrow.id.toLowerCase().includes(searchLower)
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

const totalSettlementAmount = computed(() => {
  return logs.value
    .filter(log => log.status === 'completed')
    .reduce((sum, log) => sum + (log.amount || 0), 0)
})

const totalFees = computed(() => {
  return fees.value.reduce((sum, fee) => sum + (fee.amount || 0), 0)
})

const totalEscrow = computed(() => {
  return escrows.value
    .filter(e => e.status === 'active' || e.status === 'held')
    .reduce((sum, e) => sum + (e.amount || 0), 0)
})
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
          Settlements
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          Manage settlement logs, fees, and escrow transactions
        </BaseParagraph>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Total Settled
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ formatCurrency(totalSettlementAmount) }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/20">
            <Icon name="solar:wallet-money-bold-duotone" class="size-6 text-success-500" />
          </div>
        </div>
      </BaseCard>

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
              {{ formatCurrency(totalFees) }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-900/20">
            <Icon name="solar:dollar-minimalistic-bold-duotone" class="size-6 text-warning-500" />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Escrow Balance
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ formatCurrency(totalEscrow) }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-info-50 dark:bg-info-900/20">
            <Icon name="solar:shield-check-bold-duotone" class="size-6 text-info-500" />
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Type Selector -->
    <BaseCard class="p-6">
      <div class="flex items-center gap-2 rounded-lg border border-muted-200 bg-muted-50 p-1 dark:border-muted-800 dark:bg-muted-900/50">
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          :class="typeFilter === 'logs' ? 'bg-primary-500 text-white shadow-sm' : 'text-muted-600 dark:text-muted-400 hover:text-muted-900 dark:hover:text-muted-200'"
          @click="typeFilter = 'logs'"
        >
          Logs ({{ logs.length }})
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          :class="typeFilter === 'fees' ? 'bg-primary-500 text-white shadow-sm' : 'text-muted-600 dark:text-muted-400 hover:text-muted-900 dark:hover:text-muted-200'"
          @click="typeFilter = 'fees'"
        >
          Fees ({{ fees.length }})
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          :class="typeFilter === 'escrow' ? 'bg-primary-500 text-white shadow-sm' : 'text-muted-600 dark:text-muted-400 hover:text-muted-900 dark:hover:text-muted-200'"
          @click="typeFilter = 'escrow'"
        >
          Escrow ({{ escrows.length }})
        </button>
      </div>
    </BaseCard>

    <!-- Filters -->
    <BaseCard class="p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TairoFormGroup label="Search">
          <TairoInput
            v-model="search"
            placeholder="Search..."
            icon="solar:magnifier-bold-duotone"
            size="lg"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Status" v-if="typeFilter === 'logs' || typeFilter === 'escrow'">
          <TairoSelect
            v-model="statusFilter"
            size="lg"
          >
            <BaseSelectItem value="all">All Status</BaseSelectItem>
            <BaseSelectItem value="pending">Pending</BaseSelectItem>
            <BaseSelectItem value="processing">Processing</BaseSelectItem>
            <BaseSelectItem value="completed">Completed</BaseSelectItem>
            <BaseSelectItem value="failed">Failed</BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>

        <TairoFormGroup label="Gateway">
          <TairoInput
            v-model="gatewayIdFilter"
            placeholder="Filter by gateway ID..."
            size="lg"
          />
        </TairoFormGroup>
      </div>
    </BaseCard>

    <!-- Settlement Logs Table -->
    <BaseCard v-if="typeFilter === 'logs'" class="p-6">
      <div class="mb-4">
        <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
          Settlement Logs
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
          View settlement batch logs and processing history
        </BaseParagraph>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Batch ID</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Amount</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Status</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Created</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Settled</BaseText></th>
            </tr>
          </thead>
          <tbody>
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="`loading-logs-${i}`" class="border-b border-muted-100 dark:border-muted-900">
                <td colspan="5" class="px-4 py-4"><div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" /></td>
              </tr>
            </template>
            <tr v-else-if="filteredLogs.length === 0" key="empty-logs" class="border-b border-muted-100 dark:border-muted-900">
              <td colspan="5" class="px-4 py-12 text-center"><BaseText size="sm" class="text-muted-500">No settlement logs found</BaseText></td>
            </tr>
            <template v-else>
              <tr v-for="log in filteredLogs.slice(0, 20)" :key="log.id" class="border-b border-muted-100 dark:border-muted-900">
                <td class="px-4 py-3"><BaseText size="sm" class="font-mono">{{ log.batchId?.substring(0, 12) }}...</BaseText></td>
                <td class="px-4 py-3"><BaseText size="sm" weight="medium">{{ formatCurrency(log.amount || 0, log.currency || 'USD') }}</BaseText></td>
                <td class="px-4 py-3"><BaseChip size="xs" :color="log.status === 'completed' ? 'success' : log.status === 'failed' ? 'danger' : 'warning'" variant="pastel">{{ log.status }}</BaseChip></td>
                <td class="px-4 py-3"><BaseText size="sm">{{ log.createdAt ? new Date(log.createdAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
                <td class="px-4 py-3"><BaseText size="sm">{{ log.settledAt ? new Date(log.settledAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- Fees Table -->
    <BaseCard v-if="typeFilter === 'fees'" class="p-6">
      <div class="mb-4">
        <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
          Settlement Fees
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
          View all fees associated with settlements
        </BaseParagraph>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Transaction ID</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Fee Type</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Amount</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Date</BaseText></th>
            </tr>
          </thead>
          <tbody>
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="`loading-fees-${i}`" class="border-b border-muted-100 dark:border-muted-900">
                <td colspan="4" class="px-4 py-4"><div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" /></td>
              </tr>
            </template>
            <tr v-else-if="filteredFees.length === 0" key="empty-fees" class="border-b border-muted-100 dark:border-muted-900">
              <td colspan="4" class="px-4 py-12 text-center"><BaseText size="sm" class="text-muted-500">No fees found</BaseText></td>
            </tr>
            <template v-else>
              <tr v-for="fee in filteredFees.slice(0, 20)" :key="fee.id" class="border-b border-muted-100 dark:border-muted-900">
                <td class="px-4 py-3"><BaseText size="sm" class="font-mono">{{ fee.transactionId?.substring(0, 12) }}...</BaseText></td>
                <td class="px-4 py-3"><BaseChip size="xs" :color="fee.feeType === 'processing' ? 'danger' : fee.feeType === 'gateway' ? 'warning' : 'info'" variant="pastel">{{ fee.feeType }}</BaseChip></td>
                <td class="px-4 py-3"><BaseText size="sm" weight="medium">{{ formatCurrency(fee.amount || 0, fee.currency || 'USD') }}</BaseText></td>
                <td class="px-4 py-3"><BaseText size="sm">{{ fee.createdAt ? new Date(fee.createdAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- Escrow Table -->
    <BaseCard v-if="typeFilter === 'escrow'" class="p-6">
      <div class="mb-4">
        <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
          Escrow Transactions
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
          View funds held in escrow
        </BaseParagraph>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Payment ID</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Amount</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Status</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Held Until</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Released</BaseText></th>
            </tr>
          </thead>
          <tbody>
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="`loading-escrow-${i}`" class="border-b border-muted-100 dark:border-muted-900">
                <td colspan="5" class="px-4 py-4"><div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" /></td>
              </tr>
            </template>
            <tr v-else-if="filteredEscrows.length === 0" key="empty-escrow" class="border-b border-muted-100 dark:border-muted-900">
              <td colspan="5" class="px-4 py-12 text-center"><BaseText size="sm" class="text-muted-500">No escrow transactions found</BaseText></td>
            </tr>
            <template v-else>
              <tr v-for="escrow in filteredEscrows.slice(0, 20)" :key="escrow.id" class="border-b border-muted-100 dark:border-muted-900">
                <td class="px-4 py-3"><BaseText size="sm" class="font-mono">{{ escrow.paymentId?.substring(0, 12) }}...</BaseText></td>
                <td class="px-4 py-3"><BaseText size="sm" weight="medium">{{ formatCurrency(escrow.amount || 0, escrow.currency || 'USD') }}</BaseText></td>
                <td class="px-4 py-3"><BaseChip size="xs" :color="escrow.status === 'released' ? 'success' : escrow.status === 'held' ? 'warning' : 'info'" variant="pastel">{{ escrow.status }}</BaseChip></td>
                <td class="px-4 py-3"><BaseText size="sm">{{ escrow.releaseDate ? new Date(escrow.releaseDate).toLocaleDateString() : 'N/A' }}</BaseText></td>
                <td class="px-4 py-3"><BaseText size="sm">{{ escrow.releasedAt ? new Date(escrow.releasedAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
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
        Failed to load settlements
      </template>
      <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
        {{ error }}
      </BaseParagraph>
    </BaseAlert>
  </div>
</template>

