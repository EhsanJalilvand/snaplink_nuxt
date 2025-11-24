<script setup lang="ts">
import { computed, ref, watch, onMounted } from '#imports'
import type { UpdateLinkRequest, ShortenerLink } from '~/types/url-shortener'
import { useUrlShortenerLinks } from '~/composables/useUrlShortenerLinks'
import { useUrlShortenerCollections } from '~/composables/useUrlShortenerCollections'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import { useWorkspaceDomains } from '~/composables/useWorkspaceDomains'

definePageMeta({
  title: 'Edit Link',
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()
const toaster = useNuiToasts()

console.log('[Edit Link Page] Initializing...', { route: route.path, params: route.params })

const { workspaceId } = useWorkspaceContext()
const { getLink, updateLink } = useUrlShortenerLinks()
const { items: collectionsList, fetchCollections } = useUrlShortenerCollections()
const { domainOptions, fetchDomains } = useWorkspaceDomains()

const linkId = computed(() => {
  const id = route.params.id as string
  console.log('[Edit Link Page] linkId computed:', id)
  return id
})
const isLoading = ref(false)
const isSaving = ref(false)
const link = ref<ShortenerLink | null>(null)

console.log('[Edit Link Page] workspaceId:', workspaceId.value)

// Form data
const formData = ref<UpdateLinkRequest>({
  title: null,
  description: null,
  password: null,
  expiresAt: null,
  clickLimit: null,
  isPublic: true,
  isOneTime: false,
  domainType: 'default',
  domainValue: null,
  customAlias: null,
  collectionIds: [],
})

const errors = ref<Record<string, string>>({})
const showPassword = ref(false)

// Available domains
const domains = computed(() => {
  const defaultDomain = { value: 'snap.ly', label: 'snap.ly', domainType: 'default', domainValue: null }
  return [defaultDomain, ...domainOptions.value]
})

// Available collections
const collections = computed(() => {
  return collectionsList.value.map(c => ({
    id: c.id,
    name: c.name,
  }))
})

// Fetch link data
const fetchLinkData = async () => {
  console.log('[Edit Link Page] fetchLinkData called', { linkId: linkId.value, workspaceId: workspaceId.value })
  
  if (!linkId.value || !workspaceId.value) {
    console.log('[Edit Link Page] Missing linkId or workspaceId, skipping fetch')
    return
  }

  isLoading.value = true
  try {
    console.log('[Edit Link Page] Calling getLink...')
    const linkData = await getLink(linkId.value)
    console.log('[Edit Link Page] getLink result:', linkData)
    
    if (linkData) {
      link.value = linkData
      
      // Populate form
      formData.value = {
        title: linkData.title || null,
        description: linkData.description || null,
        password: null, // Don't populate password
        expiresAt: linkData.expiresAt || null,
        clickLimit: linkData.clickLimit || null,
        isPublic: linkData.isPublic ?? true,
        isOneTime: linkData.isOneTime ?? false,
        domainType: linkData.domainType || 'default',
        domainValue: linkData.domainValue || null,
        customAlias: linkData.customAlias || null,
        collectionIds: linkData.collectionIds || [],
      }
    } else {
      toaster.add({
        title: 'Error',
        description: 'Link not found',
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
      router.push('/dashboard/url-shortener/links')
    }
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to load link',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  } finally {
    isLoading.value = false
  }
}

// Fetch initial data
const loadData = async () => {
  console.log('[Edit Link Page] loadData called', { workspaceId: workspaceId.value, linkId: linkId.value })
  
  if (!workspaceId.value || !linkId.value) {
    console.log('[Edit Link Page] Missing workspaceId or linkId, skipping load')
    return
  }

  try {
    console.log('[Edit Link Page] Starting to fetch data...')
    await Promise.all([
      fetchLinkData(),
      fetchCollections({ force: true }),
      fetchDomains(),
    ])
    console.log('[Edit Link Page] Data loaded successfully')
  } catch (error) {
    console.error('[Edit Link Page] Error loading edit page data:', error)
  }
}

onMounted(() => {
  console.log('[Edit Link Page] onMounted called')
  loadData()
})

watch([workspaceId, linkId], () => {
  loadData()
}, { immediate: false })

// Get selected domain value for display
const selectedDomain = computed(() => {
  if (formData.value.domainType === 'default') {
    return 'snap.ly'
  }
  return formData.value.domainValue || 'snap.ly'
})

// Toggle collection selection
const toggleCollection = (collectionId: string) => {
  const index = formData.value.collectionIds?.indexOf(collectionId) ?? -1
  if (index > -1) {
    formData.value.collectionIds?.splice(index, 1)
  } else {
    if (!formData.value.collectionIds) {
      formData.value.collectionIds = []
    }
    formData.value.collectionIds.push(collectionId)
  }
}

// Validate form
const validate = (): boolean => {
  errors.value = {}

  if (formData.value.customAlias && formData.value.customAlias.length < 3) {
    errors.value.customAlias = 'Custom alias must be at least 3 characters'
    return false
  }

  if (formData.value.clickLimit !== null && formData.value.clickLimit < 1) {
    errors.value.clickLimit = 'Click limit must be at least 1'
    return false
  }

  return true
}

// Save changes
const handleSave = async () => {
  if (!validate()) return

  isSaving.value = true
  try {
    const result = await updateLink(linkId.value, formData.value)
    if (result) {
      toaster.add({
        title: 'Success',
        description: 'Link updated successfully',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })
      router.push('/dashboard/url-shortener/links')
    }
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to update link',
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
  router.push('/dashboard/url-shortener/links')
}
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
          Edit Link
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Update your short link settings and preferences
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton
          variant="outline"
          @click="handleCancel"
        >
          Cancel
        </BaseButton>
        <BaseButton
          variant="primary"
          :loading="isSaving"
          @click="handleSave"
        >
          <Icon name="ph:check" class="size-4" />
          <span>Save Changes</span>
        </BaseButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div
        v-for="i in 5"
        :key="i"
        class="h-20 rounded-xl border border-muted-200/70 bg-muted-100/60 animate-pulse dark:border-muted-700/60 dark:bg-muted-900/30"
      />
    </div>

    <!-- Error State -->
    <div v-else-if="!link && !isLoading" class="flex flex-col items-center justify-center py-12">
      <BaseHeading as="h2" size="xl" weight="semibold" class="text-muted-900 dark:text-white mb-2">
        Link not found
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-4">
        The link you're looking for doesn't exist or you don't have permission to view it.
      </BaseParagraph>
      <BaseButton variant="primary" @click="handleCancel">
        Back to Links
      </BaseButton>
    </div>

    <!-- Form -->
    <div v-else-if="link" class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Main Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Link Info Card -->
        <BaseCard class="p-6">
          <div class="space-y-6">
            <div>
              <BaseHeading
                as="h2"
                size="lg"
                weight="semibold"
                class="text-muted-900 dark:text-white mb-2"
              >
                Link Information
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Basic information about your short link
              </BaseParagraph>
            </div>

            <!-- Destination URL (Read-only) -->
            <TairoFormGroup label="Destination URL">
              <TairoInput
                :model-value="link.destinationUrl"
                type="url"
                disabled
                icon="solar:link-linear"
                rounded="lg"
              />
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
                The destination URL cannot be changed
              </BaseParagraph>
            </TairoFormGroup>

            <!-- Short URL (Read-only) -->
            <TairoFormGroup label="Short URL">
              <TairoInput
                :model-value="link.shortUrl"
                type="text"
                disabled
                icon="solar:link-2-linear"
                rounded="lg"
              />
            </TairoFormGroup>

            <!-- Title -->
            <TairoFormGroup label="Title" :error="errors.title">
              <TairoInput
                v-model="formData.title"
                type="text"
                placeholder="Enter link title"
                icon="solar:pen-linear"
                rounded="lg"
              />
            </TairoFormGroup>

            <!-- Description -->
            <TairoFormGroup label="Description" :error="errors.description">
              <textarea
                v-model="formData.description"
                placeholder="Enter link description"
                rows="4"
                class="w-full px-4 py-3 rounded-lg border border-muted-300 dark:border-muted-600 bg-white dark:bg-muted-800 text-muted-800 dark:text-muted-100 placeholder:text-muted-400 dark:placeholder:text-muted-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200 resize-none"
              />
            </TairoFormGroup>
          </div>
        </BaseCard>

        <!-- Settings Card -->
        <BaseCard class="p-6">
          <div class="space-y-6">
            <div>
              <BaseHeading
                as="h2"
                size="lg"
                weight="semibold"
                class="text-muted-900 dark:text-white mb-2"
              >
                Link Settings
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Configure visibility, type, and security settings
              </BaseParagraph>
            </div>

            <!-- Visibility -->
            <TairoFormGroup label="Visibility">
              <div class="flex gap-4">
                <button
                  type="button"
                  class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium text-left"
                  :class="
                    formData.isPublic
                      ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
                  "
                  @click="formData.isPublic = true"
                >
                  <div class="font-medium mb-1">Public</div>
                  <div class="text-xs opacity-75">Anyone can access this link</div>
                </button>
                <button
                  type="button"
                  class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium text-left"
                  :class="
                    !formData.isPublic
                      ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
                  "
                  @click="formData.isPublic = false"
                >
                  <div class="font-medium mb-1">Private</div>
                  <div class="text-xs opacity-75">Only you can see this link</div>
                </button>
              </div>
            </TairoFormGroup>

            <!-- Link Type -->
            <TairoFormGroup label="Link Type">
              <div class="flex gap-4">
                <button
                  type="button"
                  class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium text-left"
                  :class="
                    !formData.isOneTime
                      ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
                  "
                  @click="formData.isOneTime = false"
                >
                  <div class="font-medium mb-1">Permanent</div>
                  <div class="text-xs opacity-75">Link never expires</div>
                </button>
                <button
                  type="button"
                  class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium text-left"
                  :class="
                    formData.isOneTime
                      ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
                  "
                  @click="formData.isOneTime = true"
                >
                  <div class="font-medium mb-1">One-Time Use</div>
                  <div class="text-xs opacity-75">Link expires after first use</div>
                </button>
              </div>
            </TairoFormGroup>

            <!-- Password -->
            <TairoFormGroup label="Password Protection" :error="errors.password">
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <TairoInput
                    v-model="formData.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Enter new password (leave empty to keep current)"
                    icon="solar:lock-password-linear"
                    rounded="lg"
                  />
                  <BaseButton
                    variant="ghost"
                    icon
                    @click="showPassword = !showPassword"
                  >
                    <Icon :name="showPassword ? 'ph:eye-slash' : 'ph:eye'" class="size-4" />
                  </BaseButton>
                </div>
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                  Leave empty to keep the current password, or enter a new password to change it
                </BaseParagraph>
              </div>
            </TairoFormGroup>

            <!-- Expiration Date -->
            <TairoFormGroup label="Expiration Date" :error="errors.expiresAt">
              <TairoInput
                v-model="formData.expiresAt"
                type="datetime-local"
                icon="solar:calendar-linear"
                rounded="lg"
              />
            </TairoFormGroup>

            <!-- Click Limit -->
            <TairoFormGroup label="Click Limit" :error="errors.clickLimit">
              <TairoInput
                v-model.number="formData.clickLimit"
                type="number"
                placeholder="Enter click limit"
                icon="solar:mouse-linear"
                rounded="lg"
                min="1"
              />
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
                Link will be disabled after reaching this number of clicks
              </BaseParagraph>
            </TairoFormGroup>
          </div>
        </BaseCard>

        <!-- Domain & Alias Card -->
        <BaseCard class="p-6">
          <div class="space-y-6">
            <div>
              <BaseHeading
                as="h2"
                size="lg"
                weight="semibold"
                class="text-muted-900 dark:text-white mb-2"
              >
                Domain & Custom Alias
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Configure the domain and custom alias for your link
              </BaseParagraph>
            </div>

            <!-- Domain Selection -->
            <TairoFormGroup label="Domain">
              <TairoSelect
                :model-value="selectedDomain"
                icon="solar:global-linear"
                rounded="lg"
                @update:model-value="(value) => {
                  const domain = domains.find(d => d.value === value)
                  if (domain) {
                    formData.domainType = domain.domainType
                    formData.domainValue = domain.domainValue
                  }
                }"
              >
                <BaseSelectItem
                  v-for="domain in domains"
                  :key="domain.value"
                  :value="domain.value"
                >
                  {{ domain.label }}
                </BaseSelectItem>
              </TairoSelect>
            </TairoFormGroup>

            <!-- Custom Alias -->
            <TairoFormGroup label="Custom Alias" :error="errors.customAlias">
              <TairoInput
                v-model="formData.customAlias"
                type="text"
                placeholder="my-custom-link"
                icon="solar:pen-linear"
                rounded="lg"
              />
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
                Leave empty to use the generated short code
              </BaseParagraph>
            </TairoFormGroup>
          </div>
        </BaseCard>

        <!-- Collections Card -->
        <BaseCard class="p-6">
          <div class="space-y-6">
            <div>
              <BaseHeading
                as="h2"
                size="lg"
                weight="semibold"
                class="text-muted-900 dark:text-white mb-2"
              >
                Collections
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Organize your link into one or more collections
              </BaseParagraph>
            </div>

            <!-- Collection Selection -->
            <div class="space-y-2 max-h-64 overflow-y-auto border border-muted-200 dark:border-muted-700 rounded-lg p-3">
              <div
                v-for="collection in collections"
                :key="collection.id"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-muted-50 dark:hover:bg-muted-800/50 cursor-pointer transition-colors"
                @click="toggleCollection(collection.id)"
              >
                <BaseCheckbox
                  :model-value="formData.collectionIds?.includes(collection.id) ?? false"
                  rounded="sm"
                  color="primary"
                  @update:model-value="toggleCollection(collection.id)"
                  @click.stop
                />
                <BaseText size="sm" class="text-muted-800 dark:text-muted-100">
                  {{ collection.name }}
                </BaseText>
              </div>
              <div v-if="collections.length === 0" class="text-center py-4 text-sm text-muted-500 dark:text-muted-400">
                No collections available. Create one first.
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Sidebar -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Link Stats Card -->
        <BaseCard class="p-6">
          <div class="space-y-4">
            <BaseHeading
              as="h3"
              size="md"
              weight="semibold"
              class="text-muted-900 dark:text-white"
            >
              Link Statistics
            </BaseHeading>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                  Total Clicks
                </BaseText>
                <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                  {{ link.currentClicks.toLocaleString() }}
                </BaseText>
              </div>
              <div class="flex items-center justify-between">
                <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                  Status
                </BaseText>
                <BaseChip :color="link.linkStatus === 'active' ? 'success' : 'warning'" size="sm">
                  {{ link.linkStatus }}
                </BaseChip>
              </div>
              <div class="flex items-center justify-between">
                <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                  Created
                </BaseText>
                <BaseText size="sm" class="text-muted-900 dark:text-muted-100">
                  {{ new Date(link.createdAt).toLocaleDateString() }}
                </BaseText>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

