<script setup lang="ts">
import type { CreateLinkRequest } from '~/types/url-shortener'
import { useUrlShortenerLinks } from '~/composables/useUrlShortenerLinks'
import { useUrlShortenerCollections } from '~/composables/useUrlShortenerCollections'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'close': []
  'created': [link: any]
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
        originalUrl: '',
        visibility: 'public',
        type: 'permanent',
        expiresAt: null,
        hasPassword: false,
        password: '',
        domain: 'snap.ly',
        customAlias: '',
        collectionIds: [],
        description: '',
        tags: [],
        clickLimit: null,
        geoRestrictions: [],
        deviceRestrictions: [],
      }
      errors.value = {}
      shortLink.value = ''
      qrCodeUrl.value = ''
    }
  },
})

const currentStep = ref(1)
const totalSteps = 3
const isLoading = ref(false)

// Form data
const formData = ref({
  // Step 1: Original URL
  originalUrl: '',
  
  // Step 2: Settings
  visibility: 'public', // 'public' | 'private'
  type: 'permanent', // 'permanent' | 'one-time'
  expiresAt: null as string | null,
  hasPassword: false,
  password: '',
  domain: 'snap.ly',
  domainType: 'default' as string,
  domainValue: null as string | null,
  customAlias: '',
  collectionIds: [] as string[],
  description: '',
  tags: [] as string[],
  clickLimit: null as number | null,
  geoRestrictions: [] as string[],
  deviceRestrictions: [] as string[],
})

// Generated short link
const shortLink = ref('')
const qrCodeUrl = ref('')
const showQRModal = ref(false)

// Available domains from workspace
const { domainOptions, fetchDomains: fetchWorkspaceDomains } = useWorkspaceDomains()

// Default domain + workspace domains
const domains = computed(() => {
  const defaultDomain = { value: 'snap.ly', label: 'snap.ly', domainType: 'default', domainValue: null }
  return [defaultDomain, ...domainOptions.value]
})

// Collections from API
const { items: collectionsList, fetchCollections } = useUrlShortenerCollections()
const collections = computed(() => {
  return collectionsList.value.map(c => ({
    id: c.id,
    name: c.name,
  }))
})

// Fetch workspace domains and collections on mount and when wizard opens
const fetchData = async () => {
  await Promise.all([
    fetchWorkspaceDomains(),
    fetchCollections({ force: true }),
  ])
}

onMounted(async () => {
  await fetchData()
})

// Refetch when wizard opens
watch(isOpen, (newValue) => {
  if (newValue) {
    fetchData()
  }
}, { immediate: false })

const errors = ref<Record<string, string>>({})

const validateStep1 = () => {
  errors.value = {}
  if (!formData.value.originalUrl.trim()) {
    errors.value.originalUrl = 'Please enter a URL'
    return false
  }
  
  try {
    new URL(formData.value.originalUrl)
  } catch {
    errors.value.originalUrl = 'Please enter a valid URL'
    return false
  }
  
  return true
}

const validateStep2 = () => {
  errors.value = {}
  
  if (formData.value.hasPassword && !formData.value.password.trim()) {
    errors.value.password = 'Please enter a password'
    return false
  }
  
  if (formData.value.type === 'one-time' && !formData.value.expiresAt) {
    errors.value.expiresAt = 'Please select an expiration date'
    return false
  }
  
  return true
}

