<script setup lang="ts">
const periods = ['Daily', 'Weekly', 'Monthly'] as const
type Period = (typeof periods)[number]

const activePeriod = ref<Period>('Daily')

const revenueData = ref<Record<Period, Array<{ label: string; revenue: number; target: number }>>>({
  Daily: [
    { label: 'Mon', revenue: 4820, target: 4500 },
    { label: 'Tue', revenue: 5120, target: 4600 },
    { label: 'Wed', revenue: 5640, target: 4750 },
    { label: 'Thu', revenue: 5980, target: 4900 },
    { label: 'Fri', revenue: 6320, target: 5050 },
    { label: 'Sat', revenue: 6840, target: 5200 },
    { label: 'Sun', revenue: 7120, target: 5300 },
  ],
  Weekly: [
    { label: 'Week 1', revenue: 23840, target: 22000 },
    { label: 'Week 2', revenue: 25410, target: 22800 },
    { label: 'Week 3', revenue: 26840, target: 23600 },
    { label: 'Week 4', revenue: 27920, target: 24400 },
  ],
  Monthly: [
    { label: 'Jan', revenue: 85640, target: 82000 },
    { label: 'Feb', revenue: 91220, target: 87000 },
    { label: 'Mar', revenue: 97840, target: 92000 },
    { label: 'Apr', revenue: 104220, target: 98000 },
    { label: 'May', revenue: 112430, target: 102000 },
  ],
})

const maxRevenue = computed(() => {
  const dataset = revenueData.value[activePeriod.value]
  return Math.max(...dataset.map(item => Math.max(item.revenue, item.target)))
})

const toCurrency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
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
          Revenue Performance
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Track gross volume against planned targets.
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-2 rounded-full border border-muted-200 bg-muted-100/60 p-1 text-xs dark:border-muted-700 dark:bg-muted-900/50">
        <button
          v-for="period in periods"
          :key="period"
          type="button"
          class="rounded-full px-3 py-1.5 font-medium transition-all"
          :class="[
            activePeriod === period
              ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30'
              : 'text-muted-500 hover:text-muted-800 dark:text-muted-400 dark:hover:text-muted-200',
          ]"
          @click="activePeriod = period"
        >
          {{ period }}
        </button>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-5">
      <div class="lg:col-span-4">
        <div class="flex h-64 items-end gap-3">
          <div
            v-for="item in revenueData[activePeriod]"
            :key="item.label"
            class="flex-1"
          >
            <div class="flex h-full flex-col justify-end gap-2 rounded-t-2xl bg-gradient-to-t from-primary-500/20 via-primary-500/30 to-primary-500/10 p-3">
              <div class="flex flex-col gap-2">
                <div class="flex items-baseline justify-between text-xs">
                  <span class="font-medium text-primary-600 dark:text-primary-300">
                    {{ toCurrency(item.revenue) }}
                  </span>
                  <span class="text-muted-400">
                    Target {{ toCurrency(item.target) }}
                  </span>
                </div>
                <div class="relative h-32 overflow-hidden rounded-full border border-primary-100/50 dark:border-primary-900/40">
                  <div
                    class="absolute bottom-0 start-0 w-full rounded-full bg-primary-500 transition-all duration-500"
                    :style="{ height: `${(item.revenue / maxRevenue) * 100}%` }"
                  />
                  <div
                    class="absolute inset-x-0 bottom-0 m-1 rounded-full border border-dashed border-primary-200 dark:border-primary-800"
                    :style="{ height: `${(item.target / maxRevenue) * 100}%` }"
                  />
                </div>
              </div>
            </div>
            <BaseText size="xs" class="mt-2 text-center text-muted-500 dark:text-muted-400">
              {{ item.label }}
            </BaseText>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-500 dark:text-muted-400">
          <div class="flex items-center gap-2">
            <div class="size-3 rounded-full bg-primary-500" />
            <span>Actual revenue</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="size-3 rounded-full border border-dashed border-primary-300 dark:border-primary-700" />
            <span>Target</span>
          </div>
        </div>
      </div>

      <div class="space-y-4 rounded-2xl border border-muted-200 bg-muted-50/60 p-5 dark:border-muted-700 dark:bg-muted-900/40">
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            MRR
          </BaseText>
          <BaseHeading
            as="h4"
            size="lg"
            weight="semibold"
            class="mt-1 text-muted-900 dark:text-white"
          >
            {{ toCurrency(128540) }}
          </BaseHeading>
          <BaseChip color="success" size="xs" class="mt-2">
            <Icon name="ph:trend-up" class="size-3" />
            <span>+8.6%</span>
          </BaseChip>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between rounded-xl border border-success-200 bg-success-50/60 p-3 dark:border-success-900/40 dark:bg-success-900/20">
            <div>
              <BaseText size="xs" class="text-success-600 dark:text-success-300">Average order value</BaseText>
              <BaseHeading as="h5" size="md" weight="bold" class="text-success-700 dark:text-success-200">
                {{ toCurrency(164) }}
              </BaseHeading>
            </div>
            <Icon name="solar:bag-smile-bold-duotone" class="size-8 text-success-500 dark:text-success-300" />
          </div>

          <div class="flex items-center justify-between rounded-xl border border-info-200 bg-info-50/60 p-3 dark:border-info-900/40 dark:bg-info-900/20">
            <div>
              <BaseText size="xs" class="text-info-600 dark:text-info-300">Refund ratio</BaseText>
              <BaseHeading as="h5" size="md" weight="bold" class="text-info-700 dark:text-info-200">
                1.8%
              </BaseHeading>
            </div>
            <Icon name="solar:shield-check-bold-duotone" class="size-8 text-info-500 dark:text-info-300" />
          </div>

          <div class="rounded-xl border border-muted-200 bg-white/60 p-3 dark:border-muted-700 dark:bg-muted-800/40">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Net revenue pace
            </BaseText>
            <div class="mt-2 flex items-end gap-2">
              <BaseHeading as="h5" size="lg" weight="bold" class="text-muted-900 dark:text-white">
                {{ toCurrency(4250) }}
              </BaseHeading>
              <BaseText size="xs" class="text-muted-400">
                in the last 6 hours
              </BaseText>
            </div>
            <div class="mt-3 h-1.5 rounded-full bg-muted-200 dark:bg-muted-700">
              <div class="h-full w-[72%] rounded-full bg-primary-500 transition-all duration-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

