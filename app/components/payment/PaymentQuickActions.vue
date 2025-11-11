<script setup lang="ts">
import { computed } from '#imports'
import type { PaymentQuickActionItem } from '~/types/payments'

const emit = defineEmits<{
  'create-link': []
  'open-gateway': []
  'open-payouts': []
}>()

interface PaymentQuickActionsProps {
  actions?: PaymentQuickActionItem[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<PaymentQuickActionsProps>(), {
  actions: () => [],
  isLoading: false,
})

const mappedActions = computed(() =>
  props.actions.map((action) => ({
    ...action,
    emit: ((): 'create-link' | 'open-gateway' | 'open-payouts' => {
      switch (action.id) {
        case 'open-gateway':
          return 'open-gateway'
        case 'open-payouts':
          return 'open-payouts'
        default:
          return 'create-link'
      }
    })(),
  })),
)

const accentClass = (accent?: PaymentQuickActionItem['accent']) => {
  switch (accent) {
    case 'info':
      return 'bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-300'
    case 'success':
      return 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-300'
    case 'warning':
      return 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-300'
    default:
      return 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
  }
}
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
        v-for="action in mappedActions"
        :key="action.id"
        type="button"
        class="group flex flex-col gap-3 rounded-2xl border border-muted-200 bg-muted-50/80 p-5 text-left transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-white dark:border-muted-700/60 dark:bg-muted-900/40 dark:hover:border-primary-700/40"
        @click="emit(action.emit as 'create-link' | 'open-gateway' | 'open-payouts')"
      >
        <div :class="[
          'flex size-12 items-center justify-center rounded-xl transition group-hover:scale-105',
          accentClass(action.accent),
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
            <span v-if="isLoading" class="block h-5 w-32 animate-pulse rounded bg-muted-200/80 dark:bg-muted-800/60" />
            <template v-else>
              {{ action.label }}
            </template>
          </BaseHeading>
          <BaseParagraph size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
            <span v-if="isLoading" class="block h-4 w-full animate-pulse rounded bg-muted-200/60 dark:bg-muted-800/40" />
            <template v-else>
              {{ action.description }}
            </template>
          </BaseParagraph>
        </div>
      </button>
    </div>
  </BaseCard>
</template>

