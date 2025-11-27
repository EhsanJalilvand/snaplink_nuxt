<script setup lang="ts">
import { computed, watch, onMounted, ref } from '#imports'
import BulkLinkWizard from '~/components/url-shortener/BulkLinkWizard.vue'
import ShortenerLinksBulkActions from '~/components/url-shortener/ShortenerLinksBulkActions.vue'
import ShortenerLinksToolbar from '~/components/url-shortener/ShortenerLinksToolbar.vue'
import ShortenerLinksTable from '~/components/url-shortener/ShortenerLinksTable.vue'
import ShortenerLinksPagination from '~/components/url-shortener/ShortenerLinksPagination.vue'
import { useUrlShortenerLinks } from '~/composables/useUrlShortenerLinks'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import type { ShortenerLink } from '~/types/url-shortener'

definePageMeta({
  title: 'Bulk Links',
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()
const { workspaceId } = useWorkspaceContext()

const {
  items,
  isLoading,
  error,
  search,
  perPage,
  page,
  selectedIds,
  filteredItems,
  paginatedItems,
  totalPages,
  statusConfig,
  allVisibleSelected,
  selectionIndeterminate,
  hasSelection,
  fetchLinks,
  setSearch,
  setPerPage,
  setPage,
  clearSelection,
  toggleSelect,
  selectMany,
  removeLink,
  copyLink,
} = useUrlShortenerLinks()

// Filter to show only bulk-created links (mock: filter by title containing "bulk" or custom alias pattern)
// In real implementation, this would filter by a flag or metadata
const bulkLinks = computed(() => {
  // For now, show all links as mock data
  // In production, filter by bulk creation flag
  return items.value
})

// Override filteredItems to use bulkLinks
const filteredBulkLinks = computed(() => {
  if (!search.value.trim()) {
    return bulkLinks.value
  }
  const searchLower = search.value.toLowerCase()
  return bulkLinks.value.filter(link => 
    link.destinationUrl?.toLowerCase().includes(searchLower) ||
    link.shortUrl?.toLowerCase().includes(searchLower) ||
    link.title?.toLowerCase().includes(searchLower) ||
    link.shortCode?.toLowerCase().includes(searchLower)
  )
})

// Pagination for bulk links
const totalBulkPages = computed(() => {
  return Math.ceil(filteredBulkLinks.value.length / perPage.value)
})

const paginatedBulkLinks = computed(() => {
  const start = (page.value - 1) * perPage.value
  const end = start + perPage.value
  return filteredBulkLinks.value.slice(start, end)
})

// Fetch links when workspaceId is available
watch(workspaceId, (newWorkspaceId) => {
  if (newWorkspaceId) {
    fetchLinks({ force: true })
  }
}, { immediate: true })

// Also fetch on mount in case workspaceId is already available
onMounted(() => {
  if (workspaceId.value) {
    fetchLinks({ force: true })
  }
})

watch(
  () => route.query.page,
  (value) => {
    const parsed = Number.parseInt((value as string) ?? '1', 10)
    if (!Number.isNaN(parsed) && parsed > 0 && parsed !== page.value) {
      setPage(parsed)
    }
  },
  { immediate: true },
)

watch(
  () => route.query.perPage,
  (value) => {
    const parsed = Number.parseInt((value as string) ?? `${perPage.value}`, 10)
    if (!Number.isNaN(parsed) && parsed > 0 && parsed !== perPage.value) {
      setPerPage(parsed)
    }
  },
  { immediate: true },
)

watch([page, perPage], ([currentPage, currentPerPage]) => {
  router.replace({
    query: {
      ...route.query,
      page: currentPage > 1 ? currentPage : undefined,
      perPage: currentPerPage !== 10 ? currentPerPage : undefined,
    },
  })
})

const showBulkLinkWizard = ref(false)

const handleCreateBulkLinks = () => {
  showBulkLinkWizard.value = true
}

const handleBulkLinksCreated = async () => {
  // Refresh links list from API
  await fetchLinks({ force: true })
}

const handleCopyLink = (link: ShortenerLink) => {
  copyLink(link.shortUrl)
}

const handleDeleteLink = async (linkId: string) => {
  await removeLink(linkId)
  // Refresh links list after deletion
  await fetchLinks({ force: true })
}

const handleViewReport = () => {
  const ids = hasSelection.value ? selectedIds.value : paginatedBulkLinks.value.slice(0, 3).map((item) => item.id)
  router.push({
    path: '/dashboard/url-shortener/reports',
    query: {
      type: 'links',
      ids: ids.join(','),
    },
  })
}

const periodSearch = computed({
  get: () => search.value,
  set: (value: string) => setSearch(value),
})

const perPageModel = computed({
  get: () => perPage.value,
  set: (value: number) => setPerPage(value),
})

const currentPage = computed({
  get: () => page.value,
  set: (value: number) => setPage(value),
})

const handleToggleAll = (selected: boolean) => {
  selectMany(paginatedBulkLinks.value.map((item) => item.id), selected)
}

// Override allVisibleSelected for bulk links
const allBulkSelected = computed(() => {
  if (paginatedBulkLinks.value.length === 0) return false
  return paginatedBulkLinks.value.every(link => selectedIds.value.includes(link.id))
})

// Override selectionIndeterminate for bulk links
const bulkSelectionIndeterminate = computed(() => {
  const selectedCount = paginatedBulkLinks.value.filter(link => selectedIds.value.includes(link.id)).length
  return selectedCount > 0 && selectedCount < paginatedBulkLinks.value.length
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
          class="text-muted-800 dark:text-muted-100"
        >
          Bulk Links
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Manage and track links created through bulk operations.
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton variant="outline" :disabled="selectedIds.length === 0" @click="handleViewReport">
          <Icon name="ph:chart-line" class="size-4" />
          <span>Generate Bulk Report</span>
        </BaseButton>
        <BaseButton variant="primary" @click="handleCreateBulkLinks">
          <Icon name="ph:plus" class="size-4" />
          <span>Create Bulk Links</span>
        </BaseButton>
      </div>
    </div>

    <ShortenerLinksBulkActions
      :selected-count="selectedIds.length"
      @clear="clearSelection"
      @report="handleViewReport"
    />

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached links
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

    <ShortenerLinksToolbar
      v-model:search="periodSearch"
      v-model:per-page="perPageModel"
    />

    <div v-if="filteredBulkLinks.length === 0 && !isLoading" class="py-12">
      <BasePlaceholderPage
        title="No bulk links found"
        subtitle="Create your first bulk links using manual entry or CSV import."
      >
        <template #image>
          <Icon name="solar:layers-linear" class="size-16 text-muted-400" />
        </template>
        <BaseButton variant="primary" @click="handleCreateBulkLinks">
          <Icon name="ph:plus" class="size-4" />
          <span>Create Bulk Links</span>
        </BaseButton>
      </BasePlaceholderPage>
    </div>

    <ShortenerLinksTable
      v-else
      :links="paginatedBulkLinks"
      :selected-ids="selectedIds"
      :is-loading="isLoading"
      :all-selected="allBulkSelected"
      :indeterminate="bulkSelectionIndeterminate"
      :status-config="statusConfig"
      @toggle-all="handleToggleAll"
      @toggle-select="toggleSelect"
      @copy="handleCopyLink"
      @delete="handleDeleteLink"
    />

    <ShortenerLinksPagination
      v-if="filteredBulkLinks.length > 0"
      v-model:page="currentPage"
      :total-pages="totalBulkPages"
    />

    <BulkLinkWizard
      v-model:open="showBulkLinkWizard"
      @created="handleBulkLinksCreated"
    />
  </div>
</template>
