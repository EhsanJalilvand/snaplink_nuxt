<script setup lang="ts">
import { computed } from '#imports'
import type { PaymentInsight, PaymentStatusItem } from '~/types/payments'

interface PaymentTransactionStatusProps {
  status?: PaymentStatusItem[]
  insights?: PaymentInsight[]
  total?: number
  isLoading?: boolean
}

const props = withDefaults(defineProps<PaymentTransactionStatusProps>(), {
  status: () => [],
  insights: () => [],
  total: undefined,
  isLoading: false,
})

const statusItems = computed(() => props.status ?? [])
const totalTransactions = computed(() => props.total ?? statusItems.value.reduce((sum, item) => sum + item.value, 0))

const progressSegments = computed(() =>
  statusItems.value.map((item) => ({
    ...item,
    percentage: totalTransactions.value === 0 ? 0 : Math.round((item.value / totalTransactions.value) * 100),
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
            <template v-for="segment in statusItems" :key="segment.label">
              <div
                class="size-3 rounded-full"
                :class="[
                  segment.color === 'success' && 'bg-success-500',
                  segment.color === 'warning' && 'bg-warning-500',
                  segment.color === 'danger' && 'bg-danger-500',
                ]"
              />
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                {{ segment.label }}
              </BaseText>
            </template>
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
            v-for="item in statusItems"
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
              <span v-if="isLoading" class="block h-6 w-20 animate-pulse rounded bg-muted-200/80 dark:bg-muted-800/60" />
              <template v-else>
                {{ item.value.toLocaleString() }}
              </template>
            </BaseHeading>
            <BaseText size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
              <span v-if="isLoading" class="block h-4 w-32 animate-pulse rounded bg-muted-200/80 dark:bg-muted-800/60" />
              <template v-else>
                {{ item.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
              </template>
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
          <div
            v-for="insight in props.insights"
            :key="insight.label"
            class="flex items-start gap-3"
          >
            <div class="rounded-full bg-primary-100 p-2 dark:bg-primary-900/30">
              <Icon :name="insight.icon" class="size-5 text-primary-500 dark:text-primary-300" />
            </div>
            <div>
              <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                {{ insight.label }}
              </BaseText>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                <span v-if="isLoading" class="block h-4 w-48 animate-pulse rounded bg-muted-200/80 dark:bg-muted-800/60" />
                <template v-else>
                  {{ insight.description }}
                </template>
              </BaseParagraph>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

