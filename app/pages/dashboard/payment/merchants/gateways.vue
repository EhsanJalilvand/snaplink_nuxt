<script setup lang="ts">
import { callOnce, ref, watch } from '#imports'
import { usePaymentGatewaysList } from '~/composables/usePaymentGatewaysList'
import { usePaymentGatewayApproval } from '~/composables/usePaymentGatewayApproval'
import GatewayStatusBadge from '~/components/payment/GatewayStatusBadge.vue'
import type { GatewayFilters } from '~/types/payment-gateway'

definePageMeta({
  title: 'Payment Gateways',
  layout: 'dashboard',
})

const router = useRouter()
const { gateways, isLoading, error, fetchGateways } = usePaymentGatewaysList()

const filters = ref<GatewayFilters>({
  search: '',
  status: 'all',
  mode: 'all',
})

const loadGateways = async () => {
  await fetchGateways(filters.value)
}

callOnce(() => loadGateways())

watch(() => filters.value, () => {
  loadGateways()
}, { deep: true })

const handleEdit = (gatewayId: string) => {
  router.push(`/dashboard/payment/gateways/${gatewayId}`)
}

const handleView = (gatewayId: string) => {
  router.push(`/dashboard/payment/gateways/${gatewayId}`)
}
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
          Payment Gateways
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          Manage your payment gateway accounts
        </BaseParagraph>
      </div>
      <BaseButton
        variant="primary"
        to="/dashboard/payment/gateways/create"
      >
        <Icon name="solar:add-circle-bold-duotone" class="size-4" />
        Create Gateway
      </BaseButton>
    </div>

    <!-- Filters -->
    <BaseCard class="p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
        <TairoFormGroup label="Search">
          <TairoInput
            v-model="filters.search"
            placeholder="Search by name..."
            icon="solar:magnifier-bold-duotone"
            size="lg"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Status">
          <TairoSelect
            v-model="filters.status"
            size="lg"
          >
            <BaseSelectItem value="all">
              All Status
            </BaseSelectItem>
            <BaseSelectItem value="draft">
              Draft
            </BaseSelectItem>
            <BaseSelectItem value="pending">
              Pending
            </BaseSelectItem>
            <BaseSelectItem value="approved">
              Approved
            </BaseSelectItem>
            <BaseSelectItem value="active">
              Active
            </BaseSelectItem>
            <BaseSelectItem value="suspended">
              Suspended
            </BaseSelectItem>
            <BaseSelectItem value="rejected">
              Rejected
            </BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>

        <TairoFormGroup label="Mode">
          <TairoSelect
            v-model="filters.mode"
            size="lg"
          >
            <BaseSelectItem value="all">
              All Modes
            </BaseSelectItem>
            <BaseSelectItem value="sandbox">
              Sandbox
            </BaseSelectItem>
            <BaseSelectItem value="live">
              Live
            </BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>

        <TairoFormGroup label="Country">
          <TairoInput
            v-model="filters.country"
            placeholder="Filter by country..."
            size="lg"
          />
        </TairoFormGroup>
      </div>
    </BaseCard>

    <!-- Table -->
    <BaseCard class="p-6">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Name
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Status
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Mode
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Business Name
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Country
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Compliance
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Created
                </BaseText>
              </th>
              <th class="px-4 py-3 text-right">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Actions
                </BaseText>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-if="isLoading"
              v-for="i in 5"
              :key="i"
              class="border-b border-muted-100 dark:border-muted-900"
            >
              <td colspan="8" class="px-4 py-4">
                <div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" />
              </td>
            </tr>
            <tr
              v-else-if="gateways.length === 0"
              class="border-b border-muted-100 dark:border-muted-900"
            >
              <td colspan="8" class="px-4 py-12 text-center">
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  No gateways found
                </BaseText>
              </td>
            </tr>
            <tr
              v-else
              v-for="gateway in gateways.slice(0, 10)"
              :key="gateway.id"
              class="border-b border-muted-100 dark:border-muted-900"
            >
              <td class="px-4 py-3">
                <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                  {{ gateway.name }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <GatewayStatusBadge :status="gateway.status" size="xs" />
              </td>
              <td class="px-4 py-3">
                <BaseChip
                  size="xs"
                  :color="gateway.mode === 'live' ? 'success' : 'warning'"
                  variant="pastel"
                >
                  {{ gateway.mode }}
                </BaseChip>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-700 dark:text-muted-300">
                  {{ gateway.businessInfo?.displayName || 'N/A' }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-700 dark:text-muted-300">
                  {{ gateway.businessInfo?.country || 'N/A' }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseChip
                  size="xs"
                  :color="gateway.compliance?.overallStatus === 'approved' ? 'success' : gateway.compliance?.overallStatus === 'rejected' ? 'danger' : 'warning'"
                  variant="pastel"
                >
                  {{ gateway.compliance?.overallStatus || 'incomplete' }}
                </BaseChip>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  {{ gateway.createdAt ? new Date(gateway.createdAt).toLocaleDateString() : 'N/A' }}
                </BaseText>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <BaseButton
                    size="sm"
                    variant="ghost"
                    @click="handleView(gateway.id)"
                  >
                    <Icon name="solar:eye-bold-duotone" class="size-4" />
                    View
                  </BaseButton>
                  <BaseButton
                    v-if="gateway.status === 'approved' || gateway.status === 'draft'"
                    size="sm"
                    variant="ghost"
                    @click="handleEdit(gateway.id)"
                  >
                    <Icon name="solar:edit-bold-duotone" class="size-4" />
                    Edit
                  </BaseButton>
                </div>
              </td>
            </tr>
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
        Failed to load gateways
      </template>
      <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
        {{ error }}
      </BaseParagraph>
    </BaseAlert>
  </div>
</template>

