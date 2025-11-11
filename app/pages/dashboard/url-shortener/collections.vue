<script setup lang="ts">
import { callOnce, computed, watch } from '#imports'
import CreateCollectionWizard from '~/components/url-shortener/CreateCollectionWizard.vue'
import ShortenerCollectionsHeader from '~/components/url-shortener/ShortenerCollectionsHeader.vue'
import ShortenerCollectionsBulkActions from '~/components/url-shortener/ShortenerCollectionsBulkActions.vue'
import ShortenerCollectionsToolbar from '~/components/url-shortener/ShortenerCollectionsToolbar.vue'
import ShortenerCollectionsTable from '~/components/url-shortener/ShortenerCollectionsTable.vue'
import ShortenerCollectionsPagination from '~/components/url-shortener/ShortenerCollectionsPagination.vue'
import { useUrlShortenerCollections } from '~/composables/useUrlShortenerCollections'
import type { ShortenerCollection } from '~/types/url-shortener'

definePageMeta({
  title: 'Collections',
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
  allSelected,
  selectionIndeterminate,
  hasSelection,
  statusColorClass,
  fetchCollections,
  setSearch,
  setPerPage,
  setPage,
  clearSelection,
  toggleSelect,
  toggleSelectMany,
  createCollection,
  removeCollection,
} = useUrlShortenerCollections()

await callOnce(() => fetchCollections())

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

watch(
  () => route.query.search,
  (value) => {
    const next = typeof value === 'string' ? value : ''
    if (next !== search.value) {
      setSearch(next)
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
      search: search.value ? search.value : undefined,
    },
  })
})

const showCreateWizard = ref(false)

const handleCreateCollection = () => {
  showCreateWizard.value = true
}

const handleCollectionCreated = (payload: any) => {
  const collection: ShortenerCollection = {
    id: payload.id,
    name: payload.name,
    description: payload.description || '',
    linkCount: payload.linkCount ?? 0,
    totalClicks: payload.links?.reduce((sum: number, link: { clicks: number }) => sum + (link.clicks ?? 0), 0) ?? 0,
    createdAt: payload.createdAt ?? new Date().toISOString(),
    color: payload.color ?? 'primary',
  }

  createCollection(collection)
}

const handleBulkReport = (collectionId?: string) => {
  const ids = collectionId
    ? [collectionId]
    : hasSelection.value
      ? selectedIds.value
      : items.value.slice(0, 2).map((item) => item.id)
  router.push({
    path: '/dashboard/url-shortener/reports',
    query: {
      type: 'collections',
      ids: ids.join(','),
    },
  })
}

const handleDeleteCollection = (collectionId: string) => {
  removeCollection(collectionId)
}

const searchModel = computed({
  get: () => search.value,
  set: (value: string) => setSearch(value),
})

const perPageModel = computed({
  get: () => perPage.value,
  set: (value: number) => setPerPage(value),
})

const pageModel = computed({
  get: () => page.value,
  set: (value: number) => setPage(value),
})

const handleToggleAll = (selected: boolean) => {
  toggleSelectMany(paginatedItems.value.map((item) => item.id), selected)
}
</script>

<template>
  <div class="space-y-6 py-6">
    <ShortenerCollectionsHeader
      :selected-count="selectedIds.length"
      @report="handleBulkReport"
      @create="handleCreateCollection"
    />

    <ShortenerCollectionsBulkActions
      :selected-count="selectedIds.length"
      @clear="clearSelection"
      @report="handleBulkReport"
    />

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached collections
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

    <ShortenerCollectionsToolbar
      v-model:search="searchModel"
      v-model:per-page="perPageModel"
    />

    <div v-if="filteredItems.length === 0 && !isLoading" class="py-12">
      <BasePlaceholderPage
        title="No collections found"
        subtitle="Create your first collection to organize your links."
      >
        <template #image>
          <Icon name="solar:folder-linear" class="size-16 text-muted-400" />
        </template>
        <BaseButton variant="primary" @click="handleCreateCollection">
          <Icon name="ph:plus" class="size-4" />
          <span>Create Your First Collection</span>
        </BaseButton>
      </BasePlaceholderPage>
    </div>

    <ShortenerCollectionsTable
      v-else
      :collections="paginatedItems"
      :selected-ids="selectedIds"
      :is-loading="isLoading"
      :all-selected="allSelected"
      :indeterminate="selectionIndeterminate"
      :status-color-class="statusColorClass"
      @toggle-all="handleToggleAll"
      @toggle-select="toggleSelect"
      @delete="handleDeleteCollection"
      @report="handleBulkReport"
    />

    <ShortenerCollectionsPagination
      v-if="filteredItems.length > 0"
      v-model:page="pageModel"
      :total-pages="totalPages"
    />

    <!-- Create Collection Wizard -->
    <CreateCollectionWizard
      v-model:open="showCreateWizard"
      @created="handleCollectionCreated"
    />
  </div>
</template>

