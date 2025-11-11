<script setup lang="ts">
import type { DashboardStat } from '~/types/dashboard'

const props = defineProps<{
  stats: DashboardStat[]
  isLoading?: boolean
}>()

const accentBackground = (accent: DashboardStat['color']) => {
  switch (accent) {
    case 'primary':
      return 'bg-primary-100 dark:bg-primary-900/30'
    case 'success':
      return 'bg-success-100 dark:bg-success-900/30'
    case 'info':
      return 'bg-info-100 dark:bg-info-900/30'
    case 'warning':
      return 'bg-warning-100 dark:bg-warning-900/30'
    case 'danger':
      return 'bg-danger-100 dark:bg-danger-900/30'
    case 'purple':
      return 'bg-purple-100 dark:bg-purple-900/30'
    default:
      return 'bg-muted-100 dark:bg-muted-800/60'
  }
}

const accentForeground = (accent: DashboardStat['color']) => {
  switch (accent) {
    case 'primary':
      return 'text-primary-600 dark:text-primary-400'
    case 'success':
      return 'text-success-600 dark:text-success-400'
    case 'info':
      return 'text-info-600 dark:text-info-400'
    case 'warning':
      return 'text-warning-600 dark:text-warning-400'
    case 'danger':
      return 'text-danger-600 dark:text-danger-400'
    case 'purple':
      return 'text-purple-600 dark:text-purple-400'
    default:
      return 'text-muted-600 dark:text-muted-400'
  }
}

const trendClass = (trend: DashboardStat['changeType']) => {
  return trend === 'positive'
    ? 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400'
    : 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400'
}
</script>

<template>
  <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
    <template v-if="isLoading">
      <BaseCard
        v-for="placeholder in 4"
        :key="`stat-skeleton-${placeholder}`"
        class="h-36 animate-pulse rounded-2xl bg-muted-100/80 dark:bg-muted-800/60"
      />
    </template>

    <template v-else>
      <NuxtLink
        v-for="stat in stats"
        :key="stat.id"
        :to="stat.link"
        class="group"
      >
        <BaseCard class="h-full p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
          <div class="mb-4 flex items-center justify-between">
            <div
              class="flex size-12 items-center justify-center rounded-xl"
              :class="accentBackground(stat.color)"
            >
              <Icon
                :name="stat.icon"
                class="size-6"
                :class="accentForeground(stat.color)"
              />
            </div>
            <div
              class="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold"
              :class="trendClass(stat.changeType)"
            >
              <Icon
                :name="stat.changeType === 'positive' ? 'solar:arrow-up-linear' : 'solar:arrow-down-linear'"
                class="size-3"
              />
              <span>{{ stat.change }}</span>
            </div>
          </div>
          <BaseText size="sm" weight="medium" class="mb-1 text-muted-500 dark:text-muted-400">
            {{ stat.title }}
          </BaseText>
          <BaseHeading
            as="h3"
            size="2xl"
            weight="bold"
            class="text-muted-900 transition-colors group-hover:text-primary-600 dark:text-muted-100 dark:group-hover:text-primary-400"
          >
            {{ stat.value }}
          </BaseHeading>
        </BaseCard>
      </NuxtLink>
    </template>
  </div>
</template>

