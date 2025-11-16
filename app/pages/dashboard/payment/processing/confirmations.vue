<script setup lang="ts">
import { callOnce, ref, watch } from '#imports'
import { usePaymentProcessing } from '~/composables/usePaymentProcessing'
import type { ProcessingFilters } from '~/types/payment-processing'

definePageMeta({
  title: 'Payment Confirmations',
  layout: 'dashboard',
})

const { isLoading, error, fetchConfirmations } = usePaymentProcessing()

const confirmations = ref<any[]>([])
const filters = ref<ProcessingFilters>({
  search: '',
  status: 'all',
})

const loadConfirmations = async () => {
  confirmations.value = await fetchConfirmations(filters.value)
}

callOnce(() => loadConfirmations())

watch(() => filters.value, () => {
  loadConfirmations()
}, { deep: true })
</script>

<template>
  <div class="space-y-6 py-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading as="h1" size="2xl" weight="bold" class="text-muted-900 dark:text-white">
          Payment Confirmations
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          View payment confirmation records and receipts
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
            <BaseSelectItem value="pending">Pending</BaseSelectItem>
            <BaseSelectItem value="confirmed">Confirmed</BaseSelectItem>
            <BaseSelectItem value="failed">Failed</BaseSelectItem>
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
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Intent ID</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Status</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Transaction ID</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Confirmed At</BaseText></th>
              <th class="px-4 py-3 text-right"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Actions</BaseText></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading" v-for="i in 5" :key="i"><td colspan="6" class="px-4 py-4"><div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" /></td></tr>
            <tr v-else-if="confirmations.length === 0"><td colspan="6" class="px-4 py-12 text-center"><BaseText size="sm" class="text-muted-500">No confirmations found</BaseText></td></tr>
            <tr v-else v-for="conf in confirmations.slice(0, 10)" :key="conf.id" class="border-b border-muted-100 dark:border-muted-900">
              <td class="px-4 py-3"><BaseText size="sm" class="font-mono">{{ conf.id.substring(0, 8) }}...</BaseText></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ conf.intentId?.substring(0, 8) }}...</BaseText></td>
              <td class="px-4 py-3"><BaseChip size="xs" :color="conf.status === 'confirmed' ? 'success' : conf.status === 'failed' ? 'danger' : 'warning'" variant="pastel">{{ conf.status }}</BaseChip></td>
              <td class="px-4 py-3"><BaseText size="sm" class="font-mono">{{ conf.transactionId?.substring(0, 12) || 'N/A' }}</BaseText></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ conf.confirmedAt ? new Date(conf.confirmedAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
              <td class="px-4 py-3 text-right">
                <BaseButton v-if="conf.receiptUrl" size="sm" variant="ghost" @click="window.open(conf.receiptUrl, '_blank')">
                  <Icon name="solar:download-bold-duotone" class="size-4" />
                  Receipt
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <BaseAlert v-if="error" color="danger" variant="pastel" class="rounded-2xl">
      <template #title>Failed to load confirmations</template>
      <BaseParagraph size="sm">{{ error }}</BaseParagraph>
    </BaseAlert>
  </div>
</template>

