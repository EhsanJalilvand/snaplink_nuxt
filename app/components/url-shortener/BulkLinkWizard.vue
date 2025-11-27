<script setup lang="ts">
import { ref, computed, onMounted } from '#imports'
import { useRouter } from 'vue-router'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import { useWorkspaceDomains } from '~/composables/useWorkspaceDomains'
import { useWorkspaceMembers } from '~/composables/useWorkspaceMembers'
import { useCSVParser } from '~/composables/useCSVParser'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'created': []
}>()

const toaster = useNuiToasts()
const router = useRouter()

const isOpen = computed({
  get: () => props.open,
  set: (value) => {
    emit('update:open', value)
    if (!value) {
      resetWizard()
    }
  },
})

const currentStep = ref(1)
const totalSteps = 5
const isLoading = ref(false)

// Step 1: Method selection
const selectedMethod = ref<'manual' | 'csv'>('manual')

// Step 2: Link input data
interface BulkLinkInput {
  id: string
  url: string
  title?: string
  description?: string
  isValid: boolean
  error?: string
}

const manualLinks = ref<BulkLinkInput[]>([
  { id: '1', url: '', title: '', description: '', isValid: true },
])

const csvFile = ref<File | null>(null)
const csvLinks = ref<BulkLinkInput[]>([])
const { parseCSV } = useCSVParser()

// Step 3: Shared settings
const sharedSettings = ref({
  domain: 'snap.ly',
  domainType: 'default' as string,
  domainValue: null as string | null,
  visibility: 'public' as 'public' | 'private',
  visibilityRoles: [] as string[],
  visibilityMemberIds: [] as string[],
  type: 'permanent' as 'permanent' | 'one-time',
  expiresAt: null as string | null,
  hasPassword: false,
  password: '',
  clickLimit: null as number | null,
})

// Step 4: Preview data
const previewLinks = ref<BulkLinkInput[]>([])

// Step 5: Results
interface BulkLinkResult {
  id: string
  url: string
  title?: string
  success: boolean
  shortUrl?: string
  error?: string
}

const results = ref<BulkLinkResult[]>([])
const isCreating = ref(false)
const creationProgress = ref(0)

// Available domains
const { domainOptions, fetchDomains } = useWorkspaceDomains()
const { members: workspaceMembers, fetchMembers, isLoading: isLoadingMembers } = useWorkspaceMembers()
const { workspaceId } = useWorkspaceContext()

const domains = computed(() => {
  const defaultDomain = { value: 'snap.ly', label: 'snap.ly', domainType: 'default', domainValue: null }
  return [defaultDomain, ...domainOptions.value]
})

const visibilityRoleOptions = [
  { value: 'admin', label: 'Admin', description: 'Full access to all features' },
  { value: 'editor', label: 'Editor', description: 'Can create and edit links' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
]

const memberSearch = ref('')
const filteredMembers = computed(() => {
  if (!memberSearch.value) return workspaceMembers.value
  const search = memberSearch.value.toLowerCase()
  return workspaceMembers.value.filter(m => 
    m.name?.toLowerCase().includes(search) || 
    m.email?.toLowerCase().includes(search)
  )
})

const selectedVisibilityRoleLabels = computed(() => {
  return visibilityRoleOptions
    .filter(opt => sharedSettings.value.visibilityRoles.includes(opt.value))
    .map(opt => opt.label)
})

function resetWizard() {
  currentStep.value = 1
  selectedMethod.value = 'manual'
  manualLinks.value = [{ id: '1', url: '', title: '', description: '', isValid: true }]
  csvFile.value = null
  csvLinks.value = []
  sharedSettings.value = {
    domain: 'snap.ly',
    domainType: 'default',
    domainValue: null,
    visibility: 'public',
    visibilityRoles: [],
    visibilityMemberIds: [],
    type: 'permanent',
    expiresAt: null,
    hasPassword: false,
    password: '',
    clickLimit: null,
  }
  previewLinks.value = []
  results.value = []
  creationProgress.value = 0
}

function toggleVisibilityRole(role: string) {
  const index = sharedSettings.value.visibilityRoles.indexOf(role)
  if (index > -1) {
    sharedSettings.value.visibilityRoles.splice(index, 1)
  } else {
    sharedSettings.value.visibilityRoles.push(role)
  }
}

function toggleVisibilityMember(memberId: string) {
  const index = sharedSettings.value.visibilityMemberIds.indexOf(memberId)
  if (index > -1) {
    sharedSettings.value.visibilityMemberIds.splice(index, 1)
  } else {
    sharedSettings.value.visibilityMemberIds.push(memberId)
  }
}

function selectDomain(domain: { value: string; domainType: string; domainValue: string | null }) {
  sharedSettings.value.domain = domain.value
  sharedSettings.value.domainType = domain.domainType
  sharedSettings.value.domainValue = domain.domainValue
}

function selectDefaultDomain() {
  sharedSettings.value.domain = 'snap.ly'
  sharedSettings.value.domainType = 'default'
  sharedSettings.value.domainValue = null
}

// Step 1: Method selection
function selectMethod(method: 'manual' | 'csv') {
  selectedMethod.value = method
}

function nextFromStep1() {
  if (selectedMethod.value) {
    currentStep.value = 2
    if (selectedMethod.value === 'manual') {
      // Initialize with one empty row
      if (manualLinks.value.length === 0) {
        manualLinks.value = [{ id: '1', url: '', title: '', description: '', isValid: true }]
      }
    }
  }
}

// Step 2: Manual entry
function addManualRow() {
  if (manualLinks.value.length >= 100) {
    toaster.add({
      title: 'Limit reached',
      description: 'Maximum 100 links allowed per bulk operation',
      icon: 'ph:warning',
      color: 'warning',
      progress: true,
    })
    return
  }
  const newId = String(manualLinks.value.length + 1)
  manualLinks.value.push({ id: newId, url: '', title: '', description: '', isValid: true })
}

function removeManualRow(id: string) {
  if (manualLinks.value.length > 1) {
    manualLinks.value = manualLinks.value.filter(link => link.id !== id)
  }
}

function validateUrl(url: string): { isValid: boolean; error?: string } {
  if (!url.trim()) {
    return { isValid: false, error: 'URL is required' }
  }
  try {
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use http or https' }
    }
    return { isValid: true }
  } catch {
    // Try adding https:// if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      try {
        new URL(`https://${url}`)
        return { isValid: false, error: 'Add https:// prefix' }
      } catch {
        return { isValid: false, error: 'Invalid URL format' }
      }
    }
    return { isValid: false, error: 'Invalid URL format' }
  }
}

