<script setup lang="ts">
import { callOnce, ref, watch, computed } from '#imports'
import { usePaymentSettlement } from '~/composables/usePaymentSettlement'
import type { EscrowTransaction, EscrowStatus } from '~/types/payment-settlement'

definePageMeta({
  title: 'Escrow Transactions',
  layout: 'dashboard',
})

const { isLoading, error, fetchEscrowTransactions } = usePaymentSettlement()

const escrows = ref<EscrowTransaction[]>([])
const search = ref('')
const statusFilter = ref<'all' | EscrowStatus>('all')
const gatewayIdFilter = ref<string>('')

const loadEscrows = async () => {
  escrows.value = await fetchEscrowTransactions(gatewayIdFilter.value || undefined)
}

callOnce(() => loadEscrows())

watch([statusFilter, gatewayIdFilter], () => {
  loadEscrows()
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
          Escrow Transactions
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          Monitor escrow transactions and release status
        </BaseParagraph>
      </div>
    </div>

    <!-- Filters -->
    <BaseCard class="p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TairoFormGroup label="Search">
          <TairoInput
            v-model="search"
            placeholder="Search by payment ID..."
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
            <BaseSelectItem value="locked">
              Locked
            </BaseSelectItem>
            <BaseSelectItem value="released">
              Released
            </BaseSelectItem>
            <BaseSelectItem value="refunded">
              Refunded
            </BaseSelectItem>
            <BaseSelectItem value="disputed">
              Disputed
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

    <!-- Stats -->
    <div
      v-if="!isLoading && filteredEscrows.length > 0"
      class="grid grid-cols-1 gap-4 md:grid-cols-4"
    >
      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Total Locked
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ formatCurrency(filteredEscrows.filter(e => e.status === 'locked').reduce((sum, e) => sum + e.amount, 0), 'USD') }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-900/20">
            <Icon
              name="solar:lock-password-bold-duotone"
              class="size-6 text-warning-500"
            />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Total Released
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-success-600 dark:text-success-400"
            >
              {{ formatCurrency(filteredEscrows.filter(e => e.status === 'released').reduce((sum, e) => sum + e.amount, 0), 'USD') }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/20">
            <Icon
              name="solar:unlock-bold-duotone"
              class="size-6 text-success-500"
            />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Total Refunded
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-danger-600 dark:text-danger-400"
            >
              {{ formatCurrency(filteredEscrows.filter(e => e.status === 'refunded').reduce((sum, e) => sum + e.amount, 0), 'USD') }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-danger-50 dark:bg-danger-900/20">
            <Icon
              name="solar:refresh-bold-duotone"
              class="size-6 text-danger-500"
            />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Total Count
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ filteredEscrows.length }}
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
                  Escrow ID
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Payment ID
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
                  Locked At
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Release Date
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Released/Refunded At
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
              v-else-if="filteredEscrows.length === 0"
              class="border-b border-muted-100 dark:border-muted-900"
            >
              <td colspan="7" class="px-4 py-12 text-center">
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  No escrow transactions found
                </BaseText>
              </td>
            </tr>
            <tr
              v-else
              v-for="escrow in filteredEscrows.slice(0, 20)"
              :key="escrow.id"
              class="border-b border-muted-100 dark:border-muted-900"
            >
              <td class="px-4 py-3">
                <BaseText size="sm" weight="medium" class="font-mono text-muted-900 dark:text-white">
                  {{ escrow.id.substring(0, 8) }}...
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="font-mono text-muted-700 dark:text-muted-300">
                  {{ escrow.paymentId.substring(0, 12) }}...
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                  {{ formatCurrency(escrow.amount, escrow.currency) }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseChip
                  size="xs"
                  :color="escrow.status === 'released' ? 'success' : escrow.status === 'refunded' ? 'danger' : escrow.status === 'disputed' ? 'warning' : 'muted'"
                  variant="pastel"
                >
                  {{ escrow.status }}
                </BaseChip>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  {{ escrow.lockedAt ? new Date(escrow.lockedAt).toLocaleDateString() : 'N/A' }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  {{ escrow.releaseDate ? new Date(escrow.releaseDate).toLocaleDateString() : 'N/A' }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  {{ escrow.releasedAt ? new Date(escrow.releasedAt).toLocaleDateString() : escrow.refundedAt ? new Date(escrow.refundedAt).toLocaleDateString() : 'N/A' }}
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
        Failed to load escrow transactions
      </template>
      <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
        {{ error }}
      </BaseParagraph>
    </BaseAlert>
  </div>
</template>

