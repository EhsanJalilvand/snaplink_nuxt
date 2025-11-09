<script setup lang="ts">
const emit = defineEmits<{
  'create-link': []
  'open-gateway': []
  'open-payouts': []
}>()

const actions = [
  {
    id: 'create-link',
    label: 'Create Payment Link',
    description: 'Spin up a secure, branded payment page in seconds.',
    icon: 'solar:add-square-bold-duotone',
    color: 'primary',
    emit: 'create-link',
  },
  {
    id: 'gateway',
    label: 'Configure Gateway',
    description: 'Connect processors, manage routing rules and failover.',
    icon: 'solar:settings-bold-duotone',
    color: 'info',
    emit: 'open-gateway',
  },
  {
    id: 'payouts',
    label: 'Schedule Payout',
    description: 'Release funds to your merchant wallets instantly.',
    icon: 'solar:wallet-money-bold-duotone',
    color: 'success',
    emit: 'open-payouts',
  },
]
</script>

<template>
  <BaseCard class="p-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-900 dark:text-white"
        >
          Quick Actions
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Accelerate your financial operations with curated shortcuts.
        </BaseParagraph>
      </div>
      <BaseButton
        variant="outline"
        color="primary"
        size="sm"
        to="/dashboard/payment/links"
      >
        View all payment links
      </BaseButton>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <button
        v-for="action in actions"
        :key="action.id"
        type="button"
        class="group flex flex-col gap-3 rounded-2xl border border-muted-200 bg-muted-50/80 p-5 text-left transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-white dark:border-muted-700/60 dark:bg-muted-900/40 dark:hover:border-primary-700/40"
        @click="emit(action.emit as 'create-link' | 'open-gateway' | 'open-payouts')"
      >
        <div :class="[
          'flex size-12 items-center justify-center rounded-xl transition group-hover:scale-105',
          action.color === 'primary' && 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300',
          action.color === 'info' && 'bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-300',
          action.color === 'success' && 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-300',
        ]">
          <Icon :name="action.icon" class="size-6" />
        </div>
        <div>
          <BaseHeading
            as="h4"
            size="sm"
            weight="semibold"
            class="text-muted-900 transition group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-300"
          >
            {{ action.label }}
          </BaseHeading>
          <BaseParagraph size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
            {{ action.description }}
          </BaseParagraph>
        </div>
      </button>
    </div>
  </BaseCard>
</template>

