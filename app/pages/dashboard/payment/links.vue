<script setup lang="ts">
import PaymentLinkWizard from '~/components/payment/PaymentLinkWizard.vue'

definePageMeta({
  title: 'Payment Links',
  layout: 'dashboard',
})

const router = useRouter()
const route = useRoute()
const toaster = useNuiToasts()

const searchQuery = ref('')
const statusFilter = ref<'all' | 'active' | 'paused' | 'completed'>('all')
const currencyFilter = ref<'all' | 'USD' | 'EUR' | 'USDC'>('all')
const showWizard = ref(false)

const links = ref([
  {
    id: 'pay-001',
    name: 'Launch Bundle',
    reference: 'snap.link/pay/launch',
    amount: 420.0,
    currency: 'USD',
    payments: 186,
    conversion: 64.2,
    status: 'active',
    createdAt: '2024-02-11T10:20:00Z',
  },
  {
    id: 'pay-002',
    name: 'Pro Lifetime Access',
    reference: 'snap.link/pay/pro',
    amount: 1299.0,
    currency: 'USD',
    payments: 72,
    conversion: 51.8,
    status: 'completed',
    createdAt: '2024-02-01T14:35:00Z',
  },
  {
    id: 'pay-003',
    name: 'Escrow • Vendor Onboarding',
    reference: 'snap.link/pay/escrow',
    amount: 8400.0,
    currency: 'USDC',
    payments: 12,
    conversion: 88.4,
    status: 'active',
    createdAt: '2024-01-21T09:05:00Z',
  },
  {
    id: 'pay-004',
    name: 'Private Beta Access',
    reference: 'snap.link/pay/beta',
    amount: 89.0,
    currency: 'EUR',
    payments: 360,
    conversion: 71.5,
    status: 'paused',
    createdAt: '2024-02-14T16:15:00Z',
  },
])

const filteredLinks = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  return links.value.filter((link) => {
    const matchesQuery =
      !query ||
      link.name.toLowerCase().includes(query) ||
      link.reference.toLowerCase().includes(query) ||
      link.id.toLowerCase().includes(query)

    const matchesStatus = statusFilter.value === 'all' || link.status === statusFilter.value
    const matchesCurrency = currencyFilter.value === 'all' || link.currency === currencyFilter.value

    return matchesQuery && matchesStatus && matchesCurrency
  })
})

const openWizard = () => {
  showWizard.value = true
}

const handleWizardCreated = (payload: any) => {
  links.value.unshift({
    id: payload.id,
    name: payload.description || `Payment link ${payload.id.slice(-4)}`,
    reference: payload.link.replace('https://', ''),
    amount: payload.amount,
    currency: payload.currency,
    payments: 0,
    conversion: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
  })

  toaster.add({
    title: 'Payment link created',
    description: 'Your new payment link is ready to share.',
    icon: 'ph:check',
    color: 'success',
    progress: true,
  })
}

const handleCopy = (reference: string) => {
  navigator.clipboard.writeText(`https://${reference}`)
  toaster.add({
    title: 'Copied',
    description: 'Link copied to clipboard.',
    icon: 'ph:check',
    color: 'success',
    progress: true,
  })
}

const handleDisable = (linkId: string) => {
  const target = links.value.find((link) => link.id === linkId)
  if (target) {
    target.status = target.status === 'paused' ? 'active' : 'paused'
  }
}

const handleDelete = (linkId: string) => {
  links.value = links.value.filter((link) => link.id !== linkId)
  toaster.add({
    title: 'Link removed',
    description: 'Payment link deleted from your catalog.',
    icon: 'ph:trash',
    color: 'danger',
    progress: true,
  })
}

