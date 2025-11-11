<script setup lang="ts">
import type { DashboardQuickAction } from '~/types/dashboard'

const props = defineProps<{
  actions: DashboardQuickAction[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', action: DashboardQuickAction): void
}>()

const accentBackground = (accent: DashboardQuickAction['color']) => {
  switch (accent) {
    case 'primary':
      return 'bg-primary-100 dark:bg-primary-900/30'
    case 'info':
      return 'bg-info-100 dark:bg-info-900/30'
    case 'success':
      return 'bg-success-100 dark:bg-success-900/30'
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

const accentForeground = (accent: DashboardQuickAction['color']) => {
  switch (accent) {
    case 'primary':
      return 'text-primary-600 dark:text-primary-400'
    case 'info':
      return 'text-info-600 dark:text-info-400'
    case 'success':
      return 'text-success-600 dark:text-success-400'
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
    <BaseHeading
      as="h3"
      size="md"
      weight="semibold"
      class="mb-4 text-muted-900 dark:text-muted-100"
    >
      Quick Actions
    </BaseHeading>

    <div v-if="isLoading" class="space-y-3">
      <BaseCard
        v-for="placeholder in 3"
        :key="`quick-action-skeleton-${placeholder}`"
        class="h-20 animate-pulse rounded-xl bg-muted-100/80 dark:bg-muted-800/60"
      />
    </div>

    <div v-else class="space-y-3">
      <button
        v-for="action in actions"
        :key="action.id"
        type="button"
        class="group flex w-full items-center gap-4 rounded-xl border border-muted-200 p-4 text-left transition-all duration-200 hover:border-primary-500 hover:bg-primary-50 dark:border-muted-700 dark:hover:border-primary-500 dark:hover:bg-primary-900/20"
        @click="emit('select', action)"
      >
        <div
          class="flex size-12 items-center justify-center rounded-xl shrink-0"
          :class="accentBackground(action.color)"
        >
          <Icon
            :name="action.icon"
            class="size-6"
            :class="accentForeground(action.color)"
          />
        </div>
        <div class="flex-1">
          <BaseText
            size="sm"
            weight="semibold"
            class="text-muted-900 transition-colors group-hover:text-primary-600 dark:text-muted-100 dark:group-hover:text-primary-400"
          >
            {{ action.title }}
          </BaseText>
          <BaseParagraph size="xs" class="mt-0.5 text-muted-500 dark:text-muted-400">
            {{ action.description }}
          </BaseParagraph>
        </div>
        <Icon name="lucide:chevron-right" class="size-4 text-muted-400 transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400" />
      </button>
    </div>
  </BaseCard>
</template>

