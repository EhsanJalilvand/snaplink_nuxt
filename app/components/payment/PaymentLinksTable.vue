<script setup lang="ts">
import type { PaymentLink } from '~/types/payment-links'

const props = defineProps<{
  links: PaymentLink[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  copy: [reference: string]
  toggle: [id: string]
  remove: [id: string]
}>()

const handleCopy = (reference: string) => {
  emit('copy', reference)
}

const handleToggle = (id: string) => {
  emit('toggle', id)
}

const handleRemove = (id: string) => {
  emit('remove', id)
}
</script>

<template>
  <div class="space-y-3">
    <div v-if="isLoading" class="space-y-2">
      <div
        v-for="index in 4"
        :key="index"
        class="h-20 rounded-lg border border-muted-200/70 bg-white/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)] animate-pulse dark:border-muted-700/60 dark:bg-muted-900/40"
      />
    </div>

    <TairoFlexTable v-else>
      <template #header>
        <TairoFlexTableHeading type="grow" class="justify-start">
          Link
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="stable" class="justify-start">
          Amount
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="stable" class="justify-start">
          Payments
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="stable" class="justify-start">
          Conversion
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="stable" class="justify-start">
          Status
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="stable" class="justify-start">
          Created
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="shrink" class="justify-end">
          Actions
        </TairoFlexTableHeading>
      </template>

      <TairoFlexTableRow
        v-for="link in props.links"
        :key="link.id"
        rounded="lg"
      >
        <TairoFlexTableCell type="grow" data-content="Link">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <BaseHeading
                as="h4"
                size="sm"
                weight="semibold"
                class="text-muted-900 dark:text-white"
              >
                {{ link.name }}
              </BaseHeading>
              <BaseChip
                v-if="link.currency === 'USDC'"
                color="primary"
                size="xs"
              >
                On-chain
              </BaseChip>
            </div>
            <div class="flex items-center gap-2 text-xs text-muted-500 dark:text-muted-400">
              <span class="font-mono">{{ link.reference }}</span>
              <BaseButton
                size="sm"
                variant="ghost"
                icon
                class="rounded-full"
                @click="handleCopy(link.reference)"
              >
                <Icon name="ph:copy" class="size-3" />
              </BaseButton>
            </div>
          </div>
        </TairoFlexTableCell>

        <TairoFlexTableCell type="stable" data-content="Amount">
          <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
            {{ link.amount.toLocaleString('en-US', { style: 'currency', currency: link.currency === 'USDC' ? 'USD' : link.currency }) }}
            <span v-if="link.currency === 'USDC'" class="text-xs text-muted-400 dark:text-muted-500">USDC</span>
          </BaseText>
        </TairoFlexTableCell>

        <TairoFlexTableCell type="stable" data-content="Payments">
          <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
            {{ link.payments.toLocaleString() }}
          </BaseText>
        </TairoFlexTableCell>

        <TairoFlexTableCell type="stable" data-content="Conversion">
          <BaseChip color="success" size="sm">
            {{ link.conversion }}%
          </BaseChip>
        </TairoFlexTableCell>

        <TairoFlexTableCell type="stable" data-content="Status">
          <BaseChip
            :color="link.status === 'active' ? 'success' : link.status === 'paused' ? 'warning' : 'muted'"
            size="sm"
          >
            <span class="capitalize">{{ link.status }}</span>
          </BaseChip>
        </TairoFlexTableCell>

        <TairoFlexTableCell type="stable" data-content="Created">
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            {{ new Date(link.createdAt).toLocaleString() }}
          </BaseText>
        </TairoFlexTableCell>

        <TairoFlexTableCell type="shrink" data-content="Actions">
          <div class="flex items-center gap-1">
            <BaseButton
              size="sm"
              variant="ghost"
              icon
              class="rounded-full"
              :to="`/dashboard/payment/links`"
            >
              <Icon name="ph:eye" class="size-4" />
            </BaseButton>
            <BaseButton
              size="sm"
              variant="ghost"
              icon
              class="rounded-full"
              @click="handleToggle(link.id)"
            >
              <Icon :name="link.status === 'paused' ? 'ph:play-circle' : 'ph:pause-circle'" class="size-4" />
            </BaseButton>
            <BaseButton
              size="sm"
              variant="ghost"
              icon
              color="danger"
              class="rounded-full"
              @click="handleRemove(link.id)"
            >
              <Icon name="ph:trash" class="size-4" />
            </BaseButton>
          </div>
        </TairoFlexTableCell>
      </TairoFlexTableRow>
    </TairoFlexTable>
  </div>
</template>
