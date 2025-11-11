<script setup lang="ts">
import type { PaymentAlertItem } from '~/types/payments'

interface PaymentAlertsSummaryProps {
  alerts?: PaymentAlertItem[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<PaymentAlertsSummaryProps>(), {
  alerts: () => [],
  isLoading: false,
})

const severityConfig: Record<PaymentAlertItem['severity'], { badge: string; chip: string }> = {
  info: {
    badge: 'bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-300',
    chip: 'info',
  },
  warning: {
    badge: 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-300',
    chip: 'warning',
  },
  danger: {
    badge: 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-300',
    chip: 'danger',
  },
}

const badgeClass = (severity: PaymentAlertItem['severity']) => severityConfig[severity]?.badge ?? severityConfig.info.badge
const chipColor = (severity: PaymentAlertItem['severity']) => severityConfig[severity]?.chip ?? 'info'
</script>

<template>
  <BaseCard class="p-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-900 dark:text-white"
        >
          Alerts & Notifications
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Stay ahead of incidents with proactive intelligence and routing.
        </BaseParagraph>
      </div>
      <BaseButton
        size="sm"
        variant="outline"
        color="primary"
        to="/dashboard/payment/notifications"
      >
        Manage notifications
      </BaseButton>
    </div>

    <div class="mt-6 space-y-4">
      <BaseCard
        v-for="alert in props.alerts"
        :key="alert.id"
        class="border border-muted-200 bg-muted-50/70 p-4 dark:border-muted-700/60 dark:bg-muted-900/40"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex items-start gap-3">
            <div :class="['flex size-10 items-center justify-center rounded-xl', badgeClass(alert.severity)]">
              <Icon :name="alert.icon" class="size-5" />
            </div>
            <div>
              <BaseHeading
                as="h4"
                size="sm"
                weight="semibold"
                class="text-muted-900 dark:text-white"
              >
                <span v-if="isLoading" class="block h-5 w-48 animate-pulse rounded bg-muted-200/60 dark:bg-muted-800/60" />
                <template v-else>
                  {{ alert.title }}
                </template>
              </BaseHeading>
              <BaseParagraph size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
                <span v-if="isLoading" class="block h-4 w-full animate-pulse rounded bg-muted-200/40 dark:bg-muted-800/40" />
                <template v-else>
                  {{ alert.description }}
                </template>
              </BaseParagraph>
              <div class="mt-3 flex items-center gap-2">
                <BaseChip :color="chipColor(alert.severity)" size="xs">
                  {{ alert.severity }}
                </BaseChip>
                <BaseText size="xs" class="text-muted-400">
                  <span v-if="isLoading" class="block h-4 w-20 animate-pulse rounded bg-muted-200/40 dark:bg-muted-800/40" />
                  <template v-else>
                    {{ alert.timestamp }}
                  </template>
                </BaseText>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <BaseButton
              size="sm"
              variant="ghost"
              icon
              class="rounded-full"
            >
              <Icon name="ph:share-network" class="size-4" />
            </BaseButton>
            <BaseButton
              size="sm"
              variant="ghost"
              icon
              class="rounded-full"
            >
              <Icon name="ph:dots-three-bold" class="size-4" />
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>
  </BaseCard>
</template>

