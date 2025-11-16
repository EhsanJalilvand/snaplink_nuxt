<script setup lang="ts">
import type { Webhook, ApiKey } from '~/types/payment-gateway'

interface Props {
  webhooks: Webhook[]
  apiKeys: ApiKey[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:webhooks': [value: Webhook[]]
  'update:apiKeys': [value: ApiKey[]]
}>()

const localWebhooks = ref<Webhook[]>([...props.webhooks])
const localApiKeys = ref<ApiKey[]>([...props.apiKeys])

const availableEvents = [
  { label: 'Payment Successful', value: 'payment.success' },
  { label: 'Payment Failed', value: 'payment.failed' },
  { label: 'Payment Pending', value: 'payment.pending' },
  { label: 'Refund Requested', value: 'payment.refund.requested' },
  { label: 'Refund Processed', value: 'payment.refunded' },
  { label: 'Dispute Opened', value: 'payment.dispute.opened' },
  { label: 'Dispute Resolved', value: 'payment.dispute.resolved' },
  { label: 'Settlement Completed', value: 'settlement.completed' },
]

const newWebhookUrl = ref('')
const webhookEvents = ref<string[]>([])

const addWebhook = () => {
  if (!newWebhookUrl.value.trim()) return
  
  const webhook: Webhook = {
    id: Math.random().toString(36).substring(7),
    url: newWebhookUrl.value,
    secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
    events: [...webhookEvents.value],
    retries: 3,
    timeout: 30,
    isActive: true,
    failureCount: 0,
    createdAt: new Date().toISOString(),
  }
  
  localWebhooks.value = [...localWebhooks.value, webhook]
  newWebhookUrl.value = ''
  webhookEvents.value = []
  emit('update:webhooks', localWebhooks.value)
}

const removeWebhook = (id: string) => {
  localWebhooks.value = localWebhooks.value.filter(w => w.id !== id)
  emit('update:webhooks', localWebhooks.value)
}

const toggleWebhookEvent = (webhookId: string, event: string) => {
  const webhook = localWebhooks.value.find(w => w.id === webhookId)
  if (!webhook) return
  
  if (webhook.events.includes(event)) {
    webhook.events = webhook.events.filter(e => e !== event)
  } else {
    webhook.events = [...webhook.events, event]
  }
  
  emit('update:webhooks', localWebhooks.value)
}

const generateApiKey = (mode: 'sandbox' | 'live', name: string) => {
  const apiKey: ApiKey = {
    id: Math.random().toString(36).substring(7),
    name,
    key: `pk_${mode}_${Math.random().toString(36).substring(2, 15)}`,
    secret: `sk_${mode}_${Math.random().toString(36).substring(2, 32)}`,
    mode,
    permissions: ['read', 'write'],
    createdAt: new Date().toISOString(),
    isActive: true,
  }
  
  localApiKeys.value = [...localApiKeys.value, apiKey]
  emit('update:apiKeys', localApiKeys.value)
}

const removeApiKey = (id: string) => {
  localApiKeys.value = localApiKeys.value.filter(k => k.id !== id)
  emit('update:apiKeys', localApiKeys.value)
}

watch(() => props.webhooks, (newValue) => {
  if (newValue) localWebhooks.value = [...newValue]
}, { deep: true })

watch(() => props.apiKeys, (newValue) => {
  if (newValue) localApiKeys.value = [...newValue]
}, { deep: true })
</script>

<template>
  <div class="space-y-8">
    <div>
      <BaseHeading
        as="h3"
        size="lg"
        weight="semibold"
        class="text-muted-900 dark:text-white"
      >
        API Configuration
      </BaseHeading>
      <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
        Configure API keys and webhook endpoints for integration.
      </BaseParagraph>
    </div>

    <!-- Webhooks Section -->
    <BaseCard class="p-6">
      <div class="mb-6">
        <BaseHeading
          as="h4"
          size="md"
          weight="semibold"
          class="text-muted-900 dark:text-white"
        >
          Webhook Endpoints
        </BaseHeading>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          Configure webhooks to receive real-time payment events
        </BaseText>
      </div>

      <!-- Existing Webhooks -->
      <div
        v-if="localWebhooks.length > 0"
        class="mb-6 space-y-4"
      >
        <div
          v-for="webhook in localWebhooks"
          :key="webhook.id"
          class="rounded-xl border border-muted-200 bg-muted-50/50 p-4 dark:border-muted-700 dark:bg-muted-900/30"
        >
          <div class="mb-4 flex items-start justify-between">
            <div class="flex-1">
              <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                {{ webhook.url }}
              </BaseText>
              <BaseText size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
                Secret: {{ webhook.secret.substring(0, 12) }}•••
              </BaseText>
            </div>
            <BaseButton
              size="sm"
              variant="ghost"
              icon
              color="danger"
              @click="removeWebhook(webhook.id)"
            >
              <Icon name="solar:trash-bin-minimalistic-bold-duotone" class="size-4" />
            </BaseButton>
          </div>