onMounted(() => {
  if (route.query.wizard === 'create') {
    openWizard()
    router.replace({ query: { ...route.query, wizard: undefined } })
  }
})
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
          Payment Links
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-1 text-muted-500 dark:text-muted-400">
          Curate branded, secure payment flows for any use case in seconds.
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton
          variant="outline"
          color="primary"
          to="/dashboard/payment/gateway"
        >
          <Icon name="solar:settings-linear" class="size-4" />
          Gateway settings
        </BaseButton>
        <BaseButton variant="primary" @click="openWizard">
          <Icon name="ph:plus" class="size-4" />
          New payment link
        </BaseButton>
      </div>
    </div>

    <TairoContentWrapper>
      <template #left>
        <TairoInput
          v-model="searchQuery"
          icon="lucide:search"
          placeholder="Search links or IDs"
          rounded="lg"
        />
      </template>
      <template #right>
        <div class="flex items-center gap-2">
          <TairoSelect
            v-model="statusFilter"
            icon="solar:filter-linear"
            rounded="lg"
            class="w-36"
          >
            <BaseSelectItem value="all">All statuses</BaseSelectItem>
            <BaseSelectItem value="active">Active</BaseSelectItem>
            <BaseSelectItem value="paused">Paused</BaseSelectItem>
            <BaseSelectItem value="completed">Completed</BaseSelectItem>
          </TairoSelect>
          <TairoSelect
            v-model="currencyFilter"
            icon="solar:money-bag-linear"
            rounded="lg"
            class="w-32"
          >
            <BaseSelectItem value="all">All FX</BaseSelectItem>
            <BaseSelectItem value="USD">USD</BaseSelectItem>
            <BaseSelectItem value="EUR">EUR</BaseSelectItem>
            <BaseSelectItem value="USDC">USDC</BaseSelectItem>
          </TairoSelect>
        </div>
      </template>

      <div v-if="filteredLinks.length === 0" class="py-16">
        <BasePlaceholderPage
          title="No payment links found"
          subtitle="Spin up your first payment flow and start collecting revenue."
        >
          <template #image>
            <Icon name="solar:wallet-bold-duotone" class="size-16 text-primary-500" />
          </template>
          <BaseButton variant="primary" @click="openWizard">
            <Icon name="ph:rocket-launch" class="size-4" />
            Launch payment link
          </BaseButton>
        </BasePlaceholderPage>
      </div>

      <div v-else class="space-y-3">
        <TairoFlexTable>
          <template #header>
            <TairoFlexTableHeading type="grow" class="justify-start">
              Link
            </TairoFlexTableHeading>
            <TairoFlexTableHeading type="stable" class="justify-start">
              Amount
            </TairoFlexTableHeading>
            <TairoFlexTableHeading type="stable" class="justify-start">
              Payments
            </TairoFlexTableHeading>
            <TairoFlexTableHeading type="stable" class="justify-start">
              Conversion
            </TairoFlexTableHeading>
            <TairoFlexTableHeading type="stable" class="justify-start">
              Status
            </TairoFlexTableHeading>
            <TairoFlexTableHeading type="stable" class="justify-start">
              Created
            </TairoFlexTableHeading>
            <TairoFlexTableHeading type="shrink" class="justify-end">
              Actions
            </TairoFlexTableHeading>
          </template>

          <TairoFlexTableRow
            v-for="link in filteredLinks"
            :key="link.id"
            rounded="lg"
          >
            <TairoFlexTableCell type="grow" data-content="Link">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <BaseHeading
                    as="h4"
                    size="sm"
                    weight="semibold"
                    class="text-muted-900 dark:text-white"
                  >
                    {{ link.name }}
                  </BaseHeading>
                  <BaseChip
                    v-if="link.currency === 'USDC'"
                    color="primary"
                    size="xs"
                  >
                    On-chain
                  </BaseChip>
                </div>
                <div class="flex items-center gap-2 text-xs text-muted-500 dark:text-muted-400">
                  <span class="font-mono">{{ link.reference }}</span>
                  <BaseButton
                    size="sm"
                    variant="ghost"
                    icon
                    class="rounded-full"
                    @click="handleCopy(link.reference)"
                  >
                    <Icon name="ph:copy" class="size-3" />
                  </BaseButton>
                </div>
              </div>
            </TairoFlexTableCell>

            <TairoFlexTableCell type="stable" data-content="Amount">
              <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                {{ link.amount.toLocaleString('en-US', { style: 'currency', currency: link.currency === 'USDC' ? 'USD' : link.currency }) }}
                <span v-if="link.currency === 'USDC'" class="text-xs text-muted-400 dark:text-muted-500">USDC</span>
              </BaseText>
            </TairoFlexTableCell>

            <TairoFlexTableCell type="stable" data-content="Payments">
              <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                {{ link.payments.toLocaleString() }}
              </BaseText>
            </TairoFlexTableCell>

            <TairoFlexTableCell type="stable" data-content="Conversion">
              <BaseChip color="success" size="sm">
                {{ link.conversion }}%
              </BaseChip>
            </TairoFlexTableCell>

            <TairoFlexTableCell type="stable" data-content="Status">
              <BaseChip
                :color="link.status === 'active' ? 'success' : link.status === 'paused' ? 'warning' : 'muted'"
                size="sm"
              >
                <span class="capitalize">{{ link.status }}</span>
              </BaseChip>
            </TairoFlexTableCell>

            <TairoFlexTableCell type="stable" data-content="Created">
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                {{ new Date(link.createdAt).toLocaleString() }}
              </BaseText>
            </TairoFlexTableCell>

            <TairoFlexTableCell type="shrink" data-content="Actions">
              <div class="flex items-center gap-1">
                <BaseButton
                  size="sm"
                  variant="ghost"
                  icon
                  class="rounded-full"
                  :to="`/dashboard/payment/links`"
                >
                  <Icon name="ph:eye" class="size-4" />
                </BaseButton>
                <BaseButton
                  size="sm"
                  variant="ghost"
                  icon
                  class="rounded-full"
                  @click="handleDisable(link.id)"
                >
                  <Icon :name="link.status === 'paused' ? 'ph:play-circle' : 'ph:pause-circle'" class="size-4" />
                </BaseButton>
                <BaseButton
                  size="sm"
                  variant="ghost"
                  icon
                  color="danger"
                  class="rounded-full"
                  @click="handleDelete(link.id)"
                >
                  <Icon name="ph:trash" class="size-4" />
                </BaseButton>
              </div>
            </TairoFlexTableCell>
          </TairoFlexTableRow>
        </TairoFlexTable>
      </div>
    </TairoContentWrapper>

    <PaymentLinkWizard
      v-model:open="showWizard"
      @created="handleWizardCreated"
    />
  </div>
</template>