function detectDuplicates(links: BulkLinkInput[]): string[] {
  const urlMap = new Map<string, string[]>()
  links.forEach(link => {
    const normalizedUrl = link.url.trim().toLowerCase()
    if (!urlMap.has(normalizedUrl)) {
      urlMap.set(normalizedUrl, [])
    }
    urlMap.get(normalizedUrl)!.push(link.id)
  })
  return Array.from(urlMap.entries())
    .filter(([_, ids]) => ids.length > 1)
    .flatMap(([_, ids]) => ids)
}

function suggestTitle(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.replace('www.', '')
    const pathname = urlObj.pathname.split('/').filter(p => p).pop() || ''
    if (pathname) {
      return pathname.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }
    return hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1)
  } catch {
    return ''
  }
}

function validateManualLinks() {
  let hasValid = false
  manualLinks.value.forEach(link => {
    const validation = validateUrl(link.url)
    link.isValid = validation.isValid
    link.error = validation.error
    if (validation.isValid) hasValid = true
    
    // Auto-suggest title if empty
    if (validation.isValid && !link.title && link.url.trim()) {
      link.title = suggestTitle(link.url)
    }
  })
  
  // Check for duplicates
  const duplicateIds = detectDuplicates(manualLinks.value)
  if (duplicateIds.length > 0) {
    duplicateIds.forEach(id => {
      const link = manualLinks.value.find(l => l.id === id)
      if (link && link.isValid) {
        link.error = 'Duplicate URL'
        link.isValid = false
      }
    })
  }
  
  return hasValid
}

function handleBulkPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text')
  if (!text) return
  
  const urls = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 100 - manualLinks.value.length)
  
  if (urls.length > 0) {
    urls.forEach((url, index) => {
      const newId = String(manualLinks.value.length + index + 1)
      const validation = validateUrl(url)
      manualLinks.value.push({
        id: newId,
        url,
        title: '',
        description: '',
        isValid: validation.isValid,
        error: validation.error,
      })
    })
    toaster.add({
      title: 'URLs pasted',
      description: `${urls.length} URL(s) added`,
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })
  }
}

