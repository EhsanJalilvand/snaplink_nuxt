<script setup lang="ts">
const summary = ref({
  total: 45230.78,
  pending: 8240.15,
  available: 36990.63,
})

const trends = ref({
  total: {
    value: '+12.4%',
    direction: 'up',
  },
  pending: {
    value: '-4.1%',
    direction: 'down',
  },
  available: {
    value: '+9.8%',
    direction: 'up',
  },
})
</script>

<template>
  <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
    <BaseCard class="p-6">
      <div class="flex items-start justify-between">
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Total Balance
          </BaseText>
          <BaseHeading
            as="h3"
            size="2xl"
            weight="bold"
            class="mt-2 text-muted-900 dark:text-white"
          >
            {{ summary.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
          </BaseHeading>
        </div>
        <div class="rounded-2xl bg-primary-100 p-3 dark:bg-primary-900/30">
          <Icon name="solar:wallet-bold-duotone" class="size-6 text-primary-600 dark:text-primary-400" />
        </div>
      </div>
      <div
        class="mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
        :class="trends.total.direction === 'up'
          ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400'
          : 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400'"
      >
        <Icon
          :name="trends.total.direction === 'up' ? 'ph:arrow-up-right' : 'ph:arrow-down-right'"
          class="size-3"
        />
        <span>{{ trends.total.value }} compared to last cycle</span>
      </div>
    </BaseCard>

    <BaseCard class="p-6">
      <div class="flex items-start justify-between">
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Pending Balance
          </BaseText>
          <BaseHeading
            as="h3"
            size="2xl"
            weight="bold"
            class="mt-2 text-muted-900 dark:text-white"
          >
            {{ summary.pending.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
          </BaseHeading>
        </div>
        <div class="rounded-2xl bg-warning-100 p-3 dark:bg-warning-900/30">
          <Icon name="solar:clock-circle-bold-duotone" class="size-6 text-warning-600 dark:text-warning-400" />
        </div>
      </div>
      <div
        class="mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
        :class="trends.pending.direction === 'up'
          ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400'
          : 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400'"
      >
        <Icon
          :name="trends.pending.direction === 'up' ? 'ph:arrow-up-right' : 'ph:arrow-down-right'"
          class="size-3"
        />
        <span>{{ trends.pending.value }} vs yesterday</span>
      </div>
    </BaseCard>

    <BaseCard class="p-6">
      <div class="flex items-start justify-between">
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Available Balance
          </BaseText>
          <BaseHeading
            as="h3"
            size="2xl"
            weight="bold"
            class="mt-2 text-muted-900 dark:text-white"
          >
            {{ summary.available.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
          </BaseHeading>
        </div>
        <div class="rounded-2xl bg-success-100 p-3 dark:bg-success-900/30">
          <Icon name="solar:banknote-bold-duotone" class="size-6 text-success-600 dark:text-success-400" />
        </div>
      </div>
      <div
        class="mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
        :class="trends.available.direction === 'up'
          ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400'
          : 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400'"
      >
        <Icon
          :name="trends.available.direction === 'up' ? 'ph:arrow-up-right' : 'ph:arrow-down-right'"
          class="size-3"
        />
        <span>{{ trends.available.value }} available for payout</span>
      </div>
    </BaseCard>
  </div>
</template>

