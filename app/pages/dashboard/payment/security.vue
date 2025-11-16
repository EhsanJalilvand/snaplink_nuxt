<script setup lang="ts">
import { callOnce, ref, watch, computed } from '#imports'
import { usePaymentCompliance } from '~/composables/usePaymentCompliance'
import GatewayStatusBadge from '~/components/payment/GatewayStatusBadge.vue'
import RiskIndicator from '~/components/payment/RiskIndicator.vue'
import type { ComplianceFilters } from '~/types/payment-compliance'

definePageMeta({
  title: 'Security & Compliance',
  layout: 'dashboard',
})

const { isLoading, error, fetchKYCList, fetchKYBList, fetchAML, fetchRiskScores } = usePaymentCompliance()

const kycList = ref<any[]>([])
const kybList = ref<any[]>([])
const amlList = ref<any[]>([])
const riskScores = ref<any[]>([])

const filters = ref<ComplianceFilters>({
  status: 'all',
  riskLevel: 'all',
})

const typeFilter = ref<'kyc' | 'kyb' | 'aml' | 'risk'>('kyc')

const loadAll = async () => {
  await Promise.all([
    fetchKYCList(filters.value).then(r => kycList.value = r),
    fetchKYBList(filters.value).then(r => kybList.value = r),
    fetchAML(filters.value).then(r => amlList.value = r),
    fetchRiskScores(filters.value).then(r => riskScores.value = r),
  ])
}

callOnce(() => loadAll())

watch(() => filters.value, () => {
  loadAll()
}, { deep: true })

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, 'pending' | 'approved' | 'rejected'> = {
    verified: 'approved',
    rejected: 'rejected',
    pending_review: 'pending',
  }
  return statusMap[status] || 'pending'
}

const averageRiskScore = computed(() => {
  if (!riskScores.value.length) return 0
  const sum = riskScores.value.reduce((acc, item) => acc + (item.score || 0), 0)
  return Math.round(sum / riskScores.value.length)
})

const highRiskCount = computed(() => {
  return riskScores.value.filter(item => item.level === 'high' || item.level === 'critical').length
})

const flaggedAMLCount = computed(() => {
  return amlList.value.filter(item => item.status === 'flagged').length
})
</script>

