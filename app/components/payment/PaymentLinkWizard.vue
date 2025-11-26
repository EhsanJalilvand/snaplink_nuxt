<script setup lang="ts">
const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [link: any]
}>()

const toaster = useNuiToasts()

const isOpen = computed({
  get: () => props.open,
  set: (value) => {
    emit('update:open', value)
    if (!value) {
      resetWizard()
    }
  },
})

const totalSteps = 5
const currentStep = ref(1)

const form = ref({
  type: 'one-time', // one-time | escrow
  description: '',
  amount: 250,
  currency: 'USD',
  wallet: 'USDC-PRIMARY',
  memo: '',
  expiration: '',
  paymentLimit: 10,
  notifications: {
    email: true,
    sms: false,
    webhook: true,
  },
  allowPartial: false,
  requireCustomerDetails: true,
})

const reviewDetails = computed(() => [
  { label: 'Payment type', value: form.value.type === 'one-time' ? 'One-time payment' : 'Escrow release' },
  { label: 'Amount', value: `${form.value.amount.toLocaleString('en-US', { style: 'currency', currency: form.value.currency })}` },
  { label: 'Destination wallet', value: form.value.wallet },
  { label: 'Expiration', value: form.value.expiration ? new Date(form.value.expiration).toLocaleString() : 'No expiration' },
  { label: 'Payment limit', value: form.value.paymentLimit ? `${form.value.paymentLimit} payments` : 'Unlimited' },
  { label: 'Notifications', value: Object.entries(form.value.notifications).filter(([, enabled]) => enabled).map(([channel]) => channel.toUpperCase()).join(', ') || 'None' },
  { label: 'Customer details', value: form.value.requireCustomerDetails ? 'Required' : 'Optional' },
])

const linkPreview = ref({
  url: '',
  qr: '',
})

const currencies = [
  { label: 'USD • United States Dollar', value: 'USD' },
  { label: 'EUR • Euro', value: 'EUR' },
  { label: 'GBP • British Pound', value: 'GBP' },
  { label: 'USDC • USD Coin', value: 'USDC' },
]

const wallets = [
  { label: 'USDC Treasury • Multisig', value: 'USDC-PRIMARY' },
  { label: 'Fiat Reserve • JPMorgan', value: 'FIAT-RESERVE' },
  { label: 'Escrow Vault • Anchorage', value: 'ESCROW-ANCHORAGE' },
]

