<script setup lang="ts">
const props = defineProps<{
  selectedCount: number
}>()

const emit = defineEmits<{
  report: []
  create: []
}>()

const handleReport = () => emit('report')
const handleCreate = () => emit('create')
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <BaseHeading
        as="h1"
        size="2xl"
        weight="bold"
        class="text-muted-800 dark:text-muted-100"
      >
        Collections
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
        Organize your links into reusable collections.
      </BaseParagraph>
    </div>
    <div class="flex items-center gap-2">
      <BaseButton variant="outline" :disabled="props.selectedCount === 0" @click="handleReport">
        <Icon name="ph:chart-line" class="size-4" />
        <span>Generate Bulk Report</span>
      </BaseButton>
      <BaseButton variant="primary" @click="handleCreate">
        <Icon name="ph:plus" class="size-4" />
        <span>Create Collection</span>
      </BaseButton>
    </div>
  </div>
</template>
