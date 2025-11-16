<script setup lang="ts">
import { callOnce, ref, watch, computed } from '#imports'
import { usePaymentGatewaysList } from '~/composables/usePaymentGatewaysList'
import GatewayStatusBadge from '~/components/payment/GatewayStatusBadge.vue'
import type { GatewayFilters, IPWhitelist } from '~/types/payment-gateway'

definePageMeta({
  title: 'Gateways',
  layout: 'dashboard',
})

const router = useRouter()
const { gateways, isLoading, error, fetchGateways } = usePaymentGatewaysList()

const filters = ref<GatewayFilters>({
  search: '',
  status: 'all',
  mode: 'all',
})

const viewFilter = ref<'list' | 'create' | 'ip-whitelist'>('list')
const showCreateWizard = ref(false)

const ipWhitelist = ref<IPWhitelist[]>([])
const isLoadingIP = ref(false)
const searchIP = ref('')
const showAddIPModal = ref(false)

const newIP = ref({
  ipAddress: '',
  description: '',
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

const handleCreateClick = () => {
  router.push('/dashboard/payment/gateways/create')
}

const loadIPWhitelist = async () => {
  isLoadingIP.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  ipWhitelist.value = [
    {
      id: '1',
      ipAddress: '192.168.1.100',
      description: 'Office Network',
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: 'user-1',
    },
    {
      id: '2',
      ipAddress: '10.0.0.50',
      description: 'Development Server',
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: 'user-1',
    },
  ]
  isLoadingIP.value = false
}

const filteredIPs = computed(() => {
  if (!searchIP.value) return ipWhitelist.value
  return ipWhitelist.value.filter(ip =>
    ip.ipAddress.includes(searchIP.value) ||
    ip.description?.toLowerCase().includes(searchIP.value.toLowerCase())
  )
})

watch(() => viewFilter.value, (newVal) => {
  if (newVal === 'ip-whitelist') {
    loadIPWhitelist()
  }
})

const handleAddIP = () => {
  if (!newIP.value.ipAddress) return
  ipWhitelist.value.push({
    id: Date.now().toString(),
    ...newIP.value,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: 'user-1',
  })
  newIP.value = { ipAddress: '', description: '' }
  showAddIPModal.value = false
}

const handleDeleteIP = (id: string) => {
  ipWhitelist.value = ipWhitelist.value.filter(ip => ip.id !== id)
}

const handleToggleIP = (id: string) => {
  const ip = ipWhitelist.value.find(i => i.id === id)
  if (ip) {
    ip.isActive = !ip.isActive
  }
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
          Manage your payment gateway accounts and settings
        </BaseParagraph>
      </div>
      <BaseButton
        v-if="viewFilter === 'list'"
        variant="primary"
        @click="handleCreateClick"
      >
        <Icon name="solar:add-circle-bold-duotone" class="size-4" />
        Create Gateway
      </BaseButton>
    </div>

    <!-- View Selector -->
    <BaseCard class="p-6">
      <div class="flex items-center gap-2 rounded-lg border border-muted-200 bg-muted-50 p-1 dark:border-muted-800 dark:bg-muted-900/50">
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          :class="viewFilter === 'list' ? 'bg-primary-500 text-white shadow-sm' : 'text-muted-600 dark:text-muted-400 hover:text-muted-900 dark:hover:text-muted-200'"
          @click="viewFilter = 'list'"
        >
          Gateways ({{ gateways.length }})
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          :class="viewFilter === 'ip-whitelist' ? 'bg-primary-500 text-white shadow-sm' : 'text-muted-600 dark:text-muted-400 hover:text-muted-900 dark:hover:text-muted-200'"
          @click="viewFilter = 'ip-whitelist'"
        >
          IP Whitelist ({{ ipWhitelist.length }})
        </button>
      </div>
    </BaseCard>

    <!-- Gateways List View -->
    <div v-if="viewFilter === 'list'" class="space-y-6">
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
              <BaseSelectItem value="all">All Status</BaseSelectItem>
              <BaseSelectItem value="draft">Draft</BaseSelectItem>
              <BaseSelectItem value="pending">Pending</BaseSelectItem>
              <BaseSelectItem value="approved">Approved</BaseSelectItem>
              <BaseSelectItem value="active">Active</BaseSelectItem>
              <BaseSelectItem value="suspended">Suspended</BaseSelectItem>
              <BaseSelectItem value="rejected">Rejected</BaseSelectItem>
            </TairoSelect>
          </TairoFormGroup>

          <TairoFormGroup label="Mode">
            <TairoSelect
              v-model="filters.mode"
              size="lg"
            >
              <BaseSelectItem value="all">All Modes</BaseSelectItem>
              <BaseSelectItem value="sandbox">Sandbox</BaseSelectItem>
              <BaseSelectItem value="live">Live</BaseSelectItem>
            </TairoSelect>
          </TairoFormGroup>
        </div>
      </BaseCard>

      <!-- Gateways Table -->
      <BaseCard class="p-6">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-muted-200 dark:border-muted-800">
                <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Name</BaseText></th>
                <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Status</BaseText></th>
                <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Mode</BaseText></th>
                <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Country</BaseText></th>
                <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Created</BaseText></th>
                <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Actions</BaseText></th>
              </tr>
            </thead>
            <tbody>
              <template v-if="isLoading">
                <tr v-for="i in 5" :key="`loading-gateways-${i}`" class="border-b border-muted-100 dark:border-muted-900">
                  <td colspan="6" class="px-4 py-4"><div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" /></td>
                </tr>
              </template>
              <tr v-else-if="gateways.length === 0" key="empty-gateways" class="border-b border-muted-100 dark:border-muted-900">
                <td colspan="6" class="px-4 py-12 text-center">
                  <BaseText size="sm" class="text-muted-500 dark:text-muted-400">No gateways found</BaseText>
                  <BaseButton
                    class="mt-4"
                    variant="primary"
                    size="sm"
                    @click="handleCreateClick"
                  >
                    Create Your First Gateway
                  </BaseButton>
                </td>
              </tr>
              <template v-else>
                <tr
                  v-for="gateway in gateways"
                  :key="gateway.id"
                  class="border-b border-muted-100 dark:border-muted-900"
                >
                  <td class="px-4 py-3">
                    <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                      {{ gateway.displayName || gateway.legalName || 'Unnamed Gateway' }}
                    </BaseText>
                  </td>
                  <td class="px-4 py-3">
                    <GatewayStatusBadge :status="gateway.status" size="xs" />
                  </td>
                  <td class="px-4 py-3">
                    <BaseChip size="xs" :color="gateway.mode === 'live' ? 'success' : 'warning'" variant="pastel">
                      {{ gateway.mode }}
                    </BaseChip>
                  </td>
                  <td class="px-4 py-3">
                    <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                      {{ gateway.country || 'N/A' }}
                    </BaseText>
                  </td>
                  <td class="px-4 py-3">
                    <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                      {{ gateway.createdAt ? new Date(gateway.createdAt).toLocaleDateString() : 'N/A' }}
                    </BaseText>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <BaseButton
                        size="xs"
                        variant="ghost"
                        color="primary"
                        @click="handleView(gateway.id)"
                      >
                        View
                      </BaseButton>
                      <BaseButton
                        size="xs"
                        variant="ghost"
                        color="muted"
                        @click="handleEdit(gateway.id)"
                      >
                        Edit
                      </BaseButton>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>

    <!-- IP Whitelist View -->
    <div v-if="viewFilter === 'ip-whitelist'" class="space-y-6">
      <!-- Header Actions -->
      <BaseCard class="p-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <TairoFormGroup label="Search IPs" class="flex-1">
            <TairoInput
              v-model="searchIP"
              placeholder="Search by IP address or description..."
              icon="solar:magnifier-bold-duotone"
              size="lg"
            />
          </TairoFormGroup>
          <BaseButton
            variant="primary"
            @click="showAddIPModal = true"
          >
            <Icon name="solar:add-circle-bold-duotone" class="size-4" />
            Add IP Address
          </BaseButton>
        </div>
      </BaseCard>

      <!-- IP Whitelist Table -->
      <BaseCard class="p-6">
        <div class="mb-4">
          <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
            IP Whitelist
          </BaseHeading>
          <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
            Restrict gateway access to specific IP addresses
          </BaseParagraph>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-muted-200 dark:border-muted-800">
                <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">IP Address</BaseText></th>
                <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Description</BaseText></th>
                <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Status</BaseText></th>
                <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Created</BaseText></th>
                <th class="px-4 py-3 text-left"><BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">Actions</BaseText></th>
              </tr>
            </thead>
            <tbody>
              <template v-if="isLoadingIP">
                <tr v-for="i in 5" :key="`loading-ip-${i}`" class="border-b border-muted-100 dark:border-muted-900">
                  <td colspan="5" class="px-4 py-4"><div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" /></td>
                </tr>
              </template>
              <tr v-else-if="filteredIPs.length === 0" key="empty-ip" class="border-b border-muted-100 dark:border-muted-900">
                <td colspan="5" class="px-4 py-12 text-center">
                  <BaseText size="sm" class="text-muted-500 dark:text-muted-400">No IP addresses whitelisted</BaseText>
                  <BaseButton
                    class="mt-4"
                    variant="primary"
                    size="sm"
                    @click="showAddIPModal = true"
                  >
                    Add First IP Address
                  </BaseButton>
                </td>
              </tr>
              <template v-else>
                <tr
                  v-for="ip in filteredIPs"
                  :key="ip.id"
                  class="border-b border-muted-100 dark:border-muted-900"
                >
                  <td class="px-4 py-3">
                    <BaseText size="sm" weight="medium" class="font-mono text-muted-900 dark:text-white">
                      {{ ip.ipAddress }}
                    </BaseText>
                  </td>
                  <td class="px-4 py-3">
                    <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                      {{ ip.description || 'No description' }}
                    </BaseText>
                  </td>
                  <td class="px-4 py-3">
                    <BaseChip size="xs" :color="ip.isActive ? 'success' : 'muted'" variant="pastel">
                      {{ ip.isActive ? 'Active' : 'Inactive' }}
                    </BaseChip>
                  </td>
                  <td class="px-4 py-3">
                    <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                      {{ ip.createdAt ? new Date(ip.createdAt).toLocaleDateString() : 'N/A' }}
                    </BaseText>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <BaseButton
                        size="xs"
                        variant="ghost"
                        :color="ip.isActive ? 'muted' : 'success'"
                        @click="handleToggleIP(ip.id)"
                      >
                        {{ ip.isActive ? 'Disable' : 'Enable' }}
                      </BaseButton>
                      <BaseButton
                        size="xs"
                        variant="ghost"
                        color="danger"
                        @click="handleDeleteIP(ip.id)"
                      >
                        Delete
                      </BaseButton>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>

    <!-- Add IP Modal -->
    <TairoModal
      v-model="showAddIPModal"
      size="md"
    >
      <template #header>
        <div class="flex w-full items-center justify-between p-6 md:p-8">
          <h3 class="font-heading text-muted-800 text-lg font-semibold leading-6 dark:text-white">
            Add IP Address
          </h3>
          <BaseButtonClose @click="showAddIPModal = false" />
        </div>
      </template>

      <div class="p-6 md:p-8">
        <div class="space-y-4">
          <TairoFormGroup label="IP Address" required>
            <TairoInput
              v-model="newIP.ipAddress"
              placeholder="192.168.1.1"
              size="lg"
            />
          </TairoFormGroup>

          <TairoFormGroup label="Description">
            <TairoInput
              v-model="newIP.description"
              placeholder="Office Network, Development Server, etc."
              size="lg"
            />
          </TairoFormGroup>
        </div>
      </div>

      <template #footer>
        <div class="p-6 md:p-8">
          <div class="flex gap-x-2">
            <BaseButton
              color="muted"
              @click="showAddIPModal = false"
            >
              Cancel
            </BaseButton>
            <BaseButton
              color="primary"
              @click="handleAddIP"
            >
              Add IP Address
            </BaseButton>
          </div>
        </div>
      </template>
    </TairoModal>

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

