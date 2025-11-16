<script setup lang="ts">
import { callOnce, ref, watch } from '#imports'
import type { IPWhitelist } from '~/types/payment-gateway'

definePageMeta({
  title: 'IP Whitelist',
  layout: 'dashboard',
})

const ipWhitelist = ref<IPWhitelist[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const showAddModal = ref(false)

const newIP = ref({
  ipAddress: '',
  description: '',
})

const loadIPWhitelist = async () => {
  isLoading.value = true
  error.value = null
  
  // Mock data for now
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
  
  isLoading.value = false
}

callOnce(() => loadIPWhitelist())

const filteredIPs = computed(() => {
  if (!search.value) return ipWhitelist.value
  return ipWhitelist.value.filter(ip => 
    ip.ipAddress.includes(search.value) || 
    ip.description?.toLowerCase().includes(search.value.toLowerCase())
  )
})

const handleAdd = () => {
  if (!newIP.value.ipAddress.trim()) return
  
  const newEntry: IPWhitelist = {
    id: Math.random().toString(36).substring(7),
    ipAddress: newIP.value.ipAddress,
    description: newIP.value.description,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: 'current-user',
  }
  
  ipWhitelist.value = [...ipWhitelist.value, newEntry]
  newIP.value = { ipAddress: '', description: '' }
  showAddModal.value = false
}

const handleToggle = (id: string) => {
  const ip = ipWhitelist.value.find(item => item.id === id)
  if (ip) {
    ip.isActive = !ip.isActive
  }
}

const handleDelete = (id: string) => {
  ipWhitelist.value = ipWhitelist.value.filter(item => item.id !== id)
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
          IP Whitelist
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          Manage IP addresses allowed to access your gateway APIs
        </BaseParagraph>
      </div>
      <BaseButton
        variant="primary"
        @click="showAddModal = true"
      >
        <Icon name="solar:add-circle-bold-duotone" class="size-4" />
        Add IP Address
      </BaseButton>
    </div>

    <!-- Search -->
    <BaseCard class="p-6">
      <TairoFormGroup label="Search">
        <TairoInput
          v-model="search"
          placeholder="Search by IP address or description..."
          icon="solar:magnifier-bold-duotone"
          size="lg"
        />
      </TairoFormGroup>
    </BaseCard>

    <!-- Table -->
    <BaseCard class="p-6">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-muted-200 dark:border-muted-800">
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  IP Address
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Description
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Status
                </BaseText>
              </th>
              <th class="px-4 py-3 text-left">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Created At
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
              v-for="i in 3"
              :key="i"
              class="border-b border-muted-100 dark:border-muted-900"
            >
              <td colspan="5" class="px-4 py-4">
                <div class="h-8 animate-pulse rounded bg-muted-200 dark:bg-muted-800" />
              </td>
            </tr>
            <tr
              v-else-if="filteredIPs.length === 0"
              class="border-b border-muted-100 dark:border-muted-900"
            >
              <td colspan="5" class="px-4 py-12 text-center">
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  No IP addresses found
                </BaseText>
              </td>
            </tr>
            <tr
              v-else
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
                <BaseText size="sm" class="text-muted-700 dark:text-muted-300">
                  {{ ip.description || 'No description' }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseSwitchBall
                  :model-value="ip.isActive"
                  variant="primary"
                  @update:model-value="handleToggle(ip.id)"
                />
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  {{ ip.createdAt ? new Date(ip.createdAt).toLocaleDateString() : 'N/A' }}
                </BaseText>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <BaseButton
                    size="sm"
                    variant="ghost"
                    color="danger"
                    @click="handleDelete(ip.id)"
                  >
                    <Icon name="solar:trash-bin-minimalistic-bold-duotone" class="size-4" />
                    Delete
                  </BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- Add IP Modal -->
    <DialogRoot v-model:open="showAddModal">
      <DialogPortal>
        <DialogOverlay class="bg-muted-900/70 fixed inset-0 z-50 backdrop-blur-sm" />
        <DialogContent class="fixed top-[4%] start-1/2 z-[100] flex max-h-[92vh] w-[92vw] max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-muted-200 bg-white shadow-2xl focus:outline-none dark:border-muted-700 dark:bg-muted-900">
          <div class="flex w-full flex-col">
            <div class="flex items-center justify-between border-b border-muted-200 px-6 py-5 dark:border-muted-800">
              <DialogTitle class="font-heading text-xl font-semibold text-muted-900 dark:text-white">
                Add IP Address
              </DialogTitle>
              <BaseButton
                size="sm"
                variant="ghost"
                icon
                class="rounded-full"
                @click="showAddModal = false"
              >
                <Icon name="lucide:x" class="size-4" />
              </BaseButton>
            </div>

            <div class="nui-slimscroll flex-1 overflow-y-auto px-6 py-5">
              <div class="space-y-4">
                <TairoFormGroup label="IP Address" required>
                  <TairoInput
                    v-model="newIP.ipAddress"
                    type="text"
                    placeholder="192.168.1.100"
                    icon="solar:global-bold-duotone"
                    size="lg"
                  />
                </TairoFormGroup>

                <TairoFormGroup label="Description" sublabel="Optional description for this IP address">
                  <textarea
                    v-model="newIP.description"
                    rows="3"
                    placeholder="e.g., Office Network, Development Server"
                    class="w-full rounded-lg border border-muted-200 bg-white px-4 py-3 text-sm text-muted-800 placeholder:text-muted-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-muted-700 dark:bg-muted-900 dark:text-muted-100 dark:placeholder:text-muted-500"
                  />
                </TairoFormGroup>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 border-t border-muted-200 px-6 py-4 dark:border-muted-800">
              <BaseButton
                variant="outline"
                @click="showAddModal = false"
              >
                Cancel
              </BaseButton>
              <BaseButton
                variant="primary"
                :disabled="!newIP.ipAddress.trim()"
                @click="handleAdd"
              >
                Add IP Address
              </BaseButton>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- Error State -->
    <BaseAlert
      v-if="error"
      color="danger"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Failed to load IP whitelist
      </template>
      <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
        {{ error }}
      </BaseParagraph>
    </BaseAlert>
  </div>
</template>

