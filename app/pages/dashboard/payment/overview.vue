<script setup lang="ts">
import { callOnce, computed } from '#imports'

definePageMeta({
  title: 'Payment Overview',
  layout: 'dashboard',
})

const router = useRouter()
const {
  overview,
  isLoadingOverview,
  overviewError,
  revenueByPeriod,
  statusTotal,
  fetchOverview,
} = usePayments()

callOnce(() => fetchOverview())

const handleAction = (action: 'create-link' | 'open-gateway' | 'open-payouts') => {
  switch (action) {
    case 'create-link':
      return router.push({
        path: '/dashboard/payment/links',
        query: { wizard: 'create' },
      })
    case 'open-gateway':
      return router.push('/dashboard/payment/gateway')
    case 'open-payouts':
      return router.push('/dashboard/payment/overview#payouts')
    default:
      return
  }
}

const transactionInsights = computed(() => overview.value.insights ?? [])
const quickActions = computed(() => overview.value.quickActions ?? [])
const recentActivity = computed(() => overview.value.activities ?? [])
const paymentAlerts = computed(() => overview.value.alerts ?? [])
const conversionMetrics = computed(() => overview.value.conversions ?? [])
const hasOverviewError = computed(() => Boolean(overviewError.value))
</script>

<template>
  <div class="space-y-6 py-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-white"
        >
          Payment Mission Control
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          Monitor balances, settlement health, and gateway performance from one cockpit.
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton
          variant="outline"
          color="primary"
          to="/dashboard/payment/links"
        >
          <Icon name="ph:list-bullets" class="size-4" />
          Manage Payment Links
        </BaseButton>
        <BaseButton
          variant="primary"
          to="/dashboard/payment/gateway"
        >
          <Icon name="ph:gear-six" class="size-4" />
          Gateway Settings
        </BaseButton>
      </div>
    </div>

    <BaseAlert
      v-if="hasOverviewError"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached payment telemetry
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ overviewError }}
      </p>
    </BaseAlert>

    <PaymentSummaryCards
      :summary="overview.summary"
      :trends="overview.trends"
      :is-loading="isLoadingOverview"
    />

    <div class="space-y-6">
      <PaymentTransactionStatus
        :status="overview.status"
        :insights="transactionInsights"
        :total="statusTotal"
        :is-loading="isLoadingOverview"
      />
      <PaymentRevenueChart
        :datasets="revenueByPeriod"
        :metrics="overview.revenueMetrics"
        :is-loading="isLoadingOverview"
      />
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <PaymentTopPerformance
        class="xl:col-span-2"
        :items="overview.performance"
        :is-loading="isLoadingOverview"
      />
      <div class="space-y-6 xl:col-span-1">
        <PaymentQuickActions
          :actions="quickActions"
          :is-loading="isLoadingOverview"
          @create-link="handleAction('create-link')"
          @open-gateway="handleAction('open-gateway')"
          @open-payouts="handleAction('open-payouts')"
        />
        <PaymentRecentActivity
          :activities="recentActivity"
          :is-loading="isLoadingOverview"
        />
        <PaymentAlertsSummary
          :alerts="paymentAlerts"
          :is-loading="isLoadingOverview"
        />
      </div>
    </div>

    <PaymentConversionMetrics
      :metrics="conversionMetrics"
      :is-loading="isLoadingOverview"
    />
  </div>
</template>

