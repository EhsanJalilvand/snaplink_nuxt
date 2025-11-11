<script setup lang="ts">
import { definePageMeta } from '#imports'
import { useDocsApi } from '~/composables/useDocsApi'

definePageMeta({
  title: 'SnapLink REST API',
  layout: 'landing',
})

const { endpoints } = useDocsApi()
</script>

<template>
  <div class="pb-24 space-y-16">
    <section class="bg-muted-50 dark:bg-muted-950">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <BaseTag rounded="full" size="sm" class="bg-primary-100 text-primary-600 inline-flex items-center gap-2">
          <Icon name="solar:code-square-linear" class="size-4" />
          REST API
        </BaseTag>
        <h1 class="text-4xl font-semibold text-muted-900 dark:text-white">
          Ship everything from scripts or servers.
        </h1>
        <p class="max-w-3xl text-sm sm:text-base text-muted-600 dark:text-muted-300">
          SnapLink exposes the same primitives used in the dashboard. Authenticate with OAuth2 or workspace API keys, then use these endpoints to orchestrate URL and payment flows programmatically.
        </p>
      </div>
    </section>

    <section>
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div>
          <h2 class="text-2xl font-semibold text-muted-900 dark:text-white mb-4">Core endpoints</h2>
          <div class="space-y-4">
            <div
              v-for="endpoint in endpoints"
              :key="endpoint.path"
              class="rounded-2xl border border-muted-200 dark:border-muted-800 bg-white/95 dark:bg-muted-900/95 backdrop-blur px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div class="flex items-center gap-3">
                <BaseChip rounded="full" size="sm" class="bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
                  {{ endpoint.method }}
                </BaseChip>
                <code class="text-sm font-medium text-muted-900 dark:text-muted-100">{{ endpoint.path }}</code>
              </div>
              <p class="text-sm text-muted-600 dark:text-muted-400 max-w-lg">{{ endpoint.description }}</p>
            </div>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <BaseCard class="border border-muted-200 dark:border-muted-800 rounded-3xl p-6 bg-white/95 dark:bg-muted-900/95 backdrop-blur space-y-4">
            <h3 class="text-lg font-semibold text-muted-900 dark:text-white">Create a short link</h3>
            <pre class="rounded-2xl bg-muted-950/90 text-muted-100 p-5 text-xs overflow-x-auto border border-muted-800">
fetch('https://api.snaplink.dev/v1/links', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    originalUrl: 'https://alpha.launch',
    slug: 'alpha',
    visibility: 'private',
    expiresAt: '2025-12-31T23:59:59Z'
  })
})
  .then(res => res.json())
  .then(console.log)
            </pre>
          </BaseCard>

          <BaseCard class="border border-muted-200 dark:border-muted-800 rounded-3xl p-6 bg-white/95 dark:bg-muted-900/95 backdrop-blur space-y-4">
            <h3 class="text-lg font-semibold text-muted-900 dark:text-white">Listen for events</h3>
            <pre class="rounded-2xl bg-muted-950/90 text-muted-100 p-5 text-xs overflow-x-auto border border-muted-800">
// Example webhook payload
{
  "event": "payment.link.settled",
  "data": {
    "paymentLinkId": "pay_01j9cqs",
    "amount": 2480,
    "currency": "usd",
    "payer": {
      "email": "customer@example.com"
    },
    "metadata": {
      "invoiceId": "inv-4242"
    }
  },
  "deliveredAt": "2025-11-07T10:12:44Z"
}
            </pre>
          </BaseCard>
        </div>

        <BaseAlert color="info" variant="pastel" class="rounded-2xl">
          <template #icon>
            <Icon name="solar:info-circle-linear" class="size-5" />
          </template>
          <div class="space-y-2 text-sm text-muted-700 dark:text-muted-200">
            <p class="font-semibold">Need more?</p>
            <p>
              We’re adding SDKs and Postman collections next. Until then, reach out via <NuxtLink to="mailto:founder@snaplink.dev" class="text-primary-600 dark:text-primary-300 hover:underline">founder@snaplink.dev</NuxtLink> and we’ll unblock you fast.
            </p>
          </div>
        </BaseAlert>
      </div>
    </section>
  </div>
</template>


