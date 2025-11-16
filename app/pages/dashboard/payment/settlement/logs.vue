<script setup lang="ts">
import { ref, watch, computed } from '#imports'
import { usePaymentSettlement } from '~/composables/usePaymentSettlement'
import type { SettlementLog, SettlementStatus } from '~/types/payment-settlement'

definePageMeta({
  title: 'Settlement Logs',
  layout: 'dashboard',
})

const { isLoading, error, fetchSettlementLogs } = usePaymentSettlement()

const logs = ref<SettlementLog[]>([])
const search = ref('')
const statusFilter = ref<'all' | SettlementStatus>('all')
const gatewayIdFilter = ref<string>('')

const loadLogs = async () => {
  logs.value = await fetchSettlementLogs(gatewayIdFilter.value || undefined)
}

// Always fetch on mount to ensure API call is made
onMounted(async () => {
  if (import.meta.dev) {
    // eslint-disable-next-line no-console
    console.warn('[settlement/logs.vue] onMounted - calling loadLogs()')
  }
  await loadLogs()
})

watch([statusFilter, gatewayIdFilter], () => {
  loadLogs()
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

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USDC' ? 'USD' : currency,
  }).format(amount)
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
          Settlement Logs
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          View settlement batch logs and processing history
        </BaseParagraph>
      </div>
      <BaseButton
        variant="outline"
        color="primary"
      >
        <Icon name="solar:download-bold-duotone" class="size-4" />
        Export Logs
      </BaseButton>
    </div>

    <!-- Filters -->
    <BaseCard class="p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TairoFormGroup label="Search">
          <TairoInput
            v-model="search"
            placeholder="Search by batch ID..."
            icon="solar:magnifier-bold-duotone"
            size="lg"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Status">
          <TairoSelect
            v-model="statusFilter"
            size="lg"
          >
            <BaseSelectItem value="all">
              All Status
            </BaseSelectItem>
            <BaseSelectItem value="pending">
              Pending
            </BaseSelectItem>
            <BaseSelectItem value="processing">
              Processing
            </BaseSelectItem>
            <BaseSelectItem value="completed">
              Completed
            </BaseSelectItem>
            <BaseSelectItem value="failed">
              Failed
            </BaseSelectItem>
            <BaseSelectItem value="reversed">
              Reversed
            </BaseSelectItem>
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

    <!-- Stats Cards -->
    <div
      v-if="!isLoading && filteredLogs.length > 0"
      class="grid grid-cols-1 gap-4 md:grid-cols-4"
    >
      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Total Settlements
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ formatCurrency(filteredLogs.reduce((sum, log) => sum + log.amount, 0), 'USD') }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/20">
            <Icon
              name="solar:wallet-money-bold-duotone"
              class="size-6 text-success-500"
            />
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
              {{ formatCurrency(filteredLogs.reduce((sum, log) => sum + log.fees, 0), 'USD') }}
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
              Net Amount
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ formatCurrency(filteredLogs.reduce((sum, log) => sum + log.netAmount, 0), 'USD') }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
            <Icon
              name="solar:money-bag-bold-duotone"
              class="size-6 text-primary-500"
            />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Batch Count
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ filteredLogs.length }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-info-50 dark:bg-info-900/20">
            <Icon
              name="solar:document-bold-duotone"
              class="size-6 text-info-500"
            />
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
                  Batch ID
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Gateway
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Amount
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Fees
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Net Amount
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Transactions
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Status
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Settlement Date
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
              <td colspan="8" class="px-4 py-4">
                <div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" />
              </td>
            </tr>
            <tr
              v-else-if="filteredLogs.length === 0"
              class="border-b border-muted-100 dark:border-muted-900"
            >
              <td colspan="8" class="px-4 py-12 text-center">
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  No settlement logs found
                </BaseText>
              </td>
            </tr>
            <tr
              v-else
              v-for="log in filteredLogs.slice(0, 20)"
              :key="log.id"
              class="border-b border-muted-100 dark:border-muted-900"
            >
              <td class="px-4 py-3">
                <BaseText size="sm" weight="medium" class="font-mono text-muted-900 dark:text-white">
                  {{ log.batchId }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-700 dark:text-muted-300">
                  Gateway {{ log.gatewayId?.substring(0, 8) || 'N/A' }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                  {{ formatCurrency(log.amount, log.currency) }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-warning-600 dark:text-warning-400">
                  {{ formatCurrency(log.fees, log.currency) }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" weight="medium" class="text-success-600 dark:text-success-400">
                  {{ formatCurrency(log.netAmount, log.currency) }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-700 dark:text-muted-300">
                  {{ log.transactionCount }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseChip
                  size="xs"
                  :color="log.status === 'completed' ? 'success' : log.status === 'failed' ? 'danger' : log.status === 'processing' ? 'warning' : 'muted'"
                  variant="pastel"
                >
                  {{ log.status }}
                </BaseChip>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  {{ log.settlementDate ? new Date(log.settlementDate).toLocaleDateString() : 'N/A' }}
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
        Failed to load settlement logs
      </template>
      <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
        {{ error }}
      </BaseParagraph>
    </BaseAlert>
  </div>
</template>

