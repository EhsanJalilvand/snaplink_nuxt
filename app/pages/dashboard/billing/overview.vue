<script setup lang="ts">
definePageMeta({
  title: 'Billing Overview',
  layout: 'dashboard',
})

const toaster = useNuiToasts()

// Billing state
const billing = ref({
  balance: 1250.50,
  status: 'active', // active, suspended, low
  monthlyUsage: {
    clicks: 125000,
    apiCalls: 45000,
  },
})

const usageChartData = ref({
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  clicks: [28000, 32000, 35000, 30000],
  apiCalls: [10000, 12000, 11000, 12000],
})

const statusConfig = computed(() => {
  switch (billing.value.status) {
    case 'active':
      return {
        label: 'Active',
        color: 'success',
        icon: 'ph:check-circle',
        description: 'Your account is active and running smoothly',
      }
    case 'suspended':
      return {
        label: 'Suspended',
        color: 'danger',
        icon: 'ph:warning',
        description: 'Your account has been suspended',
      }
    case 'low':
      return {
        label: 'Low Balance',
        color: 'warning',
        icon: 'ph:warning',
        description: 'Your balance is running low. Please add credit soon.',
      }
    default:
      return {
        label: 'Unknown',
        color: 'muted',
        icon: 'ph:question',
        description: 'Unknown status',
      }
  }
})

const handleAddCredit = () => {
  // TODO: Open add credit modal/page
  toaster.add({
    title: 'Add Credit',
    description: 'Credit addition feature will be available soon',
    icon: 'ph:info',
    color: 'info',
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
          Billing Overview
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Manage your account balance and monitor usage
        </BaseParagraph>
      </div>
    </div>

    <!-- Credit/Balance Card -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <BaseCard class="p-6">
          <div class="flex items-center justify-between mb-6">
            <BaseHeading
              as="h3"
              size="md"
              weight="semibold"
              class="text-muted-800 dark:text-muted-100"
            >
              Account Balance
            </BaseHeading>
            <BaseButton
              variant="primary"
              size="sm"
              @click="handleAddCredit"
            >
              <Icon name="ph:plus" class="size-4" />
              <span>Add Credit</span>
            </BaseButton>
          </div>

          <div class="space-y-4">
            <div>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-2">
                Current Balance
              </BaseText>
              <BaseHeading
                as="h2"
                size="3xl"
                weight="bold"
                class="text-muted-900 dark:text-muted-100"
              >
                ${{ billing.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
              </BaseHeading>
            </div>

            <!-- Status Badge -->
            <div class="flex items-center gap-3">
              <BaseChip
                :color="statusConfig.color"
                size="sm"
              >
                <Icon :name="statusConfig.icon" class="size-3" />
                <span>{{ statusConfig.label }}</span>
              </BaseChip>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                {{ statusConfig.description }}
              </BaseText>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Current Month Usage -->
      <div class="lg:col-span-1">
        <BaseCard class="p-6">
          <BaseHeading
            as="h3"
            size="md"
            weight="semibold"
            class="text-muted-800 dark:text-muted-100 mb-6"
          >
            This Month
          </BaseHeading>

          <div class="space-y-6">
            <div>
              <div class="flex items-center justify-between mb-2">
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  URL Clicks
                </BaseText>
                <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                  {{ billing.monthlyUsage.clicks.toLocaleString() }}
                </BaseText>
              </div>
              <div class="h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary-500 rounded-full transition-all"
                  :style="{ width: '75%' }"
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  API Calls
                </BaseText>
                <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                  {{ billing.monthlyUsage.apiCalls.toLocaleString() }}
                </BaseText>
              </div>
              <div class="h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-success-500 rounded-full transition-all"
                  :style="{ width: '60%' }"
                />
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Usage Chart -->
    <BaseCard class="p-6">
      <div class="flex items-center justify-between mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100"
        >
          Usage Trends
        </BaseHeading>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div class="size-3 rounded-full bg-primary-500" />
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Clicks
            </BaseText>
          </div>
          <div class="flex items-center gap-2">
            <div class="size-3 rounded-full bg-success-500" />
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              API Calls
            </BaseText>
          </div>
        </div>
      </div>

      <!-- Simple Chart Visualization -->
      <div class="h-64 flex items-end justify-between gap-2">
        <div
          v-for="(label, index) in usageChartData.labels"
          :key="label"
          class="flex-1 flex flex-col items-center gap-2"
        >
          <div class="w-full flex flex-col justify-end gap-1 h-full">
            <div
              class="bg-primary-500 rounded-t"
              :style="{ height: `${(usageChartData.clicks[index] / 35000) * 100}%` }"
            />
            <div
              class="bg-success-500 rounded-t"
              :style="{ height: `${(usageChartData.apiCalls[index] / 12000) * 100}%` }"
            />
          </div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            {{ label }}
          </BaseText>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

