<script setup lang="ts">
const props = defineProps<{
  balance: number
  statusLabel: string
  statusDescription: string
  statusColor: string
  statusIcon: string
  isLoading?: boolean
}>()

defineOptions({
  name: 'BillingBalanceCard',
})

const formatBalance = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
</script>

<template>
  <BaseCard class="p-6">
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-muted-100">
          Account Balance
        </BaseHeading>
        <BaseText size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
          Workspace credits available for usage and add-ons
        </BaseText>
      </div>
    </div>

    <div class="mt-6 space-y-6">
      <div>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          Current balance
        </BaseText>
        <div class="mt-2 h-12">
          <div v-if="isLoading" class="h-full w-40 rounded-xl bg-muted-200/80 animate-pulse dark:bg-muted-800/60" />
          <BaseHeading
            v-else
            as="h2"
            size="3xl"
            weight="bold"
            class="text-muted-900 dark:text-muted-100"
          >
            ${{ formatBalance(balance) }}
          </BaseHeading>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <BaseChip :color="statusColor" size="sm">
          <Icon :name="statusIcon" class="size-3" />
          <span>{{ statusLabel }}</span>
        </BaseChip>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          {{ statusDescription }}
        </BaseText>
      </div>
    </div>
  </BaseCard>
</template>
