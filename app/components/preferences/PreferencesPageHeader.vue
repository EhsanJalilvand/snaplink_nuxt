<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <BaseHeading as="h1" size="2xl" weight="bold" class="text-muted-900 dark:text-muted-100">
        {{ title ?? 'Preferences' }}
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
        {{ description ?? 'Manage workspace defaults, collaboration rules, and platform integrations.' }}
      </BaseParagraph>
    </div>
  </div>
</template>
