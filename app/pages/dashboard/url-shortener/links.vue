<script setup lang="ts">
import { callOnce, computed, watch } from '#imports'
import CreateLinkWizard from '~/components/url-shortener/CreateLinkWizard.vue'
import ShortenerLinksHeader from '~/components/url-shortener/ShortenerLinksHeader.vue'
import ShortenerLinksBulkActions from '~/components/url-shortener/ShortenerLinksBulkActions.vue'
import ShortenerLinksToolbar from '~/components/url-shortener/ShortenerLinksToolbar.vue'
import ShortenerLinksTable from '~/components/url-shortener/ShortenerLinksTable.vue'
import ShortenerLinksPagination from '~/components/url-shortener/ShortenerLinksPagination.vue'
import { useUrlShortenerLinks } from '~/composables/useUrlShortenerLinks'
import type { ShortenerLink } from '~/types/url-shortener'

definePageMeta({
  title: 'Links',
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()

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

await callOnce(() => fetchLinks())

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

const showCreateLinkWizard = ref(false)

const handleCreateLink = () => {
  showCreateLinkWizard.value = true
}

const handleLinkCreated = async (payload: any) => {
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
  const ids = hasSelection.value ? selectedIds.value : items.value.slice(0, 3).map((item) => item.id)
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
  selectMany(paginatedItems.value.map((item) => item.id), selected)
}
</script>

<template>
  <div class="space-y-6 py-6">
    <ShortenerLinksHeader
      :selected-count="selectedIds.length"
      @report="handleViewReport"
      @create="handleCreateLink"
    />

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

    <div v-if="filteredItems.length === 0 && !isLoading" class="py-12">
      <BasePlaceholderPage
        title="No links found"
        subtitle="Create your first shortened link to get started."
      >
        <template #image>
          <Icon name="solar:link-linear" class="size-16 text-muted-400" />
        </template>
        <BaseButton variant="primary" @click="handleCreateLink">
          <Icon name="ph:plus" class="size-4" />
          <span>Create Your First Link</span>
        </BaseButton>
      </BasePlaceholderPage>
    </div>

    <ShortenerLinksTable
      v-else
      :links="paginatedItems"
      :selected-ids="selectedIds"
      :is-loading="isLoading"
      :all-selected="allVisibleSelected"
      :indeterminate="selectionIndeterminate"
      :status-config="statusConfig"
      @toggle-all="handleToggleAll"
      @toggle-select="toggleSelect"
      @copy="handleCopyLink"
      @delete="handleDeleteLink"
    />

    <ShortenerLinksPagination
      v-if="filteredItems.length > 0"
      v-model:page="currentPage"
      :total-pages="totalPages"
    />

    <CreateLinkWizard
      v-model:open="showCreateLinkWizard"
      @created="handleLinkCreated"
    />
  </div>
</template>

