<script setup lang="ts">
interface PaymentLinkPreview {
  title: string
  description: string
  amountType: 'fixed' | 'open'
  amount: number
  currency: string
  linkType: 'one-time' | 'reusable'
  expirationDate?: string
}

interface Props {
  modelValue: PaymentLinkPreview
  onEdit?: () => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: PaymentLinkPreview]
}>()

import { useQRCode } from '~/composables/useQRCode'

const { getQRCodeUrl } = useQRCode()

const linkUrl = computed(() => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `https://snap.link/pay/${code}`
})

const qrCodeUrl = computed(() => {
  return getQRCodeUrl(linkUrl.value, 280)
})

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USDC' ? 'USD' : currency,
  }).format(amount)
}

const copyLink = async () => {
  if (import.meta.client && navigator.clipboard) {
    await navigator.clipboard.writeText(linkUrl.value)
    const toaster = useNuiToasts()
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
  <div class="space-y-6">
    <div>
      <BaseHeading
        as="h3"
        size="lg"
        weight="semibold"
        class="text-muted-900 dark:text-white"
      >
        Preview & Confirm
      </BaseHeading>
      <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
        Review your payment link configuration before creating it.
      </BaseParagraph>
    </div>

    <!-- Preview Card -->
    <BaseCard class="overflow-hidden p-0">
      <div class="bg-gradient-to-br from-primary-500 to-primary-600 p-6 text-white">
        <BaseHeading
          as="h2"
          size="xl"
          weight="bold"
          class="text-white"
        >
          {{ modelValue.title }}
        </BaseHeading>
        <BaseParagraph
          v-if="modelValue.description"
          size="sm"
          class="mt-2 text-primary-100"
        >
          {{ modelValue.description }}
        </BaseParagraph>
      </div>

      <div class="p-6">
        <div class="mb-6 text-center">
          <div class="mb-2">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Amount
            </BaseText>
            <BaseHeading
              as="h2"
              size="2xl"
              weight="bold"
              class="text-muted-900 dark:text-white"
            >
              {{ modelValue.amountType === 'fixed' ? formatCurrency(modelValue.amount, modelValue.currency) : 'Custom Amount' }}
            </BaseHeading>
            <BaseText size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
              {{ modelValue.currency }}
            </BaseText>
          </div>
        </div>

        <!-- Link Info -->
        <div class="rounded-xl border border-muted-200 bg-muted-50/50 p-4 dark:border-muted-700 dark:bg-muted-900/30">
          <BaseText size="xs" class="mb-2 text-muted-500 dark:text-muted-400">
            Payment Link URL
          </BaseText>
          <div class="flex items-center gap-2">
            <code class="flex-1 truncate rounded-lg border border-muted-200 bg-white px-3 py-2 text-xs font-mono text-muted-700 dark:border-muted-700 dark:bg-muted-900 dark:text-muted-300">
              {{ linkUrl }}
            </code>
            <BaseButton
              size="sm"
              variant="ghost"
              icon
              class="rounded-full"
              @click="copyLink"
            >
              <Icon name="ph:copy" class="size-4" />
            </BaseButton>
          </div>
        </div>

        <!-- QR Code -->
        <div class="mt-6 text-center">
          <BaseText size="xs" class="mb-3 text-muted-500 dark:text-muted-400">
            QR Code
          </BaseText>
          <div class="flex justify-center">
            <img
              :src="qrCodeUrl"
              alt="QR Code"
              class="rounded-lg border border-muted-200 p-2 dark:border-muted-700"
            >
          </div>
        </div>

        <!-- Configuration Summary -->
        <div class="mt-6 space-y-3 rounded-xl border border-muted-200 bg-white/50 p-4 dark:border-muted-700 dark:bg-muted-900/30">
          <div class="flex items-center justify-between">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Link Type
            </BaseText>
            <BaseChip
              size="xs"
              color="primary"
              variant="pastel"
            >
              {{ modelValue.linkType === 'one-time' ? 'One-Time' : 'Reusable' }}
            </BaseChip>
          </div>
          <div
            v-if="modelValue.expirationDate"
            class="flex items-center justify-between"
          >
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Expires
            </BaseText>
            <BaseText size="xs" weight="medium" class="text-muted-700 dark:text-muted-300">
              {{ new Date(modelValue.expirationDate).toLocaleDateString() }}
            </BaseText>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Edit Button -->
    <div class="flex justify-center">
      <BaseButton
        v-if="onEdit"
        variant="outline"
        @click="onEdit?.()"
      >
        <Icon name="solar:edit-bold-duotone" class="size-4" />
        Edit Configuration
      </BaseButton>
    </div>
  </div>
</template>

