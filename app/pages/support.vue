<script setup lang="ts">
import { callOnce, computed } from '#imports'
import SupportPageHeader from '~/components/support/SupportPageHeader.vue'
import SupportStatsGrid from '~/components/support/SupportStatsGrid.vue'
import SupportFilters from '~/components/support/SupportFilters.vue'
import SupportTicketList from '~/components/support/SupportTicketList.vue'
import SupportTicketModal from '~/components/support/SupportTicketModal.vue'
import { useSupport } from '~/composables/useSupport'

definePageMeta({
  title: 'Support',
  layout: 'dashboard',
})

const {
  stats,
  filteredTickets,
  statusColor,
  priorityMeta,
  isLoading,
  isSaving,
  error,
  filters,
  modalOpen,
  draft,
  fetchTickets,
  setFilters,
  openModal,
  closeModal,
  updateDraft,
  createTicket,
} = useSupport()

await callOnce(() => fetchTickets())

const filtersModel = computed({
  get: () => filters.value,
  set: (value) => setFilters(value),
})

const handleViewTicket = (ticket: any) => {
  // placeholder for future enhancements
}

const handleReplyTicket = (ticket: any) => {
  // placeholder for future enhancements
}

const handleModalStateChange = (value: boolean) => {
  if (value) {
    openModal()
  } else {
    closeModal()
  }
}
</script>

<template>
  <div class="space-y-6 py-6">
    <SupportPageHeader :on-create="openModal" />

    <SupportStatsGrid :stats="stats" />

    <SupportTicketList
      :tickets="filteredTickets"
      :status-color="statusColor"
      :priority-meta="priorityMeta"
      :is-loading="isLoading"
      @view="handleViewTicket"
      @reply="handleReplyTicket"
    >
      <template #filters>
        <SupportFilters v-model="filtersModel" />
      </template>
    </SupportTicketList>

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached support data
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

    <SupportTicketModal
      :open="modalOpen"
      :draft="draft"
      :is-saving="isSaving"
      @update:open="handleModalStateChange"
      @update-draft="updateDraft"
      @submit="createTicket"
    />
  </div>
</template>
