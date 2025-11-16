<script setup lang="ts">
import { definePageMeta } from '#imports'
import { usePaymentNotifications } from '~/composables/usePaymentNotifications'

definePageMeta({
  title: 'Payment Notifications',
  layout: 'dashboard',
})

const {
  channels,
  events,
  templates,
  previewSuccess,
  previewFailed,
  isLoading,
  error,
  fetchNotifications,
  setChannel,
  setEvent,
  updateTemplate,
  saveConfiguration,
} = usePaymentNotifications()

// Always fetch on mount to ensure API call is made
onMounted(async () => {
  if (import.meta.dev) {
    // eslint-disable-next-line no-console
    console.warn('[notifications.vue] onMounted - calling fetchNotifications() with force: true')
  }
  await fetchNotifications({ force: true })
})

const templateTokens = ['{{customer.name}}', '{{payment.id}}', '{{payment.amount}}', '{{payment.currency}}']

function handleChannelChange(channel: keyof typeof channels.value, value: boolean) {
  setChannel(channel, value)
}

function handleEventChange(eventKey: keyof typeof events.value, value: boolean) {
  setEvent(eventKey, value)
}

function handleTemplateInput(key: keyof typeof templates.value, event: Event) {
  const target = event.target as HTMLTextAreaElement | null
  if (!target) {
    return
  }
  updateTemplate(key, target.value)
}

const channelUpdater = (channel: keyof typeof channels.value) => (value: boolean) => {
  handleChannelChange(channel, value)
}

const eventUpdater = (eventKey: keyof typeof events.value) => (value: boolean) => {
  handleEventChange(eventKey, value)
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
        <BaseButton size="sm" variant="primary" :loading="isLoading" @click="saveConfiguration">
          <Icon name="ph:floppy-disk" class="size-4" />
          Save configuration
        </BaseButton>
      </div>
    </div>

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached notification settings
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

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
          <BaseSwitchBall :model-value="channels.email" variant="primary" @update:model-value="channelUpdater('email')" />
        </label>

        <label class="flex items-center justify-between rounded-xl border border-muted-200 bg-muted-50 px-4 py-3 text-sm font-medium dark:border-muted-700 dark:bg-muted-800">
          <div>
            Push notifications
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              iOS / Android admin console
            </BaseParagraph>
          </div>
          <BaseSwitchBall :model-value="channels.push" variant="primary" @update:model-value="channelUpdater('push')" />
        </label>

        <label class="flex items-center justify-between rounded-xl border border-muted-200 bg-muted-50 px-4 py-3 text-sm font-medium dark:border-muted-700 dark:bg-muted-800">
          <div>
            SMS alerts
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              High priority escalations only
            </BaseParagraph>
          </div>
          <BaseSwitchBall :model-value="channels.sms" variant="primary" @update:model-value="channelUpdater('sms')" />
        </label>

        <label class="flex items-center justify-between rounded-xl border border-muted-200 bg-muted-50 px-4 py-3 text-sm font-medium dark:border-muted-700 dark:bg-muted-800">
          <div>
            Webhook delivery
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              POST to https://api.snaplink.app/hooks
            </BaseParagraph>
          </div>
          <BaseSwitchBall :model-value="channels.webhook" variant="primary" @update:model-value="channelUpdater('webhook')" />
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
            <BaseSwitchBall :model-value="events.success" variant="primary" @update:model-value="eventUpdater('success')" />
          </label>
          <label class="flex items-center justify-between rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium dark:border-danger-900/40 dark:bg-danger-900/20">
            <span>Payment failed</span>
            <BaseSwitchBall :model-value="events.failed" variant="primary" @update:model-value="eventUpdater('failed')" />
          </label>
          <label class="flex items-center justify-between rounded-xl border border-info-200 bg-info-50 px-4 py-3 text-sm font-medium dark:border-info-900/40 dark:bg-info-900/20">
            <span>Refund issued</span>
            <BaseSwitchBall :model-value="events.refund" variant="primary" @update:model-value="eventUpdater('refund')" />
          </label>
          <label class="flex items-center justify-between rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm font-medium dark:border-warning-900/30 dark:bg-warning-900/20">
            <span>Dispute opened</span>
            <BaseSwitchBall :model-value="events.dispute" variant="primary" @update:model-value="eventUpdater('dispute')" />
          </label>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="flex flex-col gap-3">
            <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-900 dark:text-white">
              Success template (Email / Push)
            </BaseHeading>
            <textarea
              :value="templates.success"
              rows="8"
              class="w-full rounded-xl border border-muted-200 bg-white px-4 py-3 font-mono text-xs text-muted-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-muted-700 dark:bg-muted-900 dark:text-muted-100"
              @input="handleTemplateInput.bind(null, 'success')"
            />
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              Available tokens:
              <span v-for="(token, index) in templateTokens" :key="token">
                <code class="rounded bg-muted-100 px-1 py-0.5 text-[11px] font-mono text-muted-600 dark:bg-muted-800 dark:text-muted-300">{{ token }}</code>
                <span v-if="index < templateTokens.length - 1">, </span>
              </span>
            </BaseParagraph>
          </div>
          <div class="flex flex-col gap-3">
            <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-900 dark:text-white">
              Failure template
            </BaseHeading>
            <textarea
              :value="templates.failed"
              rows="8"
              class="w-full rounded-xl border border-muted-200 bg-white px-4 py-3 font-mono text-xs text-muted-800 focus:outline-none focus:ring-2 focus:ring-danger-500 dark:border-muted-700 dark:bg-muted-900 dark:text-muted-100"
              @input="handleTemplateInput.bind(null, 'failed')"
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
{{ previewSuccess }}</pre>
          </BaseCard>
          <BaseCard class="border border-muted-200/80 bg-white/80 p-4 dark:border-muted-700/60 dark:bg-muted-900/30">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Failure preview
            </BaseText>
            <pre class="mt-2 whitespace-pre-wrap rounded-xl bg-muted-100 p-3 text-xs text-muted-700 dark:bg-muted-800 dark:text-muted-200">
{{ previewFailed }}</pre>
          </BaseCard>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

