<script setup lang="ts">
const props = defineProps<{
  isSubmitting?: boolean
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit'): void
}>()

const handleCancel = () => emit('cancel')
const handleSubmit = () => emit('submit')
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 border-b border-muted-200 pb-4 dark:border-muted-800">
    <div>
      <BaseHeading as="h1" size="2xl" weight="bold" class="text-muted-900 dark:text-muted-100">
        Security settings
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
        Rotate credentials and manage two-factor authentication to protect your workspace.
      </BaseParagraph>
    </div>
    <div class="flex items-center gap-2">
      <BaseButton variant="ghost" @click="handleCancel">
        Cancel
      </BaseButton>
      <BaseButton variant="primary" :loading="isSubmitting" :disabled="isSubmitting" @click="handleSubmit">
        Save changes
      </BaseButton>
    </div>
  </div>
</template>
