<script setup lang="ts">
const props = defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <BaseHeading as="h1" size="2xl" weight="bold" class="text-muted-900 dark:text-muted-100">
      {{ title ?? 'Account Settings' }}
    </BaseHeading>
    <BaseParagraph size="sm" class="max-w-2xl text-muted-500 dark:text-muted-400">
      {{ subtitle ?? 'Manage your profile, security posture, and workspace preferences.' }}
    </BaseParagraph>
  </div>
</template>
