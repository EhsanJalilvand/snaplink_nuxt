<script setup lang="ts">
definePageMeta({
  title: 'Merchant Gateway',
  layout: 'dashboard',
})

const gateways = ref([
  {
    id: 'gw-1',
    name: 'Stripe US',
    status: 'active',
    mode: 'Live',
    volumeShare: 45,
    lastSync: '3 mins ago',
    latency: '184 ms',
  },
  {
    id: 'gw-2',
    name: 'Adyen EU',
    status: 'active',
    mode: 'Live',
    volumeShare: 28,
    lastSync: '12 mins ago',
    latency: '212 ms',
  },
  {
    id: 'gw-3',
    name: 'Circle USDC',
    status: 'standby',
    mode: 'Sandbox',
    volumeShare: 17,
    lastSync: '58 mins ago',
    latency: '164 ms',
  },
])

const webhook = ref({
  url: 'https://api.snaplink.app/webhooks/payment',
  secret: 'whsec_live_4f98d1f0c1',
  retries: 3,
  events: ['payment.success', 'payment.failed', 'payment.refunded'],
})

const compliance = ref({
  maxTransaction: 25000,
  dailyVolume: 250000,
  allowedCurrencies: ['USD', 'EUR', 'USDC'],
  riskProfile: 'Adaptive',
})

const report = ref([
  {
    id: '#TX-8453',
    gateway: 'Stripe US',
    method: 'Card • Visa',
    amount: 480.65,
    currency: 'USD',
    status: 'Captured',
    createdAt: '2024-02-14T12:42:00Z',
  },
  {
    id: '#TX-8452',
    gateway: 'Adyen EU',
    method: 'iDEAL',
    amount: 189.0,
    currency: 'EUR',
    status: 'Settled',
    createdAt: '2024-02-14T12:05:00Z',
  },
  {
    id: '#TX-8451',
    gateway: 'Circle USDC',
    method: 'Crypto • USDC',
    amount: 5600.0,
    currency: 'USDC',
    status: 'Pending',
    createdAt: '2024-02-14T11:20:00Z',
  },
])

const availableEvents = [
  { label: 'Payment successful', value: 'payment.success' },
  { label: 'Payment failed', value: 'payment.failed' },
  { label: 'Payment pending', value: 'payment.pending' },
  { label: 'Refund requested', value: 'payment.refund.requested' },
  { label: 'Refund processed', value: 'payment.refunded' },
  { label: 'Dispute opened', value: 'payment.dispute.opened' },
]

