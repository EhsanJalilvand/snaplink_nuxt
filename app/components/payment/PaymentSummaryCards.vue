<script setup lang="ts">
import { computed } from '#imports'
import type { PaymentBalanceSummary, PaymentSummaryTrends } from '~/types/payments'

interface PaymentSummaryCardsProps {
  summary?: PaymentBalanceSummary | null
  trends?: PaymentSummaryTrends | null
  isLoading?: boolean
}

const props = withDefaults(defineProps<PaymentSummaryCardsProps>(), {
  summary: () => ({
    total: 0,
    pending: 0,
    available: 0,
  }),
  trends: () => ({
    total: { value: '0%', direction: 'up' },
    pending: { value: '0%', direction: 'up' },
    available: { value: '0%', direction: 'up' },
  }),
  isLoading: false,
})

const cards = computed(() => [
  {
    label: 'Total Balance',
    value: props.summary.total,
    trend: props.trends.total,
    icon: 'solar:wallet-bold-duotone',
    accent: 'primary',
  },
  {
    label: 'Pending Balance',
    value: props.summary.pending,
    trend: props.trends.pending,
    icon: 'solar:clock-circle-bold-duotone',
    accent: 'warning',
  },
  {
    label: 'Available Balance',
    value: props.summary.available,
    trend: props.trends.available,
    icon: 'solar:banknote-bold-duotone',
    accent: 'success',
  },
])

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const accentClass = (accent: string) => {
  switch (accent) {
    case 'warning':
      return 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400'
    case 'success':
      return 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400'
    default:
      return 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
  }
}
</script>

<template>
  <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
    <BaseCard
      v-for="card in cards"
      :key="card.label"
      class="p-6"
    >
      <div class="flex items-start justify-between">
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            {{ card.label }}
          </BaseText>
          <div class="mt-2">
            <div
              v-if="isLoading"
              class="h-7 w-32 rounded-lg bg-muted-200/80 animate-pulse dark:bg-muted-800/60"
            />
            <BaseHeading
              v-else
              as="h3"
              size="2xl"
              weight="bold"
              class="text-muted-900 dark:text-white"
            >
              {{ formatCurrency(card.value) }}
            </BaseHeading>
          </div>
        </div>
        <div
          class="rounded-2xl p-3"
          :class="accentClass(card.accent)"
        >
          <Icon :name="card.icon" class="size-6" />
        </div>
      </div>
      <div
        class="mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
        :class="card.trend.direction === 'up'
          ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400'
          : 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400'"
      >
        <div
          v-if="isLoading"
          class="h-4 w-40 rounded-full bg-muted-200/80 animate-pulse dark:bg-muted-800/60"
        />
        <template v-else>
          <Icon
            :name="card.trend.direction === 'up' ? 'ph:arrow-up-right' : 'ph:arrow-down-right'"
            class="size-3"
          />
          <span>{{ card.trend.value }} compared to last cycle</span>
        </template>
      </div>
    </BaseCard>
  </div>
</template>

