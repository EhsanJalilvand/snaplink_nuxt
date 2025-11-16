<script setup lang="ts">
import { ref, watch } from '#imports'
import { usePaymentProcessing } from '~/composables/usePaymentProcessing'
import type { ProcessingFilters } from '~/types/payment-processing'

definePageMeta({
  title: 'Payment Sessions',
  layout: 'dashboard',
})

const { isLoading, error, fetchSessions } = usePaymentProcessing()

const sessions = ref<any[]>([])
const filters = ref<ProcessingFilters>({
  search: '',
  status: 'all',
})

const loadSessions = async () => {
  sessions.value = await fetchSessions(filters.value)
}

// Always fetch on mount to ensure API call is made
onMounted(async () => {
  if (import.meta.dev) {
    // eslint-disable-next-line no-console
    console.warn('[processing/sessions.vue] onMounted - calling loadSessions()')
  }
  await loadSessions()
})

watch(() => filters.value, () => {
  loadSessions()
}, { deep: true })
</script>

<template>
  <div class="space-y-6 py-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading as="h1" size="2xl" weight="bold" class="text-muted-900 dark:text-white">
          Payment Sessions
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          Track active and completed payment sessions
        </BaseParagraph>
      </div>
    </div>

    <BaseCard class="p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TairoFormGroup label="Search">
          <TairoInput v-model="filters.search" placeholder="Search..." icon="solar:magnifier-bold-duotone" size="lg" />
        </TairoFormGroup>
        <TairoFormGroup label="Status">
          <TairoSelect v-model="filters.status" size="lg">
            <BaseSelectItem value="all">All Status</BaseSelectItem>
            <BaseSelectItem value="created">Created</BaseSelectItem>
            <BaseSelectItem value="active">Active</BaseSelectItem>
            <BaseSelectItem value="completed">Completed</BaseSelectItem>
            <BaseSelectItem value="expired">Expired</BaseSelectItem>
            <BaseSelectItem value="canceled">Canceled</BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>
      </div>
    </BaseCard>

    <BaseCard class="p-6">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">ID</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Intent ID</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Status</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Expires</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Created</BaseText></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading" v-for="i in 5" :key="i"><td colspan="5" class="px-4 py-4"><div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" /></td></tr>
            <tr v-else-if="sessions.length === 0"><td colspan="5" class="px-4 py-12 text-center"><BaseText size="sm" class="text-muted-500">No sessions found</BaseText></td></tr>
            <tr v-else v-for="session in sessions.slice(0, 10)" :key="session.id" class="border-b border-muted-100 dark:border-muted-900">
              <td class="px-4 py-3"><BaseText size="sm" class="font-mono">{{ session.id.substring(0, 8) }}...</BaseText></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ session.intentId?.substring(0, 8) }}...</BaseText></td>
              <td class="px-4 py-3"><BaseChip size="xs" :color="session.status === 'completed' ? 'success' : 'warning'" variant="pastel">{{ session.status }}</BaseChip></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ session.expiresAt ? new Date(session.expiresAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <BaseAlert v-if="error" color="danger" variant="pastel" class="rounded-2xl">
      <template #title>Failed to load sessions</template>
      <BaseParagraph size="sm">{{ error }}</BaseParagraph>
    </BaseAlert>
  </div>
</template>