const nextStep = async () => {
  if (currentStep.value === 1) {
    if (!validateStep1()) return
    // Fetch domains and collections when moving to step 2
    await fetchData()
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

const { createLink: createLinkApi } = useUrlShortenerLinks()
const { workspaceId } = useWorkspaceContext()

const createLink = async () => {
  // Validate step 2 before creating link
  if (!validateStep2()) {
    return
  }

  isLoading.value = true
  try {
    // Determine domain type and value from selected domain
    const selectedDomain = domains.value.find(d => d.value === formData.value.domain)
    const domainType = selectedDomain?.domainType === 'default' ? 'default' : (selectedDomain?.domainType === 'subdomain' ? 'subdomain' : 'custom')
    const domainValue = selectedDomain?.domainValue || (domainType !== 'default' ? formData.value.domain : null)

    // Map form data to CreateLinkRequest
    const request: CreateLinkRequest = {
      collectionIds: formData.value.collectionIds.length > 0 ? formData.value.collectionIds : null,
      destinationUrl: formData.value.originalUrl,
      title: formData.value.description || null,
      description: formData.value.description || null,
      linkType: 'urlShortener',
      customAlias: formData.value.customAlias || null,
      domainType,
      domainValue,
      password: formData.value.hasPassword ? formData.value.password : null,
      expiresAt: formData.value.expiresAt ? new Date(formData.value.expiresAt).toISOString() : null,
      clickLimit: formData.value.clickLimit || null,
      isOneTime: formData.value.type === 'one-time',
      isPublic: formData.value.visibility === 'public',
    }

    const result = await createLinkApi(request)

    if (result) {
      // Set short link and QR code from API response
      shortLink.value = result.shortUrl
      
      // Use QR code from API if available, otherwise generate from URL
      if (result.qrCodeBase64) {
        qrCodeUrl.value = `data:image/png;base64,${result.qrCodeBase64}`
      } else {
        qrCodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shortLink.value)}`
      }

      currentStep.value = 3
      
      // Emit created event
      emit('created', {
        id: result.id || Date.now().toString(),
        shortUrl: result.shortUrl,
        originalUrl: formData.value.originalUrl,
        ...formData.value,
      })
    }
  } catch (error: any) {
    const errorMessage = error?.data?.errors?.[0]?.message ?? error?.message ?? 'Failed to create link'
    toaster.add({
      title: 'Error',
      description: errorMessage,
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  } finally {
    isLoading.value = false
  }
}

const toggleCollection = (collectionId: string) => {
  const index = formData.value.collectionIds.indexOf(collectionId)
  if (index > -1) {
    formData.value.collectionIds.splice(index, 1)
  } else {
    formData.value.collectionIds.push(collectionId)
  }
}

const setOriginalUrl = (url: string) => {
  formData.value.originalUrl = url
  if (errors.value.originalUrl) {
    delete errors.value.originalUrl
  }
  if (currentStep.value !== 1) {
    currentStep.value = 1
  }
}

defineExpose({
  setOriginalUrl,
})

const copyLink = () => {
  navigator.clipboard.writeText(shortLink.value)
  toaster.add({
    title: 'Copied!',
    description: 'Link copied to clipboard',
    icon: 'ph:check',
    progress: true,
  })
}

const downloadQRCode = () => {
  const link = document.createElement('a')
  link.href = qrCodeUrl.value
  link.download = 'qrcode.png'
  link.click()
}

const shareToSocial = (platform: string) => {
  const text = `Check out this link: ${shortLink.value}`
  let url = ''
  
  switch (platform) {
    case 'twitter':
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
      break
    case 'facebook':
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shortLink.value)}`
      break
    case 'linkedin':
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shortLink.value)}`
      break
    case 'whatsapp':
      url = `https://wa.me/?text=${encodeURIComponent(text)}`
      break
    case 'telegram':
      url = `https://t.me/share/url?url=${encodeURIComponent(shortLink.value)}&text=${encodeURIComponent(text)}`
      break
  }
  
  if (url) {
    window.open(url, '_blank', 'width=600,height=400')
  }
}

const handleClose = () => {
  isOpen.value = false
}

