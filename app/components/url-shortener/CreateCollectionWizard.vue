<script setup lang="ts">
import type { CreateCollectionRequest } from '~/types/url-shortener'
import { useUrlShortenerCollections } from '~/composables/useUrlShortenerCollections'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'close': []
  'created': [collection: any]
}>()

const toaster = useNuiToasts()

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
    }
  },
})

const currentStep = ref(1)
const totalSteps = 3

// Form data
const formData = ref({
  name: '',
  description: '',
  color: 'primary' as 'primary' | 'success' | 'info' | 'warning' | 'purple',
  selectedLinks: [] as string[],
})

// Available links - TODO: Replace with API call
const availableLinks = ref([
  {
    id: '1',
    shortUrl: 'snap.ly/abc123',
    originalUrl: 'https://example.com/very/long/url/path/that/needs/to/be/shortened',
    clicks: 12500,
    createdAt: '2024-01-15',
    status: 'active',
  },
  {
    id: '2',
    shortUrl: 'snap.ly/xyz789',
    originalUrl: 'https://another-example.com/product/page',
    clicks: 8900,
    createdAt: '2024-01-20',
    status: 'active',
  },
  {
    id: '3',
    shortUrl: 'snap.ly/def456',
    originalUrl: 'https://third-example.com/blog/post',
    clicks: 15600,
    createdAt: '2024-02-01',
    status: 'active',
  },
  {
    id: '4',
    shortUrl: 'snap.ly/ghi789',
    originalUrl: 'https://fourth-example.com/landing/page',
    clicks: 6700,
    createdAt: '2024-02-05',
    status: 'active',
  },
  {
    id: '5',
    shortUrl: 'snap.ly/jkl012',
    originalUrl: 'https://fifth-example.com/about',
    clicks: 11200,
    createdAt: '2024-02-10',
    status: 'active',
  },
  {
    id: '6',
    shortUrl: 'snap.ly/mno345',
    originalUrl: 'https://sixth-example.com/contact',
    clicks: 4500,
    createdAt: '2024-02-15',
    status: 'active',
  },
  {
    id: '7',
    shortUrl: 'snap.ly/pqr678',
    originalUrl: 'https://seventh-example.com/services',
    clicks: 9800,
    createdAt: '2024-02-20',
    status: 'active',
  },
  {
    id: '8',
    shortUrl: 'snap.ly/stu901',
    originalUrl: 'https://eighth-example.com/pricing',
    clicks: 13400,
    createdAt: '2024-02-25',
    status: 'active',
  },
])

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
  if (!searchQuery.value.trim()) {
    return availableLinks.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return availableLinks.value.filter(link =>
    link.shortUrl.toLowerCase().includes(query) ||
    link.originalUrl.toLowerCase().includes(query)
  )
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
  
  if (formData.value.selectedLinks.length === 0) {
    errors.value.selectedLinks = 'Please select at least one link'
    return false
  }
  
  return true
}

const nextStep = () => {
  if (currentStep.value === 1) {
    if (!validateStep1()) return
  } else if (currentStep.value === 2) {
    if (!validateStep2()) return
  }
  
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const { createCollection: createCollectionApi } = useUrlShortenerCollections()
const { workspaceId } = useWorkspaceContext()

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
  return getSelectedLinksData.value.reduce((sum, link) => sum + link.clicks, 0)
})
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogPortal>
      <DialogOverlay 
        class="bg-muted-800/70 dark:bg-muted-900/80 fixed inset-0 z-50"
        @click="handleClose"
      />
      <DialogContent
        class="fixed top-[5%] start-[50%] max-h-[90vh] w-[90vw] max-w-2xl translate-x-[-50%] rounded-lg overflow-hidden border border-muted-200 dark:border-muted-700 bg-white dark:bg-muted-800 focus:outline-none z-[100] transition-all duration-200 ease-out flex flex-col"
        @pointer-down-outside="handleClose"
        @escape-key-down="handleClose"
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
                Choose the links you want to add to this collection
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
              <div
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
                  :checked="formData.selectedLinks.includes(link.id)"
                  rounded="sm"
                  color="primary"
                  @update:checked="toggleSelectLink(link.id)"
                  @click.stop
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100 font-mono">
                      {{ link.shortUrl }}
                    </BaseText>
                    <BaseTag
                      :color="link.status === 'active' ? 'success' : 'warning'"
                      size="xs"
                    >
                      {{ link.status }}
                    </BaseTag>
                  </div>
                  <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 line-clamp-1">
                    {{ link.originalUrl }}
                  </BaseParagraph>
                  <div class="flex items-center gap-4 mt-2">
                    <div class="flex items-center gap-1">
                      <Icon name="solar:mouse-linear" class="size-3 text-muted-400" />
                      <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                        {{ link.clicks.toLocaleString() }} clicks
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

              <div v-if="filteredLinks.length === 0" class="py-8 text-center">
                <Icon name="solar:link-linear" class="size-12 text-muted-400 mx-auto mb-3" />
                <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                  No links found matching your search
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

            <div v-if="errors.selectedLinks" class="text-danger-500 text-sm">
              {{ errors.selectedLinks }}
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
                      {{ link.originalUrl }}
                    </BaseParagraph>
                  </div>
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400 shrink-0">
                    {{ link.clicks.toLocaleString() }} clicks
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

