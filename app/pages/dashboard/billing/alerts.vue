<script setup lang="ts">
import { callOnce } from '#imports'
import { useBillingAlerts } from '~/composables/useBillingAlerts'

definePageMeta({
  title: 'Alerts & Limits',
  layout: 'dashboard',
})

const {
  settings,
  isLoading,
  isSaving,
  error,
  fetchAlerts,
  updateLowBalance,
  updateSpendingLimit,
  updateBillingAlerts,
  saveSettings,
} = useBillingAlerts()

callOnce(() => fetchAlerts())

const handleLowBalanceChange = (value: typeof settings.value.lowBalanceAlert) => {
  updateLowBalance(value)
}

const handleSpendingLimitChange = (value: typeof settings.value.spendingLimit) => {
  updateSpendingLimit(value)
}

const handleNotificationChange = (value: typeof settings.value.billingAlerts) => {
  updateBillingAlerts(value)
}
</script>

<template>
  <div class="space-y-6 py-6">
    <BillingAlertsHeader
      :is-saving="isSaving"
      @save="saveSettings"
    />

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached alert preferences
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

    <BillingLowBalanceCard
      :model-value="settings.lowBalanceAlert"
      :disabled="isLoading || isSaving"
      @update:model-value="handleLowBalanceChange"
    />

    <BillingSpendingLimitCard
      :model-value="settings.spendingLimit"
      :disabled="isLoading || isSaving"
      @update:model-value="handleSpendingLimitChange"
    />

    <BillingNotificationCard
      :model-value="settings.billingAlerts"
      :disabled="isLoading || isSaving"
      @update:model-value="handleNotificationChange"
    />
  </div>
</template>

