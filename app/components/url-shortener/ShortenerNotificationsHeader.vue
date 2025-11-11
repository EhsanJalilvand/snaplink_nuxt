<script setup lang="ts">
const props = defineProps<{
  isSaving: boolean
}>()

const emit = defineEmits<{
  save: []
}>()

const handleSave = () => emit('save')
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
        Notifications
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
        Configure alerting and report schedules for your short links.
      </BaseParagraph>
    </div>
    <BaseButton variant="primary" :loading="props.isSaving" :disabled="props.isSaving" @click="handleSave">
      <Icon name="ph:check" class="size-4" />
      <span>Save Changes</span>
    </BaseButton>
  </div>
</template>
