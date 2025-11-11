<script setup lang="ts">
import type { PaymentActivityItem } from '~/types/payments'

interface PaymentRecentActivityProps {
  activities?: PaymentActivityItem[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<PaymentRecentActivityProps>(), {
  activities: () => [],
  isLoading: false,
})

const badgeClass = (color: string) => {
  switch (color) {
    case 'success':
      return 'text-success-500'
    case 'info':
      return 'text-info-500'
    case 'warning':
      return 'text-warning-500'
    case 'danger':
      return 'text-danger-500'
    default:
      return 'text-primary-500'
  }
}

const iconFor = (activity: PaymentActivityItem) => activity.icon || 'solar:card-transfer-bold-duotone'
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
        v-for="activity in props.activities"
        :key="activity.id"
        class="flex items-start gap-4 rounded-2xl border border-muted-200 bg-muted-50/70 p-4 dark:border-muted-700/60 dark:bg-muted-900/40"
      >
        <div class="flex-shrink-0">
          <div
            :class="[
              'flex size-10 items-center justify-center rounded-xl bg-white shadow-sm shadow-muted-200/40 dark:bg-muted-800',
              badgeClass(activity.color),
            ]"
          >
            <Icon :name="iconFor(activity)" class="size-5" />
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
              <span v-if="props.isLoading" class="block h-5 w-40 animate-pulse rounded bg-muted-200/60 dark:bg-muted-800/60" />
              <template v-else>
                {{ activity.title }}
              </template>
            </BaseHeading>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              <span v-if="props.isLoading" class="block h-4 w-24 animate-pulse rounded bg-muted-200/40 dark:bg-muted-800/40" />
              <template v-else>
                {{ activity.timestamp }}
              </template>
            </BaseText>
          </div>
          <BaseParagraph size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
            <span v-if="props.isLoading" class="block h-4 w-full animate-pulse rounded bg-muted-200/40 dark:bg-muted-800/40" />
            <template v-else>
              {{ activity.description }}
            </template>
          </BaseParagraph>
          <div
            v-if="activity.amount && !props.isLoading"
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