          <!-- Webhook Events -->
          <div>
            <BaseText size="xs" class="mb-2 text-muted-500 dark:text-muted-400">
              Subscribed Events
            </BaseText>
            <div class="flex flex-wrap gap-2">
              <BaseChip
                v-for="event in availableEvents"
                :key="event.value"
                size="xs"
                :color="webhook.events.includes(event.value) ? 'primary' : 'muted'"
                variant="pastel"
                class="cursor-pointer"
                @click="toggleWebhookEvent(webhook.id, event.value)"
              >
                {{ webhook.events.includes(event.value) ? '✓' : '' }} {{ event.label }}
              </BaseChip>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Webhook Form -->
      <div class="space-y-4 rounded-xl border border-dashed border-muted-300 p-4 dark:border-muted-700">
        <TairoFormGroup label="Webhook URL">
          <TairoInput
            v-model="newWebhookUrl"
            type="url"
            placeholder="https://api.example.com/webhooks/payment"
            icon="solar:global-bold-duotone"
            size="lg"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Events to Subscribe">
          <div class="flex flex-wrap gap-2">
            <BaseChip
              v-for="event in availableEvents"
              :key="event.value"
              size="xs"
              :color="webhookEvents.includes(event.value) ? 'primary' : 'muted'"
              variant="pastel"
              class="cursor-pointer"
              @click="webhookEvents.includes(event.value) 
                ? webhookEvents = webhookEvents.filter(e => e !== event.value)
                : webhookEvents.push(event.value)"
            >
              {{ webhookEvents.includes(event.value) ? '✓' : '' }} {{ event.label }}
            </BaseChip>
          </div>
        </TairoFormGroup>

        <BaseButton
          variant="outline"
          size="sm"
          :disabled="!newWebhookUrl.trim()"
          @click="addWebhook"
        >
          <Icon name="solar:add-circle-bold-duotone" class="size-4" />
          Add Webhook
        </BaseButton>
      </div>
    </BaseCard>

    <!-- API Keys Section -->
    <BaseCard class="p-6">
      <div class="mb-6">
        <BaseHeading
          as="h4"
          size="md"
          weight="semibold"
          class="text-muted-900 dark:text-white"
        >
          API Keys
        </BaseHeading>
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          Generate API keys for sandbox and live environments
        </BaseText>
      </div>

      <!-- Existing API Keys -->
      <div
        v-if="localApiKeys.length > 0"
        class="mb-6 space-y-4"
      >
        <div
          v-for="key in localApiKeys"
          :key="key.id"
          class="flex items-center justify-between rounded-xl border border-muted-200 bg-muted-50/50 px-4 py-3 dark:border-muted-700 dark:bg-muted-900/30"
        >
          <div class="flex items-center gap-3">
            <Icon
              :name="key.mode === 'live' ? 'solar:rocket-2-bold-duotone' : 'solar:test-tube-minimalistic-bold-duotone'"
              class="size-5"
              :class="key.mode === 'live' ? 'text-success-500' : 'text-warning-500'"
            />
            <div>
              <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                {{ key.name }}
              </BaseText>
              <BaseText size="xs" class="font-mono text-muted-500 dark:text-muted-400">
                {{ key.key }}
              </BaseText>
            </div>
          </div>
          <BaseButton
            size="sm"
            variant="ghost"
            icon
            color="danger"
            @click="removeApiKey(key.id)"
          >
            <Icon name="solar:trash-bin-minimalistic-bold-duotone" class="size-4" />
          </BaseButton>
        </div>
      </div>

      <!-- Generate API Keys -->
      <div class="grid grid-cols-2 gap-4">
        <BaseButton
          variant="outline"
          size="lg"
          class="flex flex-col gap-2"
          @click="generateApiKey('sandbox', 'Sandbox Key')"
        >
          <Icon name="solar:test-tube-minimalistic-bold-duotone" class="size-5 text-warning-500" />
          Generate Sandbox Key
        </BaseButton>
        <BaseButton
          variant="outline"
          size="lg"
          class="flex flex-col gap-2"
          @click="generateApiKey('live', 'Live Key')"
        >
          <Icon name="solar:rocket-2-bold-duotone" class="size-5 text-success-500" />
          Generate Live Key
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

