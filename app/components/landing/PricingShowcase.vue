<template>
  <section class="relative">
    <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[320px] bg-gradient-to-r from-primary-500/10 via-transparent to-indigo-500/10 blur-3xl" />
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto">
        <BaseTag rounded="full" size="sm" class="bg-primary-100 text-primary-600 inline-flex items-center gap-2">
          <Icon name="solar:wallet-linear" class="size-4" />
          Pay as you go
        </BaseTag>
        <h2 class="mt-4 text-3xl sm:text-4xl font-semibold text-muted-900 dark:text-white">
          Keep it lightweight. Only pay when clicks or payments succeed.
        </h2>
        <p class="mt-3 text-sm sm:text-base text-muted-600 dark:text-muted-300">
          You’re early—there’s no tiering or commitment. We optimized pricing for teams validating their first growth loops.
        </p>
      </div>

      <div class="mt-12 grid gap-6 lg:grid-cols-2">
        <BaseCard class="border border-muted-200 dark:border-muted-800 rounded-3xl p-8 bg-white/95 dark:bg-muted-900/95 backdrop-blur shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs uppercase tracking-wide text-muted-500 dark:text-muted-400">URL Shortener</p>
              <h3 class="mt-1 text-2xl font-semibold text-muted-900 dark:text-white">Usage pricing</h3>
            </div>
            <BaseChip rounded="full" size="sm" class="bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400">
              First 1,000 clicks free
            </BaseChip>
          </div>
          <div class="mt-6 flex items-baseline gap-2">
            <span class="text-4xl font-semibold text-muted-900 dark:text-white">$0.004</span>
            <span class="text-sm text-muted-500 dark:text-muted-400">per tracked click after free tier</span>
          </div>
          <ul class="mt-6 space-y-3 text-sm text-muted-600 dark:text-muted-300">
            <li class="flex items-start gap-2">
              <Icon name="solar:check-circle-linear" class="size-4 text-primary-500 mt-1" />
              Full analytics & AI insights even on free clicks.
            </li>
            <li class="flex items-start gap-2">
              <Icon name="solar:check-circle-linear" class="size-4 text-primary-500 mt-1" />
              Create links via UI, REST, or CLI with the same limits.
            </li>
            <li class="flex items-start gap-2">
              <Icon name="solar:check-circle-linear" class="size-4 text-primary-500 mt-1" />
              Alerts keep you ahead of spend—set custom thresholds.
            </li>
          </ul>
          <BaseButton size="lg" variant="primary" class="mt-8 w-full justify-center rounded-2xl" to="/dashboard/url-shortener/links">
            Launch your first short link
          </BaseButton>
        </BaseCard>

        <BaseCard class="border border-muted-200 dark:border-muted-800 rounded-3xl p-8 bg-white/95 dark:bg-muted-900/95 backdrop-blur shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs uppercase tracking-wide text-muted-500 dark:text-muted-400">Payment Link</p>
              <h3 class="mt-1 text-2xl font-semibold text-muted-900 dark:text-white">Per transaction</h3>
            </div>
            <BaseChip rounded="full" size="sm" class="bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
              Module access is free
            </BaseChip>
          </div>
          <div class="mt-6 flex items-baseline gap-2">
            <span class="text-4xl font-semibold text-muted-900 dark:text-white">$0.07</span>
            <span class="text-sm text-muted-500 dark:text-muted-400">per successful settlement</span>
          </div>
          <ul class="mt-6 space-y-3 text-sm text-muted-600 dark:text-muted-300">
            <li class="flex items-start gap-2">
              <Icon name="solar:check-circle-linear" class="size-4 text-primary-500 mt-1" />
              Smart-contract escrow keeps customer funds protected.
            </li>
            <li class="flex items-start gap-2">
              <Icon name="solar:check-circle-linear" class="size-4 text-primary-500 mt-1" />
              Automatic notifications + webhook callbacks for both parties.
            </li>
            <li class="flex items-start gap-2">
              <Icon name="solar:check-circle-linear" class="size-4 text-primary-500 mt-1" />
              Works for one-off invoices and full storefront flows.
            </li>
          </ul>
          <BaseButton size="lg" variant="outline" class="mt-8 w-full justify-center rounded-2xl" to="/dashboard/payment-link/overview">
            Test the payment flow
          </BaseButton>
        </BaseCard>
      </div>
    </div>
  </section>
</template>



