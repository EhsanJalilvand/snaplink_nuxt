<script setup lang="ts">
import type { AuditLogEntry } from '~/types/payment-gateway'

interface Props {
  entries: AuditLogEntry[]
  isLoading?: boolean
  maxHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  maxHeight: '600px',
})

const actionConfig = {
  created: {
    label: 'Created',
    icon: 'solar:add-circle-bold-duotone',
    color: 'primary',
    bgColor: 'bg-primary-50 dark:bg-primary-900/20',
    borderColor: 'border-primary-200 dark:border-primary-800',
  },
  submitted: {
    label: 'Submitted for Review',
    icon: 'solar:document-send-bold-duotone',
    color: 'info',
    bgColor: 'bg-info-50 dark:bg-info-900/20',
    borderColor: 'border-info-200 dark:border-info-800',
  },
  approved: {
    label: 'Approved',
    icon: 'solar:check-circle-bold-duotone',
    color: 'success',
    bgColor: 'bg-success-50 dark:bg-success-900/20',
    borderColor: 'border-success-200 dark:border-success-800',
  },
  rejected: {
    label: 'Rejected',
    icon: 'solar:close-circle-bold-duotone',
    color: 'danger',
    bgColor: 'bg-danger-50 dark:bg-danger-900/20',
    borderColor: 'border-danger-200 dark:border-danger-800',
  },
  activated: {
    label: 'Activated',
    icon: 'solar:play-circle-bold-duotone',
    color: 'success',
    bgColor: 'bg-success-50 dark:bg-success-900/20',
    borderColor: 'border-success-200 dark:border-success-800',
  },
  suspended: {
    label: 'Suspended',
    icon: 'solar:pause-circle-bold-duotone',
    color: 'warning',
    bgColor: 'bg-warning-50 dark:bg-warning-900/20',
    borderColor: 'border-warning-200 dark:border-warning-800',
  },
  updated: {
    label: 'Updated',
    icon: 'solar:edit-circle-bold-duotone',
    color: 'muted',
    bgColor: 'bg-muted-50 dark:bg-muted-900/40',
    borderColor: 'border-muted-200 dark:border-muted-800',
  },
  deleted: {
    label: 'Deleted',
    icon: 'solar:trash-bin-minimalistic-bold-duotone',
    color: 'danger',
    bgColor: 'bg-danger-50 dark:bg-danger-900/20',
    borderColor: 'border-danger-200 dark:border-danger-800',
  },
} as const

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

const fullTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const sortedEntries = computed(() => {
  return [...props.entries].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
})
</script>

<template>
  <div class="relative">
    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="space-y-4"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="flex gap-4"
      >
        <div class="flex shrink-0 flex-col items-center">
          <div class="size-10 animate-pulse rounded-full bg-muted-200 dark:bg-muted-800" />
          <div class="mt-2 h-8 w-px bg-muted-200 dark:bg-muted-800" />
        </div>
        <div class="flex-1 space-y-2 pb-6">
          <div class="h-4 w-32 animate-pulse rounded bg-muted-200 dark:bg-muted-800" />
          <div class="h-3 w-24 animate-pulse rounded bg-muted-200 dark:bg-muted-800" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="sortedEntries.length === 0"
      class="flex flex-col items-center justify-center py-12 text-center"
    >
      <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-muted-100 dark:bg-muted-900">
        <Icon
          name="solar:history-bold-duotone"
          class="size-8 text-muted-400"
        />
      </div>
      <BaseHeading
        as="h3"
        size="sm"
        weight="semibold"
        class="text-muted-600 dark:text-muted-400"
      >
        No activity yet
      </BaseHeading>
      <BaseParagraph size="xs" class="mt-1 text-muted-500">
        Activity history will appear here
      </BaseParagraph>
    </div>

    <!-- Timeline -->
    <div
      v-else
      class="nui-slimscroll space-y-0 overflow-y-auto"
      :style="{ maxHeight: props.maxHeight }"
    >
      <div
        v-for="(entry, index) in sortedEntries"
        :key="entry.id"
        class="relative flex gap-4 pb-6 last:pb-0"
      >
        <!-- Timeline Line -->
        <div
          v-if="index < sortedEntries.length - 1"
          class="absolute start-5 top-12 h-full w-px bg-muted-200 dark:bg-muted-800"
        />

        <!-- Icon -->
        <div class="relative z-10 flex shrink-0">
          <div
            class="flex size-10 items-center justify-center rounded-full border-2 shadow-sm transition-colors"
            :class="[
              actionConfig[entry.action]?.bgColor,
              actionConfig[entry.action]?.borderColor,
            ]"
          >
            <Icon
              :name="actionConfig[entry.action]?.icon || 'solar:circle-bold-duotone'"
              class="size-5"
              :class="`text-${actionConfig[entry.action]?.color}-500`"
            />
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 space-y-2 pb-1">
          <!-- Header -->
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <BaseHeading
                  as="h4"
                  size="sm"
                  weight="semibold"
                  class="text-muted-900 dark:text-white"
                >
                  {{ actionConfig[entry.action]?.label || entry.action }}
                </BaseHeading>
                <BaseChip
                  v-if="entry.action === 'rejected' || entry.action === 'suspended'"
                  size="xs"
                  :color="actionConfig[entry.action]?.color"
                  variant="pastel"
                >
                  {{ entry.action }}
                </BaseChip>
              </div>
              <div class="mt-1 flex items-center gap-2 text-xs text-muted-500 dark:text-muted-400">
                <span>{{ entry.userName }}</span>
                <span>•</span>
                <BaseTooltip :content="fullTimestamp(entry.timestamp)">
                  <span>{{ formatTimestamp(entry.timestamp) }}</span>
                </BaseTooltip>
              </div>
            </div>
          </div>

          <!-- Rejection Reason -->
          <div
            v-if="entry.reason && (entry.action === 'rejected' || entry.action === 'suspended')"
            class="mt-3 rounded-xl border p-4"
            :class="[
              actionConfig[entry.action]?.bgColor,
              actionConfig[entry.action]?.borderColor,
            ]"
          >
            <div class="flex items-start gap-3">
              <Icon
                name="solar:info-circle-bold-duotone"
                class="size-5 shrink-0 mt-0.5"
                :class="`text-${actionConfig[entry.action]?.color}-500`"
              />
              <div class="flex-1 space-y-2">
                <BaseText
                  size="xs"
                  weight="medium"
                  :class="`text-${actionConfig[entry.action]?.color}-700 dark:text-${actionConfig[entry.action]?.color}-300`"
                >
                  Reason
                </BaseText>
                <BaseText
                  size="sm"
                  class="text-muted-700 dark:text-muted-300"
                >
                  {{ entry.reason.freeText || entry.reason.predefined.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }}
                </BaseText>
              </div>
            </div>
          </div>

          <!-- Metadata -->
          <div
            v-if="entry.metadata && Object.keys(entry.metadata).length > 0"
            class="mt-2 rounded-lg border border-muted-200 bg-muted-50/50 p-3 dark:border-muted-700 dark:bg-muted-900/30"
          >
            <BaseText
              size="xs"
              class="font-mono text-muted-600 dark:text-muted-400"
            >
              <pre class="whitespace-pre-wrap">{{ JSON.stringify(entry.metadata, null, 2) }}</pre>
            </BaseText>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

