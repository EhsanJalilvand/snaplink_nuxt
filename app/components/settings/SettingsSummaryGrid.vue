<script setup lang="ts">
import type { SettingsSummaryLink } from '~/types/settings'

const props = defineProps<{
  title: string
  description: string
  links: SettingsSummaryLink[]
}>()
</script>

<template>
  <BaseCard class="p-6">
    <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-muted-100">
      {{ title }}
    </BaseHeading>
    <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
      {{ description }}
    </BaseParagraph>

    <div class="mt-6 divide-y divide-muted-200 dark:divide-muted-800">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-4 px-4 py-4 transition hover:bg-muted-100 dark:hover:bg-muted-900/40"
      >
        <div class="flex size-12 items-center justify-center rounded-full bg-muted-100 text-primary-500 dark:bg-muted-900/50">
          <Icon :name="link.icon" class="size-5" />
        </div>
        <div class="flex-1">
          <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
            {{ link.label }}
          </BaseHeading>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            {{ link.description }}
          </BaseParagraph>
        </div>
        <Icon name="ph:arrow-right" class="size-4 text-muted-400" />
      </NuxtLink>
    </div>
  </BaseCard>
</template>
