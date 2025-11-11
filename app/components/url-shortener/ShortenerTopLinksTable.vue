<script setup lang="ts">
import type { ShortenerLink } from '~/types/url-shortener'

interface Props {
  links: ShortenerLink[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const handleCopy = (reference: string) => {
  const url = `https://${reference}`
  if (import.meta.client && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url)
  }
}
</script>

<template>
  <BaseCard class="p-6">
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
          Top performing links
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Track the highest converting short links across your workspace.
        </BaseParagraph>
      </div>
      <BaseButton size="sm" variant="ghost" class="rounded-full" to="/dashboard/url-shortener/links">
        View all
      </BaseButton>
    </div>

    <div class="mt-5">
      <div v-if="isLoading" class="space-y-2">
        <div
          v-for="index in 5"
          :key="`link-skeleton-${index}`"
          class="h-14 rounded-xl border border-muted-200/70 bg-muted-100/70 animate-pulse dark:border-muted-700/50 dark:bg-muted-900/30"
        />
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="link in links"
          :key="link.id"
          class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-muted-200/70 bg-white/80 px-4 py-3 dark:border-muted-700/50 dark:bg-muted-900/30"
        >
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <BaseHeading as="h4" size="sm" weight="semibold" class="truncate text-muted-900 dark:text-white">
              {{ link.shortUrl }}
            </BaseHeading>
            <BaseText size="xs" class="truncate text-muted-500 dark:text-muted-400">
              {{ link.originalUrl }}
            </BaseText>
            <div class="flex items-center gap-2 text-xs text-muted-400 dark:text-muted-500">
              <span class="font-mono">{{ link.id }}</span>
              <BaseButton size="xs" variant="ghost" icon class="rounded-full" @click="handleCopy(link.shortUrl)">
                <Icon name="ph:copy" class="size-3" />
              </BaseButton>
            </div>
          </div>
          <div class="flex items-end gap-6">
            <div class="text-right">
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Clicks
              </BaseText>
              <BaseHeading as="span" size="md" weight="bold" class="text-primary-500">
                {{ link.clicks.toLocaleString() }}
              </BaseHeading>
            </div>
            <div class="text-right">
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Created
              </BaseText>
              <BaseText size="xs" class="text-muted-400 dark:text-muted-500">
                {{ new Date(link.createdAt).toLocaleDateString() }}
              </BaseText>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
