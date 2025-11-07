<template>
  <section>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <BaseCard class="border border-muted-200 dark:border-muted-800 rounded-3xl p-10 bg-white dark:bg-muted-900 shadow-xl">
        <div class="grid gap-8 md:grid-cols-2 items-center">
          <div class="space-y-4">
            <BaseTag rounded="full" size="sm" class="bg-muted-200/60 dark:bg-muted-800/70 text-muted-600 dark:text-muted-300">
              Early access program
            </BaseTag>
            <h2 class="text-3xl font-semibold text-muted-900 dark:text-white">
              We’re onboarding the first builders right now.
            </h2>
            <p class="text-sm text-muted-600 dark:text-muted-300">
              No vanity metrics. You’ll work directly with us while we iterate on URL Shortener and Payment Link. Other modules join soon, but today you can run growth experiments without waiting on an enterprise contract.
            </p>
            <div class="flex flex-wrap items-center gap-3 text-sm text-muted-600 dark:text-muted-300">
              <div class="inline-flex items-center gap-2">
                <span class="size-2 rounded-full bg-success-500" />
                Workspace analytics live
              </div>
              <div class="inline-flex items-center gap-2">
                <span class="size-2 rounded-full bg-primary-500" />
                Payment link smart contracts live
              </div>
            </div>
          </div>
          <div class="rounded-3xl border border-dashed border-primary-300 dark:border-primary-800 bg-primary-50/70 dark:bg-primary-900/20 p-8 space-y-5">
            <h3 class="text-lg font-semibold text-primary-700 dark:text-primary-200">How to get in</h3>
            <ul class="space-y-3 text-sm text-primary-700/80 dark:text-primary-200/80">
              <li class="flex items-start gap-3">
                <Icon name="solar:letter-linear" class="size-5 mt-0.5" />
                <span>Request an invite inside the app—no waitlist forms.</span>
              </li>
              <li class="flex items-start gap-3">
                <Icon name="solar:user-speak-rounded-linear" class="size-5 mt-0.5" />
                <span>Jump on a 20-minute pairing call so we understand your launch plan.</span>
              </li>
              <li class="flex items-start gap-3">
                <Icon name="solar:flash-linear" class="size-5 mt-0.5" />
                <span>We flip on production access—no customers yet, just builders like you.</span>
              </li>
            </ul>
            <BaseButton size="lg" variant="primary" class="w-full justify-center rounded-2xl" to="/auth/register">
              Claim early access
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>
  </section>
</template>

