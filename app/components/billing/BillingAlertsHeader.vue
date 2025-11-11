<script setup lang="ts">
const props = defineProps<{
  isSaving?: boolean
}>()

const emit = defineEmits<{
  (e: 'save'): void
}>()

const handleSave = () => emit('save')
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <BaseHeading as="h1" size="2xl" weight="bold" class="text-muted-900 dark:text-muted-100">
        Alerts & Limits
      </BaseHeading>
      <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
        Configure safeguards that notify your team before spend surprises happen.
      </BaseParagraph>
    </div>

    <BaseButton
      variant="primary"
      :loading="isSaving"
      :disabled="isSaving"
      @click="handleSave"
    >
      <Icon name="ph:check" class="size-4" />
      Save changes
    </BaseButton>
  </div>
</template>
