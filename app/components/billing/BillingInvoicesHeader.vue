<script setup lang="ts">
const emit = defineEmits<{
  (e: 'export'): void
}>()

const handleExport = () => {
  emit('export')
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <BaseHeading as="h1" size="2xl" weight="bold" class="text-muted-900 dark:text-muted-100">
        Invoices
      </BaseHeading>
      <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
        Review billing documents and payment records.
      </BaseParagraph>
    </div>

    <div class="flex items-center gap-2">
      <BaseButton variant="outline" size="sm" @click="handleExport">
        <Icon name="ph:download" class="size-4" />
        Export
      </BaseButton>
    </div>
  </div>
</template>