// Step 2: CSV upload
async function handleCSVUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.name.endsWith('.csv')) {
    toaster.add({
      title: 'Invalid file',
      description: 'Please upload a CSV file',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
    return
  }

  csvFile.value = file
  try {
    const parsed = await parseCSV(file)
    if (parsed.length > 100) {
      toaster.add({
        title: 'Too many links',
        description: 'CSV contains more than 100 links. Only the first 100 will be processed.',
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      csvLinks.value = parsed.slice(0, 100)
    } else {
      csvLinks.value = parsed
    }
  } catch (error) {
    toaster.add({
      title: 'Parse error',
      description: 'Failed to parse CSV file. Please check the format.',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
  }
}

function downloadCSVTemplate() {
  const template = 'url,title,description\nhttps://example.com/page1,Example Page 1,Description 1\nhttps://example.com/page2,Example Page 2,Description 2'
  const blob = new Blob([template], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'bulk-links-template.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function nextFromStep2() {
  if (selectedMethod.value === 'manual') {
    if (!validateManualLinks()) {
      const duplicateCount = detectDuplicates(manualLinks.value).length
      const invalidCount = manualLinks.value.filter(l => l.url.trim() && !l.isValid).length
      toaster.add({
        title: 'Validation error',
        description: duplicateCount > 0 
          ? `Found ${duplicateCount} duplicate(s) and ${invalidCount} invalid URL(s)`
          : 'Please add at least one valid URL',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return
    }
    // Remove duplicates before preview
    const seen = new Set<string>()
    previewLinks.value = manualLinks.value.filter(link => {
      if (!link.isValid) return false
      const normalized = link.url.trim().toLowerCase()
      if (seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
  } else {
    if (csvLinks.value.length === 0) {
      toaster.add({
        title: 'No links found',
        description: 'Please upload a valid CSV file',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return
    }
    // Remove duplicates from CSV
    const seen = new Set<string>()
    previewLinks.value = csvLinks.value.filter(link => {
      if (!link.isValid) return false
      const normalized = link.url.trim().toLowerCase()
      if (seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
  }

  if (previewLinks.value.length === 0) {
    toaster.add({
      title: 'No valid links',
      description: 'Please ensure at least one valid URL is provided',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
    return
  }

  currentStep.value = 3
}

// Step 3: Settings
function nextFromStep3() {
  // Validate settings if needed
  if (sharedSettings.value.visibility === 'private') {
    if (sharedSettings.value.visibilityRoles.length === 0 && sharedSettings.value.visibilityMemberIds.length === 0) {
      toaster.add({
        title: 'Validation error',
        description: 'Please select at least one role or member for private links',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return
    }
  }

  if (sharedSettings.value.hasPassword && !sharedSettings.value.password.trim()) {
    toaster.add({
      title: 'Validation error',
      description: 'Please enter a password',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
    return
  }

  currentStep.value = 4
}

// Step 4: Preview
function removePreviewLink(id: string) {
  previewLinks.value = previewLinks.value.filter(link => link.id !== id)
}

function generateShortUrlPreview(url: string, index: number): string {
  const selectedDomain = domains.value.find(d => d.value === sharedSettings.value.domain)
  const baseUrl = selectedDomain?.domainType === 'default' 
    ? 'snap.ly' 
    : (selectedDomain?.domainValue || selectedDomain?.value || 'snap.ly')
  const code = `bulk${index.toString().padStart(3, '0')}`
  return `https://${baseUrl}/${code}`
}

async function createBulkLinks() {
  isCreating.value = true
  creationProgress.value = 0
  results.value = []

  // Simulate bulk creation with progress
  const total = previewLinks.value.length
  const mockResults: BulkLinkResult[] = []

  for (let i = 0; i < total; i++) {
    const link = previewLinks.value[i]
    await new Promise(resolve => setTimeout(resolve, 100)) // Simulate API call

    // Mock: 90% success rate
    const success = Math.random() > 0.1
    mockResults.push({
      id: link.id,
      url: link.url,
      title: link.title,
      success,
      shortUrl: success ? generateShortUrlPreview(link.url, i + 1) : undefined,
      error: success ? undefined : 'Failed to create link',
    })

    creationProgress.value = Math.round(((i + 1) / total) * 100)
  }

  results.value = mockResults
  isCreating.value = false
  currentStep.value = 5

  const successCount = mockResults.filter(r => r.success).length
  toaster.add({
    title: 'Bulk creation complete',
    description: `${successCount} of ${total} links created successfully`,
    icon: successCount === total ? 'ph:check-circle' : 'ph:warning',
    color: successCount === total ? 'success' : 'warning',
    progress: true,
  })
}

// Step 5: Results
function copyAllUrls() {
  const urls = results.value
    .filter(r => r.success && r.shortUrl)
    .map(r => r.shortUrl)
    .join('\n')
  
  if (urls) {
    navigator.clipboard.writeText(urls)
    toaster.add({
      title: 'Copied',
      description: 'All URLs copied to clipboard',
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })
  }
}

function downloadResultsCSV() {
  const csv = [
    ['URL', 'Title', 'Short URL', 'Status', 'Error'].join(','),
    ...results.value.map(r => [
      r.url,
      r.title || '',
      r.shortUrl || '',
      r.success ? 'Success' : 'Failed',
      r.error || '',
    ].join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `bulk-links-results-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function viewInLinks() {
  emit('update:open', false)
  router.push('/dashboard/url-shortener/links')
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Fetch data on mount
onMounted(async () => {
  if (workspaceId.value) {
    await fetchDomains()
    await fetchMembers()
  }
})
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogPortal>
      <DialogOverlay class="bg-muted-900/70 fixed inset-0 z-50 backdrop-blur-sm" />
      <DialogContent
        class="fixed top-[2%] start-1/2 z-[100] flex max-h-[96vh] w-[96vw] max-w-4xl -translate-x-1/2 overflow-hidden rounded-2xl border border-muted-200 bg-white shadow-2xl focus:outline-none dark:border-muted-700 dark:bg-muted-900"
        @pointer-down-outside="isOpen = false"
        @escape-key-down="isOpen = false"
      >
        <div class="flex w-full flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-muted-200 px-6 py-5 dark:border-muted-800">
            <div>
              <DialogTitle class="font-heading text-xl font-semibold text-muted-900 dark:text-white">
                Create Bulk Links
              </DialogTitle>
              <DialogDescription class="mt-1 text-sm text-muted-500 dark:text-muted-400">
                Step {{ currentStep }} of {{ totalSteps }}
              </DialogDescription>
            </div>
            <BaseButton
              size="sm"
              variant="ghost"
              icon
              class="rounded-full"
              @click="isOpen = false"
            >
              <Icon name="lucide:x" class="size-4" />
            </BaseButton>
          </div>

          <!-- Progress Bar -->
          <div class="h-1 bg-muted-200 dark:bg-muted-800">
            <div
              class="h-full bg-primary-500 transition-all duration-300"
              :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
            />
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <!-- Step 1: Method Selection -->
            <div v-if="currentStep === 1" class="space-y-6">
              <div>
                <BaseHeading
                  as="h3"
                  size="lg"
                  weight="semibold"
                  class="text-muted-800 dark:text-muted-100 mb-2"
                >
                  Choose Input Method
                </BaseHeading>
                <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                  Select how you want to add your links
                </BaseParagraph>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  class="group relative rounded-xl border-2 p-6 text-left transition-all"
                  :class="
                    selectedMethod === 'manual'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-muted-300 dark:border-muted-700 hover:border-primary-400'
                  "
                  @click="selectMethod('manual')"
                >
                  <div class="mb-4 flex items-center gap-3">
                    <div
                      class="flex size-12 items-center justify-center rounded-lg"
                      :class="
                        selectedMethod === 'manual'
                          ? 'bg-primary-500 text-white'
                          : 'bg-muted-200 dark:bg-muted-700 text-muted-600 dark:text-muted-400'
                      "
                    >
                      <Icon name="ph:keyboard" class="size-6" />
                    </div>
                    <div class="flex-1">
                      <BaseHeading as="h4" size="md" weight="semibold" class="text-muted-900 dark:text-white">
                        Manual Entry
                      </BaseHeading>
                    </div>
                    <Icon
                      v-if="selectedMethod === 'manual'"
                      name="ph:check-circle-fill"
                      class="size-5 text-primary-500"
                    />
                  </div>
                  <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
                    Add links one by one or paste multiple URLs at once. Supports up to 100 links.
                  </BaseParagraph>
                </button>

                <button
                  type="button"
                  class="group relative rounded-xl border-2 p-6 text-left transition-all"
                  :class="
                    selectedMethod === 'csv'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-muted-300 dark:border-muted-700 hover:border-primary-400'
                  "
                  @click="selectMethod('csv')"
                >
                  <div class="mb-4 flex items-center gap-3">
                    <div
                      class="flex size-12 items-center justify-center rounded-lg"
                      :class="
                        selectedMethod === 'csv'
                          ? 'bg-primary-500 text-white'
                          : 'bg-muted-200 dark:bg-muted-700 text-muted-600 dark:text-muted-400'
                      "
                    >
                      <Icon name="ph:file-csv" class="size-6" />
                    </div>
                    <div class="flex-1">
                      <BaseHeading as="h4" size="md" weight="semibold" class="text-muted-900 dark:text-white">
                        CSV Upload
                      </BaseHeading>
                    </div>
                    <Icon
                      v-if="selectedMethod === 'csv'"
                      name="ph:check-circle-fill"
                      class="size-5 text-primary-500"
                    />
                  </div>
                  <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
                    Upload a CSV file with your links. Download template for the correct format.
                  </BaseParagraph>
                </button>
              </div>
            </div>

            <!-- Step 2: Link Input -->
            <div v-else-if="currentStep === 2" class="space-y-6">
              <!-- Manual Entry -->
              <div v-if="selectedMethod === 'manual'" class="space-y-6">
                <div>
                  <BaseHeading
                    as="h3"
                    size="lg"
                    weight="semibold"
                    class="text-muted-800 dark:text-muted-100 mb-2"
                  >
                    Add Links Manually
                  </BaseHeading>
                  <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-4">
                    Enter URLs one by one or paste multiple URLs (one per line). Maximum 100 links.
                  </BaseParagraph>
                  <div class="flex items-center justify-between">
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                      {{ manualLinks.filter(l => l.isValid && l.url.trim()).length }} valid link(s) of {{ manualLinks.length }} total
                    </BaseText>
                    <BaseButton
                      size="sm"
                      variant="outline"
                      :disabled="manualLinks.length >= 100"
                      @click="addManualRow"
                    >
                      <Icon name="ph:plus" class="size-4" />
                      <span>Add Row</span>
                    </BaseButton>
                  </div>
                </div>

                <div class="space-y-3 max-h-[400px] overflow-y-auto">
                  <div
                    v-for="(link, index) in manualLinks"
                    :key="link.id"
                    class="flex gap-3 items-start p-4 rounded-lg border"
                    :class="
                      link.isValid && link.url.trim()
                        ? 'border-muted-200 dark:border-muted-700 bg-white dark:bg-muted-900'
                        : link.url.trim()
                          ? 'border-danger-300 dark:border-danger-700 bg-danger-50/50 dark:bg-danger-900/20'
                          : 'border-muted-200 dark:border-muted-700 bg-muted-50/50 dark:bg-muted-800/50'
                    "
                  >
                    <div class="flex-1 space-y-3">
                      <div>
                        <TairoFormGroup
                          :label="`Link ${index + 1}`"
                          :error="link.error"
                        >
                          <TairoInput
                            :model-value="link.url"
                            type="url"
                            placeholder="https://example.com/page"
                            icon="solar:link-linear"
                            rounded="lg"
                            @update:model-value="(value) => {
                              link.url = value
                              const validation = validateUrl(value)
                              link.isValid = validation.isValid
                              link.error = validation.error
                            }"
                            @paste="handleBulkPaste"
                          />
                        </TairoFormGroup>
                      </div>
                      <div class="grid gap-3 md:grid-cols-2">
                        <TairoFormGroup label="Title (Optional)">
                          <TairoInput
                            v-model="link.title"
                            placeholder="Link title"
                            rounded="lg"
                          />
                        </TairoFormGroup>
                        <TairoFormGroup label="Description (Optional)">
                          <TairoInput
                            v-model="link.description"
                            placeholder="Link description"
                            rounded="lg"
                          />
                        </TairoFormGroup>
                      </div>
                    </div>
                    <BaseButton
                      v-if="manualLinks.length > 1"
                      size="sm"
                      variant="ghost"
                      icon
                      class="shrink-0 text-danger-600 dark:text-danger-400"
                      @click="removeManualRow(link.id)"
                    >
                      <Icon name="ph:trash" class="size-4" />
                    </BaseButton>
                  </div>
                </div>

                <BaseAlert
                  v-if="manualLinks.filter(l => l.url.trim() && !l.isValid).length > 0"
                  color="warning"
                  variant="pastel"
                  class="rounded-lg"
                >
                  <template #title>
                    {{ detectDuplicates(manualLinks).length > 0 ? 'Duplicates and invalid URLs detected' : 'Invalid URLs detected' }}
                  </template>
                  <p class="text-sm text-muted-600 dark:text-muted-300">
                    {{ detectDuplicates(manualLinks).length > 0 
                      ? `Found ${detectDuplicates(manualLinks).length} duplicate(s) and ${manualLinks.filter(l => l.url.trim() && !l.isValid && l.error !== 'Duplicate URL').length} invalid URL(s). Please fix before proceeding.`
                      : 'Please fix the invalid URLs before proceeding.' }}
                  </p>
                </BaseAlert>
              </div>

              <!-- CSV Upload -->
              <div v-else class="space-y-6">
                <div>
                  <BaseHeading
                    as="h3"
                    size="lg"
                    weight="semibold"
                    class="text-muted-800 dark:text-muted-100 mb-2"
                  >
                    Upload CSV File
                  </BaseHeading>
                  <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-4">
                    Upload a CSV file with your links. The file should contain columns: url, title (optional), description (optional).
                  </BaseParagraph>
                  <div class="flex items-center gap-2">
                    <BaseButton
                      size="sm"
                      variant="outline"
                      @click="downloadCSVTemplate"
                    >
                      <Icon name="ph:download" class="size-4" />
                      <span>Download Template</span>
                    </BaseButton>
                  </div>
                </div>

                <div
                  class="relative rounded-xl border-2 border-dashed p-8 text-center transition-all"
                  :class="
                    csvFile
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                      : 'border-muted-300 dark:border-muted-700 hover:border-primary-400'
                  "
                >
                  <input
                    type="file"
                    accept=".csv"
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    @change="handleCSVUpload"
                  >
                  <div class="space-y-4">
                    <div
                      class="mx-auto flex size-16 items-center justify-center rounded-full"
                      :class="
                        csvFile
                          ? 'bg-primary-500 text-white'
                          : 'bg-muted-200 dark:bg-muted-700 text-muted-600 dark:text-muted-400'
                      "
                    >
                      <Icon name="ph:file-csv" class="size-8" />
                    </div>
                    <div>
                      <BaseHeading as="h4" size="md" weight="semibold" class="text-muted-900 dark:text-white mb-2">
                        {{ csvFile ? csvFile.name : 'Drop CSV file here or click to browse' }}
                      </BaseHeading>
                      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                        {{ csvFile ? `${csvLinks.length} link(s) found` : 'CSV files only, max 100 links' }}
                      </BaseParagraph>
                    </div>
                  </div>
                </div>

                <!-- CSV Preview Table -->
                <div v-if="csvLinks.length > 0" class="space-y-4">
                  <div class="flex items-center justify-between">
                    <BaseHeading as="h4" size="md" weight="semibold" class="text-muted-900 dark:text-white">
                      Preview ({{ csvLinks.filter(l => l.isValid).length }} valid of {{ csvLinks.length }} total)
                    </BaseHeading>
                  </div>
                  <div class="rounded-lg border border-muted-200 dark:border-muted-700 overflow-hidden">
                    <div class="max-h-[300px] overflow-y-auto">
                      <table class="w-full">
                        <thead class="bg-muted-50 dark:bg-muted-800/50 border-b border-muted-200 dark:border-muted-700">
                          <tr>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-muted-600 dark:text-muted-400">URL</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-muted-600 dark:text-muted-400">Title</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-muted-600 dark:text-muted-400">Status</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-muted-200 dark:divide-muted-700">
                          <tr
                            v-for="link in csvLinks.slice(0, 10)"
                            :key="link.id"
                            class="hover:bg-muted-50/50 dark:hover:bg-muted-800/30"
                          >
                            <td class="px-4 py-3 text-sm text-muted-700 dark:text-muted-300">
                              <div class="max-w-xs truncate" :title="link.url">
                                {{ link.url }}
                              </div>
                            </td>
                            <td class="px-4 py-3 text-sm text-muted-600 dark:text-muted-400">
                              {{ link.title || '-' }}
                            </td>
                            <td class="px-4 py-3">
                              <BaseChip
                                :color="link.isValid ? 'success' : 'danger'"
                                size="xs"
                              >
                                {{ link.isValid ? 'Valid' : 'Invalid' }}
                              </BaseChip>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div
                      v-if="csvLinks.length > 10"
                      class="px-4 py-3 text-center text-xs text-muted-500 dark:text-muted-400 bg-muted-50 dark:bg-muted-800/50 border-t border-muted-200 dark:border-muted-700"
                    >
                      Showing 10 of {{ csvLinks.length }} links
                    </div>
                  </div>
                  <BaseAlert
                    v-if="csvLinks.filter(l => !l.isValid).length > 0"
                    color="warning"
                    variant="pastel"
                    class="rounded-lg"
                  >
                    <template #title>
                      {{ csvLinks.filter(l => !l.isValid).length }} invalid URL(s) found
                    </template>
                    <p class="text-sm text-muted-600 dark:text-muted-300">
                      Invalid links will be skipped during creation.
                    </p>
                  </BaseAlert>
                </div>
              </div>
            </div>

            <!-- Step 3: Shared Settings -->
            <div v-else-if="currentStep === 3" class="space-y-6">
              <div>
                <BaseHeading
                  as="h3"
                  size="lg"
                  weight="semibold"
                  class="text-muted-800 dark:text-muted-100 mb-2"
                >
                  Shared Settings
                </BaseHeading>
                <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                  These settings will apply to all links in this bulk operation
                </BaseParagraph>
              </div>

              <!-- Visibility & Access -->
              <div class="space-y-4">
                <TairoFormGroup label="Visibility">
                  <div class="flex gap-4">
                    <button
                      type="button"
                      class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium text-left"
                      :class="
                        sharedSettings.visibility === 'public'
                          ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
                      "
                      @click="sharedSettings.visibility = 'public'"
                    >
                      <div class="font-medium mb-1">Public</div>
                      <div class="text-xs opacity-75">Anyone with the link can access it</div>
                    </button>
                    <button
                      type="button"
                      class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium text-left"
                      :class="
                        sharedSettings.visibility === 'private'
                          ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
                      "
                      @click="sharedSettings.visibility = 'private'"
                    >
                      <div class="font-medium mb-1">Private</div>
                      <div class="text-xs opacity-75">Restrict access to specific roles or teammates</div>
                    </button>
                  </div>
                </TairoFormGroup>

                <div v-if="sharedSettings.visibility === 'private'" class="space-y-4">
                  <BaseCard class="p-5">
                    <div class="flex items-center justify-between mb-4">
                      <div>
                        <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-800 dark:text-white">
                          Allow workspace roles
                        </BaseHeading>
                        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                          Members with these roles can see and manage the links
                        </BaseParagraph>
                      </div>
                      <BaseTag
                        v-if="selectedVisibilityRoleLabels.length"
                        size="sm"
                        variant="pastel"
                        color="primary"
                      >
                        {{ selectedVisibilityRoleLabels.length }} selected
                      </BaseTag>
                    </div>
                    <div class="grid gap-3 md:grid-cols-2">
                      <button
                        v-for="option in visibilityRoleOptions"
                        :key="option.value"
                        type="button"
                        class="text-left rounded-lg border px-4 py-3 transition-all"
                        :class="
                          sharedSettings.visibilityRoles.includes(option.value)
                            ? 'border-emerald-600 dark:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'border-muted-300 dark:border-muted-600 text-muted-700 dark:text-muted-200 hover:border-emerald-400/60'
                        "
                        @click="toggleVisibilityRole(option.value)"
                      >
                        <div class="flex items-center justify-between">
                          <BaseText weight="semibold" size="sm">
                            {{ option.label }}
                          </BaseText>
                          <Icon
                            v-if="sharedSettings.visibilityRoles.includes(option.value)"
                            name="ph:check-circle"
                            class="size-4 text-emerald-500"
                          />
                        </div>
                        <BaseParagraph size="xs" class="opacity-75 mt-1">
                          {{ option.description }}
                        </BaseParagraph>
                      </button>
                    </div>
                  </BaseCard>

                  <BaseCard class="p-5">
                    <div class="flex items-center justify-between mb-4">
                      <div>
                        <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-800 dark:text-white">
                          Invite specific teammates
                        </BaseHeading>
                        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                          Only selected members can view analytics or edit these links
                        </BaseParagraph>
                      </div>
                      <BaseTag
                        v-if="sharedSettings.visibilityMemberIds.length"
                        size="sm"
                        variant="pastel"
                        color="primary"
                      >
                        {{ sharedSettings.visibilityMemberIds.length }} selected
                      </BaseTag>
                    </div>
                    <div class="flex items-center gap-2 mb-3">
                      <TairoInput
                        v-model="memberSearch"
                        placeholder="Search by name or email"
                        icon="solar:magnifer-linear"
                        rounded="lg"
                      />
                      <Icon
                        v-if="isLoadingMembers"
                        name="svg-spinners:ring-resize"
                        class="size-5 text-muted-400"
                      />
                    </div>
                    <div class="max-h-48 overflow-y-auto border border-muted-200 dark:border-muted-700 rounded-lg divide-y divide-muted-100 dark:divide-muted-800">
                      <div
                        v-for="member in filteredMembers"
                        :key="member.id"
                        class="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted-50 dark:hover:bg-muted-800/40 transition-colors"
                        @click="toggleVisibilityMember(member.id)"
                      >
                        <BaseCheckbox
                          :model-value="sharedSettings.visibilityMemberIds.includes(member.id)"
                          rounded="sm"
                          color="primary"
                          @click.stop="toggleVisibilityMember(member.id)"
                        />
                        <div class="flex-1 min-w-0">
                          <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-white truncate">
                            {{ member.displayName }}
                          </BaseText>
                          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 truncate">
                            {{ member.email }}
                          </BaseParagraph>
                        </div>
                      </div>
                      <div
                        v-if="!filteredMembers.length && !isLoadingMembers"
                        class="p-4 text-center text-sm text-muted-500 dark:text-muted-400"
                      >
                        No teammates match your search
                      </div>
                    </div>
                  </BaseCard>
                </div>
              </div>

              <!-- Limits & Security -->
              <div class="space-y-4 pt-4 border-t border-muted-200 dark:border-muted-700">
                <TairoFormGroup label="Link Type">
                  <div class="flex gap-4">
                    <button
                      type="button"
                      class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium text-left"
                      :class="
                        sharedSettings.type === 'permanent'
                          ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
                      "
                      @click="sharedSettings.type = 'permanent'"
                    >
                      <div class="font-medium mb-1">Permanent</div>
                      <div class="text-xs opacity-75">Links never expire</div>
                    </button>
                    <button
                      type="button"
                      class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium text-left"
                      :class="
                        sharedSettings.type === 'one-time'
                          ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
                      "
                      @click="sharedSettings.type = 'one-time'"
                    >
                      <div class="font-medium mb-1">One-Time Use</div>
                      <div class="text-xs opacity-75">Links expire after first visit</div>
                    </button>
                  </div>
                </TairoFormGroup>

                <TairoFormGroup
                  v-if="sharedSettings.type === 'one-time'"
                  label="Expiration Date"
                >
                  <TairoInput
                    v-model="sharedSettings.expiresAt"
                    type="datetime-local"
                    icon="solar:calendar-linear"
                    rounded="lg"
                  />
                </TairoFormGroup>

                <BaseCard class="p-5 space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-800 dark:text-white">
                        Password protection
                      </BaseHeading>
                      <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                        Require a password before redirecting visitors
                      </BaseParagraph>
                    </div>
                    <BaseSwitchBall v-model="sharedSettings.hasPassword" variant="primary" />
                  </div>
                  <TairoInput
                    v-if="sharedSettings.hasPassword"
                    v-model="sharedSettings.password"
                    type="password"
                    placeholder="Set an access password"
                    icon="solar:lock-password-linear"
                    rounded="lg"
                  />
                </BaseCard>

                <TairoFormGroup label="Click limit (optional)">
                  <TairoInput
                    v-model.number="sharedSettings.clickLimit"
                    type="number"
                    min="1"
                    placeholder="e.g., 1000"
                    icon="solar:mouse-linear"
                    rounded="lg"
                  />
                  <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
                    Links will be disabled automatically after reaching this limit
                  </BaseParagraph>
                </TairoFormGroup>
              </div>

              <!-- Domain Configuration -->
              <div class="space-y-4 pt-4 border-t border-muted-200 dark:border-muted-700">
                <BaseHeading as="h4" size="md" weight="semibold" class="text-muted-800 dark:text-white mb-4">
                  Domain Configuration
                </BaseHeading>

                <div class="space-y-4">
                  <BaseParagraph size="sm" weight="medium" class="text-muted-600 dark:text-muted-300">
                    Default domain
                  </BaseParagraph>
                  <BaseCard
                    v-if="domains.find(d => d.domainType === 'default')"
                    class="p-4 border-2 transition-all cursor-pointer"
                    :class="
                      sharedSettings.domainType === 'default'
                        ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20'
                        : 'border-muted-200 dark:border-muted-700 hover:border-primary-300'
                    "
                    @click="selectDefaultDomain()"
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <BaseHeading as="h5" size="sm" weight="semibold">snap.ly</BaseHeading>
                        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">Managed by Snaplink</BaseParagraph>
                      </div>
                      <Icon
                        v-if="sharedSettings.domainType === 'default'"
                        name="ph:check-circle"
                        class="size-5 text-primary-500"
                      />
                    </div>
                  </BaseCard>
                </div>

                <div class="space-y-3">
                  <BaseParagraph size="sm" weight="medium" class="text-muted-600 dark:text-muted-300">
                    Workspace subdomains
                  </BaseParagraph>
                  <div
                    v-if="domains.filter(d => d.domainType === 'subdomain').length"
                    class="grid gap-3 md:grid-cols-2"
                  >
                    <BaseCard
                      v-for="domain in domains.filter(d => d.domainType === 'subdomain')"
                      :key="domain.value"
                      class="p-4 border-2 transition-all cursor-pointer"
                      :class="
                        sharedSettings.domain === domain.value
                          ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20'
                          : 'border-muted-200 dark:border-muted-700 hover:border-primary-300'
                      "
                      @click="selectDomain(domain)"
                    >
                      <div class="flex items-center justify-between">
                        <div>
                          <BaseHeading as="h5" size="sm" weight="semibold">{{ domain.label }}</BaseHeading>
                          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">Verified subdomain</BaseParagraph>
                        </div>
                        <Icon
                          v-if="sharedSettings.domain === domain.value"
                          name="ph:check-circle"
                          class="size-5 text-primary-500"
                        />
                      </div>
                    </BaseCard>
                  </div>
                  <div
                    v-else
                    class="rounded-lg border border-dashed border-muted-300 dark:border-muted-700 px-4 py-6 text-center text-sm text-muted-500 dark:text-muted-400"
                  >
                    No subdomains available
                  </div>
                </div>

                <div class="space-y-3">
                  <BaseParagraph size="sm" weight="medium" class="text-muted-600 dark:text-muted-300">
                    Workspace custom domains
                  </BaseParagraph>
                  <div
                    v-if="domains.filter(d => d.domainType === 'custom').length"
                    class="grid gap-3 md:grid-cols-2"
                  >
                    <BaseCard
                      v-for="domain in domains.filter(d => d.domainType === 'custom')"
                      :key="domain.value"
                      class="p-4 border-2 transition-all cursor-pointer"
                      :class="
                        sharedSettings.domain === domain.value
                          ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20'
                          : 'border-muted-200 dark:border-muted-700 hover:border-primary-300'
                      "
                      @click="selectDomain(domain)"
                    >
                      <div class="flex items-center justify-between">
                        <div>
                          <BaseHeading as="h5" size="sm" weight="semibold">{{ domain.label }}</BaseHeading>
                          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">Custom domain</BaseParagraph>
                        </div>
                        <Icon
                          v-if="sharedSettings.domain === domain.value"
                          name="ph:check-circle"
                          class="size-5 text-primary-500"
                        />
                      </div>
                    </BaseCard>
                  </div>
                  <div
                    v-else
                    class="rounded-lg border border-dashed border-muted-300 dark:border-muted-700 px-4 py-6 text-center text-sm text-muted-500 dark:text-muted-400"
                  >
                    No custom domains available
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 4: Preview -->
            <div v-else-if="currentStep === 4" class="space-y-6">
              <div>
                <BaseHeading
                  as="h3"
                  size="lg"
                  weight="semibold"
                  class="text-muted-800 dark:text-muted-100 mb-2"
                >
                  Preview & Review
                </BaseHeading>
                <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                  Review all links before creating. You can remove any link you don't want to create.
                </BaseParagraph>
              </div>

              <!-- Summary Cards -->
              <div class="grid gap-4 md:grid-cols-3">
                <BaseCard class="p-4">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300">
                      <Icon name="ph:link" class="size-5" />
                    </div>
                    <div>
                      <BaseText size="xs" class="text-muted-500 dark:text-muted-400">Total Links</BaseText>
                      <BaseHeading as="h4" size="xl" weight="bold" class="text-muted-900 dark:text-white">
                        {{ previewLinks.length }}
                      </BaseHeading>
                    </div>
                  </div>
                </BaseCard>
                <BaseCard class="p-4">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-300">
                      <Icon name="ph:check-circle" class="size-5" />
                    </div>
                    <div>
                      <BaseText size="xs" class="text-muted-500 dark:text-muted-400">Valid Links</BaseText>
                      <BaseHeading as="h4" size="xl" weight="bold" class="text-muted-900 dark:text-white">
                        {{ previewLinks.filter(l => l.isValid).length }}
                      </BaseHeading>
                    </div>
                  </div>
                </BaseCard>
                <BaseCard class="p-4">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg bg-muted-100 dark:bg-muted-800 text-muted-600 dark:text-muted-400">
                      <Icon name="ph:globe" class="size-5" />
                    </div>
                    <div>
                      <BaseText size="xs" class="text-muted-500 dark:text-muted-400">Domain</BaseText>
                      <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-900 dark:text-white truncate">
                        {{ sharedSettings.domain }}
                      </BaseHeading>
                    </div>
                  </div>
                </BaseCard>
              </div>

              <!-- Preview Table -->
              <div class="rounded-lg border border-muted-200 dark:border-muted-700 overflow-hidden">
                <div class="max-h-[400px] overflow-y-auto">
                  <table class="w-full">
                    <thead class="bg-muted-50 dark:bg-muted-800/50 border-b border-muted-200 dark:border-muted-700 sticky top-0">
                      <tr>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-muted-600 dark:text-muted-400">#</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-muted-600 dark:text-muted-400">Original URL</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-muted-600 dark:text-muted-400">Title</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-muted-600 dark:text-muted-400">Short URL Preview</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-muted-600 dark:text-muted-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-muted-200 dark:divide-muted-700">
                      <tr
                        v-for="(link, index) in previewLinks"
                        :key="link.id"
                        class="hover:bg-muted-50/50 dark:hover:bg-muted-800/30"
                      >
                        <td class="px-4 py-3 text-sm text-muted-600 dark:text-muted-400">
                          {{ index + 1 }}
                        </td>
                        <td class="px-4 py-3">
                          <div class="max-w-xs">
                            <div class="text-sm text-muted-700 dark:text-muted-300 truncate" :title="link.url">
                              {{ link.url }}
                            </div>
                          </div>
                        </td>
                        <td class="px-4 py-3 text-sm text-muted-600 dark:text-muted-400">
                          {{ link.title || '-' }}
                        </td>
                        <td class="px-4 py-3">
                          <div class="text-sm font-mono text-muted-600 dark:text-muted-400">
                            {{ generateShortUrlPreview(link.url, index + 1) }}
                          </div>
                        </td>
                        <td class="px-4 py-3">
                          <BaseButton
                            size="sm"
                            variant="ghost"
                            icon
                            class="text-danger-600 dark:text-danger-400"
                            @click="removePreviewLink(link.id)"
                          >
                            <Icon name="ph:trash" class="size-4" />
                          </BaseButton>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Settings Summary -->
              <BaseCard class="p-5">
                <BaseHeading as="h4" size="md" weight="semibold" class="text-muted-900 dark:text-white mb-4">
                  Settings Summary
                </BaseHeading>
                <div class="grid gap-3 md:grid-cols-2">
                  <div class="flex items-center gap-2">
                    <Icon name="ph:eye" class="size-4 text-muted-500" />
                    <BaseText size="sm" class="text-muted-600 dark:text-muted-300">
                      Visibility: <span class="font-semibold">{{ sharedSettings.visibility === 'public' ? 'Public' : 'Private' }}</span>
                    </BaseText>
                  </div>
                  <div class="flex items-center gap-2">
                    <Icon name="ph:clock" class="size-4 text-muted-500" />
                    <BaseText size="sm" class="text-muted-600 dark:text-muted-300">
                      Type: <span class="font-semibold">{{ sharedSettings.type === 'permanent' ? 'Permanent' : 'One-Time' }}</span>
                    </BaseText>
                  </div>
                  <div class="flex items-center gap-2">
                    <Icon name="ph:lock" class="size-4 text-muted-500" />
                    <BaseText size="sm" class="text-muted-600 dark:text-muted-300">
                      Password: <span class="font-semibold">{{ sharedSettings.hasPassword ? 'Yes' : 'No' }}</span>
                    </BaseText>
                  </div>
                  <div class="flex items-center gap-2">
                    <Icon name="ph:mouse" class="size-4 text-muted-500" />
                    <BaseText size="sm" class="text-muted-600 dark:text-muted-300">
                      Click Limit: <span class="font-semibold">{{ sharedSettings.clickLimit || 'Unlimited' }}</span>
                    </BaseText>
                  </div>
                </div>
              </BaseCard>
            </div>

            <!-- Step 5: Results -->
            <div v-else-if="currentStep === 5" class="space-y-6">
              <div>
                <BaseHeading
                  as="h3"
                  size="lg"
                  weight="semibold"
                  class="text-muted-800 dark:text-muted-100 mb-2"
                >
                  Creation Results
                </BaseHeading>
                <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                  Review the results of your bulk link creation
                </BaseParagraph>
              </div>

              <!-- Progress Indicator (if creating) -->
              <div v-if="isCreating" class="space-y-4">
                <BaseCard class="p-6">
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <BaseText size="sm" weight="medium" class="text-muted-700 dark:text-muted-300">
                        Creating links...
                      </BaseText>
                      <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                        {{ creationProgress }}%
                      </BaseText>
                    </div>
                    <div class="h-2 bg-muted-200 dark:bg-muted-800 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-primary-500 transition-all duration-300"
                        :style="{ width: `${creationProgress}%` }"
                      />
                    </div>
                  </div>
                </BaseCard>
              </div>

              <!-- Results Summary -->
              <div v-else class="grid gap-4 md:grid-cols-3">
                <BaseCard class="p-4">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-300">
                      <Icon name="ph:check-circle" class="size-5" />
                    </div>
                    <div>
                      <BaseText size="xs" class="text-muted-500 dark:text-muted-400">Successful</BaseText>
                      <BaseHeading as="h4" size="xl" weight="bold" class="text-success-600 dark:text-success-400">
                        {{ results.filter(r => r.success).length }}
                      </BaseHeading>
                    </div>
                  </div>
                </BaseCard>
                <BaseCard class="p-4">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-300">
                      <Icon name="ph:x-circle" class="size-5" />
                    </div>
                    <div>
                      <BaseText size="xs" class="text-muted-500 dark:text-muted-400">Failed</BaseText>
                      <BaseHeading as="h4" size="xl" weight="bold" class="text-danger-600 dark:text-danger-400">
                        {{ results.filter(r => !r.success).length }}
                      </BaseHeading>
                    </div>
                  </div>
                </BaseCard>
                <BaseCard class="p-4">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300">
                      <Icon name="ph:chart-line" class="size-5" />
                    </div>
                    <div>
                      <BaseText size="xs" class="text-muted-500 dark:text-muted-400">Success Rate</BaseText>
                      <BaseHeading as="h4" size="xl" weight="bold" class="text-muted-900 dark:text-white">
                        {{ results.length > 0 ? Math.round((results.filter(r => r.success).length / results.length) * 100) : 0 }}%
                      </BaseHeading>
                    </div>
                  </div>
                </BaseCard>
              </div>

              <!-- Successful Links -->
              <div v-if="results.filter(r => r.success).length > 0" class="space-y-4">
                <div class="flex items-center justify-between">
                  <BaseHeading as="h4" size="md" weight="semibold" class="text-muted-900 dark:text-white">
                    Successful Links ({{ results.filter(r => r.success).length }})
                  </BaseHeading>
                  <BaseButton
                    size="sm"
                    variant="outline"
                    @click="copyAllUrls"
                  >
                    <Icon name="ph:copy" class="size-4" />
                    <span>Copy All URLs</span>
                  </BaseButton>
                </div>
                <div class="rounded-lg border border-success-200 dark:border-success-800 bg-success-50/30 dark:bg-success-900/10 overflow-hidden">
                  <div class="max-h-[300px] overflow-y-auto">
                    <table class="w-full">
                      <thead class="bg-success-100/50 dark:bg-success-900/20 border-b border-success-200 dark:border-success-800">
                        <tr>
                          <th class="px-4 py-3 text-left text-xs font-semibold text-success-700 dark:text-success-300">#</th>
                          <th class="px-4 py-3 text-left text-xs font-semibold text-success-700 dark:text-success-300">Original URL</th>
                          <th class="px-4 py-3 text-left text-xs font-semibold text-success-700 dark:text-success-300">Short URL</th>
                          <th class="px-4 py-3 text-left text-xs font-semibold text-success-700 dark:text-success-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-success-200 dark:divide-success-800">
                        <tr
                          v-for="(result, index) in results.filter(r => r.success)"
                          :key="result.id"
                          class="hover:bg-success-100/30 dark:hover:bg-success-900/20"
                        >
                          <td class="px-4 py-3 text-sm text-success-700 dark:text-success-300">
                            {{ index + 1 }}
                          </td>
                          <td class="px-4 py-3">
                            <div class="max-w-xs text-sm text-muted-700 dark:text-muted-300 truncate" :title="result.url">
                              {{ result.url }}
                            </div>
                          </td>
                          <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                              <div class="text-sm font-mono text-success-700 dark:text-success-300">
                                {{ result.shortUrl }}
                              </div>
                              <BaseButton
                                size="sm"
                                variant="ghost"
                                icon
                                @click="navigator.clipboard.writeText(result.shortUrl || '')"
                              >
                                <Icon name="ph:copy" class="size-4" />
                              </BaseButton>
                            </div>
                          </td>
                          <td class="px-4 py-3">
                            <BaseChip color="success" size="xs">
                              Success
                            </BaseChip>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Failed Links -->
              <div v-if="results.filter(r => !r.success).length > 0" class="space-y-4">
                <BaseHeading as="h4" size="md" weight="semibold" class="text-muted-900 dark:text-white">
                  Failed Links ({{ results.filter(r => !r.success).length }})
                </BaseHeading>
                <div class="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50/30 dark:bg-danger-900/10 overflow-hidden">
                  <div class="max-h-[300px] overflow-y-auto">
                    <table class="w-full">
                      <thead class="bg-danger-100/50 dark:bg-danger-900/20 border-b border-danger-200 dark:border-danger-800">
                        <tr>
                          <th class="px-4 py-3 text-left text-xs font-semibold text-danger-700 dark:text-danger-300">#</th>
                          <th class="px-4 py-3 text-left text-xs font-semibold text-danger-700 dark:text-danger-300">Original URL</th>
                          <th class="px-4 py-3 text-left text-xs font-semibold text-danger-700 dark:text-danger-300">Error</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-danger-200 dark:divide-danger-800">
                        <tr
                          v-for="(result, index) in results.filter(r => !r.success)"
                          :key="result.id"
                          class="hover:bg-danger-100/30 dark:hover:bg-danger-900/20"
                        >
                          <td class="px-4 py-3 text-sm text-danger-700 dark:text-danger-300">
                            {{ index + 1 }}
                          </td>
                          <td class="px-4 py-3">
                            <div class="max-w-xs text-sm text-muted-700 dark:text-muted-300 truncate" :title="result.url">
                              {{ result.url }}
                            </div>
                          </td>
                          <td class="px-4 py-3">
                            <BaseText size="sm" class="text-danger-600 dark:text-danger-400">
                              {{ result.error || 'Unknown error' }}
                            </BaseText>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center justify-between pt-4 border-t border-muted-200 dark:border-muted-700">
                <div class="flex items-center gap-2">
                  <BaseButton
                    variant="outline"
                    @click="downloadResultsCSV"
                  >
                    <Icon name="ph:download" class="size-4" />
                    <span>Download CSV</span>
                  </BaseButton>
                  <BaseButton
                    variant="outline"
                    @click="viewInLinks"
                  >
                    <Icon name="ph:arrow-right" class="size-4" />
                    <span>View in Links</span>
                  </BaseButton>
                </div>
                <BaseButton
                  variant="primary"
                  @click="resetWizard(); currentStep = 1"
                >
                  <Icon name="ph:plus" class="size-4" />
                  <span>Create More</span>
                </BaseButton>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between border-t border-muted-200 px-6 py-4 dark:border-muted-800">
            <BaseButton
              v-if="currentStep > 1"
              variant="outline"
              @click="prevStep"
            >
              <Icon name="ph:arrow-left" class="size-4" />
              <span>Previous</span>
            </BaseButton>
            <div v-else />

            <div class="flex items-center gap-2">
              <BaseButton
                variant="outline"
                @click="isOpen = false"
              >
                Cancel
              </BaseButton>
              <BaseButton
                v-if="currentStep === 1"
                variant="primary"
                :disabled="!selectedMethod"
                @click="nextFromStep1"
              >
                <span>Next</span>
                <Icon name="ph:arrow-right" class="size-4" />
              </BaseButton>
              <BaseButton
                v-else-if="currentStep === 2"
                variant="primary"
                @click="nextFromStep2"
              >
                <span>Next</span>
                <Icon name="ph:arrow-right" class="size-4" />
              </BaseButton>
              <BaseButton
                v-else-if="currentStep === 3"
                variant="primary"
                @click="nextFromStep3"
              >
                <span>Next</span>
                <Icon name="ph:arrow-right" class="size-4" />
              </BaseButton>
              <BaseButton
                v-else-if="currentStep === 4"
                variant="primary"
                :disabled="previewLinks.length === 0 || isCreating"
                @click="createBulkLinks"
              >
                <Icon name="ph:magic-wand" class="size-4" />
                <span>Create {{ previewLinks.length }} Link(s)</span>
              </BaseButton>
            </div>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

