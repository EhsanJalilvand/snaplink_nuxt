<script setup lang="ts">
const activities = ref([
  {
    id: 'act-1',
    type: 'payment',
    title: 'Payment captured',
    description: 'Escrow release for invoice #INV-2024-118',
    amount: 1280.45,
    currency: 'USD',
    time: '2 minutes ago',
    status: 'success',
  },
  {
    id: 'act-2',
    type: 'refund',
    title: 'Refund processed',
    description: 'Partial refund for link snap.link/pay/pro',
    amount: 180.00,
    currency: 'USD',
    time: '12 minutes ago',
    status: 'info',
  },
  {
    id: 'act-3',
    type: 'alert',
    title: 'High risk flagged',
    description: 'Gateway velocity triggered for merchant “Nova Labs”',
    time: '25 minutes ago',
    status: 'warning',
  },
  {
    id: 'act-4',
    type: 'payout',
    title: 'Payout initiated',
    description: 'Sent to USDC wallet ending 8XY1',
    amount: 8200.55,
    currency: 'USD',
    time: '1 hour ago',
    status: 'success',
  },
])

const statusConfig: Record<string, { icon: string; color: string }> = {
  success: {
    icon: 'solar:check-circle-bold-duotone',
    color: 'text-success-500',
  },
  info: {
    icon: 'solar:info-circle-bold-duotone',
    color: 'text-info-500',
  },
  warning: {
    icon: 'solar:warning-triangle-bold-duotone',
    color: 'text-warning-500',
  },
  danger: {
    icon: 'solar:danger-circle-bold-duotone',
    color: 'text-danger-500',
  },
}
</script>

<template>
  <BaseCard class="p-6">
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-900 dark:text-white"
        >
          Recent Activity
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Real-time ledger of payment operations and automations.
        </BaseParagraph>
      </div>
      <BaseButton
        size="sm"
        variant="outline"
        color="primary"
        to="/dashboard/payment/links"
      >
        View ledger
      </BaseButton>
    </div>

    <div class="mt-6 space-y-4">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex items-start gap-4 rounded-2xl border border-muted-200 bg-muted-50/70 p-4 dark:border-muted-700/60 dark:bg-muted-900/40"
      >
        <div class="flex-shrink-0">
          <div
            :class="[
              'flex size-10 items-center justify-center rounded-xl bg-white shadow-sm shadow-muted-200/40 dark:bg-muted-800',
              statusConfig[activity.status].color,
            ]"
          >
            <Icon :name="statusConfig[activity.status].icon" class="size-5" />
          </div>
        </div>
        <div class="flex-1">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <BaseHeading
              as="h4"
              size="sm"
              weight="semibold"
              class="text-muted-900 dark:text-white"
            >
              {{ activity.title }}
            </BaseHeading>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              {{ activity.time }}
            </BaseText>
          </div>
          <BaseParagraph size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
            {{ activity.description }}
          </BaseParagraph>
          <div
            v-if="activity.amount"
            class="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-muted-900 shadow-sm dark:bg-muted-800 dark:text-muted-100"
          >
            <Icon name="solar:card-transfer-bold-duotone" class="size-3 text-primary-500" />
            <span>{{ activity.amount.toLocaleString('en-US', { style: 'currency', currency: activity.currency }) }}</span>
          </div>
        </div>
        <BaseButton size="sm" variant="ghost" icon class="rounded-full">
          <Icon name="ph:arrow-up-right" class="size-4" />
        </BaseButton>
      </div>
    </div>
  </BaseCard>
</template>

