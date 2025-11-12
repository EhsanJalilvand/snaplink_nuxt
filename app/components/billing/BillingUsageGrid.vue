<script setup lang="ts">
import type { BillingUsageModule } from '~/types/billing'

type MeterColor = 'success' | 'warning' | 'danger'

interface BillingUsageMetricView {
  metricKey: string
  metricName: string
  unit: string
  usage: number
  included: number
  billable: number
  customerTotal: number
  vendorTotal: number
  markupPercent: number
  currency: string
  billingNote?: string | null
  metadata?: Record<string, string>
  utilization: number
  meterColor: MeterColor
  utilizationLabel: string
  hasAllowance: boolean
}

interface BillingUsageModuleView extends BillingUsageModule {
  metrics: BillingUsageMetricView[]
  utilization: number
  utilizationState: MeterColor
}

const props = withDefaults(defineProps<{
  modules: BillingUsageModuleView[]
  isLoading?: boolean
}>(), {
  modules: () => [],
  isLoading: false,
})

const formatCurrency = (value: number, currency: string) => {
  if (currency === 'MULTI') {
    return `$${value.toFixed(2)}`
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `$${value.toFixed(2)}`
  }
}

const getAccentClasses = (color: BillingUsageModule['color']) => {
  switch (color) {
    case 'primary':
      return {
        background: 'bg-primary-100 dark:bg-primary-900/30',
        foreground: 'text-primary-600 dark:text-primary-400',
      }
    case 'success':
      return {
        background: 'bg-success-100 dark:bg-success-900/30',
        foreground: 'text-success-600 dark:text-success-400',
      }
    case 'info':
      return {
        background: 'bg-info-100 dark:bg-info-900/30',
        foreground: 'text-info-600 dark:text-info-400',
      }
    case 'warning':
      return {
        background: 'bg-warning-100 dark:bg-warning-900/30',
        foreground: 'text-warning-600 dark:text-warning-400',
      }
    case 'purple':
      return {
        background: 'bg-purple-100 dark:bg-purple-900/30',
        foreground: 'text-purple-600 dark:text-purple-400',
      }
    case 'orange':
      return {
        background: 'bg-orange-100 dark:bg-orange-900/30',
        foreground: 'text-orange-600 dark:text-orange-400',
      }
    case 'cyan':
      return {
        background: 'bg-cyan-100 dark:bg-cyan-900/30',
        foreground: 'text-cyan-600 dark:text-cyan-400',
      }
    case 'pink':
      return {
        background: 'bg-pink-100 dark:bg-pink-900/30',
        foreground: 'text-pink-600 dark:text-pink-400',
      }
    default:
      return {
        background: 'bg-muted-100 dark:bg-muted-800',
        foreground: 'text-muted-600 dark:text-muted-300',
      }
  }
}

const getMeterClasses = (meterColor: MeterColor) => {
  switch (meterColor) {
    case 'danger':
      return {
        bar: 'bg-danger-500',
        icon: 'ph:warning-circle',
        chip: 'danger',
      }
    case 'warning':
      return {
        bar: 'bg-warning-500',
        icon: 'ph:timer',
        chip: 'warning',
      }
    default:
      return {
        bar: 'bg-success-500',
        icon: 'ph:check-circle',
        chip: 'success',
      }
  }
}
</script>

