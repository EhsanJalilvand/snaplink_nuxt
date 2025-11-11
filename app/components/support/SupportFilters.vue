<script setup lang="ts">
import type { SupportTicketFilters, SupportTicketPriority, SupportTicketStatus } from '~/types/support'

const props = defineProps<{
  modelValue: SupportTicketFilters
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: SupportTicketFilters): void
}>()

const updateFilters = (patch: Partial<SupportTicketFilters>) => {
  emit('update:modelValue', {
    ...props.modelValue,
    ...patch,
  })
}

const handleSearch = (value: string) => {
  updateFilters({ search: value })
}

const handleStatus = (value: 'all' | SupportTicketStatus) => {
  updateFilters({ status: value })
}

const handlePriority = (value: 'all' | SupportTicketPriority) => {
  updateFilters({ priority: value })
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <TairoInput
      :model-value="modelValue.search"
      icon="lucide:search"
      placeholder="Search tickets or people"
      rounded="lg"
      class="min-w-[220px] flex-1"
      @update:model-value="handleSearch"
    />
    <TairoSelect
      :model-value="modelValue.status"
      icon="solar:filter-linear"
      rounded="lg"
      class="w-40"
      @update:model-value="handleStatus"
    >
      <BaseSelectItem value="all">All statuses</BaseSelectItem>
      <BaseSelectItem value="open">Open</BaseSelectItem>
      <BaseSelectItem value="waiting">Waiting</BaseSelectItem>
      <BaseSelectItem value="resolved">Resolved</BaseSelectItem>
      <BaseSelectItem value="escalated">Escalated</BaseSelectItem>
    </TairoSelect>
    <TairoSelect
      :model-value="modelValue.priority"
      icon="solar:danger-triangle-linear"
      rounded="lg"
      class="w-40"
      @update:model-value="handlePriority"
    >
      <BaseSelectItem value="all">All priorities</BaseSelectItem>
      <BaseSelectItem value="low">Low</BaseSelectItem>
      <BaseSelectItem value="medium">Medium</BaseSelectItem>
      <BaseSelectItem value="high">High</BaseSelectItem>
      <BaseSelectItem value="critical">Critical</BaseSelectItem>
    </TairoSelect>
  </div>
</template>
