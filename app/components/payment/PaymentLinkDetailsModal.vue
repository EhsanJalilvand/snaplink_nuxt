<script setup lang="ts">
import type { PaymentLink } from '~/types/payment-links'
import GatewayStatusBadge from './GatewayStatusBadge.vue'
import { useQRCode } from '~/composables/useQRCode'

const { getQRCodeUrl } = useQRCode()

interface Props {
  link: PaymentLink | null
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  edit: [id: string]
  copy: [reference: string]
  toggle: [id: string]
  delete: [id: string]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const toaster = useNuiToasts()

const statusConfig = {
  active: {
    label: 'Active',
    color: 'success',
    icon: 'solar:play-circle-bold-duotone',
  },
  paused: {
    label: 'Paused',
    color: 'warning',
    icon: 'solar:pause-circle-bold-duotone',
  },
  completed: {
    label: 'Completed',
    color: 'muted',
    icon: 'solar:check-circle-bold-duotone',
  },
} as const

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USDC' ? 'USD' : currency,
  }).format(amount)
}

const copyReference = async () => {
  if (!props.link) return
  
  const fullUrl = `https://${props.link.reference}`
  if (import.meta.client && navigator.clipboard) {
    await navigator.clipboard.writeText(fullUrl)
    emit('copy', props.link.reference)
    toaster.add({
      title: 'Copied!',
      description: 'Payment link copied to clipboard',
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })
  }
}
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogPortal>
      <DialogOverlay class="bg-muted-900/70 fixed inset-0 z-50 backdrop-blur-sm" />
      <DialogContent
        class="fixed top-[4%] start-1/2 z-[100] flex max-h-[92vh] w-[92vw] max-w-4xl -translate-x-1/2 overflow-hidden rounded-2xl border border-muted-200 bg-white shadow-2xl focus:outline-none dark:border-muted-700 dark:bg-muted-900"
      >
        <div v-if="link" class="flex w-full flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-muted-200 px-6 py-5 dark:border-muted-800">
            <div class="flex-1">
              <DialogTitle class="font-heading text-xl font-semibold text-muted-900 dark:text-white">
                {{ link.name }}
              </DialogTitle>
              <DialogDescription class="mt-1 text-sm text-muted-500 dark:text-muted-400">
                Payment link details and statistics
              </DialogDescription>
            </div>
            <div class="flex items-center gap-2">
              <GatewayStatusBadge :status="link.status === 'active' ? 'active' : link.status === 'paused' ? 'suspended' : 'draft'" />
              <BaseButton
                size="sm"
                variant="ghost"
                icon
                class="rounded-full"
                @click="isOpen = false"
              >
                <Icon name="lucide:x" class="size-4" />
              </BaseButton>
            </div>
          </div>

          <!-- Content -->
          <div class="nui-slimscroll flex-1 overflow-y-auto px-6 py-5">
            <div class="space-y-6">
              <!-- Stats Grid -->
              <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
                <BaseCard class="p-4">
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    Amount
                  </BaseText>
                  <BaseHeading
                    as="h3"
                    size="lg"
                    weight="bold"
                    class="mt-1 text-muted-900 dark:text-white"
                  >
                    {{ formatCurrency(link.amount, link.currency) }}
                  </BaseHeading>
                  <BaseText size="xs" class="mt-1 text-muted-400">
                    {{ link.currency }}
                  </BaseText>
                </BaseCard>

                <BaseCard class="p-4">
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    Payments
                  </BaseText>
                  <BaseHeading
                    as="h3"
                    size="lg"
                    weight="bold"
                    class="mt-1 text-muted-900 dark:text-white"
                  >
                    {{ link.payments.toLocaleString() }}
                  </BaseHeading>
                  <BaseText size="xs" class="mt-1 text-muted-400">
                    Total transactions
                  </BaseText>
                </BaseCard>

                <BaseCard class="p-4">
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    Conversion
                  </BaseText>
                  <BaseHeading
                    as="h3"
                    size="lg"
                    weight="bold"
                    class="mt-1 text-muted-900 dark:text-white"
                  >
                    {{ link.conversion.toFixed(1) }}%
                  </BaseHeading>
                  <BaseText size="xs" class="mt-1 text-muted-400">
                    Success rate
                  </BaseText>
                </BaseCard>

                <BaseCard class="p-4">
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    Revenue
                  </BaseText>
                  <BaseHeading
                    as="h3"
                    size="lg"
                    weight="bold"
                    class="mt-1 text-muted-900 dark:text-white"
                  >
                    {{ formatCurrency(link.amount * link.payments, link.currency) }}
                  </BaseHeading>
                  <BaseText size="xs" class="mt-1 text-muted-400">
                    Total collected
                  </BaseText>
                </BaseCard>
              </div>

              <!-- Link Info -->
              <BaseCard class="p-6">
                <BaseHeading
                  as="h3"
                  size="md"
                  weight="semibold"
                  class="mb-4 text-muted-900 dark:text-white"
                >
                  Link Information
                </BaseHeading>
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                      Link URL
                    </BaseText>
                    <div class="flex items-center gap-2">
                      <code class="rounded-lg border border-muted-200 bg-muted-50 px-3 py-1.5 text-xs font-mono text-muted-700 dark:border-muted-700 dark:bg-muted-800 dark:text-muted-300">
                        https://{{ link.reference }}
                      </code>
                      <BaseButton
                        size="sm"
                        variant="ghost"
                        icon
                        class="rounded-full"
                        @click="copyReference"
                      >
                        <Icon name="ph:copy" class="size-4" />
                      </BaseButton>
                    </div>
                  </div>

                  <div class="flex items-center justify-between">
                    <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                      Created
                    </BaseText>
                    <BaseText size="sm" weight="medium" class="text-muted-700 dark:text-muted-300">
                      {{ new Date(link.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      }) }}
                    </BaseText>
                  </div>

                  <div class="flex items-center justify-between">
                    <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                      Status
                    </BaseText>
                    <GatewayStatusBadge :status="link.status === 'active' ? 'active' : link.status === 'paused' ? 'suspended' : 'draft'" />
                  </div>
                </div>
              </BaseCard>

              <!-- QR Code -->
              <BaseCard class="p-6">
                <BaseHeading
                  as="h3"
                  size="md"
                  weight="semibold"
                  class="mb-4 text-muted-900 dark:text-white"
                >
                  QR Code
                </BaseHeading>
                <div class="flex justify-center">
                  <img
                    :src="getQRCodeUrl(`https://${link.reference}`, 200)"
                    alt="QR Code"
                    class="rounded-lg border border-muted-200 p-2 dark:border-muted-700"
                  >
                </div>
              </BaseCard>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="flex items-center justify-between border-t border-muted-200 px-6 py-4 dark:border-muted-800">
            <BaseButton
              variant="ghost"
              color="danger"
              @click="emit('delete', link.id)"
            >
              <Icon name="solar:trash-bin-minimalistic-bold-duotone" class="size-4" />
              Delete
            </BaseButton>
            <div class="flex items-center gap-2">
              <BaseButton
                variant="outline"
                @click="emit('toggle', link.id)"
              >
                <Icon
                  :name="link.status === 'active' ? 'solar:pause-circle-bold-duotone' : 'solar:play-circle-bold-duotone'"
                  class="size-4"
                />
                {{ link.status === 'active' ? 'Pause' : 'Activate' }}
              </BaseButton>
              <BaseButton
                variant="primary"
                @click="emit('edit', link.id)"
              >
                <Icon name="solar:edit-circle-bold-duotone" class="size-4" />
                Edit
              </BaseButton>
            </div>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

