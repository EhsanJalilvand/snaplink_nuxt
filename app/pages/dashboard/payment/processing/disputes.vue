<script setup lang="ts">
import { ref, watch } from '#imports'
import { usePaymentProcessing } from '~/composables/usePaymentProcessing'
import type { ProcessingFilters } from '~/types/payment-processing'

definePageMeta({
  title: 'Disputes',
  layout: 'dashboard',
})

const { isLoading, error, fetchDisputes } = usePaymentProcessing()

const disputes = ref<any[]>([])
const filters = ref<ProcessingFilters>({
  search: '',
  status: 'all',
})

const loadDisputes = async () => {
  disputes.value = await fetchDisputes(filters.value)
}

// Always fetch on mount to ensure API call is made
onMounted(async () => {
  if (import.meta.dev) {
    // eslint-disable-next-line no-console
    console.warn('[processing/disputes.vue] onMounted - calling loadDisputes()')
  }
  await loadDisputes()
})

watch(() => filters.value, () => {
  loadDisputes()
}, { deep: true })

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USDC' ? 'USD' : currency,
  }).format(amount)
}
</script>

<template>
  <div class="space-y-6 py-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading as="h1" size="2xl" weight="bold" class="text-muted-900 dark:text-white">
          Disputes
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          Monitor and manage payment disputes
        </BaseParagraph>
      </div>
    </div>

    <BaseCard class="p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TairoFormGroup label="Search">
          <TairoInput v-model="filters.search" placeholder="Search..." icon="solar:magnifier-bold-duotone" size="lg" />
        </TairoFormGroup>
        <TairoFormGroup label="Status">
          <TairoSelect v-model="filters.status" size="lg">
            <BaseSelectItem value="all">All Status</BaseSelectItem>
            <BaseSelectItem value="open">Open</BaseSelectItem>
            <BaseSelectItem value="under_review">Under Review</BaseSelectItem>
            <BaseSelectItem value="won">Won</BaseSelectItem>
            <BaseSelectItem value="lost">Lost</BaseSelectItem>
            <BaseSelectItem value="canceled">Canceled</BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>
      </div>
    </BaseCard>

    <BaseCard class="p-6">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">ID</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Payment ID</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Amount</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Status</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Reason</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Opened At</BaseText></th>
              <th class="px-4 py-3 text-right"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Actions</BaseText></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading" v-for="i in 5" :key="i"><td colspan="7" class="px-4 py-4"><div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" /></td></tr>
            <tr v-else-if="disputes.length === 0"><td colspan="7" class="px-4 py-12 text-center"><BaseText size="sm" class="text-muted-500">No disputes found</BaseText></td></tr>
            <tr v-else v-for="dispute in disputes.slice(0, 10)" :key="dispute.id" class="border-b border-muted-100 dark:border-muted-900">
              <td class="px-4 py-3"><BaseText size="sm" class="font-mono">{{ dispute.id.substring(0, 8) }}...</BaseText></td>
              <td class="px-4 py-3"><BaseText size="sm" class="font-mono">{{ dispute.paymentId?.substring(0, 8) }}...</BaseText></td>
              <td class="px-4 py-3"><BaseText size="sm" weight="medium">{{ formatCurrency(dispute.amount || 0, dispute.currency || 'USD') }}</BaseText></td>
              <td class="px-4 py-3"><BaseChip size="xs" :color="dispute.status === 'won' ? 'success' : dispute.status === 'lost' ? 'danger' : 'warning'" variant="pastel">{{ dispute.status }}</BaseChip></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ dispute.reason || 'N/A' }}</BaseText></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ dispute.openedAt ? new Date(dispute.openedAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
              <td class="px-4 py-3 text-right">
                <BaseButton v-if="dispute.evidence?.length" size="sm" variant="ghost">
                  <Icon name="solar:eye-bold-duotone" class="size-4" />
                  View Evidence
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <BaseAlert v-if="error" color="danger" variant="pastel" class="rounded-2xl">
      <template #title>Failed to load disputes</template>
      <BaseParagraph size="sm">{{ error }}</BaseParagraph>
    </BaseAlert>
  </div>
</template>

