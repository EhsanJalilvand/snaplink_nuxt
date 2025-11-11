<script setup lang="ts">
import type { SupportTicket } from '~/types/support'

const props = defineProps<{
  tickets: SupportTicket[]
  statusColor: (status: SupportTicket['status']) => string
  priorityMeta: (priority: SupportTicket['priority']) => { label: string; color: string }
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'view', ticket: SupportTicket): void
  (e: 'reply', ticket: SupportTicket): void
}>()

const handleView = (ticket: SupportTicket) => emit('view', ticket)
const handleReply = (ticket: SupportTicket) => emit('reply', ticket)
</script>

<template>
  <BaseCard class="space-y-4 p-6">
    <slot name="filters" />

    <div v-if="isLoading" class="space-y-3">
      <BaseCard
        v-for="index in 3"
        :key="index"
        class="h-28 animate-pulse rounded-2xl bg-muted-200/80 dark:bg-muted-800/60"
      />
    </div>

    <div
      v-else
      class="divide-y divide-muted-200 rounded-2xl border border-muted-200 bg-white dark:divide-muted-800 dark:border-muted-700 dark:bg-muted-900/40"
    >
      <div
        v-for="ticket in tickets"
        :key="ticket.id"
        class="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
      >
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-900 dark:text-white">
              {{ ticket.subject }}
            </BaseHeading>
            <BaseChip :color="priorityMeta(ticket.priority).color" size="xs">
              {{ priorityMeta(ticket.priority).label }}
            </BaseChip>
            <BaseChip :color="statusColor(ticket.status)" size="xs">
              {{ ticket.status }}
            </BaseChip>
          </div>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            {{ ticket.summary }}
          </BaseParagraph>
          <div class="flex flex-wrap items-center gap-2 text-xs text-muted-400 dark:text-muted-500">
            <span>#{{ ticket.id }}</span>
            <span>•</span>
            <span>{{ ticket.requester }}</span>
            <span>•</span>
            <span>{{ ticket.updatedAt }}</span>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs text-muted-500 dark:text-muted-400">
          <BaseButton size="sm" variant="ghost" @click="handleView(ticket)">
            View details
          </BaseButton>
          <BaseButton size="sm" variant="ghost" @click="handleReply(ticket)">
            Reply
          </BaseButton>
        </div>
      </div>

      <div v-if="tickets.length === 0" class="py-12 text-center">
        <Icon name="solar:lifebuoy-bold-duotone" class="mx-auto mb-4 size-12 text-muted-400" />
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          No tickets match your filters.
        </BaseParagraph>
      </div>
    </div>
  </BaseCard>
</template>
