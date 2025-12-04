<script setup lang="ts">
import { ref, computed, watch } from '#imports'
import type { BulkLinkCampaignItem } from '~/types/bulk-link'
import { useCSVParser } from '~/composables/useCSVParser'

interface Props {
  open: boolean
  campaignId: string
  campaignName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: []
}>()

const toaster = useNuiToasts()
const { addLinksToCampaign } = useBulkLinkCampaigns()
const { parseCSV } = useCSVParser()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const activeTab = ref<'manual' | 'csv'>('manual')
const isSubmitting = ref(false)
const showConfirmation = ref(false)
const validationResult = ref<{
  totalRequested: number
  validItems: BulkLinkCampaignItem[]
  invalidCount: number
  errors: string[]
} | null>(null)

// Manual entry state
const manualLinks = ref<Array<{
  id: string
  destinationUrl: string
  title: string
  description: string
  error?: string
}>>([
  { id: '1', destinationUrl: '', title: '', description: '' },
])

// CSV state
const csvFile = ref<File | null>(null)
const csvLinks = ref<Array<{
  destinationUrl: string
  title: string
  description: string
  isValid: boolean
  error?: string
}>>([])

const fileInputRef = ref<HTMLInputElement>()

const addManualLink = () => {
  const newId = (manualLinks.value.length + 1).toString()
  manualLinks.value.push({
    id: newId,
    destinationUrl: '',
    title: '',
    description: '',
  })
}

