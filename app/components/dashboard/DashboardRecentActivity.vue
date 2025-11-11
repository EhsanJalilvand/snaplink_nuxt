<script setup lang="ts">
import type { DashboardActivity } from '~/types/dashboard'

const props = defineProps<{
  activities: DashboardActivity[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'view-all'): void
}>()

const accentBackground = (accent: DashboardActivity['color']) => {
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

const accentForeground = (accent: DashboardActivity['color']) => {
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
</script>

<template>
  <BaseCard class="p-6">
    <div class="mb-6 flex items-center justify-between">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-900 dark:text-muted-100"
      >
        Recent Activity
      </BaseHeading>
      <BaseButton
        size="sm"
        variant="ghost"
        @click="emit('view-all')"
      >
        View All
        <Icon name="lucide:chevron-right" class="size-4" />
      </BaseButton>
    </div>

    <div v-if="isLoading" class="space-y-4">
      <div
        v-for="placeholder in 4"
        :key="`activity-skeleton-${placeholder}`"
        class="flex items-start gap-3 rounded-lg border border-transparent bg-muted-100/80 p-4 dark:bg-muted-800/60"
      >
        <div class="size-10 rounded-lg bg-muted-200/70 dark:bg-muted-700" />
        <div class="flex-1 space-y-2">
          <div class="h-3 w-32 rounded bg-muted-200/80 dark:bg-muted-700/80" />
          <div class="h-2.5 w-56 rounded bg-muted-200/70 dark:bg-muted-800/70" />
          <div class="h-2 w-24 rounded bg-muted-200/60 dark:bg-muted-800/60" />
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted-50 dark:hover:bg-muted-800/50"
      >
        <div
          class="flex size-10 items-center justify-center rounded-lg"
          :class="accentBackground(activity.color)"
        >
          <Icon
            :name="activity.icon"
            class="size-5"
            :class="accentForeground(activity.color)"
          />
        </div>
        <div class="min-w-0 flex-1">
          <BaseText size="sm" weight="medium" class="mb-0.5 text-muted-900 dark:text-muted-100">
            {{ activity.title }}
          </BaseText>
          <BaseParagraph size="xs" class="mb-1 text-muted-500 dark:text-muted-400">
            {{ activity.description }}
          </BaseParagraph>
          <BaseText size="xs" class="text-muted-400 dark:text-muted-500">
            {{ activity.time }}
          </BaseText>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

