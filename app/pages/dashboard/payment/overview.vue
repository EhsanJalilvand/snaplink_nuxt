<script setup lang="ts">
definePageMeta({
  title: 'Payment Overview',
  layout: 'dashboard',
})

const router = useRouter()

const handleAction = (action: 'create-link' | 'open-gateway' | 'open-payouts') => {
  switch (action) {
    case 'create-link':
      router.push({
        path: '/dashboard/payment/links',
        query: { wizard: 'create' },
      })
      break
    case 'open-gateway':
      router.push('/dashboard/payment/gateway')
      break
    case 'open-payouts':
      router.push('/dashboard/payment/overview#payouts')
      break
  }
}
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

    <PaymentSummaryCards />

    <div class="space-y-6">
      <PaymentTransactionStatus />
      <PaymentRevenueChart />
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <PaymentTopPerformance class="xl:col-span-2" />
      <div class="space-y-6 xl:col-span-1">
        <PaymentQuickActions
          @create-link="handleAction('create-link')"
          @open-gateway="handleAction('open-gateway')"
          @open-payouts="handleAction('open-payouts')"
        />
        <PaymentRecentActivity />
        <PaymentAlertsSummary />
      </div>
    </div>

    <PaymentConversionMetrics />
  </div>
</template>

