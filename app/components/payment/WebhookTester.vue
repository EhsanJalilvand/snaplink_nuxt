<script setup lang="ts">
import type { Webhook } from '~/types/payment-gateway'

interface Props {
  webhook: Webhook
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: false,
})

const emit = defineEmits<{
  test: [id: string]
  update: [id: string, updates: Partial<Webhook>]
  delete: [id: string]
}>()

const toaster = useNuiToasts()

const isTesting = ref(false)
const testResult = ref<{
  status: 'success' | 'failed' | null
  response?: any
  error?: string
  timestamp?: string
}>({ status: null })

const statusConfig = {
  success: {
    label: 'Delivered',
    color: 'success',
    icon: 'solar:check-circle-bold-duotone',
  },
  failed: {
    label: 'Failed',
    color: 'danger',
    icon: 'solar:close-circle-bold-duotone',
  },
  pending: {
    label: 'Pending',
    color: 'muted',
    icon: 'solar:clock-circle-bold-duotone',
  },
} as const

const handleTest = async () => {
  isTesting.value = true
  testResult.value = { status: null }
  
  emit('test', props.webhook.id)
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Mock result (replace with actual API call)
  testResult.value = {
    status: Math.random() > 0.3 ? 'success' : 'failed',
    timestamp: new Date().toISOString(),
    response: Math.random() > 0.3
      ? { status: 200, message: 'Webhook delivered successfully' }
      : { status: 500, error: 'Connection timeout' },
  }
  
  isTesting.value = false
  
  if (testResult.value.status === 'success') {
    toaster.add({
      title: 'Webhook test successful',
      description: 'Webhook was delivered successfully',
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })
  } else {
    toaster.add({
      title: 'Webhook test failed',
      description: testResult.value.error || 'Failed to deliver webhook',
      icon: 'ph:warning',
      color: 'warning',
      progress: true,
    })
  }
}

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return 'Never'
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <BaseCard
    class="border border-muted-200/80 bg-white/80 p-6 dark:border-muted-700/60 dark:bg-muted-900/40"
  >
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <Icon
              name="solar:webhook-bold-duotone"
              class="size-5 text-primary-500"
            />
            <BaseHeading
              as="h4"
              size="sm"
              weight="semibold"
              class="text-muted-900 dark:text-white"
            >
              Webhook Endpoint
            </BaseHeading>
            <BaseChip
              v-if="webhook.isActive"
              size="xs"
              color="success"
              variant="pastel"
            >
              Active
            </BaseChip>
            <BaseChip
              v-else
              size="xs"
              color="muted"
              variant="pastel"
            >
              Inactive
            </BaseChip>
          </div>
          <BaseText size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
            {{ webhook.url }}
          </BaseText>
        </div>
        <BaseButton
          :variant="webhook.isActive ? 'primary' : 'outline'"
          size="sm"
          :loading="isTesting"
          @click="handleTest"
        >
          <Icon name="solar:play-circle-bold-duotone" class="size-4" />
          Test Webhook
        </BaseButton>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-4 gap-4 rounded-xl border border-muted-200 bg-muted-50/50 p-4 dark:border-muted-700 dark:bg-muted-900/30">
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Last Success
          </BaseText>
          <BaseText size="sm" weight="medium" class="mt-0.5 text-muted-700 dark:text-muted-300">
            {{ formatTimestamp(webhook.lastSuccessAt) }}
          </BaseText>
        </div>
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Last Failure
          </BaseText>
          <BaseText size="sm" weight="medium" class="mt-0.5 text-muted-700 dark:text-muted-300">
            {{ formatTimestamp(webhook.lastFailureAt) }}
          </BaseText>
        </div>
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Failures
          </BaseText>
          <BaseText
            size="sm"
            weight="medium"
            class="mt-0.5"
            :class="webhook.failureCount > 0 ? 'text-danger-600 dark:text-danger-400' : 'text-muted-700 dark:text-muted-300'"
          >
            {{ webhook.failureCount }}
          </BaseText>
        </div>
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Retries
          </BaseText>
          <BaseText size="sm" weight="medium" class="mt-0.5 text-muted-700 dark:text-muted-300">
            {{ webhook.retries }}
          </BaseText>
        </div>
      </div>

      <!-- Test Result -->
      <div
        v-if="testResult.status"
        class="rounded-xl border p-4"
        :class="[
          testResult.status === 'success'
            ? 'border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20'
            : 'border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-900/20',
        ]"
      >
        <div class="flex items-start gap-3">
          <Icon
            :name="statusConfig[testResult.status].icon"
            class="size-5 shrink-0 mt-0.5"
            :class="`text-${statusConfig[testResult.status].color}-500`"
          />
          <div class="flex-1">
            <BaseText
              size="sm"
              weight="medium"
              :class="`text-${statusConfig[testResult.status].color}-700 dark:text-${statusConfig[testResult.status].color}-300`"
            >
              {{ statusConfig[testResult.status].label }}
            </BaseText>
            <BaseText
              v-if="testResult.timestamp"
              size="xs"
              class="mt-0.5 text-muted-500 dark:text-muted-400"
            >
              Tested {{ formatTimestamp(testResult.timestamp) }}
            </BaseText>
            <div
              v-if="testResult.response"
              class="mt-2 rounded-lg border border-muted-200 bg-white p-3 dark:border-muted-700 dark:bg-muted-900"
            >
              <BaseText
                size="xs"
                class="font-mono text-muted-600 dark:text-muted-400"
              >
                <pre class="whitespace-pre-wrap">{{ JSON.stringify(testResult.response, null, 2) }}</pre>
              </BaseText>
            </div>
          </div>
        </div>
      </div>

      <!-- Events -->
      <div>
        <BaseText size="xs" class="mb-2 text-muted-500 dark:text-muted-400">
          Subscribed Events ({{ webhook.events.length }})
        </BaseText>
        <div class="flex flex-wrap gap-2">
          <BaseChip
            v-for="event in webhook.events"
            :key="event"
            size="xs"
            color="primary"
            variant="pastel"
          >
            {{ event }}
          </BaseChip>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

