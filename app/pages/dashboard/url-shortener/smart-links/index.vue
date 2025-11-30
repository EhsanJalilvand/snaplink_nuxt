<script setup lang="ts">
import { computed, watch, onMounted, ref } from '#imports'
import SmartLinkWizard from '~/components/url-shortener/SmartLinkWizard.vue'
import SmartLinkAiWizard from '~/components/url-shortener/SmartLinkAiWizard.vue'
import SmartLinksTable from '~/components/url-shortener/SmartLinksTable.vue'
import ShortenerLinksToolbar from '~/components/url-shortener/ShortenerLinksToolbar.vue'
import ShortenerLinksPagination from '~/components/url-shortener/ShortenerLinksPagination.vue'
import { useSmartLinks } from '~/composables/useSmartLinks'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import type { SmartLink } from '~/types/url-shortener'

definePageMeta({
  title: 'SmartLinks',
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
  allVisibleSelected,
  selectionIndeterminate,
  hasSelection,
  fetchSmartLinks,
  deleteSmartLink,
  setSearch,
  setPerPage,
  setPage,
  clearSelection,
  toggleSelect,
  selectMany,
} = useSmartLinks()

// Fetch smart links when workspaceId is available
watch(workspaceId, (newWorkspaceId) => {
  if (newWorkspaceId) {
    fetchSmartLinks({ force: true })
  }
}, { immediate: true })

// Also fetch on mount in case workspaceId is already available
onMounted(() => {
  if (workspaceId.value) {
    fetchSmartLinks({ force: true })
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

const showSmartLinkWizard = ref(false)
const showSmartLinkAiWizard = ref(false)

const handleCreateSmartLink = () => {
  showSmartLinkWizard.value = true
}

const handleCreateSmartLinkWithAI = () => {
  showSmartLinkAiWizard.value = true
}

const handleSmartLinkCreated = async () => {
  // Refresh smart links list from API
  await fetchSmartLinks({ force: true })
}

const handleCopyLink = (link: SmartLink) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link.shortUrl)
    const toaster = useNuiToasts()
    toaster.add({
      title: 'Copied',
      description: 'SmartLink copied to clipboard.',
      color: 'success',
      icon: 'ph:copy-simple',
    })
  }
}

const showDeleteConfirm = ref(false)
const smartLinkToDelete = ref<string | null>(null)

const handleDeleteClick = (id: string) => {
  smartLinkToDelete.value = id
  showDeleteConfirm.value = true
}

const handleDeleteConfirm = async () => {
  if (smartLinkToDelete.value) {
    await deleteSmartLink(smartLinkToDelete.value)
    showDeleteConfirm.value = false
    smartLinkToDelete.value = null
  }
}

const handleDeleteCancel = () => {
  showDeleteConfirm.value = false
  smartLinkToDelete.value = null
}

const handleViewReport = () => {
  const ids = hasSelection.value ? selectedIds.value : paginatedItems.value.slice(0, 3).map((item) => item.id)
  router.push({
    path: '/dashboard/url-shortener/reports',
    query: {
      type: 'smart-links',
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
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-800 dark:text-muted-100"
        >
          SmartLinks
        </BaseHeading>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton variant="outline" :disabled="selectedIds.length === 0" @click="handleViewReport">
          <Icon name="ph:chart-line" class="size-4" />
          <span>Generate Bulk Report</span>
        </BaseButton>
        <BaseButton variant="outline" @click="handleCreateSmartLink">
          <Icon name="ph:plus" class="size-4" />
          <span>Create SmartLink</span>
        </BaseButton>
        <BaseButton variant="primary" @click="handleCreateSmartLinkWithAI">
          <Icon name="ph:sparkle" class="size-4" />
          <span>Create SmartLink With AI</span>
        </BaseButton>
      </div>
    </div>

    <BaseAlert
      v-if="selectedIds.length > 0"
      color="info"
      variant="pastel"
      class="rounded-2xl"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-600 dark:text-muted-300">
          {{ selectedIds.length }} SmartLink{{ selectedIds.length > 1 ? 's' : '' }} selected
        </span>
        <BaseButton
          size="xs"
          variant="ghost"
          @click="clearSelection"
        >
          Clear
        </BaseButton>
      </div>
    </BaseAlert>

    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached SmartLinks
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
        title="No SmartLinks found"
        subtitle="Create your first SmartLink to start dynamic routing."
      >
        <template #image>
          <Icon name="solar:shuffle-linear" class="size-16 text-muted-400" />
        </template>
        <BaseButton variant="primary" @click="handleCreateSmartLink">
          <Icon name="ph:plus" class="size-4" />
          <span>Create Your First SmartLink</span>
        </BaseButton>
      </BasePlaceholderPage>
    </div>

    <SmartLinksTable
      v-else
      :smart-links="paginatedItems"
      :selected-ids="selectedIds"
      :is-loading="isLoading"
      :all-selected="allVisibleSelected"
      :indeterminate="selectionIndeterminate"
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

    <SmartLinkWizard
      v-model:open="showSmartLinkWizard"
      @created="handleSmartLinkCreated"
    />
    <SmartLinkAiWizard
      v-model:open="showSmartLinkAiWizard"
      @created="handleSmartLinkCreated"
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
                  Delete SmartLink
                </DialogTitle>
                <DialogDescription class="mt-1 text-sm text-muted-500 dark:text-muted-400">
                  Are you sure you want to delete this SmartLink? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>

            <!-- Content -->
            <div class="px-6 py-5">
              <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                This will permanently delete the SmartLink and all its associated data including rules, collections, and tracking information. This action cannot be reversed.
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
