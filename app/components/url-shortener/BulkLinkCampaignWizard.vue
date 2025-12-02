<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from '#imports'
import type { CreateBulkLinkCampaignRequest, BulkLinkCampaignItem, BulkLinkTemplateListItem } from '~/types/bulk-link'
import { useBulkLinkTemplates } from '~/composables/useBulkLinkTemplates'
import { useBulkLinkCampaigns } from '~/composables/useBulkLinkCampaigns'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import { useCSVParser } from '~/composables/useCSVParser'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
  created: []
}>()

const toaster = useNuiToasts()
const { workspaceId } = useWorkspaceContext()
const { items: templates, fetchTemplates } = useBulkLinkTemplates()
const { createCampaign } = useBulkLinkCampaigns()
const { parseCSV } = useCSVParser()

const isOpen = computed({
  get: () => props.open,
  set: (value) => {
    emit('update:open', value)
    if (!value) {
      emit('close')
      nextTick(() => resetWizard())
    }
  },
})

const totalSteps = 4
const currentStep = ref(1)
const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})

interface LinkInput {
  id: string
  destinationUrl: string
  title?: string
  description?: string
  isValid: boolean
  error?: string
}

const formData = ref({
  name: '',
  description: '',
  templateId: '',
  inputMethod: 'manual' as 'manual' | 'csv',
  manualLinks: [
    { id: '1', destinationUrl: '', title: '', description: '', isValid: true },
  ] as LinkInput[],
  csvFile: null as File | null,
  csvLinks: [] as LinkInput[],
})

const selectedTemplate = computed(() => {
  return templates.value.find(t => t.id === formData.value.templateId)
})

const linksToCreate = computed(() => {
  return formData.value.inputMethod === 'manual'
    ? formData.value.manualLinks.filter(l => l.destinationUrl.trim())
    : formData.value.csvLinks
})

const addManualLink = () => {
  const newId = (formData.value.manualLinks.length + 1).toString()
  formData.value.manualLinks.push({
    id: newId,
    destinationUrl: '',
    title: '',
    description: '',
    isValid: true,
  })
}

const removeManualLink = (id: string) => {
  if (formData.value.manualLinks.length > 1) {
    formData.value.manualLinks = formData.value.manualLinks.filter(l => l.id !== id)
  }
}

