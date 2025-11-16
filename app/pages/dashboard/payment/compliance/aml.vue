<script setup lang="ts">
import { ref, watch } from '#imports'
import { usePaymentCompliance } from '~/composables/usePaymentCompliance'
import type { ComplianceFilters } from '~/types/payment-compliance'

definePageMeta({
  title: 'AML Checks',
  layout: 'dashboard',
})

const { isLoading, error, fetchAML } = usePaymentCompliance()

const amlList = ref<any[]>([])
const filters = ref<ComplianceFilters>({
  status: 'all',
})

const loadAML = async () => {
  amlList.value = await fetchAML(filters.value)
}

// Always fetch on mount to ensure API call is made
onMounted(async () => {
  if (import.meta.dev) {
    // eslint-disable-next-line no-console
    console.warn('[compliance/aml.vue] onMounted - calling loadAML()')
  }
  await loadAML()
})

watch(() => filters.value, () => {
  loadAML()
}, { deep: true })
</script>

<template>
  <div class="space-y-6 py-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading as="h1" size="2xl" weight="bold" class="text-muted-900 dark:text-white">
          AML Checks
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          View Anti-Money Laundering compliance checks and flags
        </BaseParagraph>
      </div>
    </div>

    <!-- Filters -->
    <BaseCard class="p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TairoFormGroup label="Status">
          <TairoSelect v-model="filters.status" size="lg">
            <BaseSelectItem value="all">All Status</BaseSelectItem>
            <BaseSelectItem value="pending">Pending</BaseSelectItem>
            <BaseSelectItem value="passed">Passed</BaseSelectItem>
            <BaseSelectItem value="flagged">Flagged</BaseSelectItem>
            <BaseSelectItem value="failed">Failed</BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>
      </div>
    </BaseCard>

    <!-- Table -->
    <BaseCard class="p-6">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Check ID</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Status</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Flags</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Checked At</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Checked By</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Resolution</BaseText></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading" v-for="i in 5" :key="i"><td colspan="6" class="px-4 py-4"><div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" /></td></tr>
            <tr v-else-if="amlList.length === 0"><td colspan="6" class="px-4 py-12 text-center"><BaseText size="sm" class="text-muted-500">No AML checks found</BaseText></td></tr>
            <tr v-else v-for="aml in amlList.slice(0, 10)" :key="aml.id" class="border-b border-muted-100 dark:border-muted-900">
              <td class="px-4 py-3"><BaseText size="sm" class="font-mono">{{ aml.id.substring(0, 8) }}...</BaseText></td>
              <td class="px-4 py-3">
                <BaseChip size="xs" :color="aml.status === 'passed' ? 'success' : aml.status === 'failed' ? 'danger' : aml.status === 'flagged' ? 'warning' : 'muted'" variant="pastel">
                  {{ aml.status }}
                </BaseChip>
              </td>
              <td class="px-4 py-3"><BaseText size="sm">{{ aml.flags?.length || 0 }} flags</BaseText></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ aml.checkedAt ? new Date(aml.checkedAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ aml.checkedBy || 'System' }}</BaseText></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ aml.resolution || 'N/A' }}</BaseText></td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <BaseAlert v-if="error" color="danger" variant="pastel" class="rounded-2xl">
      <template #title>Failed to load AML checks</template>
      <BaseParagraph size="sm">{{ error }}</BaseParagraph>
    </BaseAlert>
  </div>
</template>

