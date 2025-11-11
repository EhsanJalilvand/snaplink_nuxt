<script setup lang="ts">
import type { ShortenerUserStats } from '~/types/url-shortener'

interface Props {
  stats: ShortenerUserStats
  total: number
  newRatio: number
  returningRatio: number
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})
</script>

<template>
  <BaseCard class="p-6">
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
          Audience composition
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Compare new and returning visitors for the selected period.
        </BaseParagraph>
      </div>
    </div>

    <div class="mt-6 space-y-4">
      <div class="rounded-2xl border border-muted-200 bg-muted-50/60 p-4 dark:border-muted-700 dark:bg-muted-900/30">
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          Total visitors
        </BaseText>
        <div class="mt-2">
          <div v-if="isLoading" class="h-6 w-20 rounded bg-muted-200/80 animate-pulse dark:bg-muted-800/60" />
          <BaseHeading v-else as="h4" size="lg" weight="bold" class="text-muted-900 dark:text-white">
            {{ total.toLocaleString() }}
          </BaseHeading>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between gap-4 rounded-xl border border-muted-200 bg-white/80 px-4 py-3 dark:border-muted-700/60 dark:bg-muted-900/30">
          <div>
            <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
              New visitors
            </BaseText>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              {{ stats.new.toLocaleString() }} total
            </BaseText>
          </div>
          <BaseChip color="primary" size="sm">
            {{ newRatio }}%
          </BaseChip>
        </div>

        <div class="flex items-center justify-between gap-4 rounded-xl border border-muted-200 bg-white/80 px-4 py-3 dark:border-muted-700/60 dark:bg-muted-900/30">
          <div>
            <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
              Returning visitors
            </BaseText>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              {{ stats.returning.toLocaleString() }} total
            </BaseText>
          </div>
          <BaseChip color="muted" size="sm">
            {{ returningRatio }}%
          </BaseChip>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
