<script setup lang="ts">
definePageMeta({
  title: 'Payment Notifications',
  layout: 'dashboard',
})

const channels = ref({
  email: true,
  push: true,
  sms: false,
  webhook: true,
})

const events = ref({
  success: true,
  failed: true,
  refund: true,
  dispute: false,
})

const templates = ref({
  success: `Hi {{customer.name}},

Payment {{payment.id}} for {{payment.amount}} {{payment.currency}} is complete.

Thanks for trusting SnapLink.`,
  failed: `Heads up team,

Payment {{payment.id}} for {{payment.amount}} {{payment.currency}} failed due to {{payment.error}}.

Review in the payment console.`,
})

const previewContext = computed(() => ({
  customer: {
    name: 'Ava Stone',
    email: 'ava@snaplink.app',
  },
  payment: {
    id: 'TX-8453',
    amount: '420.00',
    currency: 'USD',
    error: 'Insufficient funds',
  },
}))

const formatPreview = (template: string) => {
  return template
    .replace(/{{customer.name}}/g, previewContext.value.customer.name)
    .replace(/{{payment.id}}/g, previewContext.value.payment.id)
    .replace(/{{payment.amount}}/g, previewContext.value.payment.amount)
    .replace(/{{payment.currency}}/g, previewContext.value.payment.currency)
    .replace(/{{payment.error}}/g, previewContext.value.payment.error)
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
          Notification Playbooks
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Orchestrate multi-channel alerts for every payment lifecycle event.
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton size="sm" variant="outline" color="primary">
          <Icon name="ph:share-network" class="size-4" />
          Sync to Slack
        </BaseButton>
        <BaseButton size="sm" variant="primary">
          <Icon name="ph:floppy-disk" class="size-4" />
          Save configuration
        </BaseButton>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <BaseCard class="xl:col-span-1 flex flex-col gap-4 p-6">
        <div>
          <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
            Delivery channels
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            Activate the surfaces where your team needs signal.
          </BaseParagraph>
        </div>

        <label class="flex items-center justify-between rounded-xl border border-muted-200 bg-muted-50 px-4 py-3 text-sm font-medium dark:border-muted-700 dark:bg-muted-800">
          <div>
            Email alerts
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              Deliver to finance@snaplink.app
            </BaseParagraph>
          </div>
          <BaseSwitchBall v-model="channels.email" variant="primary" />
        </label>

        <label class="flex items-center justify-between rounded-xl border border-muted-200 bg-muted-50 px-4 py-3 text-sm font-medium dark:border-muted-700 dark:bg-muted-800">
          <div>
            Push notifications
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              iOS / Android admin console
            </BaseParagraph>
          </div>
          <BaseSwitchBall v-model="channels.push" variant="primary" />
        </label>

        <label class="flex items-center justify-between rounded-xl border border-muted-200 bg-muted-50 px-4 py-3 text-sm font-medium dark:border-muted-700 dark:bg-muted-800">
          <div>
            SMS alerts
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              High priority escalations only
            </BaseParagraph>
          </div>
          <BaseSwitchBall v-model="channels.sms" variant="primary" />
        </label>

        <label class="flex items-center justify-between rounded-xl border border-muted-200 bg-muted-50 px-4 py-3 text-sm font-medium dark:border-muted-700 dark:bg-muted-800">
          <div>
            Webhook delivery
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              POST to https://api.snaplink.app/hooks
            </BaseParagraph>
          </div>
          <BaseSwitchBall v-model="channels.webhook" variant="primary" />
        </label>
      </BaseCard>

      <BaseCard class="xl:col-span-2 flex flex-col gap-6 p-6">
        <div>
          <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
            Trigger matrix
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            Select which events should raise alerts across each channel.
          </BaseParagraph>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="flex items-center justify-between rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm font-medium dark:border-success-900/40 dark:bg-success-900/20">
            <span>Payment successful</span>
            <BaseSwitchBall v-model="events.success" variant="primary" />
          </label>
          <label class="flex items-center justify-between rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium dark:border-danger-900/40 dark:bg-danger-900/20">
            <span>Payment failed</span>
            <BaseSwitchBall v-model="events.failed" variant="primary" />
          </label>
          <label class="flex items-center justify-between rounded-xl border border-info-200 bg-info-50 px-4 py-3 text-sm font-medium dark:border-info-900/40 dark:bg-info-900/20">
            <span>Refund issued</span>
            <BaseSwitchBall v-model="events.refund" variant="primary" />
          </label>
          <label class="flex items-center justify-between rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm font-medium dark:border-warning-900/30 dark:bg-warning-900/20">
            <span>Dispute opened</span>
            <BaseSwitchBall v-model="events.dispute" variant="primary" />
          </label>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="flex flex-col gap-3">
            <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-900 dark:text-white">
              Success template (Email / Push)
            </BaseHeading>
            <textarea
              v-model="templates.success"
              rows="8"
              class="w-full rounded-xl border border-muted-200 bg-white px-4 py-3 font-mono text-xs text-muted-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-muted-700 dark:bg-muted-900 dark:text-muted-100"
            />
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              Available tokens:
              {{ '{' }}{{ '{' }}customer.name{{ '}' }}{{ '}' }},
              {{ '{' }}{{ '{' }}payment.id{{ '}' }}{{ '}' }},
              {{ '{' }}{{ '{' }}payment.amount{{ '}' }}{{ '}' }},
              {{ '{' }}{{ '{' }}payment.currency{{ '}' }}{{ '}' }}.
            </BaseParagraph>
          </div>
          <div class="flex flex-col gap-3">
            <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-900 dark:text-white">
              Failure template
            </BaseHeading>
            <textarea
              v-model="templates.failed"
              rows="8"
              class="w-full rounded-xl border border-muted-200 bg-white px-4 py-3 font-mono text-xs text-muted-800 focus:outline-none focus:ring-2 focus:ring-danger-500 dark:border-muted-700 dark:bg-muted-900 dark:text-muted-100"
            />
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              Include escalation details for refund, failed, or dispute events.
            </BaseParagraph>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BaseCard class="border border-muted-200/80 bg-white/80 p-4 dark:border-muted-700/60 dark:bg-muted-900/30">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Success preview
            </BaseText>
            <pre class="mt-2 whitespace-pre-wrap rounded-xl bg-muted-100 p-3 text-xs text-muted-700 dark:bg-muted-800 dark:text-muted-200">
{{ formatPreview(templates.success) }}</pre>
          </BaseCard>
          <BaseCard class="border border-muted-200/80 bg-white/80 p-4 dark:border-muted-700/60 dark:bg-muted-900/30">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Failure preview
            </BaseText>
            <pre class="mt-2 whitespace-pre-wrap rounded-xl bg-muted-100 p-3 text-xs text-muted-700 dark:bg-muted-800 dark:text-muted-200">
{{ formatPreview(templates.failed) }}</pre>
          </BaseCard>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

