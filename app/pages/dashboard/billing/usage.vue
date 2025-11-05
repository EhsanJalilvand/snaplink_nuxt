<script setup lang="ts">
definePageMeta({
  title: 'Usage',
  layout: 'dashboard',
})

// Usage data
const usageData = ref([
  {
    service: 'URL Click',
    icon: 'solar:link-linear',
    current: 125000,
    limit: 200000,
    cost: 12.50,
    color: 'primary',
  },
  {
    service: 'Payment Service',
    icon: 'solar:card-linear',
    current: 850,
    limit: 1000,
    cost: 42.50,
    color: 'success',
  },
  {
    service: 'Bio Service',
    icon: 'solar:user-id-linear',
    current: 320,
    limit: 500,
    cost: 16.00,
    color: 'info',
  },
  {
    service: 'Survey Service',
    icon: 'solar:document-linear',
    current: 1250,
    limit: 2000,
    cost: 25.00,
    color: 'warning',
  },
  {
    service: 'API Call',
    icon: 'solar:api-linear',
    current: 45000,
    limit: 100000,
    cost: 22.50,
    color: 'purple',
  },
  {
    service: 'Webhook',
    icon: 'solar:webhook-linear',
    current: 5600,
    limit: 10000,
    cost: 5.60,
    color: 'orange',
  },
])

const period = ref('month')
const periods = [
  { label: 'This Month', value: 'month' },
  { label: 'This Week', value: 'week' },
  { label: 'This Year', value: 'year' },
]

const getUsagePercentage = (current: number, limit: number) => {
  return Math.min((current / limit) * 100, 100)
}

const getUsageColor = (percentage: number) => {
  if (percentage >= 90) return 'danger'
  if (percentage >= 70) return 'warning'
  return 'success'
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
          Usage
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Monitor your service usage and costs
        </BaseParagraph>
      </div>
      <TairoSelect
        v-model="period"
        icon="solar:calendar-linear"
        rounded="lg"
        size="sm"
        class="w-40"
      >
        <BaseSelectItem
          v-for="p in periods"
          :key="p.value"
          :value="p.value"
        >
          {{ p.label }}
        </BaseSelectItem>
      </TairoSelect>
    </div>

    <!-- Usage Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <BaseCard
        v-for="service in usageData"
        :key="service.service"
        class="p-6"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div
              class="p-2 rounded-lg"
              :class="{
                'bg-primary-100 dark:bg-primary-900/30': service.color === 'primary',
                'bg-success-100 dark:bg-success-900/30': service.color === 'success',
                'bg-info-100 dark:bg-info-900/30': service.color === 'info',
                'bg-warning-100 dark:bg-warning-900/30': service.color === 'warning',
                'bg-purple-100 dark:bg-purple-900/30': service.color === 'purple',
                'bg-orange-100 dark:bg-orange-900/30': service.color === 'orange',
              }"
            >
              <Icon
                :name="service.icon"
                class="size-5"
                :class="{
                  'text-primary-600 dark:text-primary-400': service.color === 'primary',
                  'text-success-600 dark:text-success-400': service.color === 'success',
                  'text-info-600 dark:text-info-400': service.color === 'info',
                  'text-warning-600 dark:text-warning-400': service.color === 'warning',
                  'text-purple-600 dark:text-purple-400': service.color === 'purple',
                  'text-orange-600 dark:text-orange-400': service.color === 'orange',
                }"
              />
            </div>
            <div>
              <BaseHeading
                as="h4"
                size="sm"
                weight="semibold"
                class="text-muted-800 dark:text-muted-100"
              >
                {{ service.service }}
              </BaseHeading>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Cost: ${{ service.cost.toFixed(2) }}
              </BaseText>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
              {{ service.current.toLocaleString() }} / {{ service.limit.toLocaleString() }}
            </BaseText>
            <BaseText
              size="sm"
              weight="semibold"
              :class="{
                'text-danger-600 dark:text-danger-400': getUsagePercentage(service.current, service.limit) >= 90,
                'text-warning-600 dark:text-warning-400': getUsagePercentage(service.current, service.limit) >= 70 && getUsagePercentage(service.current, service.limit) < 90,
                'text-success-600 dark:text-success-400': getUsagePercentage(service.current, service.limit) < 70,
              }"
            >
              {{ Math.round(getUsagePercentage(service.current, service.limit)) }}%
            </BaseText>
          </div>

          <div class="h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="{
                'bg-danger-500': getUsagePercentage(service.current, service.limit) >= 90,
                'bg-warning-500': getUsagePercentage(service.current, service.limit) >= 70 && getUsagePercentage(service.current, service.limit) < 90,
                'bg-success-500': getUsagePercentage(service.current, service.limit) < 70,
              }"
              :style="{ width: `${getUsagePercentage(service.current, service.limit)}%` }"
            />
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Total Usage Summary -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Total Usage Summary
      </BaseHeading>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-2">
            Total Services Used
          </BaseText>
          <BaseHeading
            as="h3"
            size="2xl"
            weight="bold"
            class="text-muted-900 dark:text-muted-100"
          >
            {{ usageData.length }}
          </BaseHeading>
        </div>
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-2">
            Total Cost This Period
          </BaseText>
          <BaseHeading
            as="h3"
            size="2xl"
            weight="bold"
            class="text-muted-900 dark:text-muted-100"
          >
            ${{ usageData.reduce((sum, s) => sum + s.cost, 0).toFixed(2) }}
          </BaseHeading>
        </div>
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-2">
            Average Usage
          </BaseText>
          <BaseHeading
            as="h3"
            size="2xl"
            weight="bold"
            class="text-muted-900 dark:text-muted-100"
          >
            {{ Math.round(usageData.reduce((sum, s) => sum + getUsagePercentage(s.current, s.limit), 0) / usageData.length) }}%
          </BaseHeading>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