<template>
  <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
    <template v-if="isLoading">
      <BaseCard
        v-for="index in 4"
        :key="index"
        class="h-64 animate-pulse rounded-2xl bg-muted-200/80 dark:bg-muted-800/60"
      />
    </template>

    <BaseCard
      v-else
      v-for="module in modules"
      :key="module.moduleKey"
      class="flex flex-col gap-5 p-6"
      :class="{ 'opacity-60': module.isActive === false }"
    >
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex items-start gap-3">
          <div
            class="rounded-xl p-2"
            :class="getAccentClasses(module.color).background"
          >
            <Icon
              :name="module.icon"
              class="size-5"
              :class="getAccentClasses(module.color).foreground"
            />
          </div>
          <div>
            <BaseHeading
              as="h4"
              size="sm"
              weight="semibold"
              class="text-muted-900 dark:text-muted-100"
            >
              {{ module.moduleName }}
            </BaseHeading>
            <div v-if="module.tags && Object.keys(module.tags).length" class="mt-1 flex flex-wrap gap-2">
              <BaseTag
                v-for="(value, key) in module.tags"
                :key="`${module.moduleKey}-${key}`"
                size="2xs"
                color="muted"
                rounded="full"
              >
                {{ key }}: {{ value }}
              </BaseTag>
            </div>
          </div>
        </div>

        <BaseChip size="xs" :color="module.utilizationState">
          Avg utilization · {{ module.utilization.toFixed(0) }}%
        </BaseChip>
      </div>

      <BaseAlert
        v-if="module.isActive === false"
        color="warning"
        variant="pastel"
        class="border-warning-200/60 bg-warning-50/80 text-warning-700 dark:border-warning-500/40 dark:bg-warning-500/10 dark:text-warning-300"
      >
        <template #title>
          Module disabled
        </template>
        <p class="text-xs text-warning-700/80 dark:text-warning-300/80">
          This module is currently switched off. Usage data is retained for historical analysis.
        </p>
      </BaseAlert>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Customer spend
          </BaseText>
          <BaseHeading as="h3" size="md" weight="bold" class="mt-1 text-muted-900 dark:text-muted-100">
            {{ formatCurrency(module.cost.customerTotal, module.cost.currency) }}
          </BaseHeading>
        </div>
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Vendor cost
          </BaseText>
          <BaseHeading as="h3" size="md" weight="bold" class="mt-1 text-muted-900 dark:text-muted-100">
            {{ formatCurrency(module.cost.vendorTotal, module.cost.currency) }}
          </BaseHeading>
        </div>
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Gross margin
          </BaseText>
          <BaseHeading as="h3" size="md" weight="bold" class="mt-1 text-success-600 dark:text-success-400">
            {{ formatCurrency(module.cost.grossMargin, module.cost.currency) }}
            <span class="text-sm text-success-500 dark:text-success-400">
              ({{ module.cost.grossMarginPercent.toFixed(1) }}%)
            </span>
          </BaseHeading>
        </div>
      </div>

      <div class="space-y-4">
        <div
          v-for="metric in module.metrics"
          :key="metric.metricKey"
          class="rounded-2xl border border-muted-200/60 p-4 dark:border-muted-800/60"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <BaseHeading as="h5" size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                {{ metric.metricName }}
              </BaseHeading>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                {{ metric.billingNote ?? 'Usage metric' }}
              </BaseText>
            </div>
            <BaseChip size="xs" :color="getMeterClasses(metric.meterColor).chip">
              {{ metric.utilization.toFixed(0) }}%
            </BaseChip>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-600 dark:text-muted-400">
            <span class="flex items-center gap-1">
              <Icon :name="getMeterClasses(metric.meterColor).icon" class="size-4" />
              {{ metric.utilizationLabel }}
            </span>
            <span v-if="metric.hasAllowance">
              Billable: {{ metric.billable.toLocaleString() }} {{ metric.unit }}
            </span>
            <span>
              Vendor {{ formatCurrency(metric.vendorTotal, metric.currency) }}
            </span>
            <span class="font-medium text-muted-700 dark:text-muted-200">
              Customer {{ formatCurrency(metric.customerTotal, metric.currency) }}
            </span>
            <span class="text-muted-500 dark:text-muted-500">
              Margin {{ metric.markupPercent.toFixed(1) }}%
            </span>
          </div>

          <div class="mt-3 h-2 overflow-hidden rounded-full bg-muted-200 dark:bg-muted-700">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="getMeterClasses(metric.meterColor).bar"
              :style="{ width: `${Math.min(metric.utilization, 250) / 2.5}%` }"
            />
          </div>

          <BaseText v-if="metric.metadata" size="xs" class="mt-2 text-muted-400 dark:text-muted-500">
            Provider: {{ metric.metadata.provider ?? '—' }}
            <span v-if="metric.metadata.model">
              · Model: {{ metric.metadata.model }}
            </span>
          </BaseText>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