<template>
  <div class="space-y-6 py-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-white"
        >
          Security & Compliance
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          Monitor KYC, KYB, AML checks and risk scores
        </BaseParagraph>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              KYC Verified
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ kycList.filter(k => k.status === 'verified').length }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/20">
            <Icon name="solar:user-id-bold-duotone" class="size-6 text-success-500" />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              KYB Verified
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ kybList.filter(k => k.status === 'verified').length }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
            <Icon name="solar:buildings-bold-duotone" class="size-6 text-primary-500" />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              AML Flagged
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ flaggedAMLCount }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-danger-50 dark:bg-danger-900/20">
            <Icon name="solar:shield-warning-bold-duotone" class="size-6 text-danger-500" />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Avg Risk Score
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ averageRiskScore }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-900/20">
            <Icon name="solar:chart-2-bold-duotone" class="size-6 text-warning-500" />
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Type Selector -->
    <BaseCard class="p-6">
      <div class="flex items-center gap-2 rounded-lg border border-muted-200 bg-muted-50 p-1 dark:border-muted-800 dark:bg-muted-900/50">
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          :class="typeFilter === 'kyc' ? 'bg-primary-500 text-white shadow-sm' : 'text-muted-600 dark:text-muted-400 hover:text-muted-900 dark:hover:text-muted-200'"
          @click="typeFilter = 'kyc'"
        >
          KYC ({{ kycList.length }})
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          :class="typeFilter === 'kyb' ? 'bg-primary-500 text-white shadow-sm' : 'text-muted-600 dark:text-muted-400 hover:text-muted-900 dark:hover:text-muted-200'"
          @click="typeFilter = 'kyb'"
        >
          KYB ({{ kybList.length }})
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          :class="typeFilter === 'aml' ? 'bg-primary-500 text-white shadow-sm' : 'text-muted-600 dark:text-muted-400 hover:text-muted-900 dark:hover:text-muted-200'"
          @click="typeFilter = 'aml'"
        >
          AML ({{ amlList.length }})
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          :class="typeFilter === 'risk' ? 'bg-primary-500 text-white shadow-sm' : 'text-muted-600 dark:text-muted-400 hover:text-muted-900 dark:hover:text-muted-200'"
          @click="typeFilter = 'risk'"
        >
          Risk Score ({{ riskScores.length }})
        </button>
      </div>
    </BaseCard>

    <!-- Filters -->
    <BaseCard class="p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
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

        <TairoFormGroup label="Risk Level" v-if="typeFilter === 'kyc' || typeFilter === 'kyb' || typeFilter === 'risk'">
          <TairoSelect v-model="filters.riskLevel" size="lg">
            <BaseSelectItem value="all">All Levels</BaseSelectItem>
            <BaseSelectItem value="low">Low</BaseSelectItem>
            <BaseSelectItem value="medium">Medium</BaseSelectItem>
            <BaseSelectItem value="high">High</BaseSelectItem>
            <BaseSelectItem value="critical">Critical</BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>
      </div>
    </BaseCard>

    <!-- KYC Table -->
    <BaseCard v-if="typeFilter === 'kyc'" class="p-6">
      <div class="mb-4">
        <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
          KYC Verification
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
          Know Your Customer verification status
        </BaseParagraph>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Name</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Status</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Risk</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Documents</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Submitted</BaseText></th>
            </tr>
          </thead>
          <tbody>
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="`loading-kyc-${i}`" class="border-b border-muted-100 dark:border-muted-900">
                <td colspan="5" class="px-4 py-4"><div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" /></td>
              </tr>
            </template>
            <tr v-else-if="kycList.length === 0" key="empty-kyc" class="border-b border-muted-100 dark:border-muted-900">
              <td colspan="5" class="px-4 py-12 text-center"><BaseText size="sm" class="text-muted-500">No KYC records found</BaseText></td>
            </tr>
            <template v-else>
              <tr v-for="kyc in kycList.slice(0, 20)" :key="kyc.id" class="border-b border-muted-100 dark:border-muted-900">
                <td class="px-4 py-3"><BaseText size="sm" weight="medium">{{ kyc.firstName }} {{ kyc.lastName }}</BaseText></td>
                <td class="px-4 py-3"><GatewayStatusBadge :status="getStatusBadge(kyc.status)" size="xs" /></td>
                <td class="px-4 py-3"><RiskIndicator :level="kyc.riskLevel || 'medium'" size="sm" /></td>
                <td class="px-4 py-3"><BaseText size="sm">{{ kyc.documents?.length || 0 }} documents</BaseText></td>
                <td class="px-4 py-3"><BaseText size="sm">{{ kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- KYB Table -->
    <BaseCard v-if="typeFilter === 'kyb'" class="p-6">
      <div class="mb-4">
        <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
          KYB Verification
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
          Know Your Business verification status
        </BaseParagraph>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Business Name</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Status</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Risk</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Country</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Submitted</BaseText></th>
            </tr>
          </thead>
          <tbody>
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="`loading-kyb-${i}`" class="border-b border-muted-100 dark:border-muted-900">
                <td colspan="5" class="px-4 py-4"><div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" /></td>
              </tr>
            </template>
            <tr v-else-if="kybList.length === 0" key="empty-kyb" class="border-b border-muted-100 dark:border-muted-900">
              <td colspan="5" class="px-4 py-12 text-center"><BaseText size="sm" class="text-muted-500">No KYB records found</BaseText></td>
            </tr>
            <template v-else>
              <tr v-for="kyb in kybList.slice(0, 20)" :key="kyb.id" class="border-b border-muted-100 dark:border-muted-900">
                <td class="px-4 py-3"><BaseText size="sm" weight="medium">{{ kyb.businessName || 'N/A' }}</BaseText></td>
                <td class="px-4 py-3"><GatewayStatusBadge :status="getStatusBadge(kyb.status)" size="xs" /></td>
                <td class="px-4 py-3"><RiskIndicator :level="kyb.riskLevel || 'medium'" size="sm" /></td>
                <td class="px-4 py-3"><BaseText size="sm">{{ kyb.country || 'N/A' }}</BaseText></td>
                <td class="px-4 py-3"><BaseText size="sm">{{ kyb.submittedAt ? new Date(kyb.submittedAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- AML Table -->
    <BaseCard v-if="typeFilter === 'aml'" class="p-6">
      <div class="mb-4">
        <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
          AML Checks
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
          Anti-Money Laundering compliance checks
        </BaseParagraph>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Transaction ID</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Status</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Risk Score</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Flags</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Checked</BaseText></th>
            </tr>
          </thead>
          <tbody>
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="`loading-aml-${i}`" class="border-b border-muted-100 dark:border-muted-900">
                <td colspan="5" class="px-4 py-4"><div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" /></td>
              </tr>
            </template>
            <tr v-else-if="amlList.length === 0" key="empty-aml" class="border-b border-muted-100 dark:border-muted-900">
              <td colspan="5" class="px-4 py-12 text-center"><BaseText size="sm" class="text-muted-500">No AML checks found</BaseText></td>
            </tr>
            <template v-else>
              <tr v-for="aml in amlList.slice(0, 20)" :key="aml.id" class="border-b border-muted-100 dark:border-muted-900">
                <td class="px-4 py-3"><BaseText size="sm" class="font-mono">{{ aml.transactionId?.substring(0, 12) }}...</BaseText></td>
                <td class="px-4 py-3"><BaseChip size="xs" :color="aml.status === 'passed' ? 'success' : aml.status === 'flagged' ? 'danger' : 'warning'" variant="pastel">{{ aml.status }}</BaseChip></td>
                <td class="px-4 py-3"><RiskIndicator :level="aml.riskLevel || 'medium'" :score="aml.riskScore" size="sm" /></td>
                <td class="px-4 py-3"><BaseChip size="xs" :color="aml.flagsCount > 0 ? 'danger' : 'success'" variant="pastel">{{ aml.flagsCount || 0 }} flags</BaseChip></td>
                <td class="px-4 py-3"><BaseText size="sm">{{ aml.checkedAt ? new Date(aml.checkedAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- Risk Score Table -->
    <BaseCard v-if="typeFilter === 'risk'" class="p-6">
      <div class="mb-4">
        <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
          Risk Scores
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
          Risk assessment scores and levels
        </BaseParagraph>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Gateway/Entity</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Risk Level</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Score</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Last Updated</BaseText></th>
            </tr>
          </thead>
          <tbody>
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="`loading-risk-${i}`" class="border-b border-muted-100 dark:border-muted-900">
                <td colspan="4" class="px-4 py-4"><div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" /></td>
              </tr>
            </template>
            <tr v-else-if="riskScores.length === 0" key="empty-risk" class="border-b border-muted-100 dark:border-muted-900">
              <td colspan="4" class="px-4 py-12 text-center"><BaseText size="sm" class="text-muted-500">No risk scores found</BaseText></td>
            </tr>
            <template v-else>
              <tr v-for="risk in riskScores.slice(0, 20)" :key="risk.id" class="border-b border-muted-100 dark:border-muted-900">
                <td class="px-4 py-3"><BaseText size="sm" weight="medium">{{ risk.gatewayId || risk.entityId || 'Unknown' }}</BaseText></td>
                <td class="px-4 py-3"><RiskIndicator :level="risk.level || 'medium'" size="sm" /></td>
                <td class="px-4 py-3"><BaseText size="sm" weight="semibold">{{ risk.score || 0 }}/100</BaseText></td>
                <td class="px-4 py-3"><BaseText size="sm">{{ risk.updatedAt ? new Date(risk.updatedAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- Error State -->
    <BaseAlert
      v-if="error"
      color="danger"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Failed to load compliance data
      </template>
      <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
        {{ error }}
      </BaseParagraph>
    </BaseAlert>
  </div>
</template>

