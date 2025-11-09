<script setup lang="ts">
const metrics = ref([
  {
    label: 'Checkout conversion',
    value: 72.4,
    delta: '+4.2%',
    trend: 'up',
    description: 'Completed payments / initiated sessions',
    color: 'success',
  },
  {
    label: 'Abandonment rate',
    value: 9.8,
    delta: '-1.3%',
    trend: 'down',
    description: 'Exits before authentication step',
    color: 'warning',
  },
  {
    label: 'Escrow completion',
    value: 94.1,
    delta: '+0.8%',
    trend: 'up',
    description: 'Escrow releases within SLA window',
    color: 'info',
  },
  {
    label: 'Chargeback ratio',
    value: 0.7,
    delta: '-0.2%',
    trend: 'down',
    description: 'Chargebacks over total captured volume',
    color: 'danger',
  },
])
</script>

<template>
  <BaseCard class="p-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-900 dark:text-white"
        >
          Conversion Metrics
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Optimize every step of the checkout funnel with actionable telemetry.
        </BaseParagraph>
      </div>
      <BaseButton size="sm" variant="outline" color="primary">
        Export report
      </BaseButton>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <BaseCard
        v-for="metric in metrics"
        :key="metric.label"
        class="border border-muted-200/80 bg-white/70 p-5 dark:border-muted-700/50 dark:bg-muted-900/30"
      >
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          {{ metric.label }}
        </BaseText>
        <div class="mt-3 flex items-end justify-between">
          <BaseHeading
            as="h4"
            size="xl"
            weight="bold"
            class="text-muted-900 dark:text-white"
          >
            {{ metric.value }}%
          </BaseHeading>
          <BaseChip
            :color="metric.color"
            size="xs"
          >
            <Icon
              :name="metric.trend === 'up' ? 'ph:arrow-up-right' : 'ph:arrow-down-right'"
              class="size-3"
            />
            <span>{{ metric.delta }}</span>
          </BaseChip>
        </div>
        <BaseParagraph size="xs" class="mt-2 text-muted-500 dark:text-muted-400">
          {{ metric.description }}
        </BaseParagraph>
        <div class="mt-4 h-2 rounded-full bg-muted-200 dark:bg-muted-700">
          <div
            class="h-full rounded-full bg-primary-500 transition-all duration-500"
            :style="{ width: `${metric.value}%` }"
          />
        </div>
      </BaseCard>
    </div>
  </BaseCard>
</template>

