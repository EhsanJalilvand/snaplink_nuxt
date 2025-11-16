<script setup lang="ts">
import { ref, watch } from '#imports'
import { usePaymentCompliance } from '~/composables/usePaymentCompliance'
import RiskIndicator from '~/components/payment/RiskIndicator.vue'
import type { ComplianceFilters } from '~/types/payment-compliance'

definePageMeta({
  title: 'Risk Score',
  layout: 'dashboard',
})

const { isLoading, error, fetchRiskScores } = usePaymentCompliance()

const riskScores = ref<any[]>([])
const filters = ref<ComplianceFilters>({
  status: 'all',
  riskLevel: 'all',
})

const loadRiskScores = async () => {
  riskScores.value = await fetchRiskScores(filters.value)
}

// Always fetch on mount to ensure API call is made
onMounted(async () => {
  if (import.meta.dev) {
    // eslint-disable-next-line no-console
    console.warn('[compliance/risk-score.vue] onMounted - calling loadRiskScores()')
  }
  await loadRiskScores()
})

watch(() => filters.value, () => {
  loadRiskScores()
}, { deep: true })

const averageRiskScore = computed(() => {
  if (!riskScores.value.length) return 0
  const sum = riskScores.value.reduce((acc, item) => acc + (item.score || 0), 0)
  return Math.round(sum / riskScores.value.length)
})

const highRiskCount = computed(() => {
  return riskScores.value.filter(item => item.level === 'high' || item.level === 'critical').length
})
</script>

<template>
  <div class="space-y-6 py-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading as="h1" size="2xl" weight="bold" class="text-muted-900 dark:text-white">
          Risk Score Dashboard
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          Monitor risk scores and compliance risk levels
        </BaseParagraph>
      </div>
    </div>

    <!-- Stats Cards -->
    <div
      v-if="!isLoading"
      class="grid grid-cols-1 gap-4 md:grid-cols-3"
    >
      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Average Risk Score
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ averageRiskScore }}/100
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
            <Icon
              name="solar:chart-bold-duotone"
              class="size-6 text-primary-500"
            />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              High Risk Count
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-danger-600 dark:text-danger-400"
            >
              {{ highRiskCount }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-danger-50 dark:bg-danger-900/20">
            <Icon
              name="solar:danger-triangle-bold-duotone"
              class="size-6 text-danger-500"
            />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Total Entities
            </BaseText>
            <BaseHeading
              as="h3"
              size="xl"
              weight="bold"
              class="mt-1 text-muted-900 dark:text-white"
            >
              {{ riskScores.length }}
            </BaseHeading>
          </div>
          <div class="flex size-12 items-center justify-center rounded-full bg-info-50 dark:bg-info-900/20">
            <Icon
              name="solar:users-group-rounded-bold-duotone"
              class="size-6 text-info-500"
            />
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Filters -->
    <BaseCard class="p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TairoFormGroup label="Risk Level">
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

    <!-- Table -->
    <BaseCard class="p-6">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Entity</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Risk Score</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Risk Level</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Factors</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Calculated At</BaseText></th>
              <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Reviewed By</BaseText></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading" v-for="i in 5" :key="i"><td colspan="6" class="px-4 py-4"><div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" /></td></tr>
            <tr v-else-if="riskScores.length === 0"><td colspan="6" class="px-4 py-12 text-center"><BaseText size="sm" class="text-muted-500">No risk scores found</BaseText></td></tr>
            <tr v-else v-for="risk in riskScores.slice(0, 10)" :key="risk.id" class="border-b border-muted-100 dark:border-muted-900">
              <td class="px-4 py-3"><BaseText size="sm" weight="medium">{{ risk.entityId || risk.id }}</BaseText></td>
              <td class="px-4 py-3">
                <RiskIndicator
                  :level="risk.level || 'low'"
                  :score="risk.score || 0"
                  :show-label="false"
                  :show-score="true"
                  size="sm"
                />
              </td>
              <td class="px-4 py-3">
                <BaseChip
                  size="xs"
                  :color="risk.level === 'low' ? 'success' : risk.level === 'medium' ? 'warning' : 'danger'"
                  variant="pastel"
                >
                  {{ risk.level }}
                </BaseChip>
              </td>
              <td class="px-4 py-3"><BaseText size="sm">{{ risk.factors?.length || 0 }} factors</BaseText></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ risk.calculatedAt ? new Date(risk.calculatedAt).toLocaleDateString() : 'N/A' }}</BaseText></td>
              <td class="px-4 py-3"><BaseText size="sm">{{ risk.reviewedBy || 'N/A' }}</BaseText></td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <BaseAlert v-if="error" color="danger" variant="pastel" class="rounded-2xl">
      <template #title>Failed to load risk scores</template>
      <BaseParagraph size="sm">{{ error }}</BaseParagraph>
    </BaseAlert>
  </div>
</template>

