<script setup lang="ts">
import type { CreateCollectionRequest, ShortenerLink, SmartLink } from '~/types/url-shortener'
import { useUrlShortenerCollections } from '~/composables/useUrlShortenerCollections'
import { useUrlShortenerLinks } from '~/composables/useUrlShortenerLinks'
import { useSmartLinks } from '~/composables/useSmartLinks'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import { useApi } from '~/composables/useApi'
import { watch } from '#imports'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'close': []
  'created': [collection: any]
}>()

const toaster = useNuiToasts()
const api = useApi()
const { workspaceId } = useWorkspaceContext()
const { items: linksList, fetchLinks, getLink, updateLink } = useUrlShortenerLinks()
const { items: smartLinksList, fetchSmartLinks } = useSmartLinks()

const isOpen = computed({
  get: () => props.open,
  set: (value) => {
    emit('update:open', value)
    if (!value) {
      emit('close')
      // Reset form when modal closes
      currentStep.value = 1
      formData.value = {
        name: '',
        description: '',
        color: 'primary',
        selectedLinks: [],
      }
      errors.value = {}
      searchQuery.value = ''
      isLoadingLinks.value = false
      isLoadingSmartLinks.value = false
    }
  },
})

const currentStep = ref(1)
const totalSteps = 3
const isLoadingLinks = ref(false)
const isLoadingSmartLinks = ref(false)

// Form data
const formData = ref({
  name: '',
  description: '',
  color: 'primary' as 'primary' | 'success' | 'info' | 'warning' | 'purple',
  selectedLinks: [] as string[],
})

// Combined type for display
interface CombinedLink {
  id: string
  shortUrl: string
  name?: string | null
  destinationUrl?: string | null
  originalUrl?: string | null
  description?: string | null
  linkStatus?: string
  currentClicks: number
  createdAt: string
  isSmartLink: boolean
}

// Available links from API (both regular links and SmartLinks)
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
      originalUrl: link.originalUrl || null,
      description: link.description || null,
      linkStatus: link.linkStatus,
      currentClicks: link.currentClicks,
      createdAt: link.createdAt,
      isSmartLink: false,
    }))

  const smartLinks: CombinedLink[] = smartLinksList.value.map(link => ({
    id: link.id,
    shortUrl: link.shortUrl,
    name: link.name || null,
    destinationUrl: link.fallbackUrl || null,
    originalUrl: link.fallbackUrl || null,
    description: link.description || null,
    linkStatus: 'active', // SmartLinks don't have status, default to active
    currentClicks: link.currentClicks,
    createdAt: link.createdAt,
    isSmartLink: true,
  }))

  // Combine and sort by creation date (newest first)
  return [...regularLinks, ...smartLinks].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

const searchQuery = ref('')
const errors = ref<Record<string, string>>({})

const colorOptions = [
  { value: 'primary', label: 'Primary', color: 'bg-primary-500' },
  { value: 'success', label: 'Success', color: 'bg-success-500' },
  { value: 'info', label: 'Info', color: 'bg-info-500' },
  { value: 'warning', label: 'Warning', color: 'bg-warning-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
]

const filteredLinks = computed(() => {
  let links = availableLinks.value
  
  // Apply search filter if query exists
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    links = links.filter(link =>
      (link.shortUrl || '').toLowerCase().includes(query) ||
      (link.name || '').toLowerCase().includes(query) ||
      (link.destinationUrl || link.originalUrl || '').toLowerCase().includes(query) ||
      (link.description || '').toLowerCase().includes(query)
    )
  }
  
  return links
})

const isAllLinksSelected = computed(() => {
  return filteredLinks.value.length > 0 &&
    filteredLinks.value.every(link => formData.value.selectedLinks.includes(link.id))
})

const isSomeLinksSelected = computed(() => {
  return formData.value.selectedLinks.length > 0 && !isAllLinksSelected.value
})

const toggleSelectAllLinks = () => {
  if (isAllLinksSelected.value) {
    filteredLinks.value.forEach(link => {
      const index = formData.value.selectedLinks.indexOf(link.id)
      if (index > -1) {
        formData.value.selectedLinks.splice(index, 1)
      }
    })
  } else {
    filteredLinks.value.forEach(link => {
      if (!formData.value.selectedLinks.includes(link.id)) {
        formData.value.selectedLinks.push(link.id)
      }
    })
  }
}

