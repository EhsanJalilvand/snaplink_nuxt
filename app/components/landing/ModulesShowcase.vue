<template>
  <section class="relative">
    <div class="absolute inset-x-0 -top-20 h-40 bg-gradient-to-b from-primary-500/5 to-transparent blur-3xl" />
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between flex-wrap gap-4 mb-10">
        <div>
          <BaseTag rounded="full" size="sm" class="bg-muted-200/60 dark:bg-muted-800/80 text-muted-600 dark:text-muted-300">
            Core modules
          </BaseTag>
          <h2 class="mt-3 text-3xl font-semibold text-muted-900 dark:text-white">
            Two rails. Endless launch scenarios.
          </h2>
        </div>
        <BaseButton size="md" variant="outline-primary" class="rounded-full" to="/dashboard">
          Explore workspace
        </BaseButton>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <BaseCard class="h-full border border-muted-200 dark:border-muted-800 rounded-3xl p-8 bg-white/90 dark:bg-muted-900/90 backdrop-blur shadow-lg shadow-primary-500/10">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="rounded-2xl bg-primary-100 dark:bg-primary-900/30 p-3">
                <Icon name="solar:link-bold-linear" class="size-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-muted-500 dark:text-muted-400">Module</p>
                <h3 class="text-xl font-semibold text-muted-900 dark:text-white">URL Shortener</h3>
              </div>
            </div>
            <BaseChip size="sm" rounded="full" class="bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400">
              AI insight ready
            </BaseChip>
          </div>
          <p class="mt-6 text-sm text-muted-600 dark:text-muted-300 leading-relaxed">
            Batch launch branded links, layer access controls, and watch real-time click funnels. The analytics engine summarizes referrers, devices, and campaigns so you can act instantly.
          </p>
          <div class="mt-8 grid grid-cols-2 gap-4 text-sm">
            <div class="rounded-2xl bg-muted-100 dark:bg-muted-800/70 p-4">
              <p class="font-semibold text-muted-900 dark:text-white">Launch wizard</p>
              <p class="mt-1 text-muted-500 dark:text-muted-400">Stage URLs, rules, and expirations in three guided steps.</p>
            </div>
            <div class="rounded-2xl bg-muted-100 dark:bg-muted-800/70 p-4">
              <p class="font-semibold text-muted-900 dark:text-white">Bulk intelligence</p>
              <p class="mt-1 text-muted-500 dark:text-muted-400">Select multiple links to fire advanced comparison reports.</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="h-full border border-muted-200 dark:border-muted-800 rounded-3xl p-8 bg-white/90 dark:bg-muted-900/90 backdrop-blur shadow-lg shadow-primary-500/10">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 p-3">
                <Icon name="solar:wallet-linear" class="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-muted-500 dark:text-muted-400">Module</p>
                <h3 class="text-xl font-semibold text-muted-900 dark:text-white">Payment Link</h3>
              </div>
            </div>
            <BaseChip size="sm" rounded="full" class="bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
              Always free
            </BaseChip>
          </div>
          <p class="mt-6 text-sm text-muted-600 dark:text-muted-300 leading-relaxed">
            Build trustless payment flows in three steps. Smart contracts auto-validate deposits, trigger notifications for both parties, and refund misfires instantly. Works B2C and B2B out of the box.
          </p>
          <div class="mt-8 grid grid-cols-2 gap-4 text-sm">
            <div class="rounded-2xl bg-muted-100 dark:bg-muted-800/70 p-4">
              <p class="font-semibold text-muted-900 dark:text-white">Dual notifications</p>
              <p class="mt-1 text-muted-500 dark:text-muted-400">Send receipts to payer & payee plus webhook callbacks.</p>
            </div>
            <div class="rounded-2xl bg-muted-100 dark:bg-muted-800/70 p-4">
              <p class="font-semibold text-muted-900 dark:text-white">Fail-safe refunds</p>
              <p class="mt-1 text-muted-500 dark:text-muted-400">Mismatch in amount or memo? Funds route back automatically.</p>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </section>
</template>