const validateUrl = (url: string): boolean => {
  if (!url.trim()) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const validateManualLinks = () => {
  let isValid = true
  formData.value.manualLinks.forEach(link => {
    if (link.destinationUrl.trim()) {
      link.isValid = validateUrl(link.destinationUrl)
      link.error = link.isValid ? undefined : 'Invalid URL'
      if (!link.isValid) isValid = false
    }
  })
  return isValid
}

const handleCSVUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  formData.value.csvFile = file

  try {
    const parsedData = await parseCSV(file, ['url', 'title', 'description'])
    
    formData.value.csvLinks = parsedData.map((row, index) => {
      const url = row.url || row.destinationurl || row.destinationUrl || ''
      const isValid = validateUrl(url)
      
      return {
        id: `csv-${index + 1}`,
        destinationUrl: url,
      title: row.title || '',
      description: row.description || '',
        isValid,
        error: isValid ? undefined : 'Invalid URL format',
      }
    })

    const validCount = formData.value.csvLinks.filter(l => l.isValid).length

    toaster.add({
      title: 'CSV Loaded',
      description: `Loaded ${validCount} valid links from ${formData.value.csvLinks.length} total`,
      icon: 'ph:check',
      color: validCount === formData.value.csvLinks.length ? 'success' : 'warning',
      progress: true,
    })
  } catch (error: any) {
    toaster.add({
      title: 'CSV Parse Error',
      description: error.message || 'Failed to parse CSV file',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
  }
}

const nextStep = () => {
  if (validateCurrentStep()) {
    if (currentStep.value < totalSteps) {
      currentStep.value++
      console.log('[BulkLinkCampaignWizard] Moved to step:', currentStep.value)
    }
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const validateCurrentStep = (): boolean => {
  errors.value = {}

  switch (currentStep.value) {
    case 1: // Template Selection
      if (!formData.value.templateId) {
        errors.value.template = 'Please select a template'
        return false
      }
      return true

    case 2: // Campaign Info
      if (!formData.value.name.trim()) {
        errors.value.name = 'Campaign name is required'
        return false
      }
      return true

    case 3: // Links Input
      if (formData.value.inputMethod === 'manual') {
        if (!validateManualLinks()) {
          errors.value.links = 'Please fix invalid URLs'
          return false
        }
        const validLinks = formData.value.manualLinks.filter(l => l.destinationUrl.trim() && l.isValid)
        if (validLinks.length === 0) {
          errors.value.links = 'Add at least one valid link'
          return false
        }
      } else {
        if (formData.value.csvLinks.length === 0) {
          errors.value.csv = 'Please upload a CSV file'
          return false
        }
        const validLinks = formData.value.csvLinks.filter(l => l.isValid)
        if (validLinks.length === 0) {
          errors.value.csv = 'No valid URLs found in CSV'
          return false
        }
      }
      return true

    case 4: // Preview
      return true

    default:
      return true
  }
}

const handleSubmit = async () => {
  if (!validateCurrentStep()) return

  isSubmitting.value = true

  try {
    const items: BulkLinkCampaignItem[] = linksToCreate.value
      .filter(l => l.isValid)
      .map(l => ({
        destinationUrl: l.destinationUrl,
        title: l.title || null,
        description: l.description || null,
      }))

    const request: CreateBulkLinkCampaignRequest = {
      templateId: formData.value.templateId,
      name: formData.value.name,
      description: formData.value.description || null,
      items,
    }

    await createCampaign(request)

    toaster.add({
      title: 'Campaign created',
      description: `Successfully created campaign with ${items.length} link(s)`,
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })

    emit('created')
    isOpen.value = false
  } catch (error: any) {
    console.error('Failed to create campaign:', error)
    
    let errorMessage = 'Failed to create campaign. Please try again.'
    
    if (error?.data?.message) {
      errorMessage = error.data.message
    } else if (error?.message) {
      errorMessage = error.message
    } else if (error?.statusCode === 404) {
      errorMessage = 'API endpoint not found. Please ensure the UrlShortener API is running.'
    } else if (error?.statusCode === 401 || error?.statusCode === 403) {
      errorMessage = 'You do not have permission to perform this action.'
    } else if (error?.statusCode >= 500) {
      errorMessage = 'Server error. Please try again later.'
    }
    
    toaster.add({
      title: 'Failed to create campaign',
      description: errorMessage,
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
    
    // Keep modal open so user can retry
  } finally {
    isSubmitting.value = false
  }
}

const resetWizard = () => {
  currentStep.value = 1
  formData.value = {
    name: '',
    description: '',
    templateId: '',
    inputMethod: 'manual',
    manualLinks: [
      { id: '1', destinationUrl: '', title: '', description: '', isValid: true },
    ],
    csvFile: null,
    csvLinks: [],
  }
  errors.value = {}
}

const handleClose = () => {
  isOpen.value = false
}

onMounted(async () => {
  if (workspaceId.value) {
    await fetchTemplates({ force: true })
  }
})

watch(isOpen, async (value) => {
  if (value && workspaceId.value) {
    await fetchTemplates({ force: true })
  }
})
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogPortal>
      <DialogOverlay class="bg-muted-800/70 dark:bg-muted-900/80 fixed inset-0 z-50" />
      <DialogContent
        class="fixed top-[4%] start-1/2 max-h-[92vh] w-[92vw] max-w-4xl -translate-x-1/2 rounded-2xl border border-muted-200 dark:border-muted-700 bg-white dark:bg-muted-900 focus:outline-none z-[100] flex flex-col"
        @escape-key-down="handleClose"
        @interact-outside.prevent
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-muted-200 dark:border-muted-800 px-6 py-4">
          <div>
            <DialogTitle class="font-heading text-xl font-semibold text-muted-900 dark:text-white">
              Create Bulk Campaign
            </DialogTitle>
            <DialogDescription class="text-sm text-muted-500 dark:text-muted-400">
              Step {{ currentStep }} of {{ totalSteps }}
            </DialogDescription>
          </div>
          <BaseButton size="sm" variant="ghost" @click="handleClose">
            <Icon name="lucide:x" class="size-4" />
          </BaseButton>
        </div>

        <!-- Progress -->
        <div class="h-1 bg-muted-200 dark:bg-muted-800">
          <div
            class="h-full bg-primary-500 transition-all duration-300"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Step 1: Select Template -->
          <div v-if="currentStep === 1" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-muted-100 mb-2">
                Select Template
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Choose a template to use for this campaign
              </BaseParagraph>
            </div>

            <div v-if="errors.template" class="rounded-lg bg-danger-50 dark:bg-danger-900/20 p-3 text-sm text-danger-600 dark:text-danger-400">
              {{ errors.template }}
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <BaseCard
                v-for="template in templates"
                :key="template.id"
                class="p-4 border-2 transition-all cursor-pointer"
                :class="formData.templateId === template.id
                  ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20'
                  : 'border-muted-200 dark:border-muted-700 hover:border-primary-300'"
                @click="formData.templateId = template.id"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <BaseHeading as="h5" size="sm" weight="semibold" class="mb-1">
                      {{ template.name }}
                    </BaseHeading>
                    <BaseParagraph
                      v-if="template.description"
                      size="xs"
                      class="text-muted-500 dark:text-muted-400 mb-2 line-clamp-2"
                    >
                      {{ template.description }}
                    </BaseParagraph>
                    <div class="flex items-center gap-4 text-xs text-muted-500">
                      <span>{{ template.ruleCount }} rules</span>
                      <span>{{ template.campaignCount }} campaigns</span>
                      <span>{{ template.totalLinks }} links</span>
                    </div>
                  </div>
                  <Icon
                    v-if="formData.templateId === template.id"
                    name="ph:check-circle"
                    class="size-5 text-primary-500 shrink-0"
                  />
                </div>
              </BaseCard>
            </div>

            <div
              v-if="templates.length === 0"
              class="text-center py-8 border-2 border-dashed border-muted-300 dark:border-muted-600 rounded-lg"
            >
              <Icon name="solar:document-text-linear" class="size-12 mx-auto text-muted-400 mb-2" />
              <BaseParagraph class="text-muted-500 dark:text-muted-400">
                No templates available. Create a template first.
              </BaseParagraph>
            </div>
          </div>

          <!-- Step 2: Campaign Info -->
          <div v-else-if="currentStep === 2" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-muted-100 mb-2">
                Campaign Information
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Give your campaign a name and description
              </BaseParagraph>
            </div>

            <TairoFormGroup label="Campaign Name *" :error="errors.name">
              <TairoInput
                v-model="formData.name"
                placeholder="e.g., Summer Products Launch"
                icon="solar:layers-linear"
                rounded="lg"
              />
            </TairoFormGroup>

            <TairoFormGroup label="Description (optional)">
              <TairoTextarea
                v-model="formData.description"
                placeholder="Describe the purpose of this campaign..."
                rows="3"
              />
            </TairoFormGroup>

            <div v-if="selectedTemplate" class="p-4 rounded-lg bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800">
              <div class="flex items-center gap-2 mb-2">
                <Icon name="solar:info-circle-linear" class="size-5 text-info-500" />
                <BaseText size="sm" weight="medium" class="text-info-700 dark:text-info-300">
                  Using Template: {{ selectedTemplate.name }}
                </BaseText>
              </div>
              <BaseParagraph size="xs" class="text-info-600 dark:text-info-400">
                All links will use {{ selectedTemplate.ruleCount }} routing rule(s) from this template
              </BaseParagraph>
            </div>
          </div>

          <!-- Step 3: Links Input -->
          <div v-else-if="currentStep === 3" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-muted-100 mb-2">
                Add Links
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Choose input method and add destination URLs
              </BaseParagraph>
            </div>

            <!-- Input Method Selection -->
            <div class="flex gap-4">
              <button
                type="button"
                class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium"
                :class="formData.inputMethod === 'manual'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                  : 'border-muted-300 dark:border-muted-600 text-muted-600 hover:bg-muted-50'"
                @click="formData.inputMethod = 'manual'"
              >
                <div class="font-medium mb-1">Manual Entry</div>
                <div class="text-xs opacity-75">Add links one by one</div>
              </button>
              <button
                type="button"
                class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium"
                :class="formData.inputMethod === 'csv'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                  : 'border-muted-300 dark:border-muted-600 text-muted-600 hover:bg-muted-50'"
                @click="formData.inputMethod = 'csv'"
              >
                <div class="font-medium mb-1">CSV Import</div>
                <div class="text-xs opacity-75">Upload bulk links</div>
              </button>
            </div>

            <!-- Manual Entry -->
            <div v-if="formData.inputMethod === 'manual'" class="space-y-4">
              <div v-if="errors.links" class="rounded-lg bg-danger-50 dark:bg-danger-900/20 p-3 text-sm text-danger-600 dark:text-danger-400">
                {{ errors.links }}
              </div>

              <div class="flex justify-between items-center">
                <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
                  {{ formData.manualLinks.filter(l => l.destinationUrl.trim()).length }} link(s)
                </BaseParagraph>
                <BaseButton size="sm" variant="outline" @click="addManualLink">
                  <Icon name="ph:plus" class="size-4" />
                  <span>Add Link</span>
                </BaseButton>
              </div>

              <div class="space-y-3 max-h-96 overflow-y-auto">
                <div
                  v-for="(link, index) in formData.manualLinks"
                  :key="link.id"
                  class="p-4 rounded-lg border border-muted-200 dark:border-muted-700"
                >
                  <div class="flex items-start justify-between gap-4 mb-3">
                    <BaseText size="sm" weight="medium" class="text-muted-700 dark:text-muted-200">
                      Link {{ index + 1 }}
                    </BaseText>
                    <BaseButton
                      v-if="formData.manualLinks.length > 1"
                      size="xs"
                      variant="ghost"
                      color="danger"
                      @click="removeManualLink(link.id)"
                    >
                      <Icon name="solar:trash-bin-trash-linear" class="size-3.5" />
                    </BaseButton>
                  </div>

                  <div class="space-y-3">
                    <TairoInput
                      v-model="link.destinationUrl"
                      type="url"
                      placeholder="https://example.com/product-1"
                      icon="solar:link-linear"
                      rounded="lg"
                      :class="{ 'border-danger-500': link.error }"
                    />
                    <div class="grid gap-3 md:grid-cols-2">
                      <TairoInput
                        v-model="link.title"
                        placeholder="Title (optional)"
                        rounded="lg"
                      />
                      <TairoInput
                        v-model="link.description"
                        placeholder="Description (optional)"
                        rounded="lg"
                      />
                    </div>
                    <BaseParagraph
                      v-if="link.error"
                      size="xs"
                      class="text-danger-600 dark:text-danger-400"
                    >
                      {{ link.error }}
                    </BaseParagraph>
                  </div>
                </div>
              </div>
            </div>

            <!-- CSV Import -->
            <div v-else class="space-y-4">
              <div v-if="errors.csv" class="rounded-lg bg-danger-50 dark:bg-danger-900/20 p-3 text-sm text-danger-600 dark:text-danger-400">
                {{ errors.csv }}
              </div>

              <div class="p-6 border-2 border-dashed border-muted-300 dark:border-muted-600 rounded-lg text-center">
                <Icon name="solar:file-text-linear" class="size-12 mx-auto text-muted-400 mb-4" />
                <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300 mb-4">
                  Upload a CSV file with columns: url, title, description
                </BaseParagraph>
                <input
                  type="file"
                  accept=".csv"
                  class="hidden"
                  id="csvUpload"
                  @change="handleCSVUpload"
                />
                <label for="csvUpload">
                  <BaseButton as="span" variant="outline">
                    <Icon name="solar:upload-linear" class="size-4" />
                    <span>Choose CSV File</span>
                  </BaseButton>
                </label>
                <div class="mt-3">
                  <a
                    href="/samples/bulk-links-sample.csv"
                    download
                    class="text-xs text-primary-500 hover:text-primary-600 underline"
                  >
                    Download sample CSV
                  </a>
                </div>
              </div>

              <div v-if="formData.csvLinks.length > 0" class="space-y-2">
                <div class="flex items-center justify-between">
                  <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
                    {{ formData.csvLinks.filter(l => l.isValid).length }} valid / {{ formData.csvLinks.length }} total
                  </BaseParagraph>
                </div>

                <div class="max-h-64 overflow-y-auto border border-muted-200 dark:border-muted-700 rounded-lg p-3 space-y-2">
                  <div
                    v-for="link in formData.csvLinks.slice(0, 10)"
                    :key="link.id"
                    class="flex items-center gap-3 p-2 rounded-lg bg-muted-50 dark:bg-muted-800"
                  >
                    <Icon
                      :name="link.isValid ? 'ph:check-circle' : 'ph:warning-circle'"
                      :class="link.isValid ? 'text-success-500' : 'text-danger-500'"
                      class="size-5"
                    />
                    <div class="flex-1 min-w-0">
                      <BaseText size="xs" class="truncate">{{ link.destinationUrl }}</BaseText>
                      <BaseParagraph v-if="link.title" size="xs" class="text-muted-500 truncate">
                        {{ link.title }}
                      </BaseParagraph>
                    </div>
                  </div>
                  <BaseParagraph v-if="formData.csvLinks.length > 10" size="xs" class="text-center text-muted-500">
                    ... and {{ formData.csvLinks.length - 10 }} more
                  </BaseParagraph>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Preview -->
          <div v-else-if="currentStep === 4" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-muted-100 mb-2">
                Review & Create
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Review your campaign before creating
              </BaseParagraph>
            </div>

            <div class="grid gap-4">
              <BaseCard class="p-4 border border-muted-200 dark:border-muted-700">
                <div class="flex items-center gap-3 mb-3">
                  <Icon name="solar:layers-linear" class="size-5 text-primary-500" />
                  <BaseText weight="medium">Campaign Details</BaseText>
                </div>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-muted-500">Name:</span>
                    <span class="text-muted-800 dark:text-muted-100">{{ formData.name }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-500">Template:</span>
                    <span class="text-muted-800 dark:text-muted-100">{{ selectedTemplate?.name }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-500">Total Links:</span>
                    <span class="text-muted-800 dark:text-muted-100">{{ linksToCreate.filter(l => l.isValid).length }}</span>
                  </div>
                </div>
              </BaseCard>

              <BaseCard class="p-4 border border-muted-200 dark:border-muted-700">
                <div class="flex items-center gap-3 mb-3">
                  <Icon name="solar:link-round-linear" class="size-5 text-success-500" />
                  <BaseText weight="medium">Links to Create</BaseText>
                </div>
                <div class="space-y-2 text-sm text-muted-600 dark:text-muted-300">
                  <div v-if="linksToCreate.filter(l => l.isValid).length > 0">
                    <span>✓ {{ linksToCreate.filter(l => l.isValid).length }} valid links ready</span>
                  </div>
                  <div v-if="selectedTemplate">
                    <span>✓ Using {{ selectedTemplate.ruleCount }} routing rule(s)</span>
                  </div>
                  <div v-if="formData.inputMethod === 'csv'">
                    <span>✓ Imported from CSV</span>
                  </div>
                  <div v-else>
                    <span>✓ Manually entered</span>
                  </div>
                </div>
              </BaseCard>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between border-t border-muted-200 dark:border-muted-800 px-6 py-4">
          <BaseButton
            v-if="currentStep > 1"
            variant="outline"
            @click="prevStep"
          >
            <Icon name="lucide:arrow-left" class="size-4" />
            <span>Previous</span>
          </BaseButton>
          <div v-else />

          <div class="flex gap-2">
            <BaseButton variant="ghost" @click="handleClose">
              Cancel
            </BaseButton>
            <BaseButton
              v-if="currentStep < totalSteps"
              variant="primary"
              @click="nextStep"
            >
              <span>Next</span>
              <Icon name="lucide:arrow-right" class="size-4" />
            </BaseButton>
            <BaseButton
              v-else
              variant="primary"
              :disabled="isSubmitting"
              @click="handleSubmit"
            >
              <Icon name="ph:check" class="size-4" />
              <span>Create Bulk Campaign</span>
            </BaseButton>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

