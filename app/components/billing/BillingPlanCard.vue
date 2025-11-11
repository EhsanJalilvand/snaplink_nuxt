<script setup lang="ts">
import type { BillingPlanInfo } from '~/types/billing'

const props = defineProps<{
  plan: BillingPlanInfo | null
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'upgrade'): void
  (e: 'view-pricing'): void
}>()

const handleUpgrade = () => emit('upgrade')
const handleViewPricing = () => emit('view-pricing')
</script>

<template>
  <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
    <BaseCard class="p-6">
      <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-muted-100">
        Current plan
      </BaseHeading>
      <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
        Manage billing model and entitlements.
      </BaseParagraph>

      <div class="mt-6 space-y-3">
        <template v-if="isLoading">
          <div v-for="index in 2" :key="index" class="h-6 w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
        </template>
        <template v-else-if="plan">
          <div class="flex items-center justify-between">
            <BaseText size="sm" class="text-muted-600 dark:text-muted-400">Plan type</BaseText>
            <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
              {{ plan.planType }}
            </BaseText>
          </div>
          <div class="flex items-center justify-between">
            <BaseText size="sm" class="text-muted-600 dark:text-muted-400">Billing cycle</BaseText>
            <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
              {{ plan.billingCycle }}
            </BaseText>
          </div>
        </template>
      </div>

      <BaseButton variant="outline" class="mt-6 w-full" @click="handleUpgrade">
        <Icon name="ph:arrow-up" class="size-4" />
        Upgrade plan
      </BaseButton>
    </BaseCard>

    <BaseCard class="p-6">
      <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-muted-100">
        Pricing
      </BaseHeading>
      <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
        Unit rates for frequently used services.
      </BaseParagraph>

      <div class="mt-6 space-y-3">
        <template v-if="isLoading">
          <div v-for="index in 3" :key="index" class="h-6 w-full animate-pulse rounded-lg bg-muted-200/80 dark:bg-muted-800/60" />
        </template>
        <template v-else-if="plan">
          <div
            v-for="item in plan.pricing"
            :key="item.label"
            class="flex items-center justify-between"
          >
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">{{ item.label }}</BaseText>
            <BaseText size="xs" class="text-muted-600 dark:text-muted-400">{{ item.value }}</BaseText>
          </div>
        </template>
      </div>

      <BaseButton variant="outline" class="mt-6 w-full" @click="handleViewPricing">
        <Icon name="ph:info" class="size-4" />
        View full pricing
      </BaseButton>
    </BaseCard>
  </div>
</template>
