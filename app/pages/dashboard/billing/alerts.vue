<script setup lang="ts">
definePageMeta({
  title: 'Alerts & Limits',
  layout: 'dashboard',
})

const toaster = useNuiToasts()

// Alert settings
const settings = ref({
  lowBalanceAlert: {
    enabled: true,
    threshold: 50,
    email: true,
    webhook: false,
  },
  spendingLimit: {
    enabled: false,
    monthlyLimit: 500,
  },
  billingAlerts: {
    email: true,
    webhook: false,
  },
})

const isSaving = ref(false)

const handleSave = async () => {
  isSaving.value = true
  try {
    // TODO: API call to save settings
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toaster.add({
      title: 'Success',
      description: 'Alert settings saved successfully!',
      icon: 'ph:check',
      progress: true,
    })
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to save settings',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 py-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Alerts & Limits
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Configure billing alerts and spending limits
        </BaseParagraph>
      </div>
      <BaseButton
        variant="primary"
        :loading="isSaving"
        :disabled="isSaving"
        @click="handleSave"
      >
        <Icon name="ph:check" class="size-4" />
        <span>Save Changes</span>
      </BaseButton>
    </div>

    <!-- Low Balance Notification -->
    <BaseCard class="p-6">
      <div class="mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Low Balance Notification
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Get notified when your account balance falls below a certain threshold
        </BaseParagraph>
      </div>

      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
              Enable Low Balance Alert
            </BaseText>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              Receive notifications when balance is low
            </BaseParagraph>
          </div>
          <BaseSwitchBall
            v-model="settings.lowBalanceAlert.enabled"
            variant="primary"
          />
        </div>

        <div v-if="settings.lowBalanceAlert.enabled" class="space-y-4">
          <TairoFormGroup
            label="Alert Threshold"
            sublabel="Balance amount to trigger the alert"
          >
            <div class="flex items-center gap-2">
              <span class="text-muted-500 dark:text-muted-400">$</span>
              <TairoInput
                v-model="settings.lowBalanceAlert.threshold"
                type="number"
                placeholder="50"
                icon="solar:dollar-linear"
                rounded="lg"
                class="flex-1"
              />
            </div>
          </TairoFormGroup>

          <div class="space-y-3">
            <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
              Notification Methods
            </BaseText>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon name="solar:letter-linear" class="size-4 text-muted-400" />
                <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                  Email
                </BaseText>
              </div>
              <BaseSwitchBall
                v-model="settings.lowBalanceAlert.email"
                variant="primary"
              />
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon name="solar:webhook-linear" class="size-4 text-muted-400" />
                <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                  Webhook
                </BaseText>
              </div>
              <BaseSwitchBall
                v-model="settings.lowBalanceAlert.webhook"
                variant="primary"
              />
            </div>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Spending Limit Settings -->
    <BaseCard class="p-6">
      <div class="mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Spending Limit
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Set a monthly spending limit to control your costs
        </BaseParagraph>
      </div>

      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
              Enable Spending Limit
            </BaseText>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              Automatically suspend services when limit is reached
            </BaseParagraph>
          </div>
          <BaseSwitchBall
            v-model="settings.spendingLimit.enabled"
            variant="primary"
          />
        </div>

        <div v-if="settings.spendingLimit.enabled">
          <TairoFormGroup
            label="Monthly Limit"
            sublabel="Maximum amount to spend per month"
          >
            <div class="flex items-center gap-2">
              <span class="text-muted-500 dark:text-muted-400">$</span>
              <TairoInput
                v-model="settings.spendingLimit.monthlyLimit"
                type="number"
                placeholder="500"
                icon="solar:dollar-linear"
                rounded="lg"
                class="flex-1"
              />
            </div>
          </TairoFormGroup>
        </div>
      </div>
    </BaseCard>

    <!-- Billing Alerts -->
    <BaseCard class="p-6">
      <div class="mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Billing Alerts
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Receive notifications for billing events
        </BaseParagraph>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
              Email Notifications
            </BaseText>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              Receive billing alerts via email
            </BaseParagraph>
          </div>
          <BaseSwitchBall
            v-model="settings.billingAlerts.email"
            variant="primary"
          />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
              Webhook Notifications
            </BaseText>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              Send billing events to webhook URL
            </BaseParagraph>
          </div>
          <BaseSwitchBall
            v-model="settings.billingAlerts.webhook"
            variant="primary"
          />
        </div>
      </div>
    </BaseCard>
  </div>
</template>

