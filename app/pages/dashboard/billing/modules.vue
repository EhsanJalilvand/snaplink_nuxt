<script setup lang="ts">
import { callOnce, computed, ref } from '#imports'
import { useBillingUsage } from '~/composables/useBillingUsage'
import { useWorkspace } from '~/composables/useWorkspace'
import { useApi } from '~/composables/useApi'

definePageMeta({
  title: 'Modules',
  layout: 'dashboard',
})

const api = useApi()
const { currentWorkspaceId } = useWorkspace()
const billingUsage = useBillingUsage()
const usageModules = computed(() => billingUsage.usageModules.value)
const isLoading = computed(() => billingUsage.isLoading.value)
const error = computed(() => billingUsage.error.value)

const isSaving = ref<string | null>(null)

callOnce(() => billingUsage.fetchUsage())

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 2,
  }).format(amount)

const toggleModule = async (moduleKey: string, isActive: boolean) => {
  if (!currentWorkspaceId.value) return
  if (isSaving.value) return

  isSaving.value = moduleKey
  try {
    await api.put(`/workspaces/${currentWorkspaceId.value}/billing/modules/${moduleKey}`, {
      isActive,
    }, {
      base: 'gateway',
    })

    await billingUsage.fetchUsage()
  } finally {
    isSaving.value = null
  }
}
</script>

<template>
  <div class="space-y-6 py-6">
    <div class="space-y-2">
      <BaseHeading
        as="h1"
        size="2xl"
        weight="bold"
        class="text-muted-900 dark:text-muted-100"
      >
        Module Access
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
        Turn individual workspace modules on or off. Usage data is preserved even when a module is disabled.
      </BaseParagraph>
    </div>

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached module data
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
          {{ error }}
      </p>
    </BaseAlert>

    <BaseCard class="p-6">
      <div class="space-y-4">
        <div
          v-for="module in usageModules"
          :key="module.moduleKey"
          class="flex flex-col gap-3 rounded-2xl border border-muted-200/60 p-4 dark:border-muted-800/60"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <BaseAvatar
                :icon="module.icon"
                size="md"
                :class="{
                  'bg-muted-100 text-muted-600 dark:bg-muted-700 dark:text-muted-200': module.isActive !== false,
                  'bg-warning-100 text-warning-600 dark:bg-warning-900/40 dark:text-warning-400': module.isActive === false,
                }"
              />
              <div>
                <BaseHeading as="h3" size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                  {{ module.moduleName }}
                </BaseHeading>
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  {{ module.tags?.category ?? 'Usage & billing' }}
                </BaseText>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <BaseChip
                size="2xs"
                :color="module.isActive === false ? 'warning' : 'success'"
              >
                {{ module.isActive === false ? 'Disabled' : 'Enabled' }}
              </BaseChip>
              <TairoSwitch
                :model-value="module.isActive !== false"
                :disabled="isSaving === module.moduleKey || isLoading"
                @update:model-value="toggleModule(module.moduleKey, $event)"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-3 text-sm text-muted-600 dark:text-muted-400">
            <div>
              Customer spend:
              <span class="font-medium text-muted-900 dark:text-muted-100">
                {{ formatCurrency(module.cost.customerTotal, module.cost.currency) }}
              </span>
            </div>
            <div>
              Vendor cost:
              <span class="font-medium text-muted-900 dark:text-muted-100">
                {{ formatCurrency(module.cost.vendorTotal, module.cost.currency) }}
              </span>
            </div>
            <div>
              Active metrics: <span class="font-medium">{{ module.metrics.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

