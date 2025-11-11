<script setup lang="ts">
const props = defineProps<{
  statusLabel: string
  statusDescription: string
  statusColor: string
  statusIcon: string
}>()

defineOptions({
  name: 'BillingOverviewHeader',
})

const emit = defineEmits<{
  (e: 'add-credit'): void
}>()

const handleAddCredit = () => {
  emit('add-credit')
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <BaseHeading
        as="h1"
        size="2xl"
        weight="bold"
        class="text-muted-900 dark:text-muted-100"
      >
        Billing Overview
      </BaseHeading>
      <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
        Monitor balance, usage and payment status across your workspace.
      </BaseParagraph>
    </div>

    <div class="flex items-center gap-3">
      <BaseChip :color="statusColor" size="sm" class="max-md:hidden">
        <Icon :name="statusIcon" class="size-3" />
        <span>{{ statusLabel }}</span>
      </BaseChip>
      <BaseButton variant="primary" size="sm" @click="handleAddCredit">
        <Icon name="ph:plus" class="size-4" />
        Add Credit
      </BaseButton>
    </div>

    <div class="w-full rounded-2xl border border-muted-200 bg-muted-50 px-4 py-3 text-xs text-muted-500 dark:border-muted-800 dark:bg-muted-900/40 dark:text-muted-400">
      {{ statusDescription }}
    </div>
  </div>
</template>