const toggleSelectLink = (linkId: string) => {
  const index = formData.value.selectedLinks.indexOf(linkId)
  if (index > -1) {
    formData.value.selectedLinks.splice(index, 1)
  } else {
    formData.value.selectedLinks.push(linkId)
  }
}


const validateStep1 = () => {
  errors.value = {}
  if (!formData.value.name.trim()) {
    errors.value.name = 'Please enter a collection name'
    return false
  }
  
  if (formData.value.name.trim().length < 3) {
    errors.value.name = 'Collection name must be at least 3 characters'
    return false
  }
  
  return true
}

const validateStep2 = () => {
  errors.value = {}
  // Link selection is now optional, so no validation needed
  return true
}

const nextStep = async () => {
  if (currentStep.value === 1) {
    if (!validateStep1()) return
    // Fetch links when moving to step 2
    await fetchLinksData()
  } else if (currentStep.value === 2) {
    if (!validateStep2()) return
  }
  
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

// Fetch links from API (both regular links and SmartLinks)
const fetchLinksData = async () => {
  if (isLoadingLinks.value || isLoadingSmartLinks.value) return
  
  isLoadingLinks.value = true
  isLoadingSmartLinks.value = true
  try {
    await Promise.all([
      fetchLinks({ force: true }),
      fetchSmartLinks({ force: true }),
    ])
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to fetch links',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  } finally {
    isLoadingLinks.value = false
    isLoadingSmartLinks.value = false
  }
}

// Fetch links when wizard opens
watch(isOpen, (newValue) => {
  if (newValue) {
    fetchLinksData()
  }
})

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const { createCollection: createCollectionApi } = useUrlShortenerCollections()

const createCollection = async () => {
  try {
    // Map form data to CreateCollectionRequest
    const request: CreateCollectionRequest = {
      name: formData.value.name,
      description: formData.value.description || null,
      color: formData.value.color,
      defaultExpirationHours: null,
      defaultPassword: null,
      tags: null,
    }

    const result = await createCollectionApi(request)

    if (result) {
      // Add selected links to the collection if any were selected
      if (formData.value.selectedLinks.length > 0 && result.id) {
        await addLinksToCollection(result.id, formData.value.selectedLinks)
      }

      // Emit created event with the result
      emit('created', {
        id: result.id,
        name: result.name,
        description: result.description,
        color: result.color,
        linkCount: result.linkCount,
        totalClicks: result.totalClicks,
        createdAt: result.createdAt,
      })
      
      handleClose()
    }
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to create collection',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  }
}

// Add links to collection by updating their collectionIds
const addLinksToCollection = async (collectionId: string, linkIds: string[]) => {
  if (!workspaceId.value) return

  try {
    // Update each link to add the new collection to its collectionIds
    const updatePromises = linkIds.map(async (linkId) => {
      // Get current link data to preserve existing collections
      const currentLink = await getLink(linkId)
      if (!currentLink) {
        throw new Error(`Link ${linkId} not found`)
      }

      // Get current collectionIds (ensure it's an array)
      // Handle both collectionIds (from LinkDto) and collectionNames (from LinkListDto)
      let currentCollectionIds: string[] = []
      
      if (Array.isArray(currentLink.collectionIds) && currentLink.collectionIds.length > 0) {
        // Use collectionIds if available (from LinkDto)
        currentCollectionIds = currentLink.collectionIds.map(id => String(id))
      } else if (Array.isArray(currentLink.collectionNames) && currentLink.collectionNames.length > 0) {
        // Fallback: if we have collectionNames but not collectionIds, we need to fetch the full link
        // For now, we'll just use an empty array and let the backend handle it
        // This shouldn't happen if getLink returns LinkDto correctly
        currentCollectionIds = []
      }

      // Check if collection is already in the list
      if (currentCollectionIds.includes(collectionId)) {
        // Already in collection, skip update
        return
      }

      // Add the new collection to existing ones (preserve all previous collections)
      const updatedCollectionIds = [...currentCollectionIds, collectionId]

      // Update link with merged collectionIds (preserving all existing collections)
      await updateLink(linkId, {
        collectionIds: updatedCollectionIds,
      })
    })

    await Promise.all(updatePromises)
    
    // Refresh links list to show updated collections
    await fetchLinks({ force: true })
  } catch (error: any) {
    // Log error but don't fail the collection creation
    console.error('Failed to add links to collection:', error)
    toaster.add({
      title: 'Warning',
      description: 'Collection created but some links could not be added',
      icon: 'lucide:alert-triangle',
      color: 'warning',
      progress: true,
    })
  }
}

const handleClose = () => {
  isOpen.value = false
}

const finish = () => {
  createCollection()
}

const getSelectedLinksData = computed(() => {
  return availableLinks.value.filter(link =>
    formData.value.selectedLinks.includes(link.id)
  )
})

const totalClicks = computed(() => {
  return getSelectedLinksData.value.reduce((sum, link) => sum + (link.currentClicks || link.clicks || 0), 0)
})
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogPortal>
      <DialogOverlay 
        class="bg-muted-800/70 dark:bg-muted-900/80 fixed inset-0 z-50"
      />
      <DialogContent
        class="fixed top-[5%] start-[50%] max-h-[90vh] w-[90vw] max-w-2xl translate-x-[-50%] rounded-lg overflow-hidden border border-muted-200 dark:border-muted-700 bg-white dark:bg-muted-800 focus:outline-none z-[100] transition-all duration-200 ease-out flex flex-col"
        @escape-key-down="handleClose"
        @interact-outside.prevent
      >
        <!-- Header -->
        <div class="flex items-center justify-between w-full p-6 border-b border-muted-200 dark:border-muted-700">
          <div>
            <DialogTitle
              class="font-heading text-muted-900 text-xl font-bold leading-6 dark:text-white mb-2"
            >
              Create Collection
            </DialogTitle>
            <DialogDescription class="text-sm text-muted-500 dark:text-muted-400">
              Step {{ currentStep }} of {{ totalSteps }}
            </DialogDescription>
          </div>
          <BaseButton
            size="sm"
            variant="ghost"
            @click="handleClose"
          >
            <Icon name="lucide:x" class="size-4" />
          </BaseButton>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Progress Bar -->
          <div class="mb-6">
            <div class="h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary-500 rounded-full transition-all duration-300"
                :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
              />
            </div>
          </div>

          <!-- Step 1: Collection Name -->
          <div v-if="currentStep === 1" class="space-y-6">
            <div>
              <BaseHeading
                as="h3"
                size="lg"
                weight="semibold"
                class="text-muted-800 dark:text-muted-100 mb-2"
              >
                Collection Details
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                Enter the name and details for your collection
              </BaseParagraph>
            </div>

            <TairoFormGroup
              label="Collection Name"
              :error="errors.name"
            >
              <TairoInput
                v-model="formData.name"
                type="text"
                placeholder="e.g., Marketing Campaigns"
                icon="solar:folder-linear"
                rounded="lg"
                size="lg"
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

          <!-- Step 2: Select Links -->
          <div v-if="currentStep === 2" class="space-y-6">
            <div>
              <BaseHeading
                as="h3"
                size="lg"
                weight="semibold"
                class="text-muted-800 dark:text-muted-100 mb-2"
              >
                Select Links
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                Choose the links you want to add to this collection (optional)
              </BaseParagraph>
            </div>

            <!-- Search -->
            <TairoFormGroup label="Search Links">
              <TairoInput
                v-model="searchQuery"
                type="text"
                placeholder="Search by short URL or original URL..."
                icon="lucide:search"
                rounded="lg"
              />
            </TairoFormGroup>

            <!-- Selection Info -->
            <div class="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
              <div class="flex items-center gap-2">
                <Icon name="solar:link-linear" class="size-5 text-primary-600 dark:text-primary-400" />
                <BaseText size="sm" weight="semibold" class="text-primary-900 dark:text-primary-100">
                  {{ formData.selectedLinks.length }} link(s) selected
                </BaseText>
              </div>
              <BaseButton
                v-if="formData.selectedLinks.length > 0"
                size="sm"
                variant="ghost"
                @click="formData.selectedLinks = []"
              >
                Clear Selection
              </BaseButton>
            </div>

            <!-- Links List -->
            <div class="space-y-2 max-h-96 overflow-y-auto">
              <div v-if="isLoadingLinks || isLoadingSmartLinks" class="py-8 text-center">
                <Icon name="solar:refresh-linear" class="size-12 text-muted-400 mx-auto mb-3 animate-spin" />
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  Loading links...
                </BaseText>
              </div>
              <div
                v-else
                v-for="link in filteredLinks"
                :key="link.id"
                class="flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer"
                :class="
                  formData.selectedLinks.includes(link.id)
                    ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-muted-200 dark:border-muted-700 hover:border-muted-300 dark:hover:border-muted-600 hover:bg-muted-50 dark:hover:bg-muted-800/50'
                "
                @click="toggleSelectLink(link.id)"
              >
                <BaseCheckbox
                  :model-value="formData.selectedLinks.includes(link.id)"
                  rounded="sm"
                  color="primary"
                  @update:model-value="(value) => {
                    const index = formData.selectedLinks.indexOf(link.id)
                    if (value && index === -1) {
                      formData.selectedLinks.push(link.id)
                    } else if (!value && index > -1) {
                      formData.selectedLinks.splice(index, 1)
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
                    <BaseTag
                      v-else
                      :color="link.linkStatus === 'active' ? 'success' : 'warning'"
                      size="xs"
                    >
                      {{ link.linkStatus }}
                    </BaseTag>
                  </div>
                  <BaseText v-if="link.name" size="xs" weight="medium" class="text-muted-700 dark:text-muted-300 mb-1">
                    {{ link.name }}
                  </BaseText>
                  <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 line-clamp-1">
                    {{ link.destinationUrl || link.originalUrl || (link.isSmartLink ? 'SmartLink with routing rules' : 'No destination URL') }}
                  </BaseParagraph>
                  <div class="flex items-center gap-4 mt-2">
                    <div class="flex items-center gap-1">
                      <Icon name="solar:mouse-linear" class="size-3 text-muted-400" />
                      <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                        {{ (link.currentClicks || link.clicks || 0).toLocaleString() }} clicks
                      </BaseText>
                    </div>
                    <div class="flex items-center gap-1">
                      <Icon name="solar:calendar-linear" class="size-3 text-muted-400" />
                      <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                        {{ new Date(link.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
                      </BaseText>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="!isLoadingLinks && filteredLinks.length === 0" class="py-8 text-center">
                <Icon name="solar:link-linear" class="size-12 text-muted-400 mx-auto mb-3" />
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  {{ availableLinks.length === 0 ? 'No links available. Create some links first.' : 'No links found matching your search' }}
                </BaseText>
              </div>
            </div>

            <!-- Select All -->
            <div class="flex items-center justify-between pt-2 border-t border-muted-200 dark:border-muted-700">
              <BaseButton
                variant="ghost"
                size="sm"
                @click="toggleSelectAllLinks"
              >
                <BaseCheckbox
                  :checked="isAllLinksSelected"
                  :indeterminate="isSomeLinksSelected"
                  rounded="sm"
                  color="primary"
                  @update:checked="toggleSelectAllLinks"
                />
                <span class="ml-2">
                  {{ isAllLinksSelected ? 'Deselect All' : 'Select All' }}
                </span>
              </BaseButton>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                {{ filteredLinks.length }} link(s) available
              </BaseText>
            </div>

          </div>

          <!-- Step 3: Confirmation -->
          <div v-if="currentStep === 3" class="space-y-6">
            <div class="text-center">
              <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                <Icon name="solar:folder-linear" class="size-8 text-primary-600 dark:text-primary-400" />
              </div>
              <BaseHeading
                as="h3"
                size="lg"
                weight="semibold"
                class="text-muted-800 dark:text-muted-100 mb-2"
              >
                Review Collection
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                Review your collection details before creating
              </BaseParagraph>
            </div>

            <!-- Collection Summary -->
            <BaseCard class="p-6">
              <div class="flex items-center gap-3 mb-4">
                <div
                  class="p-3 rounded-lg shrink-0"
                  :class="{
                    'bg-primary-100 dark:bg-primary-900/30': formData.color === 'primary',
                    'bg-success-100 dark:bg-success-900/30': formData.color === 'success',
                    'bg-info-100 dark:bg-info-900/30': formData.color === 'info',
                    'bg-warning-100 dark:bg-warning-900/30': formData.color === 'warning',
                    'bg-purple-100 dark:bg-purple-900/30': formData.color === 'purple',
                  }"
                >
                  <Icon
                    name="solar:folder-linear"
                    class="size-6"
                    :class="{
                      'text-primary-600 dark:text-primary-400': formData.color === 'primary',
                      'text-success-600 dark:text-success-400': formData.color === 'success',
                      'text-info-600 dark:text-info-400': formData.color === 'info',
                      'text-warning-600 dark:text-warning-400': formData.color === 'warning',
                      'text-purple-600 dark:text-purple-400': formData.color === 'purple',
                    }"
                  />
                </div>
                <div class="flex-1">
                  <BaseHeading
                    as="h4"
                    size="md"
                    weight="semibold"
                    class="text-muted-900 dark:text-muted-100 mb-1"
                  >
                    {{ formData.name }}
                  </BaseHeading>
                  <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                    {{ formData.description || 'No description' }}
                  </BaseParagraph>
                </div>
              </div>

              <!-- Stats -->
              <div class="grid grid-cols-3 gap-4 pt-4 border-t border-muted-200 dark:border-muted-700">
                <div class="text-center">
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-1">
                    Links
                  </BaseText>
                  <BaseHeading
                    as="h5"
                    size="lg"
                    weight="bold"
                    class="text-muted-900 dark:text-muted-100"
                  >
                    {{ formData.selectedLinks.length }}
                  </BaseHeading>
                </div>
                <div class="text-center">
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-1">
                    Total Clicks
                  </BaseText>
                  <BaseHeading
                    as="h5"
                    size="lg"
                    weight="bold"
                    class="text-muted-900 dark:text-muted-100"
                  >
                    {{ totalClicks.toLocaleString() }}
                  </BaseHeading>
                </div>
                <div class="text-center">
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-1">
                    Color
                  </BaseText>
                  <div class="flex justify-center">
                    <div
                      class="size-6 rounded-full"
                      :class="{
                        'bg-primary-500': formData.color === 'primary',
                        'bg-success-500': formData.color === 'success',
                        'bg-info-500': formData.color === 'info',
                        'bg-warning-500': formData.color === 'warning',
                        'bg-purple-500': formData.color === 'purple',
                      }"
                    />
                  </div>
                </div>
              </div>
            </BaseCard>

            <!-- Selected Links Preview -->
            <BaseCard class="p-6">
              <div class="flex items-center gap-2 mb-4">
                <Icon name="solar:link-linear" class="size-5 text-primary-600 dark:text-primary-400" />
                <BaseText size="sm" weight="semibold" class="text-muted-800 dark:text-muted-100">
                  Selected Links ({{ formData.selectedLinks.length }})
                </BaseText>
              </div>
              <div class="space-y-2 max-h-64 overflow-y-auto">
                <div
                  v-for="link in getSelectedLinksData"
                  :key="link.id"
                  class="flex items-center gap-3 p-3 rounded-lg bg-muted-50 dark:bg-muted-800/50 border border-muted-200 dark:border-muted-700"
                >
                  <Icon name="solar:link-linear" class="size-4 text-muted-400 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-muted-100 font-mono">
                      {{ link.shortUrl }}
                    </BaseText>
                    <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 line-clamp-1">
                      {{ link.destinationUrl || link.originalUrl }}
                    </BaseParagraph>
                  </div>
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400 shrink-0">
                    {{ (link.currentClicks || link.clicks || 0).toLocaleString() }} clicks
                  </BaseText>
                </div>
              </div>
            </BaseCard>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="flex items-center justify-between w-full p-6 border-t border-muted-200 dark:border-muted-700">
          <BaseButton
            v-if="currentStep > 1"
            variant="outline"
            @click="prevStep"
          >
            <Icon name="lucide:chevron-left" class="size-4" />
            <span>Previous</span>
          </BaseButton>
          <div v-else />

          <div class="flex items-center gap-2">
            <BaseButton
              variant="ghost"
              @click="handleClose"
            >
              Cancel
            </BaseButton>
            <BaseButton
              v-if="currentStep < totalSteps"
              variant="primary"
              @click="nextStep"
            >
              <span>Next</span>
              <Icon name="lucide:chevron-right" class="size-4" />
            </BaseButton>
            <BaseButton
              v-else
              variant="primary"
              @click="finish"
            >
              <Icon name="ph:check" class="size-4" />
              <span>Create Collection</span>
            </BaseButton>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

