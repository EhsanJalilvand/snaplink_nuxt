<script setup lang="ts">
import type { ShortenerReferrer } from '~/types/url-shortener'

interface Props {
  referrers: ShortenerReferrer[]
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
          Top referrers
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Understand where your visitors are coming from.
        </BaseParagraph>
      </div>
    </div>

    <div class="mt-5 space-y-3">
      <div v-if="isLoading" class="space-y-2">
        <div
          v-for="index in 5"
          :key="`referrer-skeleton-${index}`"
          class="h-12 rounded-xl border border-muted-200/70 bg-muted-100/70 animate-pulse dark:border-muted-700/60 dark:bg-muted-900/30"
        />
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="referrer in referrers"
          :key="referrer.source"
          class="flex items-center justify-between gap-4 rounded-xl border border-muted-200/70 bg-white/80 px-4 py-3 dark:border-muted-700/50 dark:bg-muted-900/30"
        >
          <div>
            <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
              {{ referrer.source }}
            </BaseText>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              {{ referrer.clicks.toLocaleString() }} clicks
            </BaseText>
          </div>
          <div class="w-32">
            <div class="h-2 rounded-full bg-muted-200 dark:bg-muted-800">
              <div
                class="h-full rounded-full bg-primary-500"
                :style="{ width: `${referrer.percentage}%` }"
              />
            </div>
            <BaseText size="xs" class="mt-1 block text-right text-muted-400 dark:text-muted-500">
              {{ referrer.percentage }}%
            </BaseText>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