const nextStep = () => {
  if (currentStep.value === 2) {
    if (!form.value.amount || form.value.amount <= 0) {
      toaster.add({
        title: 'Amount required',
        description: 'Please enter a positive amount.',
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      return
    }
  }

  if (currentStep.value < totalSteps) {
    currentStep.value++
    if (currentStep.value === 4) {
      generatePreview()
    }
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const resetWizard = () => {
  currentStep.value = 1
  form.value = {
    type: 'one-time',
    description: '',
    amount: 250,
    currency: 'USD',
    wallet: 'USDC-PRIMARY',
    memo: '',
    expiration: '',
    paymentLimit: 10,
    notifications: {
      email: true,
      sms: false,
      webhook: true,
    },
    allowPartial: false,
    requireCustomerDetails: true,
  }
  linkPreview.value = {
    url: '',
    qr: '',
  }
}

const { getQRCodeUrl } = useQRCode()

const generatePreview = () => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  linkPreview.value.url = `https://snap.link/pay/${code}`
  linkPreview.value.qr = getQRCodeUrl(linkPreview.value.url, 280)
}

const completeWizard = () => {
  emit('created', {
    id: Date.now().toString(),
    ...form.value,
    link: linkPreview.value.url,
    createdAt: new Date().toISOString(),
    status: 'active',
  })

  toaster.add({
    title: 'Payment link published',
    description: 'Share your link with customers or embed the QR code.',
    icon: 'ph:check-circle',
    color: 'success',
    progress: true,
  })

  isOpen.value = false
}
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogPortal>
      <DialogOverlay class="bg-muted-900/70 fixed inset-0 z-50 backdrop-blur-sm" />
      <DialogContent
        class="fixed top-[4%] start-1/2 z-[100] flex max-h-[92vh] w-[92vw] max-w-3xl -translate-x-1/2 overflow-hidden rounded-2xl border border-muted-200 bg-white shadow-2xl focus:outline-none dark:border-muted-700 dark:bg-muted-900"
      >
        <div class="flex w-full flex-col">
          <div class="flex items-center justify-between border-b border-muted-200 px-6 py-5 dark:border-muted-800">
            <div>
              <DialogTitle class="font-heading text-xl font-semibold text-muted-900 dark:text-white">
                Launch Payment Link
              </DialogTitle>
              <DialogDescription class="text-sm text-muted-500 dark:text-muted-400">
                Step {{ currentStep }} of {{ totalSteps }} • Design, secure, and publish a tailored payment flow.
              </DialogDescription>
            </div>
            <BaseButton
              size="sm"
              variant="ghost"
              icon
              class="rounded-full"
              @click="isOpen = false"
            >
              <Icon name="lucide:x" class="size-4" />
            </BaseButton>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-5">
            <div class="mb-6 h-2 rounded-full bg-muted-200 dark:bg-muted-800">
              <div
                class="h-full rounded-full bg-primary-500 transition-all duration-300"
                :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
              />
            </div>

            <!-- Step 1: Payment Type -->
            <div v-if="currentStep === 1" class="space-y-6">
              <div>
                <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-900 dark:text-white">
                  Choose payment infrastructure
                </BaseHeading>
                <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
                  Select between an instant checkout link or an escrow-protected experience.
                </BaseParagraph>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <button
                  type="button"
                  class="flex h-full flex-col gap-3 rounded-2xl border p-5 text-left transition hover:border-primary-400"
                  :class="form.type === 'one-time'
                    ? 'border-primary-500 bg-primary-50/70 dark:border-primary-400 dark:bg-primary-900/20'
                    : 'border-muted-200 dark:border-muted-700'"
                  @click="form.type = 'one-time'"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold text-muted-900 dark:text-white">
                      Instant checkout
                    </span>
                    <Icon
                      name="solar:check-circle-bold-duotone"
                      class="size-5 text-primary-500"
                      v-if="form.type === 'one-time'"
                    />
                  </div>
                  <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                    Collect funds immediately with support for card, wallet, and crypto settlements.
                  </BaseParagraph>
                  <div class="rounded-xl bg-white/80 p-4 shadow-sm dark:bg-muted-800/80">
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                      Ideal for
                    </BaseText>
                    <ul class="mt-2 space-y-1 text-xs text-muted-600 dark:text-muted-300">
                      <li>• Digital downloads & memberships</li>
                      <li>• Early access and presales</li>
                      <li>• Paywalls with dynamic pricing</li>
                    </ul>
                  </div>
                </button>

                <button
                  type="button"
                  class="flex h-full flex-col gap-3 rounded-2xl border p-5 text-left transition hover:border-primary-400"
                  :class="form.type === 'escrow'
                    ? 'border-primary-500 bg-primary-50/70 dark:border-primary-400 dark:bg-primary-900/20'
                    : 'border-muted-200 dark:border-muted-700'"
                  @click="form.type = 'escrow'"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold text-muted-900 dark:text-white">
                      Escrow workflow
                    </span>
                    <Icon
                      name="solar:check-circle-bold-duotone"
                      class="size-5 text-primary-500"
                      v-if="form.type === 'escrow'"
                    />
                  </div>
                  <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                    Funds are held until milestones are confirmed by both merchant and buyer.
                  </BaseParagraph>
                  <div class="rounded-xl bg-white/80 p-4 shadow-sm dark:bg-muted-800/80">
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                      Ideal for
                    </BaseText>
                    <ul class="mt-2 space-y-1 text-xs text-muted-600 dark:text-muted-300">
                      <li>• Marketplace transactions</li>
                      <li>• B2B onboarding and procurement</li>
                      <li>• Dispute-safe payouts</li>
                    </ul>
                  </div>
                </button>
              </div>
            </div>

            <!-- Step 2: Payment details -->
            <div v-else-if="currentStep === 2" class="space-y-6">
              <div>
                <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-900 dark:text-white">
                  Payment parameters
                </BaseHeading>
                <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
                  Define the amount, settlement currency, and target wallet.
                </BaseParagraph>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TairoFormGroup label="Amount" required>
                  <TairoInput
                    v-model.number="form.amount"
                    type="number"
                    min="1"
                    step="0.01"
                    icon="solar:card-linear"
                    rounded="lg"
                  />
                </TairoFormGroup>

                <TairoFormGroup label="Currency" required>
                  <TairoSelect
                    v-model="form.currency"
                    icon="solar:money-bag-linear"
                    rounded="lg"
                  >
                    <BaseSelectItem
                      v-for="currency in currencies"
                      :key="currency.value"
                      :value="currency.value"
                    >
                      {{ currency.label }}
                    </BaseSelectItem>
                  </TairoSelect>
                </TairoFormGroup>
              </div>

              <TairoFormGroup label="Destination wallet" required>
                <TairoSelect
                  v-model="form.wallet"
                  icon="solar:wallet-bold-duotone"
                  rounded="lg"
                >
                  <BaseSelectItem
                    v-for="wallet in wallets"
                    :key="wallet.value"
                    :value="wallet.value"
                  >
                    {{ wallet.label }}
                  </BaseSelectItem>
                </TairoSelect>
              </TairoFormGroup>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TairoFormGroup label="Internal memo (optional)">
                  <textarea
                    v-model="form.memo"
                    rows="3"
                    placeholder="Visible to your team for reconciliation and payout batching."
                    class="w-full rounded-lg border border-muted-200 bg-white px-4 py-3 text-sm text-muted-800 placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-muted-700 dark:bg-muted-900 dark:text-muted-100 dark:placeholder:text-muted-500"
                  />
                </TairoFormGroup>

                <TairoFormGroup label="Allow partial payments">
                  <div class="flex items-center justify-between rounded-xl border border-muted-200 px-4 py-3 dark:border-muted-700">
                    <div>
                      <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
                        Enable split settlement
                      </BaseText>
                      <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                        Let customers pay the invoice in multiple transfers.
                      </BaseParagraph>
                    </div>
                    <BaseSwitchBall
                      v-model="form.allowPartial"
                      variant="primary"
                    />
                  </div>
                </TairoFormGroup>
              </div>
            </div>

            <!-- Step 3: Link settings -->
            <div v-else-if="currentStep === 3" class="space-y-6">
              <div>
                <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-900 dark:text-white">
                  Link controls & notifications
                </BaseHeading>
                <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
                  Set expiration rules, payment limits, and alert channels.
                </BaseParagraph>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TairoFormGroup label="Expiration date">
                  <TairoInput
                    v-model="form.expiration"
                    type="datetime-local"
                    icon="solar:calendar-linear"
                    rounded="lg"
                  />
                </TairoFormGroup>

                <TairoFormGroup label="Maximum payments">
                  <TairoInput
                    v-model.number="form.paymentLimit"
                    type="number"
                    min="0"
                    icon="solar:users-group-rounded-linear"
                    rounded="lg"
                  />
                  <BaseParagraph size="xs" class="mt-2 text-muted-500 dark:text-muted-400">
                    Set to zero for unlimited usage.
                  </BaseParagraph>
                </TairoFormGroup>
              </div>

              <div class="rounded-2xl border border-muted-200 bg-white/80 p-4 dark:border-muted-700 dark:bg-muted-900/30">
                <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                  Notification channels
                </BaseText>
                <BaseParagraph size="xs" class="mt-1 text-muted-500 dark:text-muted-400">
                  Decide how your team receives real-time payment events.
                </BaseParagraph>

                <div class="mt-4 grid gap-3 md:grid-cols-3">
                  <label class="flex cursor-pointer items-center justify-between rounded-xl border border-muted-200 bg-muted-50 px-4 py-3 text-sm font-medium transition hover:border-primary-300 dark:border-muted-700 dark:bg-muted-800 dark:hover:border-primary-700">
                    <span>Email alerts</span>
                    <BaseSwitchBall
                      v-model="form.notifications.email"
                      variant="primary"
                      size="sm"
                    />
                  </label>
                  <label class="flex cursor-pointer items-center justify-between rounded-xl border border-muted-200 bg-muted-50 px-4 py-3 text-sm font-medium transition hover:border-primary-300 dark:border-muted-700 dark:bg-muted-800 dark:hover:border-primary-700">
                    <span>SMS / Push</span>
                    <BaseSwitchBall
                      v-model="form.notifications.sms"
                      variant="primary"
                      size="sm"
                    />
                  </label>
                  <label class="flex cursor-pointer items-center justify-between rounded-xl border border-muted-200 bg-muted-50 px-4 py-3 text-sm font-medium transition hover:border-primary-300 dark:border-muted-700 dark:bg-muted-800 dark:hover:border-primary-700">
                    <span>Webhook events</span>
                    <BaseSwitchBall
                      v-model="form.notifications.webhook"
                      variant="primary"
                      size="sm"
                    />
                  </label>
                </div>
              </div>

              <div class="rounded-2xl border border-muted-200 bg-white/80 p-4 dark:border-muted-700 dark:bg-muted-900/30">
                <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                  Checkout requirements
                </BaseText>
                <div class="mt-4 flex items-center justify-between">
                  <div>
                    <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
                      Collect customer identity
                    </BaseText>
                    <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                      Name, email, billing country, and optional tax ID.
                    </BaseParagraph>
                  </div>
                  <BaseSwitchBall
                    v-model="form.requireCustomerDetails"
                    variant="primary"
                  />
                </div>
              </div>
            </div>

            <!-- Step 4: Review -->
            <div v-else-if="currentStep === 4" class="space-y-6">
              <div>
                <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-900 dark:text-white">
                  Review configuration
                </BaseHeading>
                <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
                  Validate payment logic, operational controls, and alert policies before launch.
                </BaseParagraph>
              </div>

              <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <BaseCard class="space-y-4 border border-muted-200/80 bg-white/70 p-5 dark:border-muted-700/60 dark:bg-muted-900/40">
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    Payment details
                  </BaseText>
                  <div class="space-y-3 text-sm text-muted-700 dark:text-muted-200">
                    <div v-for="detail in reviewDetails" :key="detail.label">
                      <div class="text-xs uppercase tracking-wide text-muted-400 dark:text-muted-500">
                        {{ detail.label }}
                      </div>
                      <div class="font-medium">
                        {{ detail.value }}
                      </div>
                    </div>
                  </div>
                </BaseCard>

                <BaseCard class="space-y-4 border border-muted-200/80 bg-white/70 p-5 dark:border-muted-700/60 dark:bg-muted-900/40">
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    Risk & automations
                  </BaseText>
                  <ul class="space-y-3 text-sm text-muted-700 dark:text-muted-200">
                    <li class="flex items-center gap-2">
                      <Icon name="solar:shield-check-bold-duotone" class="size-5 text-success-500" />
                      Velocity rules enabled for high-value payments.
                    </li>
                    <li class="flex items-center gap-2">
                      <Icon name="solar:bell-bold-duotone" class="size-5 text-primary-500" />
                      Notifications mirrored to Slack via webhook automation.
                    </li>
                    <li class="flex items-center gap-2">
                      <Icon name="solar:graph-new-bold-duotone" class="size-5 text-info-500" />
                      Conversion tracking active with UTM attribution.
                    </li>
                  </ul>
                </BaseCard>
              </div>
            </div>

            <!-- Step 5: Publish -->
            <div v-else class="space-y-6">
              <div class="text-center">
                <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30">
                  <Icon name="solar:rocket-bold-duotone" class="size-8 text-success-500 dark:text-success-300" />
                </div>
                <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-900 dark:text-white">
                  Payment link is live
                </BaseHeading>
                <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
                  Share the short link or embed the QR code in your surface.
                </BaseParagraph>
              </div>

              <div class="rounded-2xl border border-muted-200 bg-white/70 p-5 dark:border-muted-700/60 dark:bg-muted-900/40">
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  Link URL
                </BaseText>
                <div class="mt-2 flex items-center justify-between rounded-xl border border-muted-200 bg-muted-50 px-4 py-3 font-mono text-sm text-muted-800 dark:border-muted-700 dark:bg-muted-800/60 dark:text-muted-100">
                  <span>{{ linkPreview.url }}</span>
                  <BaseButton size="sm" variant="ghost" icon class="rounded-full" @click="navigator.clipboard.writeText(linkPreview.url)">
                    <Icon name="ph:copy" class="size-4" />
                  </BaseButton>
                </div>
              </div>

              <div class="flex flex-col gap-4 md:flex-row">
                <div class="flex-1 rounded-2xl border border-muted-200 bg-white/70 p-5 dark:border-muted-700/60 dark:bg-muted-900/40">
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    QR code
                  </BaseText>
                  <div class="mt-3 flex items-center justify-center rounded-xl border border-dashed border-primary-200 bg-primary-50/40 p-6 dark:border-primary-900/40 dark:bg-primary-900/20">
                    <img
                      :src="linkPreview.qr"
                      alt="QR code"
                      class="size-48 rounded-lg border border-white shadow-sm"
                    />
                  </div>
                  <div class="mt-3 flex items-center gap-2">
                    <BaseButton size="sm" variant="outline" class="flex-1" @click="navigator.clipboard.writeText(linkPreview.url)">
                      <Icon name="ph:share-network" class="size-4" />
                      Share
                    </BaseButton>
                    <BaseButton size="sm" variant="primary" class="flex-1" @click="window.open(linkPreview.qr, '_blank')">
                      <Icon name="ph:download" class="size-4" />
                      Download
                    </BaseButton>
                  </div>
                </div>

                <div class="flex-1 rounded-2xl border border-muted-200 bg-white/70 p-5 dark:border-muted-700/60 dark:bg-muted-900/40">
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    Distribution toolkit
                  </BaseText>
                  <div class="mt-3 space-y-4 text-sm text-muted-700 dark:text-muted-200">
                    <div class="flex gap-3 rounded-xl border border-muted-200 bg-muted-50/60 p-4 dark:border-muted-700 dark:bg-muted-800/40">
                      <Icon name="solar:code-circle-bold-duotone" class="size-5 text-primary-500" />
                      <div>
                        <div class="font-medium">Embed snippet</div>
                        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                          Drop-in React and Vue components for direct checkout embedding.
                        </BaseParagraph>
                      </div>
                    </div>
                    <div class="flex gap-3 rounded-xl border border-muted-200 bg-muted-50/60 p-4 dark:border-muted-700 dark:bg-muted-800/40">
                      <Icon name="solar:graph-linear" class="size-5 text-success-500" />
                      <div>
                        <div class="font-medium">Analytics auto-tag</div>
                        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                          Auto-inject UTM parameters for performance reporting.
                        </BaseParagraph>
                      </div>
                    </div>
                    <div class="flex gap-3 rounded-xl border border-muted-200 bg-muted-50/60 p-4 dark:border-muted-700 dark:bg-muted-800/40">
                      <Icon name="solar:bell-linear" class="size-5 text-warning-500" />
                      <div>
                        <div class="font-medium">Notify your team</div>
                        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                          Broadcast to Slack, email, and PagerDuty in one click.
                        </BaseParagraph>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between border-t border-muted-200 px-6 py-4 dark:border-muted-800">
            <BaseButton
              variant="ghost"
              @click="isOpen = false"
            >
              Cancel
            </BaseButton>
            <div class="flex items-center gap-2">
              <BaseButton
                v-if="currentStep > 1"
                variant="outline"
                @click="prevStep"
              >
                <Icon name="lucide:chevron-left" class="size-4" />
                Back
              </BaseButton>
              <BaseButton
                v-if="currentStep < totalSteps"
                variant="primary"
                @click="nextStep"
              >
                Next
                <Icon name="lucide:chevron-right" class="size-4" />
              </BaseButton>
              <BaseButton
                v-else
                variant="primary"
                @click="completeWizard"
              >
                <Icon name="ph:rocket-launch" class="size-4" />
                Publish link
              </BaseButton>
            </div>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

