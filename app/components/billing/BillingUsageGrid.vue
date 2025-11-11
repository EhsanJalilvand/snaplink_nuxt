<script setup lang="ts">
import type { BillingUsageItem } from '~/types/billing'

interface BillingUsageGridItem extends BillingUsageItem {
  percentage: number
  meterColor: string
}

const props = withDefaults(defineProps<{
  items: BillingUsageGridItem[]
  isLoading?: boolean
}>(), {
  items: () => [],
  isLoading: false,
})

const getAccentClasses = (color: BillingUsageItem['color']) => {
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
    default:
      return {
        background: 'bg-muted-100 dark:bg-muted-800',
        foreground: 'text-muted-600 dark:text-muted-300',
      }
  }
}
</script>

<template>
  <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
    <template v-if="isLoading">
      <BaseCard
        v-for="index in 6"
        :key="index"
        class="h-40 animate-pulse rounded-2xl bg-muted-200/80 dark:bg-muted-800/60"
      />
    </template>

    <BaseCard
      v-else
      v-for="item in items"
      :key="item.id"
      class="p-6"
    >
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div
            class="rounded-xl p-2"
            :class="getAccentClasses(item.color).background"
          >
            <Icon
              :name="item.icon"
              class="size-5"
              :class="getAccentClasses(item.color).foreground"
            />
          </div>
          <div>
            <BaseHeading
              as="h4"
              size="sm"
              weight="semibold"
              class="text-muted-900 dark:text-muted-100"
            >
              {{ item.service }}
            </BaseHeading>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Cost: ${{ item.cost.toFixed(2) }}
            </BaseText>
          </div>
        </div>
        <BaseChip :color="item.meterColor" size="xs">
          {{ Math.round(item.percentage) }}%
        </BaseChip>
      </div>

      <div class="mt-4 space-y-3">
        <div class="flex items-center justify-between text-sm text-muted-600 dark:text-muted-400">
          <span>{{ item.current.toLocaleString() }} / {{ item.limit.toLocaleString() }}</span>
          <span>
            <Icon
              :name="item.meterColor === 'danger' ? 'ph:warning-circle' : item.meterColor === 'warning' ? 'ph:timer' : 'ph:check-circle'"
              class="mr-1 size-4"
            />
            {{ Math.round(item.percentage) }}%
          </span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-muted-200 dark:bg-muted-700">
          <div
            class="h-full rounded-full transition-all"
            :class="{
              'bg-danger-500': item.meterColor === 'danger',
              'bg-warning-500': item.meterColor === 'warning',
              'bg-success-500': item.meterColor === 'success',
            }"
            :style="{ width: `${item.percentage}%` }"
          />
        </div>
      </div>
    </BaseCard>
  </div>
</template>