const finish = () => {
  emit('created', {
    id: Date.now().toString(),
    shortUrl: shortLink.value,
    originalUrl: formData.value.originalUrl,
    ...formData.value,
  })
  handleClose()
}
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
              Create Short Link
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

          <!-- Step 1: Original URL -->
          <div v-if="currentStep === 1" class="space-y-6">
            <div>
              <BaseHeading
                as="h3"
                size="lg"
                weight="semibold"
                class="text-muted-800 dark:text-muted-100 mb-2"
              >
                Enter Original URL
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                Enter the long URL you want to shorten
              </BaseParagraph>
            </div>

            <TairoFormGroup
              label="Original URL"
              :error="errors.originalUrl"
            >
              <TairoInput
                v-model="formData.originalUrl"
                type="url"
                placeholder="https://example.com/very/long/url"
                icon="solar:link-linear"
                rounded="lg"
                size="lg"
              />
            </TairoFormGroup>
          </div>

          <!-- Step 2: Settings -->
          <div v-if="currentStep === 2" class="space-y-6">
            <div>
              <BaseHeading
                as="h3"
                size="lg"
                weight="semibold"
                class="text-muted-800 dark:text-muted-100 mb-2"
              >
                Link Settings
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                Configure your short link settings
              </BaseParagraph>
            </div>

            <div class="space-y-6">
              <!-- Visibility -->
              <TairoFormGroup label="Visibility">
                <div class="flex gap-4">
                  <button
                    type="button"
                    class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium text-left"
                    :class="
                      formData.visibility === 'public'
                        ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
                    "
                    @click="formData.visibility = 'public'"
                  >
                    <div class="font-medium mb-1">Public</div>
                    <div class="text-xs opacity-75">Anyone with the link can access</div>
                  </button>
                  <button
                    type="button"
                    class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium text-left"
                    :class="
                      formData.visibility === 'private'
                        ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
                    "
                    @click="formData.visibility = 'private'"
                  >
                    <div class="font-medium mb-1">Private</div>
                    <div class="text-xs opacity-75">Only you can see this link</div>
                  </button>
                </div>
              </TairoFormGroup>

              <!-- Type -->
              <TairoFormGroup label="Link Type">
                <div class="flex gap-4">
                  <button
                    type="button"
                    class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium text-left"
                    :class="
                      formData.type === 'permanent'
                        ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
                    "
                    @click="formData.type = 'permanent'"
                  >
                    <div class="font-medium mb-1">Permanent</div>
                    <div class="text-xs opacity-75">Link never expires</div>
                  </button>
                  <button
                    type="button"
                    class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium text-left"
                    :class="
                      formData.type === 'one-time'
                        ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
                    "
                    @click="formData.type = 'one-time'"
                  >
                    <div class="font-medium mb-1">One-Time Use</div>
                    <div class="text-xs opacity-75">Link expires after first use</div>
                  </button>
                </div>
              </TairoFormGroup>

              <!-- Expiration Date -->
              <TairoFormGroup
                v-if="formData.type === 'one-time'"
                label="Expiration Date"
                :error="errors.expiresAt"
              >
                <TairoInput
                  v-model="formData.expiresAt"
                  type="datetime-local"
                  icon="solar:calendar-linear"
                  rounded="lg"
                />
              </TairoFormGroup>

              <!-- Password Protection -->
              <TairoFormGroup label="Password Protection">
                <div class="flex items-center justify-between">
                  <div>
                    <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
                      Require Password
                    </BaseText>
                    <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                      Users must enter a password to access the link
                    </BaseParagraph>
                  </div>
                  <BaseSwitchBall
                    v-model="formData.hasPassword"
                    variant="primary"
                  />
                </div>
                <TairoInput
                  v-if="formData.hasPassword"
                  v-model="formData.password"
                  type="password"
                  placeholder="Enter password"
                  icon="solar:lock-password-linear"
                  rounded="lg"
                  :error="errors.password"
                  class="mt-4"
                />
              </TairoFormGroup>

              <!-- Domain Selection -->
              <TairoFormGroup label="Domain">
                <TairoSelect
                  v-model="formData.domain"
                  icon="solar:global-linear"
                  rounded="lg"
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
              <TairoFormGroup label="Custom Alias (Optional)">
                <TairoInput
                  v-model="formData.customAlias"
                  placeholder="my-custom-link"
                  icon="solar:pen-linear"
                  rounded="lg"
                />
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
                  Leave empty to generate automatically
                </BaseParagraph>
              </TairoFormGroup>

              <!-- Collections (Multi-select) -->
              <TairoFormGroup label="Collections (Optional)">
                <div class="space-y-2 max-h-48 overflow-y-auto border border-muted-200 dark:border-muted-700 rounded-lg p-3">
                  <div
                    v-for="collection in collections"
                    :key="collection.id"
                    class="flex items-center gap-3 p-2 rounded-lg hover:bg-muted-50 dark:hover:bg-muted-800/50 cursor-pointer transition-colors"
                    @click="toggleCollection(collection.id)"
                  >
                    <BaseCheckbox
                      v-model="formData.collectionIds"
                      :value="collection.id"
                      rounded="sm"
                      color="primary"
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
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
                  Select one or more collections to organize your link
                </BaseParagraph>
              </TairoFormGroup>

              <!-- Description -->
              <TairoFormGroup label="Description (Optional)">
                <textarea
                  v-model="formData.description"
                  placeholder="Add a description for this link"
                  rows="3"
                  class="w-full px-4 py-3 rounded-lg border border-muted-300 dark:border-muted-600 bg-white dark:bg-muted-800 text-muted-800 dark:text-muted-100 placeholder:text-muted-400 dark:placeholder:text-muted-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200 resize-none"
                />
              </TairoFormGroup>

              <!-- Click Limit -->
              <TairoFormGroup label="Click Limit (Optional)">
                <TairoInput
                  v-model.number="formData.clickLimit"
                  type="number"
                  placeholder="e.g., 1000"
                  icon="solar:mouse-linear"
                  rounded="lg"
                />
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
                  Link will be disabled after reaching this limit
                </BaseParagraph>
              </TairoFormGroup>
            </div>
          </div>

          <!-- Step 3: Success -->
          <div v-if="currentStep === 3" class="space-y-6">
            <div class="text-center">
              <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30">
                <Icon name="ph:check-circle" class="size-8 text-success-600 dark:text-success-400" />
              </div>
              <BaseHeading
                as="h3"
                size="lg"
                weight="semibold"
                class="text-muted-800 dark:text-muted-100 mb-2"
              >
                Link Created Successfully!
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                Your short link is ready to share
              </BaseParagraph>
            </div>

            <!-- Short Link Box -->
            <BaseCard class="p-6">
              <div class="flex items-center gap-2 mb-4">
                <Icon name="solar:link-linear" class="size-5 text-primary-600 dark:text-primary-400" />
                <BaseText size="sm" weight="semibold" class="text-muted-800 dark:text-muted-100">
                  Your Short Link
                </BaseText>
              </div>
              <div class="px-4 py-3 rounded-lg bg-muted-50 dark:bg-muted-800/50 border border-muted-200 dark:border-muted-700 text-muted-800 dark:text-muted-100 font-mono text-sm break-all mb-4">
                {{ shortLink }}
              </div>
              <div class="flex items-center gap-3">
                <BaseButton
                  variant="primary"
                  class="flex-1"
                  @click="copyLink"
                >
                  <Icon name="ph:copy" class="size-4" />
                  <span>Copy</span>
                </BaseButton>
                <BaseButton
                  variant="outline"
                  class="flex-1"
                  @click="showQRModal = true"
                >
                  <Icon name="solar:qr-code-linear" class="size-4" />
                  <span>QR Code</span>
                </BaseButton>
              </div>
            </BaseCard>

            <!-- Share Options -->
            <BaseCard class="p-6">
              <div class="flex items-center gap-3 mb-4">
                <Icon name="solar:share-linear" class="size-5 text-primary-600 dark:text-primary-400" />
                <BaseText size="sm" weight="medium" class="text-muted-500 dark:text-muted-400">
                  Share on Social Media
                </BaseText>
              </div>
              <div class="flex flex-wrap gap-2">
                <BaseButton
                  variant="outline"
                  size="sm"
                  @click="shareToSocial('twitter')"
                >
                  <Icon name="logos:twitter" class="size-4" />
                  <span>Twitter</span>
                </BaseButton>
                <BaseButton
                  variant="outline"
                  size="sm"
                  @click="shareToSocial('facebook')"
                >
                  <Icon name="logos:facebook" class="size-4" />
                  <span>Facebook</span>
                </BaseButton>
                <BaseButton
                  variant="outline"
                  size="sm"
                  @click="shareToSocial('linkedin')"
                >
                  <Icon name="logos:linkedin-icon" class="size-4" />
                  <span>LinkedIn</span>
                </BaseButton>
                <BaseButton
                  variant="outline"
                  size="sm"
                  @click="shareToSocial('whatsapp')"
                >
                  <Icon name="logos:whatsapp-icon" class="size-4" />
                  <span>WhatsApp</span>
                </BaseButton>
                <BaseButton
                  variant="outline"
                  size="sm"
                  @click="shareToSocial('telegram')"
                >
                  <Icon name="logos:telegram" class="size-4" />
                  <span>Telegram</span>
                </BaseButton>
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
              v-if="currentStep === 1"
              variant="primary"
              @click="nextStep"
            >
              <span>Next</span>
              <Icon name="lucide:chevron-right" class="size-4" />
            </BaseButton>
            <BaseButton
              v-else-if="currentStep === 2"
              variant="primary"
              :disabled="isLoading"
              @click="createLink"
            >
              <Icon v-if="!isLoading" name="ph:check" class="size-4" />
              <Icon v-else name="svg-spinners:ring-resize" class="size-4" />
              <span>{{ isLoading ? 'Creating...' : 'Create Link' }}</span>
            </BaseButton>
            <BaseButton
              v-else-if="currentStep === 3"
              variant="primary"
              @click="finish"
            >
              <Icon name="ph:check" class="size-4" />
              <span>Done</span>
            </BaseButton>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>

  <!-- QR Code Modal -->
  <DialogRoot v-model:open="showQRModal">
    <DialogPortal>
      <DialogOverlay 
        class="bg-muted-800/70 dark:bg-muted-900/80 fixed inset-0 z-50"
        @click="showQRModal = false"
      />
      <DialogContent
        class="fixed top-[50%] start-[50%] max-h-[90vh] w-[90vw] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg overflow-hidden border border-muted-200 dark:border-muted-700 bg-white dark:bg-muted-800 focus:outline-none z-[100] transition-all duration-200 ease-out flex flex-col"
        @pointer-down-outside="showQRModal = false"
        @escape-key-down="showQRModal = false"
      >
        <!-- Header -->
        <div class="flex items-center justify-between w-full p-6 border-b border-muted-200 dark:border-muted-700">
          <div>
            <DialogTitle
              class="font-heading text-muted-900 text-xl font-bold leading-6 dark:text-white mb-2"
            >
              QR Code
            </DialogTitle>
            <DialogDescription class="text-sm text-muted-500 dark:text-muted-400">
              Scan this QR code to access your link
            </DialogDescription>
          </div>
          <BaseButton
            size="sm"
            variant="ghost"
            @click="showQRModal = false"
          >
            <Icon name="lucide:x" class="size-4" />
          </BaseButton>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <div class="flex flex-col items-center gap-6">
            <!-- QR Code Image -->
            <div class="relative">
              <div class="p-6 bg-white dark:bg-muted-900 rounded-2xl shadow-lg border-2 border-muted-200 dark:border-muted-700">
                <img
                  v-if="qrCodeUrl"
                  :src="qrCodeUrl"
                  alt="QR Code"
                  class="size-64 rounded-lg"
                />
              </div>
            </div>

            <!-- Short Link Display -->
            <div class="w-full">
              <BaseText size="xs" weight="medium" class="text-muted-500 dark:text-muted-400 mb-2">
                Short Link
              </BaseText>
              <div class="px-4 py-3 rounded-lg bg-muted-50 dark:bg-muted-800/50 border border-muted-200 dark:border-muted-700 text-muted-800 dark:text-muted-100 font-mono text-sm break-all">
                {{ shortLink }}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end w-full p-6 border-t border-muted-200 dark:border-muted-700 gap-3">
          <BaseButton
            variant="outline"
            @click="showQRModal = false"
          >
            Close
          </BaseButton>
          <BaseButton
            variant="primary"
            @click="downloadQRCode"
          >
            <Icon name="ph:download" class="size-4" />
            <span>Download QR Code</span>
          </BaseButton>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
