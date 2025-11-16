<script setup lang="ts">
import PaymentLinkWizard from '~/components/payment/PaymentLinkWizard.vue'
import PaymentLinksToolbar from '~/components/payment/PaymentLinksToolbar.vue'
import PaymentLinksTable from '~/components/payment/PaymentLinksTable.vue'

definePageMeta({
  title: 'Payment Links',
  layout: 'dashboard',
})

const router = useRouter()
const route = useRoute()

const {
  filteredLinks,
  filters,
  statusOptions,
  currencyOptions,
  isLoading,
  error,
  fetchLinks,
  createLink,
  toggleLinkStatus,
  removeLink,
  copyLinkReference,
} = usePaymentLinks()

// Always fetch on mount to ensure API call is made
onMounted(async () => {
  if (import.meta.dev) {
    // eslint-disable-next-line no-console
    console.warn('[links.vue] onMounted - calling fetchLinks() with force: true')
  }
  
  // Wait a bit to ensure workspace is loaded
  await nextTick()
  await fetchLinks({ force: true })
})

const showWizard = ref(false)

const openWizard = () => {
  showWizard.value = true
}

const handleWizardCreated = (payload: any) => {
  createLink(payload)
}

const handleCopy = (reference: string) => {
  copyLinkReference(reference)
}

const handleToggle = (linkId: string) => {
  toggleLinkStatus(linkId)
}

const handleDelete = (linkId: string) => {
  removeLink(linkId)
}

const consumeWizardQuery = () => {
  if (route.query.wizard === 'create') {
    openWizard()
    router.replace({ query: { ...route.query, wizard: undefined } })
  }
}

watch(() => route.query.wizard, consumeWizardQuery)

onMounted(() => {
  consumeWizardQuery()
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
      </div>
    </div>

    <PaymentLinksToolbar
      v-model:search="filters.search"
      v-model:status="filters.status"
      v-model:currency="filters.currency"
      :status-options="statusOptions"
      :currency-options="currencyOptions"
      @create-link="openWizard"
    />

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached payment links
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

    <div v-if="!isLoading && filteredLinks.length === 0" class="py-16">
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

    <PaymentLinksTable
      v-else
      :links="filteredLinks"
      :is-loading="isLoading"
      @copy="handleCopy"
      @toggle="handleToggle"
      @remove="handleDelete"
    />

    <PaymentLinkWizard
      v-model:open="showWizard"
      @created="handleWizardCreated"
    />
  </div>
</template>