const removeManualLink = (id: string) => {
  manualLinks.value = manualLinks.value.filter(l => l.id !== id)
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  csvFile.value = file

  try {
    const parsedData = await parseCSV(file, ['url', 'title', 'description'])
    
    csvLinks.value = parsedData.map((row) => {
      const url = row.url || ''
      const title = row.title || ''
      const description = row.description || ''
      
      let isValid = true
      let error = ''

      if (!url || !url.trim()) {
        isValid = false
        error = 'URL is required'
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        isValid = false
        error = 'URL must start with http:// or https://'
      }

      return {
        destinationUrl: url,
        title,
        description,
        isValid,
        error,
      }
    })
  } catch (error) {
    toaster.add({
      title: 'Error',
      description: 'Failed to parse CSV file',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
  }
}

const handleClearCsv = () => {
  csvFile.value = null
  csvLinks.value = []
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const validateAndPrepare = () => {
  let items: BulkLinkCampaignItem[] = []

  if (activeTab.value === 'manual') {
    // Validate manual links
    manualLinks.value.forEach(link => {
      link.error = undefined
      if (link.destinationUrl.trim()) {
        if (!link.destinationUrl.startsWith('http://') && !link.destinationUrl.startsWith('https://')) {
          link.error = 'URL must start with http:// or https://'
        }
      }
    })

    const valid = manualLinks.value.filter(l => l.destinationUrl.trim() && !l.error)
    if (valid.length === 0) {
      toaster.add({
        title: 'Validation Error',
        description: 'Please add at least one valid URL',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return null
    }

    items = valid.map(l => ({
      destinationUrl: l.destinationUrl.trim(),
      title: l.title.trim() || null,
      description: l.description.trim() || null,
    }))
  } else {
    // Validate CSV links
    const valid = csvLinks.value.filter(l => l.isValid)
    if (valid.length === 0) {
      toaster.add({
        title: 'Validation Error',
        description: 'No valid URLs found in CSV file',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return null
    }

    items = valid.map(l => ({
      destinationUrl: l.destinationUrl.trim(),
      title: l.title?.trim() || null,
      description: l.description?.trim() || null,
    }))
  }

  const invalidCount = activeTab.value === 'manual' 
    ? manualLinks.value.filter(l => l.error).length
    : csvLinks.value.filter(l => !l.isValid).length

  validationResult.value = {
    totalRequested: items.length + invalidCount,
    validItems: items,
    invalidCount,
    errors: activeTab.value === 'csv' 
      ? csvLinks.value.filter(l => !l.isValid).map(l => l.error || 'Invalid').slice(0, 5)
      : [],
  }

  showConfirmation.value = true
  return items
}

const handleProceed = () => {
  validateAndPrepare()
}

const handleConfirm = async () => {
  if (!validationResult.value) return

  isSubmitting.value = true
  try {
    const result = await addLinksToCampaign(props.campaignId, validationResult.value.validItems)
    
    toaster.add({
      title: 'Success',
      description: `${result.successfullyCreated} link(s) added successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })

    // Reset and close
    resetForm()
    showConfirmation.value = false
    isOpen.value = false
    emit('success')
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to add links',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
  } finally {
    isSubmitting.value = false
  }
}

const handleCancelConfirmation = () => {
  showConfirmation.value = false
  validationResult.value = null
}

const resetForm = () => {
  activeTab.value = 'manual'
  manualLinks.value = [{ id: '1', destinationUrl: '', title: '', description: '' }]
  csvFile.value = null
  csvLinks.value = []
  validationResult.value = null
  showConfirmation.value = false
}

watch(isOpen, (value) => {
  if (!value) {
    resetForm()
  }
})
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogPortal>
      <DialogOverlay class="bg-muted-900/70 fixed inset-0 z-50 backdrop-blur-sm" />
      <DialogContent
        class="fixed top-[50%] start-1/2 z-[100] w-[92vw] max-w-3xl max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-muted-200 bg-white dark:border-muted-700 dark:bg-muted-900 flex flex-col"
        @interact-outside.prevent
      >
        <!-- Confirmation Step -->
        <div v-if="showConfirmation && validationResult" class="flex flex-col h-full">
          <div class="border-b border-muted-200 dark:border-muted-800 px-6 py-4">
            <DialogTitle class="font-heading text-xl font-semibold text-muted-900 dark:text-white">
              Confirm Add Links
            </DialogTitle>
            <DialogDescription class="mt-1 text-sm text-muted-500 dark:text-muted-400">
              Review the links to be added to "{{ campaignName }}"
            </DialogDescription>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <!-- Summary -->
            <div class="grid grid-cols-3 gap-4">
              <BaseCard class="p-4">
                <BaseParagraph size="xs" class="text-muted-500 mb-1">Total Submitted</BaseParagraph>
                <BaseText size="xl" weight="semibold" class="text-muted-800 dark:text-muted-100">
                  {{ validationResult.totalRequested }}
                </BaseText>
              </BaseCard>
              <BaseCard class="p-4">
                <BaseParagraph size="xs" class="text-muted-500 mb-1">Will Be Created</BaseParagraph>
                <BaseText size="xl" weight="semibold" class="text-primary-600">
                  {{ validationResult.validItems.length }}
                </BaseText>
              </BaseCard>
              <BaseCard class="p-4">
                <BaseParagraph size="xs" class="text-muted-500 mb-1">Failed/Invalid</BaseParagraph>
                <BaseText size="xl" weight="semibold" class="text-danger-600">
                  {{ validationResult.invalidCount }}
                </BaseText>
              </BaseCard>
            </div>

            <!-- Errors -->
            <div v-if="validationResult.errors.length > 0" class="p-4 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
              <BaseText size="sm" weight="semibold" class="text-danger-700 dark:text-danger-300 mb-2">
                Validation Errors:
              </BaseText>
              <ul class="list-disc list-inside space-y-1 text-sm text-danger-600 dark:text-danger-400">
                <li v-for="(error, i) in validationResult.errors" :key="i">{{ error }}</li>
                <li v-if="validationResult.invalidCount > validationResult.errors.length">
                  ... and {{ validationResult.invalidCount - validationResult.errors.length }} more
                </li>
              </ul>
            </div>

            <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-400">
              Proceed to add {{ validationResult.validItems.length }} link(s) to this campaign?
            </BaseParagraph>
          </div>

          <div class="border-t border-muted-200 dark:border-muted-800 px-6 py-4 flex items-center justify-end gap-3">
            <BaseButton variant="outline" @click="handleCancelConfirmation" :disabled="isSubmitting">
              Cancel
            </BaseButton>
            <BaseButton variant="primary" @click="handleConfirm" :loading="isSubmitting">
              <Icon name="ph:plus" class="size-4" />
              Add Links
            </BaseButton>
          </div>
        </div>

        <!-- Main Form -->
        <div v-else class="flex flex-col h-full">
          <div class="border-b border-muted-200 dark:border-muted-800 px-6 py-4">
            <DialogTitle class="font-heading text-xl font-semibold text-muted-900 dark:text-white">
              Add Links to Campaign
            </DialogTitle>
            <DialogDescription class="mt-1 text-sm text-muted-500 dark:text-muted-400">
              Add new links to "{{ campaignName }}"
            </DialogDescription>
          </div>

          <!-- Tabs -->
          <div class="border-b border-muted-200 dark:border-muted-800 px-6">
            <div class="flex gap-2">
              <button
                type="button"
                class="px-4 py-3 text-sm font-medium transition-colors"
                :class="activeTab === 'manual'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                  : 'text-muted-500 hover:text-muted-700'"
                @click="activeTab = 'manual'"
              >
                Manual Entry
              </button>
              <button
                type="button"
                class="px-4 py-3 text-sm font-medium transition-colors"
                :class="activeTab === 'csv'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                  : 'text-muted-500 hover:text-muted-700'"
                @click="activeTab = 'csv'"
              >
                CSV Import
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-6 py-5">
            <!-- Manual Tab -->
            <div v-if="activeTab === 'manual'" class="space-y-4">
              <div class="flex justify-between items-center">
                <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
                  {{ manualLinks.filter(l => l.destinationUrl.trim()).length }} link(s)
                </BaseParagraph>
                <BaseButton 
                  size="sm" 
                  variant="outline" 
                  @click="addManualLink"
                  :disabled="manualLinks.length >= 10"
                >
                  <Icon name="ph:plus" class="size-4" />
                  <span>Add Link</span>
                </BaseButton>
              </div>

              <div class="space-y-3 max-h-96 overflow-y-auto">
                <div
                  v-for="(link, index) in manualLinks"
                  :key="link.id"
                  class="p-4 rounded-lg border border-muted-200 dark:border-muted-700"
                >
                  <div class="flex items-start justify-between gap-4 mb-3">
                    <BaseText size="sm" weight="medium" class="text-muted-700 dark:text-muted-200">
                      Link {{ index + 1 }}
                    </BaseText>
                    <BaseButton
                      v-if="manualLinks.length > 1"
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
                      placeholder="https://example.com/product"
                      icon="solar:link-linear"
                      rounded="lg"
                      :class="{ 'border-danger-500': link.error }"
                    />
                    <div v-if="link.error" class="text-xs text-danger-600 dark:text-danger-400">
                      {{ link.error }}
                    </div>
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
                  </div>
                </div>
              </div>

              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                Maximum 10 links at once. For larger batches, use CSV import.
              </BaseParagraph>
            </div>

            <!-- CSV Tab -->
            <div v-else class="space-y-4">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
                    {{ csvFile ? csvFile.name : 'No file selected' }}
                  </BaseParagraph>
                  <div class="flex gap-2">
                    <BaseButton
                      v-if="csvFile"
                      size="sm"
                      variant="ghost"
                      color="danger"
                      @click="handleClearCsv"
                    >
                      <Icon name="ph:x" class="size-4" />
                      Clear
                    </BaseButton>
                    <BaseButton size="sm" variant="outline" @click="fileInputRef?.click()">
                      <Icon name="ph:upload" class="size-4" />
                      {{ csvFile ? 'Change File' : 'Upload CSV' }}
                    </BaseButton>
                  </div>
                </div>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".csv"
                  class="hidden"
                  @change="handleFileSelect"
                />

                <div class="p-4 rounded-lg bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800">
                  <BaseText size="sm" weight="medium" class="text-info-700 dark:text-info-300 mb-2">
                    CSV Format
                  </BaseText>
                  <BaseParagraph size="xs" class="text-info-600 dark:text-info-400">
                    Required columns: <code class="px-1 py-0.5 rounded bg-info-100 dark:bg-info-950">url</code> or <code class="px-1 py-0.5 rounded bg-info-100 dark:bg-info-950">destination</code>
                    <br>
                    Optional columns: <code class="px-1 py-0.5 rounded bg-info-100 dark:bg-info-950">title</code>, <code class="px-1 py-0.5 rounded bg-info-100 dark:bg-info-950">description</code>
                  </BaseParagraph>
                </div>

                <!-- Preview -->
                <div v-if="csvLinks.length > 0" class="space-y-2">
                  <BaseText size="sm" weight="medium" class="text-muted-700 dark:text-muted-200">
                    Preview ({{ csvLinks.filter(l => l.isValid).length }} valid, {{ csvLinks.filter(l => !l.isValid).length }} invalid)
                  </BaseText>
                  <div class="max-h-64 overflow-y-auto border border-muted-200 dark:border-muted-700 rounded-lg">
                    <table class="w-full text-sm">
                      <thead class="bg-muted-100 dark:bg-muted-800 sticky top-0">
                        <tr>
                          <th class="px-3 py-2 text-left text-xs font-medium text-muted-600 dark:text-muted-300">
                            Status
                          </th>
                          <th class="px-3 py-2 text-left text-xs font-medium text-muted-600 dark:text-muted-300">
                            URL
                          </th>
                          <th class="px-3 py-2 text-left text-xs font-medium text-muted-600 dark:text-muted-300">
                            Title
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-muted-200 dark:divide-muted-700">
                        <tr v-for="(link, i) in csvLinks" :key="i">
                          <td class="px-3 py-2">
                            <Icon
                              :name="link.isValid ? 'ph:check-circle' : 'ph:x-circle'"
                              :class="link.isValid ? 'text-primary-500' : 'text-danger-500'"
                              class="size-4"
                            />
                          </td>
                          <td class="px-3 py-2 font-mono text-xs truncate max-w-xs">
                            {{ link.destinationUrl }}
                          </td>
                          <td class="px-3 py-2 truncate max-w-xs">
                            {{ link.title || '-' }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-muted-200 dark:border-muted-800 px-6 py-4 flex items-center justify-end gap-3">
            <BaseButton variant="outline" @click="isOpen = false">
              Cancel
            </BaseButton>
            <BaseButton variant="primary" @click="handleProceed">
              <Icon name="ph:arrow-right" class="size-4" />
              Continue
            </BaseButton>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

