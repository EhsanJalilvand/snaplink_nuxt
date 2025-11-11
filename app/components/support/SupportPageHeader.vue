<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  onCreate?: () => void
}>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <BaseHeading as="h1" size="2xl" weight="bold" class="text-muted-900 dark:text-white">
        {{ title ?? 'Support Mission Control' }}
      </BaseHeading>
      <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
        {{ description ?? 'Track conversations, hit SLAs, and keep merchants confident.' }}
      </BaseParagraph>
    </div>
    <BaseButton variant="primary" @click="onCreate?.()">
      <Icon name="ph:plus" class="size-4" />
      New ticket
    </BaseButton>
  </div>
</template>
