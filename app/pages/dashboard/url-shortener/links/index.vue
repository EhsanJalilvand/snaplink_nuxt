<script setup lang="ts">
import { computed, watch, onMounted, ref } from '#imports'
import CreateLinkWizard from '~/components/url-shortener/CreateLinkWizard.vue'
import ShortenerLinksHeader from '~/components/url-shortener/ShortenerLinksHeader.vue'
import ShortenerLinksBulkActions from '~/components/url-shortener/ShortenerLinksBulkActions.vue'
import ShortenerLinksToolbar from '~/components/url-shortener/ShortenerLinksToolbar.vue'
import ShortenerLinksTable from '~/components/url-shortener/ShortenerLinksTable.vue'
import ShortenerLinksPagination from '~/components/url-shortener/ShortenerLinksPagination.vue'
import { useUrlShortenerLinks } from '~/composables/useUrlShortenerLinks'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import type { ShortenerLink } from '~/types/url-shortener'

definePageMeta({
  title: 'Links',
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

const showDeleteConfirm = ref(false)
const linkToDelete = ref<string | null>(null)

const handleDeleteClick = (linkId: string) => {
  linkToDelete.value = linkId
  showDeleteConfirm.value = true
}

const handleDeleteConfirm = async () => {
  if (linkToDelete.value) {
    await removeLink(linkToDelete.value)
    // Refresh links list after deletion
    await fetchLinks({ force: true })
    showDeleteConfirm.value = false
    linkToDelete.value = null
  }
}

const handleDeleteCancel = () => {
  showDeleteConfirm.value = false
  linkToDelete.value = null
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
      @delete="handleDeleteClick"
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

    <!-- Delete Confirmation Modal -->
    <DialogRoot :open="showDeleteConfirm" @update:open="(value) => { if (!value) handleDeleteCancel() }">
      <DialogPortal>
        <DialogOverlay class="bg-muted-900/70 fixed inset-0 z-50 backdrop-blur-sm" />
        <DialogContent
          class="fixed top-[50%] start-1/2 z-[100] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-muted-200 bg-white shadow-2xl focus:outline-none dark:border-muted-700 dark:bg-muted-900"
        >
          <div class="flex w-full flex-col">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-muted-200 px-6 py-5 dark:border-muted-800">
              <div>
                <DialogTitle class="font-heading text-xl font-semibold text-muted-900 dark:text-white">
                  Delete Link
                </DialogTitle>
                <DialogDescription class="mt-1 text-sm text-muted-500 dark:text-muted-400">
                  Are you sure you want to delete this link? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>

            <!-- Content -->
            <div class="px-6 py-5">
              <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                This will permanently delete the link and all its associated data. This action cannot be reversed.
              </BaseText>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 border-t border-muted-200 px-6 py-4 dark:border-muted-800">
              <BaseButton
                variant="outline"
                @click="handleDeleteCancel"
              >
                Cancel
              </BaseButton>
              <BaseButton
                variant="solid"
                color="danger"
                @click="handleDeleteConfirm"
              >
                <Icon name="ph:trash" class="size-4" />
                Delete
              </BaseButton>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>

