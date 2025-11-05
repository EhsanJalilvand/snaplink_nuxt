<script setup lang="ts">
definePageMeta({
  title: 'Invoices',
  layout: 'dashboard',
})

const toaster = useNuiToasts()

// Invoice data
const invoices = ref([
  {
    id: 'INV-2024-001',
    date: '2024-03-15',
    amount: 125.50,
    status: 'paid',
    method: 'Credit Card',
    description: 'Service usage - March 2024',
  },
  {
    id: 'INV-2024-002',
    date: '2024-02-15',
    amount: 98.75,
    status: 'paid',
    method: 'Credit Card',
    description: 'Service usage - February 2024',
  },
  {
    id: 'INV-2024-003',
    date: '2024-01-15',
    amount: 150.00,
    status: 'pending',
    method: 'Bank Transfer',
    description: 'Service usage - January 2024',
  },
  {
    id: 'INV-2023-012',
    date: '2023-12-15',
    amount: 87.25,
    status: 'paid',
    method: 'Credit Card',
    description: 'Service usage - December 2023',
  },
  {
    id: 'INV-2023-011',
    date: '2023-11-15',
    amount: 200.00,
    status: 'failed',
    method: 'Credit Card',
    description: 'Service usage - November 2023',
  },
])

const statusFilter = ref<'all' | 'paid' | 'pending' | 'failed'>('all')
const filteredInvoices = computed(() => {
  if (statusFilter.value === 'all') {
    return invoices.value
  }
  return invoices.value.filter(inv => inv.status === statusFilter.value)
})

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'paid':
      return {
        label: 'Paid',
        color: 'success',
        icon: 'ph:check-circle',
      }
    case 'pending':
      return {
        label: 'Pending',
        color: 'warning',
        icon: 'ph:clock',
      }
    case 'failed':
      return {
        label: 'Failed',
        color: 'danger',
        icon: 'ph:x-circle',
      }
    default:
      return {
        label: 'Unknown',
        color: 'muted',
        icon: 'ph:question',
      }
  }
}

const handleDownload = (invoice: any) => {
  // TODO: API call to download invoice
  toaster.add({
    title: 'Download Invoice',
    description: `Downloading ${invoice.id}...`,
    icon: 'ph:download',
    progress: true,
  })
}
</script>

<template>
  <div class="space-y-6 py-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Invoices
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          View and manage your billing invoices
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-3">
        <BaseButton
          variant="outline"
          size="sm"
        >
          <Icon name="ph:download" class="size-4" />
          <span>Export</span>
        </BaseButton>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-2">
      <BaseButton
        v-for="filter in [
          { label: 'All', value: 'all' },
          { label: 'Paid', value: 'paid' },
          { label: 'Pending', value: 'pending' },
          { label: 'Failed', value: 'failed' },
        ]"
        :key="filter.value"
        :variant="statusFilter === filter.value ? 'primary' : 'outline'"
        size="sm"
        @click="statusFilter = filter.value as any"
      >
        {{ filter.label }}
      </BaseButton>
    </div>

    <!-- Invoices Table -->
    <BaseCard class="overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-muted-200 dark:border-muted-700 bg-muted-50 dark:bg-muted-800/50">
            <tr>
              <th class="px-6 py-4 text-start">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Invoice ID
                </BaseText>
              </th>
              <th class="px-6 py-4 text-start">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Date
                </BaseText>
              </th>
              <th class="px-6 py-4 text-start">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Description
                </BaseText>
              </th>
              <th class="px-6 py-4 text-start">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Amount
                </BaseText>
              </th>
              <th class="px-6 py-4 text-start">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Method
                </BaseText>
              </th>
              <th class="px-6 py-4 text-start">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Status
                </BaseText>
              </th>
              <th class="px-6 py-4 text-end">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Actions
                </BaseText>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-muted-200 dark:divide-muted-700">
            <tr
              v-for="invoice in filteredInvoices"
              :key="invoice.id"
              class="hover:bg-muted-50 dark:hover:bg-muted-800/50 transition-colors"
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
                <BaseChip
                  :color="getStatusConfig(invoice.status).color"
                  size="sm"
                >
                  <Icon :name="getStatusConfig(invoice.status).icon" class="size-3" />
                  <span>{{ getStatusConfig(invoice.status).label }}</span>
                </BaseChip>
              </td>
              <td class="px-6 py-4 text-end">
                <BaseButton
                  size="sm"
                  variant="ghost"
                  @click="handleDownload(invoice)"
                >
                  <Icon name="ph:download" class="size-4" />
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredInvoices.length === 0"
        class="flex flex-col items-center justify-center py-12"
      >
        <Icon
          name="solar:document-linear"
          class="size-12 text-muted-400 mb-4"
        />
        <BaseHeading
          as="h4"
          size="sm"
          weight="medium"
          class="text-muted-600 dark:text-muted-400 mb-2"
        >
          No invoices found
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Try adjusting your filters
        </BaseParagraph>
      </div>
    </BaseCard>

    <!-- Plan & Pricing Info -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <BaseCard class="p-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-4"
        >
          Current Plan
        </BaseHeading>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
              Plan Type
            </BaseText>
            <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
              Pay as You Go
            </BaseText>
          </div>
          <div class="flex items-center justify-between">
            <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
              Billing Cycle
            </BaseText>
            <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
              Monthly
            </BaseText>
          </div>
        </div>
        <BaseButton
          variant="outline"
          class="w-full mt-4"
        >
          <Icon name="ph:arrow-up" class="size-4" />
          <span>Upgrade Plan</span>
        </BaseButton>
      </BaseCard>

      <BaseCard class="p-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-4"
        >
          Pricing
        </BaseHeading>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              URL Click
            </BaseText>
            <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
              $0.0001 per click
            </BaseText>
          </div>
          <div class="flex items-center justify-between">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              API Call
            </BaseText>
            <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
              $0.0005 per call
            </BaseText>
          </div>
          <div class="flex items-center justify-between">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Payment Service
            </BaseText>
            <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
              2.5% per transaction
            </BaseText>
          </div>
        </div>
        <BaseButton
          variant="outline"
          class="w-full mt-4"
        >
          <Icon name="ph:info" class="size-4" />
          <span>View Full Pricing</span>
        </BaseButton>
      </BaseCard>
    </div>
  </div>
</template>

