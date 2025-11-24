<script setup lang="ts">
import SmartLinkWizard from '~/components/url-shortener/SmartLinkWizard.vue'
import SmartLinksTable from '~/components/url-shortener/SmartLinksTable.vue'
import { useSmartLinks } from '~/composables/useSmartLinks'
import { useUrlShortenerLinks } from '~/composables/useUrlShortenerLinks'
import { useUrlShortenerCollections } from '~/composables/useUrlShortenerCollections'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'

definePageMeta({
  title: 'SmartLinks',
  layout: 'dashboard',
})

const { workspaceId } = useWorkspaceContext()
const {
  items: smartLinks,
  isLoading,
  error,
  fetchSmartLinks,
} = useSmartLinks()

const {
  items: linkItems,
  fetchLinks,
  copyLink,
} = useUrlShortenerLinks()

const {
  items: collectionItems,
  fetchCollections,
} = useUrlShortenerCollections()

const toasts = useNuiToasts()
const showWizard = ref(false)

const collectionLookup = computed(() => {
  return collectionItems.value.reduce<Record<string, string>>((acc, collection) => {
    acc[collection.id] = collection.name
    return acc
  }, {})
})

const linkLookup = computed(() => {
  return linkItems.value.reduce<Record<string, string>>((acc, link) => {
    acc[link.id] = link.shortUrl || link.destinationUrl
    return acc
  }, {})
})

const hydrate = async () => {
  if (!workspaceId.value) {
    return
  }
  await Promise.all([
    fetchSmartLinks({ force: true }),
    fetchLinks({ force: true }),
    fetchCollections({ force: true }),
  ])
}

watch(workspaceId, () => {
  hydrate()
}, { immediate: true })

const handleCreated = async () => {
  showWizard.value = false
  await fetchSmartLinks({ force: true })
}

const handleCopy = async (shortUrl: string) => {
  if (!shortUrl) {
    return
  }

  copyLink(shortUrl)
  toasts.add({
    title: 'Copied',
    description: 'SmartLink copied to clipboard.',
    color: 'success',
    icon: 'ph:copy-simple',
  })
}

const openWizard = () => {
  showWizard.value = true
}

const refreshSmartLinks = () => {
  fetchSmartLinks({ force: true })
}
</script>

<template>
  <div class="space-y-6 py-6">
    <BaseCard class="p-6">
      <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div class="flex-1 space-y-2">
          <BaseTag color="primary" rounded="full" size="sm">
            AI routing
          </BaseTag>
          <BaseHeading as="h2" size="xl" weight="bold">
            Launch SmartLinks for every campaign
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 max-w-2xl">
            Route visitors to tailored destinations based on geo, device, schedule, or any custom signal. AI watches performance and suggests optimizations automatically.
          </BaseParagraph>
          <div class="flex flex-wrap gap-4 text-sm text-muted-500 dark:text-muted-400">
            <div class="flex items-center gap-2">
              <Icon name="solar:map-point-wave-linear" class="size-4 text-primary-500" />
              Geo/device targeting
            </div>
            <div class="flex items-center gap-2">
              <Icon name="solar:bot-linear" class="size-4 text-primary-500" />
              AI suggestions
            </div>
            <div class="flex items-center gap-2">
              <Icon name="solar:shield-check-linear" class="size-4 text-primary-500" />
              Password & limits
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <BaseButton
            variant="outline"
            color="primary"
            @click="refreshSmartLinks"
          >
            <Icon name="solar:refresh-linear" class="size-4" />
            Refresh
          </BaseButton>
          <BaseButton
            color="primary"
            size="lg"
            @click="openWizard"
          >
            <Icon name="ph:plus" class="size-5" />
            Create SmartLink
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-xl"
    >
      <template #title>
        Using cached SmartLinks
      </template>
      {{ error }}
    </BaseAlert>

    <SmartLinksTable
      :smart-links="smartLinks"
      :is-loading="isLoading"
      :collection-lookup="collectionLookup"
      :link-lookup="linkLookup"
      @copy="handleCopy"
    />

    <SmartLinkWizard
      v-model:open="showWizard"
      @created="handleCreated"
    />
  </div>
</template>


