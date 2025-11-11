<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4 border-b border-muted-200 pb-4 dark:border-muted-800">
    <div>
      <BaseHeading as="h1" size="2xl" weight="bold" class="text-muted-900 dark:text-muted-100">
        {{ title ?? 'Security settings' }}
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
        {{ subtitle ?? 'Harden account access with strong passwords and two-factor protections.' }}
      </BaseParagraph>
    </div>
  </div>
</template>
