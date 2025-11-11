<script setup lang="ts">
const props = defineProps<{
  selectedCount: number
}>()

const emit = defineEmits<{
  clear: []
  report: []
}>()

const handleClear = () => emit('clear')
const handleReport = () => emit('report')
</script>

<template>
  <div
    v-if="props.selectedCount > 0"
    class="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 dark:border-primary-800 dark:bg-primary-900/20"
  >
    <BaseText size="sm" weight="medium" class="text-primary-900 dark:text-primary-100">
      {{ props.selectedCount }} link(s) selected
    </BaseText>
    <div class="flex items-center gap-2">
      <BaseButton size="sm" variant="outline" @click="handleClear">
        Clear Selection
      </BaseButton>
      <BaseButton size="sm" variant="primary" @click="handleReport">
        <Icon name="ph:chart-line" class="size-4" />
        <span>Generate Bulk Report</span>
      </BaseButton>
    </div>
  </div>
</template>
