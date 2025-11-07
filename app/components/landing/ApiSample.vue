<template>
  <section>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <BaseCard class="border border-muted-200 dark:border-muted-800 rounded-3xl p-8 sm:p-10 bg-white/95 dark:bg-muted-900/95 backdrop-blur shadow-xl">
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] items-start">
          <div class="space-y-5">
            <BaseTag rounded="full" size="sm" class="bg-muted-200/60 dark:bg-muted-800/80 text-muted-600 dark:text-muted-300">
              API first
            </BaseTag>
            <h2 class="text-3xl font-semibold text-muted-900 dark:text-white">
              Anything you do in the UI you can do over REST.
            </h2>
            <p class="text-sm text-muted-600 dark:text-muted-300">
              Ship experiments from scripts or backends using the same payloads as the dashboard. Webhooks notify your systems the moment a link is created or a payment clears.
            </p>
            <div class="grid gap-4 sm:grid-cols-2 text-sm text-muted-600 dark:text-muted-300">
              <div class="rounded-2xl bg-muted-100 dark:bg-muted-800/80 p-4">
                <p class="font-semibold text-muted-900 dark:text-white">OAuth or API keys</p>
                <p class="mt-1 text-muted-500 dark:text-muted-400">Scoped access for teammates and automation.</p>
              </div>
              <div class="rounded-2xl bg-muted-100 dark:bg-muted-800/80 p-4">
                <p class="font-semibold text-muted-900 dark:text-white">Instant webhooks</p>
                <p class="mt-1 text-muted-500 dark:text-muted-400">Click events, payment settlements, and alerts fire within seconds.</p>
              </div>
            </div>
            <BaseButton size="md" variant="primary" class="rounded-full" to="/docs/api">
              View REST docs
            </BaseButton>
          </div>

          <div class="rounded-3xl bg-muted-950/90 text-muted-100 border border-muted-800 shadow-inner overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-muted-800">
              <div class="flex items-center gap-2 text-sm text-muted-300">
                <span class="size-2 rounded-full bg-success-500" />
                POST /api/links
              </div>
              <BaseChip rounded="full" size="sm" class="bg-muted-800 text-muted-400">
                curl
              </BaseChip>
            </div>
            <pre class="p-6 text-xs leading-relaxed overflow-x-auto">
curl --request POST https://api.snaplink.dev/v1/links \
  --header "Authorization: Bearer $SNAPLINK_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "originalUrl": "https://product-drop.xyz",
    "slug": "launch",
    "expiresAt": "2025-12-31T23:59:59Z",
    "visibility": "workspace",
    "notifications": {
      "email": ["founder@snaplink.dev"],
      "webhook": "https://hooks.zapier.com/..."
    }
  }'

# response excerpt
{
  "id": "link_01j9cm4",
  "shortUrl": "https://snap.link/launch",
  "clicks": 0,
  "status": "active"
}
            </pre>
          </div>
        </div>
      </BaseCard>
    </div>
  </section>
</template>

