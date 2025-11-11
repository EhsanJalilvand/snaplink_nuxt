<script setup lang="ts">
import type { BillingInvoiceItem, BillingInvoiceStatus } from '~/types/billing'

const props = withDefaults(defineProps<{
  items: BillingInvoiceItem[]
  isLoading?: boolean
  getStatusConfig: (status: BillingInvoiceStatus) => { label: string; color: string; icon: string }
}>(), {
  items: () => [],
  isLoading: false,
})

const emit = defineEmits<{
  (e: 'download', invoice: BillingInvoiceItem): void
}>()

const handleDownload = (invoice: BillingInvoiceItem) => {
  emit('download', invoice)
}
</script>

<template>
  <BaseCard class="overflow-hidden">
    <div v-if="isLoading" class="space-y-2 p-6">
      <div v-for="index in 5" :key="index" class="h-14 animate-pulse rounded-xl bg-muted-200/80 dark:bg-muted-800/60" />
    </div>

    <template v-else>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-muted-200 bg-muted-50 dark:border-muted-700 dark:bg-muted-800/50">
            <tr>
              <th class="px-6 py-4 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Invoice ID</BaseText>
              </th>
              <th class="px-6 py-4 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Date</BaseText>
              </th>
              <th class="px-6 py-4 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Description</BaseText>
              </th>
              <th class="px-6 py-4 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Amount</BaseText>
              </th>
              <th class="px-6 py-4 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Method</BaseText>
              </th>
              <th class="px-6 py-4 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Status</BaseText>
              </th>
              <th class="px-6 py-4 text-right">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Actions</BaseText>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-muted-200 dark:divide-muted-700">
            <tr
              v-for="invoice in items"
              :key="invoice.id"
              class="transition-colors hover:bg-muted-50 dark:hover:bg-muted-800/40"
            >
              <td class="px-6 py-4">
                <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                  {{ invoice.id }}
                </BaseText>
              </td>
              <td class="px-6 py-4">
                <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                  {{ new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}
                </BaseText>
              </td>
              <td class="px-6 py-4">
                <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                  {{ invoice.description }}
                </BaseText>
              </td>
              <td class="px-6 py-4">
                <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                  ${{ invoice.amount.toFixed(2) }}
                </BaseText>
              </td>
              <td class="px-6 py-4">
                <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                  {{ invoice.method }}
                </BaseText>
              </td>
              <td class="px-6 py-4">
                <BaseChip :color="getStatusConfig(invoice.status).color" size="sm">
                  <Icon :name="getStatusConfig(invoice.status).icon" class="size-3" />
                  <span>{{ getStatusConfig(invoice.status).label }}</span>
                </BaseChip>
              </td>
              <td class="px-6 py-4 text-right">
                <BaseButton size="sm" variant="ghost" icon class="rounded-full" @click="handleDownload(invoice)">
                  <Icon name="ph:download" class="size-4" />
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="items.length === 0"
        class="flex flex-col items-center justify-center gap-2 py-12"
      >
        <Icon name="solar:document-linear" class="size-12 text-muted-400" />
        <BaseHeading as="h4" size="sm" weight="medium" class="text-muted-600 dark:text-muted-400">
          No invoices found
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Try adjusting your filters
        </BaseParagraph>
      </div>
    </template>
  </BaseCard>
</template>
