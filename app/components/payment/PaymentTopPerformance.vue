<script setup lang="ts">
import { computed, ref } from '#imports'
import type { PaymentPerformanceItem } from '~/types/payments'

const activeTab = ref<'links' | 'products'>('links')

interface PaymentTopPerformanceProps {
  items?: PaymentPerformanceItem[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<PaymentTopPerformanceProps>(), {
  items: () => [],
  isLoading: false,
})

const topLinks = computed(() => props.items.filter((item) => item.type === 'link'))
const topProducts = computed(() => props.items.filter((item) => item.type === 'product'))

const formatCurrency = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
</script>

<template>
  <BaseCard class="p-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-900 dark:text-white"
        >
          Top Performing Assets
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Identify which links and products are driving the highest net volume.
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-2 rounded-full border border-muted-200 bg-muted-100/60 p-1 text-xs dark:border-muted-700 dark:bg-muted-900/40">
        <button
          type="button"
          class="rounded-full px-3 py-1.5 font-medium transition-colors"
          :class="activeTab === 'links'
            ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/20'
            : 'text-muted-500 hover:text-muted-800 dark:text-muted-400 dark:hover:text-muted-200'"
          @click="activeTab = 'links'"
        >
          Payment Links
        </button>
        <button
          type="button"
          class="rounded-full px-3 py-1.5 font-medium transition-colors"
          :class="activeTab === 'products'
            ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/20'
            : 'text-muted-500 hover:text-muted-800 dark:text-muted-400 dark:hover:text-muted-200'"
          @click="activeTab = 'products'"
        >
          Products
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'links'" class="mt-6 space-y-4">
      <BaseCard
        v-for="link in topLinks"
        :key="link.id"
        class="border border-muted-200/80 bg-white/80 p-4 transition hover:border-primary-200 dark:border-muted-700/60 dark:bg-muted-900/40 dark:hover:border-primary-700/40"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-primary-100/80 p-2 dark:bg-primary-900/20">
              <Icon name="solar:link-bold-duotone" class="size-5 text-primary-500 dark:text-primary-300" />
            </div>
            <div>
              <BaseHeading
                as="h4"
                size="sm"
                weight="semibold"
                class="text-muted-900 dark:text-white"
              >
                <span v-if="isLoading" class="block h-5 w-44 animate-pulse rounded bg-muted-200/60 dark:bg-muted-800/60" />
                <template v-else>
                  {{ link.name }}
                </template>
              </BaseHeading>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                <span v-if="isLoading" class="block h-4 w-40 animate-pulse rounded bg-muted-200/50 dark:bg-muted-800/50" />
                <template v-else>
                  {{ link.payments?.toLocaleString() ?? '—' }} payments • {{ link.conversionRate }}% conversion
                </template>
              </BaseText>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Revenue
              </BaseText>
              <BaseHeading
                as="h4"
                size="md"
                weight="bold"
                class="text-muted-900 dark:text-white"
              >
                <span v-if="isLoading" class="block h-6 w-20 animate-pulse rounded bg-muted-200/70 dark:bg-muted-800/60" />
                <template v-else>
                  {{ formatCurrency(link.revenue) }}
                </template>
              </BaseHeading>
            </div>
            <BaseChip :color="link.status === 'Live' ? 'success' : 'warning'" size="sm">
              {{ link.status ?? 'Active' }}
            </BaseChip>
            <div class="flex items-center gap-2">
              <BaseButton size="sm" variant="ghost" icon class="rounded-full" to="/dashboard/payment/links">
                <Icon name="ph:eye" class="size-4" />
              </BaseButton>
              <BaseButton size="sm" variant="ghost" icon class="rounded-full">
                <Icon name="ph:copy" class="size-4" />
              </BaseButton>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <div v-else class="mt-6 space-y-4">
      <BaseCard
        v-for="product in topProducts"
        :key="product.id"
        class="border border-muted-200/80 bg-white/80 p-4 transition hover:border-primary-200 dark:border-muted-700/60 dark:bg-muted-900/40 dark:hover:border-primary-700/40"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-info-100/80 p-2 dark:bg-info-900/20">
              <Icon name="solar:shopping-bag-bold-duotone" class="size-5 text-info-600 dark:text-info-300" />
            </div>
            <div>
              <BaseHeading
                as="h4"
                size="sm"
                weight="semibold"
                class="text-muted-900 dark:text-white"
              >
                <span v-if="isLoading" class="block h-5 w-44 animate-pulse rounded bg-muted-200/60 dark:bg-muted-800/60" />
                <template v-else>
                  {{ product.name }}
                </template>
              </BaseHeading>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                <span v-if="isLoading" class="block h-4 w-32 animate-pulse rounded bg-muted-200/50 dark:bg-muted-800/50" />
                <template v-else>
                  SKU: {{ product.sku ?? 'N/A' }}
                </template>
              </BaseText>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Revenue
              </BaseText>
              <BaseHeading
                as="h4"
                size="md"
                weight="bold"
                class="text-muted-900 dark:text-white"
              >
                <span v-if="isLoading" class="block h-6 w-20 animate-pulse rounded bg-muted-200/70 dark:bg-muted-800/60" />
                <template v-else>
                  {{ formatCurrency(product.revenue) }}
                </template>
              </BaseHeading>
            </div>
            <BaseChip :color="product.trend?.includes('-') ? 'danger' : 'primary'" size="sm">
              {{ product.trend }}
            </BaseChip>
          </div>
        </div>
      </BaseCard>
    </div>
  </BaseCard>
</template>