const toggleGateway = (gatewayId: string) => {
  const target = gateways.value.find((gateway) => gateway.id === gatewayId)
  if (target) {
    target.status = target.status === 'active' ? 'standby' : 'active'
  }
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
          Merchant Gateway Orchestration
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Route transactions intelligently, manage failover, and stay compliant across processors.
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton
          variant="outline"
          color="primary"
          size="sm"
        >
          <Icon name="ph:chart-line-up" class="size-4" />
          Performance analytics
        </BaseButton>
        <BaseButton variant="primary" size="sm">
          <Icon name="ph:plus" class="size-4" />
          Add gateway
        </BaseButton>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-5">
      <!-- Manage gateways -->
      <BaseCard class="xl:col-span-3 p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
              Connected processors
            </BaseHeading>
            <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
              Define routing strategy, availability zones, and traffic shares.
            </BaseParagraph>
          </div>
          <BaseButton variant="ghost" size="sm">
            <Icon name="ph:gear-six" class="size-4" />
            Routing rules
          </BaseButton>
        </div>

        <div class="mt-6 space-y-4">
          <BaseCard
            v-for="gateway in gateways"
            :key="gateway.id"
            class="border border-muted-200/80 bg-white/80 p-4 dark:border-muted-700/60 dark:bg-muted-900/40"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="space-y-1">
                <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-900 dark:text-white">
                  {{ gateway.name }}
                </BaseHeading>
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  {{ gateway.mode }} mode • Last synced {{ gateway.lastSync }} • Latency {{ gateway.latency }}
                </BaseText>
              </div>

              <div class="flex items-center gap-3">
                <div class="text-right">
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    Volume share
                  </BaseText>
                  <BaseHeading as="span" size="md" weight="bold" class="text-primary-500">
                    {{ gateway.volumeShare }}%
                  </BaseHeading>
                </div>
                <BaseChip :color="gateway.status === 'active' ? 'success' : 'warning'" size="sm">
                  {{ gateway.status }}
                </BaseChip>
                <BaseSwitchBall
                  :model-value="gateway.status === 'active'"
                  variant="primary"
                  @update:modelValue="toggleGateway(gateway.id)"
                />
              </div>
            </div>
          </BaseCard>
        </div>
      </BaseCard>

      <!-- Webhook settings -->
      <BaseCard class="xl:col-span-2 flex flex-col gap-5 p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
              Webhook delivery
            </BaseHeading>
            <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
              Stream payment events into your operational stack.
            </BaseParagraph>
          </div>
          <BaseButton size="sm" variant="ghost" icon class="rounded-full">
            <Icon name="ph:arrow-clockwise" class="size-4" />
          </BaseButton>
        </div>

        <TairoFormGroup label="Callback URL">
          <TairoInput
            v-model="webhook.url"
            type="url"
            icon="solar:globe-bold-duotone"
            rounded="lg"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Signing secret">
          <div class="flex items-center gap-2 rounded-xl border border-muted-200 bg-muted-50 px-4 py-3 font-mono text-xs text-muted-700 dark:border-muted-700 dark:bg-muted-800 dark:text-muted-200">
            <span>{{ webhook.secret }}</span>
            <BaseButton size="sm" variant="ghost" icon class="rounded-full" @click="navigator.clipboard.writeText(webhook.secret)">
              <Icon name="ph:copy" class="size-4" />
            </BaseButton>
          </div>
        </TairoFormGroup>

        <TairoFormGroup label="Retry attempts">
          <TairoInput
            v-model.number="webhook.retries"
            type="number"
            min="0"
            max="10"
            icon="solar:refresh-circle-linear"
            rounded="lg"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Subscribed events">
          <div class="space-y-2">
            <label
              v-for="event in availableEvents"
              :key="event.value"
              class="flex items-center justify-between rounded-xl border border-muted-200 bg-muted-50 px-4 py-3 text-sm font-medium dark:border-muted-700 dark:bg-muted-800"
            >
              <span>{{ event.label }}</span>
              <BaseSwitchBall
                :model-value="webhook.events.includes(event.value)"
                variant="primary"
                size="sm"
                @update:modelValue="(checked) => {
                  if (checked && !webhook.events.includes(event.value)) {
                    webhook.events.push(event.value)
                  } else if (!checked) {
                    webhook.events = webhook.events.filter(item => item !== event.value)
                  }
                }"
              />
            </label>
          </div>
        </TairoFormGroup>
      </BaseCard>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <BaseCard class="lg:col-span-1 flex flex-col gap-4 p-6">
        <div>
          <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
            Currency & limits
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            Enforce risk guardrails and treasury controls.
          </BaseParagraph>
        </div>

        <TairoFormGroup label="Max transaction value">
          <TairoInput
            v-model.number="compliance.maxTransaction"
            type="number"
            min="100"
            icon="solar:shield-check-linear"
            rounded="lg"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Daily volume ceiling">
          <TairoInput
            v-model.number="compliance.dailyVolume"
            type="number"
            min="1000"
            icon="solar:graph-linear"
            rounded="lg"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Allowed currencies">
          <div class="flex flex-wrap gap-2">
            <BaseChip
              v-for="currency in compliance.allowedCurrencies"
              :key="currency"
              size="sm"
              color="muted"
            >
              {{ currency }}
              <button
                type="button"
                class="ml-1 text-muted-500 transition hover:text-danger-500"
                @click="compliance.allowedCurrencies = compliance.allowedCurrencies.filter((item) => item !== currency)"
              >
                ×
              </button>
            </BaseChip>
          </div>
        </TairoFormGroup>

        <TairoFormGroup label="Risk management profile">
          <TairoSelect v-model="compliance.riskProfile" icon="solar:aim-bold-duotone" rounded="lg">
            <BaseSelectItem value="Adaptive">Adaptive (AI-driven)</BaseSelectItem>
            <BaseSelectItem value="Strict">Strict (manual escalation)</BaseSelectItem>
            <BaseSelectItem value="Custom">Custom (rule builder)</BaseSelectItem>
          </TairoSelect>
        </TairoFormGroup>
      </BaseCard>

      <BaseCard class="lg:col-span-2 p-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-white">
              Transaction feed
            </BaseHeading>
            <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
              Trace payments across providers with unified observability.
            </BaseParagraph>
          </div>
          <BaseButton size="sm" variant="ghost">
            Export CSV
          </BaseButton>
        </div>

        <div class="mt-4 rounded-2xl border border-muted-200 bg-muted-50/70 dark:border-muted-700/60 dark:bg-muted-900/40">
          <div class="grid grid-cols-6 gap-3 border-b border-muted-200 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-400 dark:border-muted-800">
            <span>Txn ID</span>
            <span>Gateway</span>
            <span>Method</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Created</span>
          </div>
          <div class="divide-y divide-muted-200 text-sm dark:divide-muted-800">
            <div
              v-for="item in report"
              :key="item.id"
              class="grid grid-cols-6 gap-3 px-4 py-3 hover:bg-white/70 dark:hover:bg-muted-800/30"
            >
              <span class="font-mono text-xs text-muted-500 dark:text-muted-400">
                {{ item.id }}
              </span>
              <span class="text-muted-700 dark:text-muted-200">
                {{ item.gateway }}
              </span>
              <span class="text-muted-500 dark:text-muted-400">
                {{ item.method }}
              </span>
              <span class="font-medium text-muted-900 dark:text-white">
                {{ item.amount.toLocaleString('en-US', { style: 'currency', currency: item.currency === 'USDC' ? 'USD' : item.currency }) }}
                <span v-if="item.currency === 'USDC'" class="text-xs text-muted-400">USDC</span>
              </span>
              <BaseChip
                size="xs"
                :color="item.status === 'Captured' ? 'success' : item.status === 'Settled' ? 'primary' : 'warning'"
              >
                {{ item.status }}
              </BaseChip>
              <span class="text-xs text-muted-500 dark:text-muted-400">
                {{ new Date(item.createdAt).toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

