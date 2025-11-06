<script setup lang="ts">
import CreateCollectionWizard from '~/components/url-shortener/CreateCollectionWizard.vue'

definePageMeta({
  title: 'Collections',
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()
const toaster = useNuiToasts()

const page = computed({
  get: () => Number.parseInt((route.query.page as string) ?? '1', 10),
  set: (value) => {
    router.push({
      query: {
        ...route.query,
        page: value,
      },
    })
  },
})

const searchQuery = ref('')
const perPage = ref(10)
const selectedCollections = ref<string[]>([])
const showCreateWizard = ref(false)

watch([searchQuery, perPage], () => {
  router.push({
    query: {
      page: undefined,
    },
  })
})

// Collections data - TODO: Replace with API call
const collections = ref([
  {
    id: '1',
    name: 'Marketing Campaigns',
    description: 'Links for marketing campaigns and promotions',
    linkCount: 45,
    totalClicks: 125000,
    createdAt: '2024-01-10',
    color: 'primary',
  },
  {
    id: '2',
    name: 'Product Launch',
    description: 'Links for product launch announcements',
    linkCount: 28,
    totalClicks: 89000,
    createdAt: '2024-02-01',
    color: 'success',
  },
  {
    id: '3',
    name: 'Social Media',
    description: 'Links shared on social media platforms',
    linkCount: 62,
    totalClicks: 156000,
    createdAt: '2024-01-15',
    color: 'info',
  },
  {
    id: '4',
    name: 'Email Campaigns',
    description: 'Links used in email marketing campaigns',
    linkCount: 34,
    totalClicks: 78000,
    createdAt: '2024-01-20',
    color: 'warning',
  },
  {
    id: '5',
    name: 'Blog Posts',
    description: 'Links embedded in blog posts',
    linkCount: 51,
    totalClicks: 95000,
    createdAt: '2024-02-05',
    color: 'purple',
  },
])

const filteredCollections = computed(() => {
  if (!searchQuery.value.trim()) {
    return collections.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return collections.value.filter(collection =>
    collection.name.toLowerCase().includes(query) ||
    collection.description?.toLowerCase().includes(query)
  )
})

const paginatedCollections = computed(() => {
  const start = (page.value - 1) * perPage.value
  const end = start + perPage.value
  return filteredCollections.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredCollections.value.length / perPage.value)
})

const isAllSelected = computed(() => {
  return paginatedCollections.value.length > 0 &&
    paginatedCollections.value.every(c => selectedCollections.value.includes(c.id))
})

const isSomeSelected = computed(() => {
  return selectedCollections.value.length > 0 && !isAllSelected.value
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    paginatedCollections.value.forEach(c => {
      const index = selectedCollections.value.indexOf(c.id)
      if (index > -1) {
        selectedCollections.value.splice(index, 1)
      }
    })
  } else {
    paginatedCollections.value.forEach(c => {
      if (!selectedCollections.value.includes(c.id)) {
        selectedCollections.value.push(c.id)
      }
    })
  }
}

const toggleSelect = (collectionId: string) => {
  const index = selectedCollections.value.indexOf(collectionId)
  if (index > -1) {
    selectedCollections.value.splice(index, 1)
  } else {
    selectedCollections.value.push(collectionId)
  }
}

const handleCreateCollection = () => {
  showCreateWizard.value = true
}

const handleCollectionCreated = (collection: any) => {
  // Add new collection to the list
  collections.value.unshift({
    id: collection.id,
    name: collection.name,
    description: collection.description || '',
    linkCount: collection.linkCount,
    totalClicks: collection.links?.reduce((sum: number, link: any) => sum + link.clicks, 0) || 0,
    createdAt: collection.createdAt,
    color: collection.color,
  })
  
  toaster.add({
    title: 'Collection Created',
    description: `Collection "${collection.name}" has been created successfully`,
    icon: 'ph:check',
    progress: true,
  })
}

const handleBulkReport = () => {
  // Use selected collections or default test IDs for demo
  const collectionIds = selectedCollections.value.length > 0
    ? selectedCollections.value.join(',')
    : collections.value.slice(0, 2).map(c => c.id).join(',')
  
  router.push({
    path: '/dashboard/url-shortener/reports',
    query: {
      type: 'collections',
      ids: collectionIds,
    },
  })
}

const handleDeleteCollection = (collectionId: string) => {
  // TODO: API call to delete collection
  collections.value = collections.value.filter(c => c.id !== collectionId)
  const index = selectedCollections.value.indexOf(collectionId)
  if (index > -1) {
    selectedCollections.value.splice(index, 1)
  }
  toaster.add({
    title: 'Collection Deleted',
    description: 'Collection has been deleted successfully',
    icon: 'ph:check',
    progress: true,
  })
}
</script>

<template>
  <div class="space-y-6 py-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Collections
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Organize your links into collections
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton
          variant="outline"
          @click="handleBulkReport"
        >
          <Icon name="ph:chart-line" class="size-4" />
          <span>Generate Bulk Report</span>
        </BaseButton>
        <BaseButton
          variant="primary"
          @click="handleCreateCollection"
        >
          <Icon name="ph:plus" class="size-4" />
          <span>Create Collection</span>
        </BaseButton>
      </div>
    </div>

    <!-- Bulk Actions Bar -->
    <div
      v-if="selectedCollections.length > 0"
      class="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg"
    >
      <BaseText size="sm" weight="medium" class="text-primary-900 dark:text-primary-100">
        {{ selectedCollections.length }} collection(s) selected
      </BaseText>
      <div class="flex items-center gap-2">
        <BaseButton
          size="sm"
          variant="outline"
          @click="selectedCollections = []"
        >
          Clear Selection
        </BaseButton>
        <BaseButton
          size="sm"
          variant="primary"
          @click="handleBulkReport"
        >
          <Icon name="ph:chart-line" class="size-4" />
          <span>Generate Bulk Report</span>
        </BaseButton>
      </div>
    </div>

    <!-- Search and Filters -->
    <TairoContentWrapper>
      <template #left>
        <TairoInput
          v-model="searchQuery"
          icon="lucide:search"
          placeholder="Search collections..."
          rounded="lg"
        />
      </template>
      <template #right>
        <TairoSelect
          v-model="perPage"
          icon="solar:list-linear"
          rounded="lg"
          size="sm"
          class="w-32"
        >
          <BaseSelectItem :value="10">10 per page</BaseSelectItem>
          <BaseSelectItem :value="25">25 per page</BaseSelectItem>
          <BaseSelectItem :value="50">50 per page</BaseSelectItem>
        </TairoSelect>
      </template>

      <!-- Collections Table -->
      <div>
        <div v-if="filteredCollections.length === 0" class="py-12">
          <BasePlaceholderPage
            title="No collections found"
            subtitle="Create your first collection to organize your links"
          >
            <template #image>
              <Icon name="solar:folder-linear" class="size-16 text-muted-400" />
            </template>
            <BaseButton
              variant="primary"
              @click="handleCreateCollection"
            >
              <Icon name="ph:plus" class="size-4" />
              <span>Create Your First Collection</span>
            </BaseButton>
          </BasePlaceholderPage>
        </div>

        <div v-else class="space-y-2">
          <TairoFlexTable>
            <template #header>
              <TairoFlexTableHeading type="shrink">
                <BaseCheckbox
                  :checked="isAllSelected"
                  :indeterminate="isSomeSelected"
                  rounded="sm"
                  color="primary"
                  @update:checked="toggleSelectAll"
                />
              </TairoFlexTableHeading>
              <TairoFlexTableHeading type="grow">
                Collection
              </TairoFlexTableHeading>
              <TairoFlexTableHeading type="stable">
                Links
              </TairoFlexTableHeading>
              <TairoFlexTableHeading type="stable">
                Total Clicks
              </TairoFlexTableHeading>
              <TairoFlexTableHeading type="stable">
                Created
              </TairoFlexTableHeading>
              <TairoFlexTableHeading type="shrink">
                Actions
              </TairoFlexTableHeading>
            </template>

            <TairoFlexTableRow
              v-for="collection in paginatedCollections"
              :key="collection.id"
              rounded="md"
            >
              <TairoFlexTableCell type="shrink" data-content="Selection">
                <BaseCheckbox
                  :checked="selectedCollections.includes(collection.id)"
                  rounded="sm"
                  color="primary"
                  @update:checked="toggleSelect(collection.id)"
                />
              </TairoFlexTableCell>

              <TairoFlexTableCell type="grow" data-content="Collection">
                <div class="flex items-center gap-3">
                  <div
                    class="p-2 rounded-lg shrink-0"
                    :class="{
                      'bg-primary-100 dark:bg-primary-900/30': collection.color === 'primary',
                      'bg-success-100 dark:bg-success-900/30': collection.color === 'success',
                      'bg-info-100 dark:bg-info-900/30': collection.color === 'info',
                      'bg-warning-100 dark:bg-warning-900/30': collection.color === 'warning',
                      'bg-purple-100 dark:bg-purple-900/30': collection.color === 'purple',
                    }"
                  >
                    <Icon
                      name="solar:folder-linear"
                      class="size-5"
                      :class="{
                        'text-primary-600 dark:text-primary-400': collection.color === 'primary',
                        'text-success-600 dark:text-success-400': collection.color === 'success',
                        'text-info-600 dark:text-info-400': collection.color === 'info',
                        'text-warning-600 dark:text-warning-400': collection.color === 'warning',
                        'text-purple-600 dark:text-purple-400': collection.color === 'purple',
                      }"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <BaseHeading
                      as="h4"
                      size="sm"
                      weight="semibold"
                      class="text-muted-900 dark:text-muted-100 mb-1"
                    >
                      {{ collection.name }}
                    </BaseHeading>
                    <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 line-clamp-1">
                      {{ collection.description }}
                    </BaseParagraph>
                  </div>
                </div>
              </TairoFlexTableCell>

              <TairoFlexTableCell type="stable" data-content="Links">
                <div class="flex items-center gap-2">
                  <Icon name="solar:link-linear" class="size-4 text-muted-400" />
                  <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                    {{ collection.linkCount }}
                  </BaseText>
                </div>
              </TairoFlexTableCell>

              <TairoFlexTableCell type="stable" data-content="Total Clicks">
                <div class="flex items-center gap-2">
                  <Icon name="solar:mouse-linear" class="size-4 text-muted-400" />
                  <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                    {{ collection.totalClicks.toLocaleString() }}
                  </BaseText>
                </div>
              </TairoFlexTableCell>

              <TairoFlexTableCell type="stable" data-content="Created">
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  {{ new Date(collection.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}
                </BaseText>
              </TairoFlexTableCell>

              <TairoFlexTableCell type="shrink" data-content="Actions">
                <div class="flex items-center gap-1">
                  <BaseButton
                    size="sm"
                    variant="ghost"
                    to="/dashboard/url-shortener/links"
                  >
                    <Icon name="ph:eye" class="size-4" />
                  </BaseButton>
                  <BaseButton
                    size="sm"
                    variant="ghost"
                    color="danger"
                    @click="handleDeleteCollection(collection.id)"
                  >
                    <Icon name="lucide:trash-2" class="size-4" />
                  </BaseButton>
                </div>
              </TairoFlexTableCell>
            </TairoFlexTableRow>
          </TairoFlexTable>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Showing {{ (page - 1) * perPage + 1 }} to {{ Math.min(page * perPage, filteredCollections.length) }} of {{ filteredCollections.length }} collections
            </BaseText>
            <div class="flex items-center gap-2">
              <BaseButton
                size="sm"
                variant="outline"
                :disabled="page === 1"
                @click="page = page - 1"
              >
                <Icon name="lucide:chevron-left" class="size-4" />
              </BaseButton>
              <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                Page {{ page }} of {{ totalPages }}
              </BaseText>
              <BaseButton
                size="sm"
                variant="outline"
                :disabled="page === totalPages"
                @click="page = page + 1"
              >
                <Icon name="lucide:chevron-right" class="size-4" />
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </TairoContentWrapper>

    <!-- Create Collection Wizard -->
    <CreateCollectionWizard
      v-model:open="showCreateWizard"
      @created="handleCollectionCreated"
    />
  </div>
</template>

