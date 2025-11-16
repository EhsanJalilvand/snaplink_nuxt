<script setup lang="ts">
import type { PaymentGatewayStatus } from '~/types/payment-gateway'

interface Props {
  status: PaymentGatewayStatus
  size?: 'xs' | 'sm' | 'md'
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  showIcon: true,
})

const statusConfig = {
  draft: {
    label: 'Draft',
    icon: 'solar:document-bold-duotone',
    color: 'muted' as const,
  },
  pending: {
    label: 'Pending Review',
    icon: 'solar:clock-circle-bold-duotone',
    color: 'info' as const,
  },
  approved: {
    label: 'Approved',
    icon: 'solar:check-circle-bold-duotone',
    color: 'success' as const,
  },
  active: {
    label: 'Active',
    icon: 'solar:play-circle-bold-duotone',
    color: 'success' as const,
  },
  suspended: {
    label: 'Suspended',
    icon: 'solar:pause-circle-bold-duotone',
    color: 'warning' as const,
  },
  rejected: {
    label: 'Rejected',
    icon: 'solar:close-circle-bold-duotone',
    color: 'danger' as const,
  },
} as const

const config = computed(() => statusConfig[props.status])
</script>

<template>
  <BaseChip
    :size="size"
    :color="config.color"
    variant="pastel"
    class="inline-flex items-center gap-1.5"
  >
    <Icon
      v-if="showIcon"
      :name="config.icon"
      class="size-3.5"
    />
    {{ config.label }}
  </BaseChip>
</template>

