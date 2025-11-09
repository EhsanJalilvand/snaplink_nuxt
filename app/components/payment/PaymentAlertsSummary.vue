<script setup lang="ts">
const alerts = ref([
  {
    id: 'alert-1',
    title: 'Gateway failover engaged',
    description: 'Stripe latency exceeded 2.4s. Switched to Adyen backup route.',
    severity: 'warning',
    time: '3 mins ago',
  },
  {
    id: 'alert-2',
    title: 'Unusual refund burst detected',
    description: '7 refunds triggered within 15 minutes on SnapLink Pro links.',
    severity: 'danger',
    time: '18 mins ago',
  },
  {
    id: 'alert-3',
    title: 'Webhook retries occurring',
    description: '3 webhooks failed delivery to https://api.merchant.app/webhooks.',
    severity: 'info',
    time: '25 mins ago',
  },
])

const severityConfig: Record<string, { icon: string; badge: string; chip: string }> = {
  info: {
    icon: 'solar:info-circle-bold-duotone',
    badge: 'bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-300',
    chip: 'info',
  },
  warning: {
    icon: 'solar:warning-triangle-bold-duotone',
    badge: 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-300',
    chip: 'warning',
  },
  danger: {
    icon: 'solar:danger-circle-bold-duotone',
    badge: 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-300',
    chip: 'danger',
  },
}
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
        v-for="alert in alerts"
        :key="alert.id"
        class="border border-muted-200 bg-muted-50/70 p-4 dark:border-muted-700/60 dark:bg-muted-900/40"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex items-start gap-3">
            <div :class="['flex size-10 items-center justify-center rounded-xl', severityConfig[alert.severity].badge]">
              <Icon :name="severityConfig[alert.severity].icon" class="size-5" />
            </div>
            <div>
              <BaseHeading
                as="h4"
                size="sm"
                weight="semibold"
                class="text-muted-900 dark:text-white"
              >
                {{ alert.title }}
              </BaseHeading>
              <BaseParagraph size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
                {{ alert.description }}
              </BaseParagraph>
              <div class="mt-3 flex items-center gap-2">
                <BaseChip :color="severityConfig[alert.severity].chip" size="xs">
                  {{ alert.severity }}
                </BaseChip>
                <BaseText size="xs" class="text-muted-400">
                  {{ alert.time }}
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

