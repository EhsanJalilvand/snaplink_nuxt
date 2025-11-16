<script setup lang="ts">
import { ref, watch } from '#imports'
import { usePaymentCompliance } from '~/composables/usePaymentCompliance'
import GatewayStatusBadge from '~/components/payment/GatewayStatusBadge.vue'
import type { ComplianceFilters } from '~/types/payment-compliance'

definePageMeta({
  title: 'KYC List',
  layout: 'dashboard',
})

const { isLoading, error, fetchKYCList } = usePaymentCompliance()

const kycList = ref<any[]>([])
const filters = ref<ComplianceFilters>({
  status: 'all',
  riskLevel: 'all',
})

const loadKYC = async () => {
  kycList.value = await fetchKYCList(filters.value)
}

// Always fetch on mount to ensure API call is made
onMounted(async () => {
  if (import.meta.dev) {
    // eslint-disable-next-line no-console
    console.warn('[compliance/kyc.vue] onMounted - calling loadKYC()')
  }
  await loadKYC()
})

watch(() => filters.value, () => {
  loadKYC()
}, { deep: true })

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, 'pending' | 'approved' | 'rejected'> = {
    verified: 'approved',
    rejected: 'rejected',
    pending_review: 'pending',
  }
  return statusMap[status] || 'pending'
}
</script>

<template>
  <div class="space-y-6 py-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading as="h1" size="2xl" weight="bold" class="text-muted-900 dark:text-white">
          KYC Verification
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          View Know Your Customer verification status and documents
        </BaseParagraph>
      </div>
    </div>

    <!-- Filters -->
    <BaseCard class="p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TairoFormGroup label="Status">
          <TairoSelect v-model="filters.status" size="lg">
            <BaseSelectItem value="all">All Status</BaseSelectItem>
            <BaseSelectItem value="not_started">Not Started</BaseSelectItem>
            <BaseSelectItem value="in_progress">In Progress</BaseSelectItem>
            <BaseSelectItem value="pending_review">Pending Review</BaseSelectItem>
            <BaseSelectItem value="verified">Verified</BaseSelectItem>
            <BaseSelectItem value="rejected">Rejected</BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>

        <TairoFormGroup label="Risk Level">
          <TairoSelect v-model="filters.riskLevel" size="lg">
            <BaseSelectItem value="all">All Levels</BaseSelectItem>
            <BaseSelectItem value="low">Low</BaseSelectItem>
            <BaseSelectItem value="medium">Medium</BaseSelectItem>
            <BaseSelectItem value="high">High</BaseSelectItem>
            <BaseSelectItem value="critical">Critical</BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>

        <TairoFormGroup label="Country">
          <TairoInput v-model="filters.country" placeholder="Filter by country..." size="lg" />
        </TairoFormGroup>
      </div>
    </BaseCard>

    <!-- Table -->
    <BaseCard class="p-6">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Name</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Status</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Documents</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Nationality</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Submitted</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Verified</BaseText></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading" v-for="i in 5" :key="i"><td colspan="6" class="px-4 py-4"><div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" /></td></tr>
            <tr v-else-if="kycList.length === 0"><td colspan="6" class="px-4 py-12 text-center"><BaseText size="sm" class="text-muted-500">No KYC records found</BaseText></td></tr>
            <tr v-else v-for="kyc in kycList.slice(0, 10)" :key="kyc.id" class="border-b border-muted-100 dark:border-muted-900">
              <td class="px-4 py-3"><BaseText size="sm" weight="medium">{{ kyc.firstName }} {{ kyc.lastName }}</BaseText></td>
              <td class="px-4 py-3"><GatewayStatusBadge :status="getStatusBadge(kyc.status)" size="xs" /></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ kyc.documents?.length || 0 }} documents</BaseText></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ kyc.nationality || 'N/A' }}</BaseText></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ kyc.verifiedAt ? new Date(kyc.verifiedAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <BaseAlert v-if="error" color="danger" variant="pastel" class="rounded-2xl">
      <template #title>Failed to load KYC list</template>
      <BaseParagraph size="sm">{{ error }}</BaseParagraph>
    </BaseAlert>
  </div>
</template>

