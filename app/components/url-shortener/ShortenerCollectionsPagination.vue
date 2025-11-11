<script setup lang="ts">
const pageModel = defineModel<number>('page', { required: true })

const props = defineProps<{
  totalPages: number
}>()
</script>

<template>
  <div class="flex items-center justify-between pt-4">
    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
      Page {{ pageModel }} of {{ props.totalPages }}
    </BaseText>
    <BasePagination v-model:current-page="pageModel" :total-pages="props.totalPages" rounded />
  </div>
</template>
