<script setup lang="ts">
import type { DashboardService } from '~/types/dashboard'

const props = defineProps<{
  services: DashboardService[]
  isLoading?: boolean
  viewAllTo?: string
  viewAllLabel?: string
}>()

const emit = defineEmits<{
  (e: 'view-all'): void
}>()

const accentBackground = (accent: DashboardService['color']) => {
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

const accentForeground = (accent: DashboardService['color']) => {
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
    <div class="mb-6 flex items-center justify-between">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-900 dark:text-muted-100"
      >
        Services Overview
      </BaseHeading>
      <BaseButton
        size="sm"
        variant="ghost"
        :to="viewAllTo"
        @click="emit('view-all')"
      >
        {{ viewAllLabel ?? 'View All' }}
        <Icon name="lucide:chevron-right" class="size-4" />
      </BaseButton>
    </div>

    <div v-if="isLoading" class="grid grid-cols-2 gap-4 md:grid-cols-3">
      <BaseCard
        v-for="placeholder in 6"
        :key="`service-skeleton-${placeholder}`"
        class="h-36 animate-pulse rounded-xl bg-muted-100/80 dark:bg-muted-800/60"
      />
    </div>

    <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-3">
      <component
        :is="service.comingSoon ? 'div' : 'NuxtLink'"
        v-for="service in services"
        :key="service.id"
        :to="service.comingSoon ? undefined : service.link"
        class="group"
      >
        <div
          class="h-full rounded-xl border-2 p-6 transition-all duration-300"
          :class="[
            service.comingSoon
              ? 'cursor-not-allowed border-muted-200 bg-muted-50 opacity-60 dark:border-muted-700 dark:bg-muted-800/50'
              : 'border-muted-200 hover:border-primary-500 hover:bg-primary-50 hover:shadow-lg dark:border-muted-700 dark:hover:border-primary-500 dark:hover:bg-primary-900/20',
          ]"
        >
          <div
            class="mb-4 flex size-14 items-center justify-center rounded-xl"
            :class="accentBackground(service.color)"
          >
            <Icon
              :name="service.icon"
              class="size-7"
              :class="accentForeground(service.color)"
            />
          </div>
          <BaseText size="sm" weight="semibold" class="mb-1 text-muted-900 dark:text-muted-100">
            {{ service.name }}
          </BaseText>
          <div class="flex items-center gap-2">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              {{ service.count.toLocaleString() }} items
            </BaseText>
            <BaseTag
              v-if="service.comingSoon"
              size="xs"
              color="muted"
            >
              Soon
            </BaseTag>
          </div>
        </div>
      </component>
    </div>
  </BaseCard>
</template>

