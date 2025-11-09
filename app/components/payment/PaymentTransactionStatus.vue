<script setup lang="ts">
const status = ref([
  {
    label: 'Successful',
    value: 1824,
    amount: 28450.12,
    trend: '+6.2%',
    color: 'success',
    icon: 'solar:check-circle-bold-duotone',
  },
  {
    label: 'Pending',
    value: 312,
    amount: 4820.33,
    trend: '-1.4%',
    color: 'warning',
    icon: 'solar:clock-circle-bold-duotone',
  },
  {
    label: 'Failed',
    value: 96,
    amount: 920.41,
    trend: '-0.9%',
    color: 'danger',
    icon: 'solar:close-circle-bold-duotone',
  },
])

const total = computed(() => status.value.reduce((sum, item) => sum + item.value, 0))

const progressSegments = computed(() =>
  status.value.map((item) => ({
    ...item,
    percentage: Math.round((item.value / total.value) * 100),
  })),
)
</script>

<template>
  <BaseCard class="p-6">
    <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div class="flex-1 space-y-6">
        <div>
          <BaseHeading
            as="h3"
            size="md"
            weight="semibold"
            class="text-muted-900 dark:text-white"
          >
            Transaction Status
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mt-1">
            Monitor payment performance and identify friction in the funnel.
          </BaseParagraph>
        </div>

        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="size-3 rounded-full bg-success-500" />
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Successful
            </BaseText>
            <div class="size-3 rounded-full bg-warning-500 ms-4" />
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Pending
            </BaseText>
            <div class="size-3 rounded-full bg-danger-500 ms-4" />
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Failed
            </BaseText>
          </div>

          <div class="flex h-3 overflow-hidden rounded-full border border-muted-200 dark:border-muted-700 bg-muted-100 dark:bg-muted-800">
            <div
              v-for="segment in progressSegments"
              :key="segment.label"
              :class="[
                'transition-all duration-500 ease-out',
                segment.color === 'success' && 'bg-success-500',
                segment.color === 'warning' && 'bg-warning-500',
                segment.color === 'danger' && 'bg-danger-500',
              ]"
              :style="{ width: `${segment.percentage}%` }"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <BaseCard
            v-for="item in status"
            :key="item.label"
            class="border border-muted-200/60 bg-muted-50/60 p-4 dark:border-muted-700/60 dark:bg-muted-900/40"
          >
            <div class="flex items-center justify-between">
              <div class="rounded-xl bg-muted-100 p-2 dark:bg-muted-800">
                <Icon :name="item.icon" class="size-5 text-primary-500 dark:text-primary-300" />
              </div>
              <BaseChip :color="item.color" size="xs">
                {{ item.trend }}
              </BaseChip>
            </div>
            <BaseText size="xs" class="mt-3 text-muted-500 dark:text-muted-400">
              {{ item.label }}
            </BaseText>
            <BaseHeading
              as="h4"
              size="lg"
              weight="semibold"
              class="mt-2 text-muted-900 dark:text-white"
            >
              {{ item.value.toLocaleString() }}
            </BaseHeading>
            <BaseText size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
              {{ item.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
            </BaseText>
          </BaseCard>
        </div>
      </div>

      <div class="w-full max-w-sm rounded-2xl border border-muted-200 bg-muted-50/60 p-6 dark:border-muted-700 dark:bg-muted-900/40">
        <BaseHeading
          as="h4"
          size="sm"
          weight="semibold"
          class="text-muted-900 dark:text-white"
        >
          Funnel Insights
        </BaseHeading>
        <div class="mt-4 space-y-4">
          <div class="flex items-start gap-3">
            <div class="rounded-full bg-primary-100 p-2 dark:bg-primary-900/30">
              <Icon name="solar:card-send-bold-duotone" class="size-5 text-primary-500 dark:text-primary-300" />
            </div>
            <div>
              <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                Average settlement time
              </BaseText>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                2m 41s from initiation to merchant wallet.
              </BaseParagraph>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="rounded-full bg-success-100 p-2 dark:bg-success-900/30">
              <Icon name="solar:graph-new-bold-duotone" class="size-5 text-success-500 dark:text-success-300" />
            </div>
            <div>
              <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                Approval rate
              </BaseText>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                {{ Math.round((status[0].value / total) * 100) }}% of payments complete without manual review.
              </BaseParagraph>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="rounded-full bg-warning-100 p-2 dark:bg-warning-900/30">
              <Icon name="solar:shield-check-bold-duotone" class="size-5 text-warning-500 dark:text-warning-300" />
            </div>
            <div>
              <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                Fraud escalation
              </BaseText>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                11 cases pending review & automated rule tuning.
              </BaseParagraph>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

