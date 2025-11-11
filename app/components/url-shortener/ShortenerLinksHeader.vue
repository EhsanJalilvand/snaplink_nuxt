<script setup lang="ts">
interface Props {
  selectedCount: number
}

const props = withDefaults(defineProps<Props>(), {
  selectedCount: 0,
})

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
        Links
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
        Manage and track all shortened URLs across your workspace.
      </BaseParagraph>
    </div>
    <div class="flex items-center gap-2">
      <BaseButton variant="outline" :disabled="selectedCount === 0" @click="handleReport">
        <Icon name="ph:chart-line" class="size-4" />
        <span>Generate Bulk Report</span>
      </BaseButton>
      <BaseButton variant="primary" @click="handleCreate">
        <Icon name="ph:plus" class="size-4" />
        <span>Create Link</span>
      </BaseButton>
    </div>
  </div>
</template>
