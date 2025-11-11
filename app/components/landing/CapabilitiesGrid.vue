<template>
  <section>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <BaseTag rounded="full" size="sm" class="bg-muted-200/60 dark:bg-muted-800/80 text-muted-600 dark:text-muted-300">
            Shared capabilities
          </BaseTag>
          <h2 class="mt-3 text-3xl font-semibold text-muted-900 dark:text-white">
            Built-in control for every launch.
          </h2>
        </div>
        <p class="max-w-md text-sm text-muted-600 dark:text-muted-400">
          Everything you ship in SnapLink is available through REST and the UI. No extra teams, no vendor sprawl.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <BaseCard class="border border-muted-200 dark:border-muted-800 rounded-2xl p-6 bg-white/90 dark:bg-muted-900/90 backdrop-blur">
          <div class="flex items-center gap-3">
            <div class="rounded-2xl bg-primary-100 dark:bg-primary-900/30 p-3">
              <Icon name="solar:api-linear" class="size-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-muted-900 dark:text-white">API first</h3>
              <p class="text-sm text-muted-500 dark:text-muted-400">UI actions mirror REST responses and webhooks.</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="border border-muted-200 dark:border-muted-800 rounded-2xl p-6 bg-white/90 dark:bg-muted-900/90 backdrop-blur">
          <div class="flex items-center gap-3">
            <div class="rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 p-3">
              <Icon name="solar:laptop-linear" class="size-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-muted-900 dark:text-white">Workspace control</h3>
              <p class="text-sm text-muted-500 dark:text-muted-400">Granular visibility, shared collections, and audit trails.</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="border border-muted-200 dark:border-muted-800 rounded-2xl p-6 bg-white/90 dark:bg-muted-900/90 backdrop-blur">
          <div class="flex items-center gap-3">
            <div class="rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 p-3">
              <Icon name="solar:wallet-linear" class="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-muted-900 dark:text-white">Pay as you go</h3>
              <p class="text-sm text-muted-500 dark:text-muted-400">Top up with fiat or crypto, set spend limits per workspace.</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="border border-muted-200 dark:border-muted-800 rounded-2xl p-6 bg-white/90 dark:bg-muted-900/90 backdrop-blur">
          <div class="flex items-center gap-3">
            <div class="rounded-2xl bg-amber-100 dark:bg-amber-900/30 p-3">
              <Icon name="solar:bell-linear" class="size-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-muted-900 dark:text-white">Webhook & notification</h3>
              <p class="text-sm text-muted-500 dark:text-muted-400">Real-time alerts to email, Slack, or custom webhooks.</p>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </section>
</template>




