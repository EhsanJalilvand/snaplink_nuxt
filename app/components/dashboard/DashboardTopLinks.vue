<script setup lang="ts">
import type { DashboardTopLink } from '~/types/dashboard'

const props = defineProps<{
  links: DashboardTopLink[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'view-all'): void
  (e: 'open-link', link: DashboardTopLink): void
}>()

const changeClass = (change: string) => {
  return change.includes('-')
    ? 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400'
    : 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400'
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
        Top Performing Links
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

    <div v-if="isLoading" class="space-y-3">
      <BaseCard
        v-for="placeholder in 3"
        :key="`top-link-skeleton-${placeholder}`"
        class="h-24 animate-pulse rounded-xl bg-muted-100/80 dark:bg-muted-800/60"
      />
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(link, index) in links"
        :key="link.id"
        class="group flex items-center gap-4 rounded-xl border border-muted-200 p-4 transition-all duration-200 hover:border-primary-500 hover:bg-primary-50 dark:border-muted-700 dark:hover:border-primary-500 dark:hover:bg-primary-900/20"
      >
        <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          {{ index + 1 }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="mb-1 flex items-center gap-2">
            <BaseText size="sm" weight="semibold" class="font-mono text-muted-900 dark:text-muted-100">
              {{ link.shortUrl }}
            </BaseText>
            <div
              class="flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold"
              :class="changeClass(link.change)"
            >
              <Icon
                :name="link.change.includes('-') ? 'solar:arrow-down-linear' : 'solar:arrow-up-linear'"
                class="size-3"
              />
              <span>{{ link.change }}</span>
            </div>
          </div>
          <BaseParagraph size="xs" class="line-clamp-1 text-muted-500 dark:text-muted-400">
            {{ link.originalUrl }}
          </BaseParagraph>
        </div>
        <div class="flex shrink-0 items-center gap-6">
          <div class="text-right">
            <BaseText size="sm" weight="bold" class="text-muted-900 dark:text-muted-100">
              {{ link.clicks.toLocaleString() }}
            </BaseText>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              clicks
            </BaseParagraph>
          </div>
          <BaseButton
            size="sm"
            variant="ghost"
            @click="emit('open-link', link)"
          >
            <Icon name="lucide:arrow-right" class="size-4" />
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

