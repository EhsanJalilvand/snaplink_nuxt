<script setup lang="ts">
import { computed, ref, watch, onMounted } from '#imports'
import type { UpdateCollectionRequest, ShortenerCollectionDto, CollectionLinkItem } from '~/types/url-shortener'
import { useUrlShortenerCollections } from '~/composables/useUrlShortenerCollections'
import { useUrlShortenerLinks } from '~/composables/useUrlShortenerLinks'
import { useSmartLinks } from '~/composables/useSmartLinks'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'

definePageMeta({
  title: 'Edit Collection',
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()
const toaster = useNuiToasts()

console.log('[Edit Collection Page] Initializing...', { route: route.path, params: route.params })

const { workspaceId } = useWorkspaceContext()
const { getCollection, updateCollection, addLinksToCollection, removeLinksFromCollection, getCollectionLinks } = useUrlShortenerCollections()
const { items: linksList, fetchLinks } = useUrlShortenerLinks()
const { items: smartLinksList, fetchSmartLinks } = useSmartLinks()

const collectionId = computed(() => {
  const id = route.params.id as string
  console.log('[Edit Collection Page] collectionId computed:', id, 'route:', route.path)
  return id
})
const isLoading = ref(false)
const isSaving = ref(false)
const collection = ref<ShortenerCollectionDto | null>(null)
const collectionLinks = ref<CollectionLinkItem[]>([])

// Form data
const formData = ref<UpdateCollectionRequest>({
  name: null,
  description: null,
  color: null,
  defaultExpirationHours: null,
  defaultPassword: null,
  tags: null,
})

const errors = ref<Record<string, string>>({})

const tabs = [
  { key: 'basics', label: 'Basics', description: 'Name & description' },
  { key: 'links', label: 'Links', description: 'Manage links' },
]
const activeTab = ref(tabs[0].key)

// Color options
const colorOptions = [
  { value: 'primary', label: 'Primary', color: 'bg-primary-500' },
  { value: 'success', label: 'Success', color: 'bg-success-500' },
  { value: 'info', label: 'Info', color: 'bg-info-500' },
  { value: 'warning', label: 'Warning', color: 'bg-warning-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
]

// Combined links for selection
interface CombinedLink {
  id: string
  shortUrl: string
  name?: string | null
  destinationUrl?: string | null
  description?: string | null
  isSmartLink: boolean
}

const availableLinks = computed<CombinedLink[]>(() => {
  const regularLinks: CombinedLink[] = linksList.value
    .filter(link => {
      const url = (link.destinationUrl || '').toLowerCase()
      return !url.includes('test') && !url.includes('example.com')
    })
    .map(link => ({
      id: link.id,
      shortUrl: link.shortUrl,
      name: link.title || null,
      destinationUrl: link.destinationUrl || null,
      description: link.description || null,
      isSmartLink: false,
    }))

  const smartLinks: CombinedLink[] = smartLinksList.value.map(link => ({
    id: link.id,
    shortUrl: link.shortUrl,
    name: link.name || null,
    destinationUrl: link.fallbackUrl || null,
    description: link.description || null,
    isSmartLink: true,
  }))

  // Filter out links already in collection
  const collectionLinkIds = new Set(collectionLinks.value.map(l => l.id))
  const filtered = [...regularLinks, ...smartLinks].filter(link => !collectionLinkIds.has(link.id))

  return filtered
})

const searchQuery = ref('')
const selectedLinksToAdd = ref<string[]>([])
const showAddLinksModal = ref(false)
const showRemoveConfirm = ref(false)
const linkToRemove = ref<string | null>(null)

const filteredAvailableLinks = computed(() => {
  if (!searchQuery.value.trim()) {
    return availableLinks.value
  }

  const query = searchQuery.value.toLowerCase()
  return availableLinks.value.filter(link =>
    (link.shortUrl || '').toLowerCase().includes(query) ||
    (link.name || '').toLowerCase().includes(query) ||
    (link.destinationUrl || '').toLowerCase().includes(query) ||
    (link.description || '').toLowerCase().includes(query)
  )
})

// Fetch collection data
const fetchCollectionData = async () => {
  console.log('[Edit Collection Page] fetchCollectionData called', { workspaceId: workspaceId.value, collectionId: collectionId.value })
  if (!workspaceId.value || !collectionId.value) {
    console.log('[Edit Collection Page] Missing workspaceId or collectionId, returning early')
    return
  }

  isLoading.value = true
  try {
    const [collectionData, linksData] = await Promise.all([
      getCollection(collectionId.value),
      getCollectionLinks(collectionId.value),
    ])

    if (collectionData) {
      collection.value = collectionData
      formData.value = {
        name: collectionData.name,
        description: collectionData.description,
        color: collectionData.color,
        defaultExpirationHours: collectionData.defaultExpirationHours,
        defaultPassword: null, // Don't load password
        tags: collectionData.tags || null,
      }
    }

    if (linksData) {
      collectionLinks.value = linksData
    }
  } catch (error) {
    console.error('Error fetching collection data:', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch available links
const fetchAvailableLinks = async () => {
  await Promise.all([
    fetchLinks({ force: true }),
    fetchSmartLinks({ force: true }),
  ])
}

// Validate form
const validate = (): boolean => {
  errors.value = {}

  if (!formData.value.name?.trim()) {
    errors.value.name = 'Collection name is required'
    return false
  }

  if (formData.value.name.trim().length < 3) {
    errors.value.name = 'Collection name must be at least 3 characters'
    return false
  }

  return true
}

// Save changes
const handleSave = async () => {
  if (!validate()) {
    activeTab.value = 'basics'
    return
  }

  isSaving.value = true
  try {
    const payload: UpdateCollectionRequest = {
      name: formData.value.name?.trim() || null,
      description: formData.value.description?.trim() || null,
      color: formData.value.color || null,
      defaultExpirationHours: formData.value.defaultExpirationHours || null,
      defaultPassword: formData.value.defaultPassword?.trim() || null,
      tags: formData.value.tags || null,
    }

    const result = await updateCollection(collectionId.value, payload)
    if (result) {
      toaster.add({
        title: 'Success',
        description: 'Collection updated successfully',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })
      router.push('/dashboard/url-shortener/collections')
    }
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to update collection',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  } finally {
    isSaving.value = false
  }
}

// Cancel
const handleCancel = () => {
  router.push('/dashboard/url-shortener/collections')
}

// Add links to collection
const handleAddLinks = async () => {
  if (selectedLinksToAdd.value.length === 0) {
    toaster.add({
      title: 'No links selected',
      description: 'Please select at least one link to add',
      icon: 'ph:warning',
      color: 'warning',
      progress: true,
    })
    return
  }

  try {
    const result = await addLinksToCollection(collectionId.value, selectedLinksToAdd.value)
    if (result) {
      showAddLinksModal.value = false
      selectedLinksToAdd.value = []
      searchQuery.value = ''
      await fetchCollectionData()
      await fetchAvailableLinks()
    }
  } catch (error: any) {
    console.error('Error adding links:', error)
  }
}

// Remove link from collection
const handleRemoveLinkClick = (linkId: string) => {
  linkToRemove.value = linkId
  showRemoveConfirm.value = true
}

const handleRemoveLinkConfirm = async () => {
  if (!linkToRemove.value) return

  try {
    const success = await removeLinksFromCollection(collectionId.value, [linkToRemove.value])
    if (success) {
      showRemoveConfirm.value = false
      linkToRemove.value = null
      await fetchCollectionData()
      await fetchAvailableLinks()
    }
  } catch (error: any) {
    console.error('Error removing link:', error)
  }
}

const handleRemoveLinkCancel = () => {
  showRemoveConfirm.value = false
  linkToRemove.value = null
}

// Toggle link selection for adding
const toggleLinkSelection = (linkId: string) => {
  const index = selectedLinksToAdd.value.indexOf(linkId)
  if (index > -1) {
    selectedLinksToAdd.value.splice(index, 1)
  } else {
    selectedLinksToAdd.value.push(linkId)
  }
}

// Load data on mount
onMounted(() => {
  console.log('[Edit Collection Page] onMounted called', { workspaceId: workspaceId.value, collectionId: collectionId.value })
  fetchCollectionData()
  fetchAvailableLinks()
})

watch([workspaceId, collectionId], () => {
  console.log('[Edit Collection Page] watch triggered', { workspaceId: workspaceId.value, collectionId: collectionId.value })
  fetchCollectionData()
  fetchAvailableLinks()
}, { immediate: false })

</script>

<template>
  <div class="space-y-6 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-white mb-2"
        >
          Edit Collection
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mt-1">
          Update your collection configuration
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-3">
        <BaseButton variant="ghost" @click="handleCancel">
          Cancel
        </BaseButton>
        <BaseButton color="primary" :loading="isSaving" type="button" @click="handleSave">
          <Icon name="ph:check" class="size-4" />
          <span>Save Changes</span>
        </BaseButton>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <BaseSpinner size="lg" />
    </div>

    <div v-else-if="collection" class="space-y-6">
      <!-- Hero Section -->
      <div class="space-y-6 pb-4 border-b border-muted-200 dark:border-muted-800">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
          <div class="flex-1 space-y-1">
            <BaseParagraph size="xs" class="uppercase tracking-[0.3em] text-muted-500 dark:text-muted-400">
              Collection Name
            </BaseParagraph>
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
              <BaseText size="lg" weight="semibold" class="text-muted-900 dark:text-muted-100 leading-relaxed break-words">
                {{ collection.name }}
              </BaseText>
            </div>
          </div>

          <div class="flex-1 space-y-1">
            <BaseParagraph size="xs" class="uppercase tracking-[0.3em] text-muted-500 dark:text-muted-400">
              Statistics
            </BaseParagraph>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <Icon name="solar:link-linear" class="size-4 text-muted-400" />
                <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                  {{ collection.linkCount }} links
                </BaseText>
              </div>
              <div class="flex items-center gap-2">
                <Icon name="solar:mouse-linear" class="size-4 text-muted-400" />
                <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                  {{ collection.totalClicks.toLocaleString() }} clicks
                </BaseText>
              </div>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 ms-auto">
                Created {{ new Date(collection.createdAt).toLocaleDateString() }}
              </BaseParagraph>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <BaseCard class="p-4">
        <div class="flex flex-wrap gap-3">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="flex-1 min-w-[150px] rounded-xl border px-4 py-3 text-left transition-all"
            :class="
              activeTab === tab.key
                ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300'
                : 'border-muted-200 dark:border-muted-700 hover:border-primary-300 text-muted-700 dark:text-muted-300'
            "
            @click="activeTab = tab.key"
          >
            <div class="font-semibold">{{ tab.label }}</div>
            <div class="text-xs opacity-70">{{ tab.description }}</div>
          </button>
        </div>
      </BaseCard>

      <!-- Basics Tab -->
      <BaseCard v-if="activeTab === 'basics'" class="p-6">
        <div class="space-y-6">
          <div>
            <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
              Collection Details
            </BaseHeading>
            <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
              Update the name, description, and color of your collection
            </BaseParagraph>
          </div>

          <TairoFormGroup label="Collection Name" :error="errors.name">
            <TairoInput
              v-model="formData.name"
              type="text"
              placeholder="e.g., Marketing Campaigns"
              icon="solar:folder-linear"
              rounded="lg"
            />
          </TairoFormGroup>

          <TairoFormGroup label="Description (Optional)">
            <textarea
              v-model="formData.description"
              placeholder="Add a description for this collection"
              rows="3"
              class="w-full px-4 py-3 rounded-lg border border-muted-300 dark:border-muted-600 bg-white dark:bg-muted-800 text-muted-800 dark:text-muted-100 placeholder:text-muted-400 dark:placeholder:text-muted-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200 resize-none"
            />
          </TairoFormGroup>

          <TairoFormGroup label="Color">
            <div class="flex gap-3">
              <button
                v-for="option in colorOptions"
                :key="option.value"
                type="button"
                class="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-medium"
                :class="
                  formData.color === option.value
                    ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
                "
                @click="formData.color = option.value"
              >
                <div :class="[option.color, 'size-4 rounded-full']" />
                <span>{{ option.label }}</span>
              </button>
            </div>
          </TairoFormGroup>
        </div>
      </BaseCard>

      <!-- Links Tab -->
      <BaseCard v-if="activeTab === 'links'" class="p-6">
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
                Links in Collection
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Manage links in this collection
              </BaseParagraph>
            </div>
            <BaseButton color="primary" @click="showAddLinksModal = true">
              <Icon name="ph:plus" class="size-4" />
              <span>Add Links</span>
            </BaseButton>
          </div>

          <div v-if="collectionLinks.length === 0" class="py-12 text-center">
            <Icon name="solar:link-linear" class="mx-auto size-12 text-muted-400 mb-3" />
            <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
              No links in this collection yet. Add links to get started.
            </BaseText>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="link in collectionLinks"
              :key="link.id"
              class="flex items-center gap-4 p-4 rounded-lg border border-muted-200 dark:border-muted-700 hover:border-muted-300 dark:hover:border-muted-600 transition-all"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100 font-mono truncate">
                    {{ link.shortUrl }}
                  </BaseText>
                  <BaseTag
                    v-if="link.isSmartLink"
                    color="info"
                    size="xs"
                  >
                    SmartLink
                  </BaseTag>
                </div>
                <BaseText v-if="link.name" size="xs" weight="medium" class="text-muted-700 dark:text-muted-300 mb-1">
                  {{ link.name }}
                </BaseText>
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 line-clamp-1">
                  {{ link.destinationUrl || (link.isSmartLink ? 'SmartLink with routing rules' : 'No destination URL') }}
                </BaseParagraph>
                <div class="flex items-center gap-4 mt-2">
                  <div class="flex items-center gap-1">
                    <Icon name="solar:mouse-linear" class="size-3 text-muted-400" />
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                      {{ link.currentClicks }} clicks
                    </BaseText>
                  </div>
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    {{ new Date(link.createdAt).toLocaleDateString() }}
                  </BaseText>
                </div>
              </div>
              <BaseButton
                size="sm"
                variant="ghost"
                icon
                color="danger"
                class="rounded-full"
                @click="handleRemoveLinkClick(link.id)"
              >
                <Icon name="ph:trash" class="size-4" />
              </BaseButton>
            </div>
          </div>
        </div>
      </BaseCard>

    </div>

    <!-- Add Links Modal -->
    <DialogRoot :open="showAddLinksModal" @update:open="(value) => { showAddLinksModal = value; if (!value) { selectedLinksToAdd = []; searchQuery = '' } }">
      <DialogPortal>
        <DialogOverlay class="bg-muted-900/70 fixed inset-0 z-50 backdrop-blur-sm" />
        <DialogContent
          class="fixed top-[5%] start-1/2 z-[100] w-[92vw] max-w-2xl -translate-x-1/2 rounded-2xl border border-muted-200 bg-white shadow-2xl focus:outline-none dark:border-muted-700 dark:bg-muted-900"
        >
          <div class="flex w-full flex-col max-h-[90vh]">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-muted-200 px-6 py-5 dark:border-muted-800">
              <div>
                <DialogTitle class="font-heading text-xl font-semibold text-muted-900 dark:text-white">
                  Add Links to Collection
                </DialogTitle>
                <DialogDescription class="mt-1 text-sm text-muted-500 dark:text-muted-400">
                  Select links to add to this collection
                </DialogDescription>
              </div>
              <BaseButton
                size="sm"
                variant="ghost"
                icon
                class="rounded-full"
                @click="showAddLinksModal = false"
              >
                <Icon name="lucide:x" class="size-4" />
              </BaseButton>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto px-6 py-5">
              <TairoFormGroup label="Search Links" class="mb-4">
                <TairoInput
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search by short URL, name, or destination..."
                  icon="lucide:search"
                  rounded="lg"
                />
              </TairoFormGroup>

              <div class="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg mb-4">
                <div class="flex items-center gap-2">
                  <Icon name="solar:link-linear" class="size-5 text-primary-600 dark:text-primary-400" />
                  <BaseText size="sm" weight="semibold" class="text-primary-900 dark:text-primary-100">
                    {{ selectedLinksToAdd.length }} link(s) selected
                  </BaseText>
                </div>
                <BaseButton
                  v-if="selectedLinksToAdd.length > 0"
                  size="sm"
                  variant="ghost"
                  @click="selectedLinksToAdd = []"
                >
                  Clear Selection
                </BaseButton>
              </div>

              <div class="space-y-2 max-h-96 overflow-y-auto">
                <div
                  v-for="link in filteredAvailableLinks"
                  :key="link.id"
                  class="flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer"
                  :class="
                    selectedLinksToAdd.includes(link.id)
                      ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-muted-200 dark:border-muted-700 hover:border-muted-300 dark:hover:border-muted-600 hover:bg-muted-50 dark:hover:bg-muted-800/50'
                  "
                  @click="toggleLinkSelection(link.id)"
                >
                  <BaseCheckbox
                    :model-value="selectedLinksToAdd.includes(link.id)"
                    rounded="sm"
                    color="primary"
                    @update:model-value="(value) => {
                      if (value && !selectedLinksToAdd.includes(link.id)) {
                        selectedLinksToAdd.push(link.id)
                      } else if (!value) {
                        const index = selectedLinksToAdd.indexOf(link.id)
                        if (index > -1) selectedLinksToAdd.splice(index, 1)
                      }
                    }"
                    @click.stop
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100 font-mono">
                        {{ link.shortUrl }}
                      </BaseText>
                      <BaseTag
                        v-if="link.isSmartLink"
                        color="info"
                        size="xs"
                      >
                        SmartLink
                      </BaseTag>
                    </div>
                    <BaseText v-if="link.name" size="xs" weight="medium" class="text-muted-700 dark:text-muted-300 mb-1">
                      {{ link.name }}
                    </BaseText>
                    <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 line-clamp-1">
                      {{ link.destinationUrl || (link.isSmartLink ? 'SmartLink with routing rules' : 'No destination URL') }}
                    </BaseParagraph>
                  </div>
                </div>

                <div v-if="filteredAvailableLinks.length === 0" class="py-8 text-center">
                  <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                    {{ searchQuery ? 'No links found matching your search' : 'All available links are already in this collection' }}
                  </BaseText>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 border-t border-muted-200 px-6 py-4 dark:border-muted-800">
              <BaseButton
                variant="outline"
                @click="showAddLinksModal = false"
              >
                Cancel
              </BaseButton>
              <BaseButton
                variant="solid"
                color="primary"
                :disabled="selectedLinksToAdd.length === 0"
                @click="handleAddLinks"
              >
                <Icon name="ph:plus" class="size-4" />
                Add {{ selectedLinksToAdd.length }} Link(s)
              </BaseButton>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- Remove Link Confirmation Modal -->
    <DialogRoot :open="showRemoveConfirm" @update:open="(value) => { if (!value) handleRemoveLinkCancel() }">
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
                  Remove Link from Collection
                </DialogTitle>
                <DialogDescription class="mt-1 text-sm text-muted-500 dark:text-muted-400">
                  Are you sure you want to remove this link from the collection?
                </DialogDescription>
              </div>
            </div>

            <!-- Content -->
            <div class="px-6 py-5">
              <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                The link will be removed from this collection, but it will not be deleted. You can add it back later if needed.
              </BaseText>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 border-t border-muted-200 px-6 py-4 dark:border-muted-800">
              <BaseButton
                variant="outline"
                @click="handleRemoveLinkCancel"
              >
                Cancel
              </BaseButton>
              <BaseButton
                variant="solid"
                color="danger"
                @click="handleRemoveLinkConfirm"
              >
                <Icon name="ph:trash" class="size-4" />
                Remove
              </BaseButton>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>

