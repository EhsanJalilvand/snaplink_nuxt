<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from '#imports'
import type { CreateBulkLinkTemplateRequest, BulkLinkTemplateRule } from '~/types/bulk-link'
import type { SmartLinkConditionType } from '~/types/url-shortener'
import { useBulkLinkTemplates } from '~/composables/useBulkLinkTemplates'
import { useUrlShortenerCollections } from '~/composables/useUrlShortenerCollections'
import { useWorkspaceDomains } from '~/composables/useWorkspaceDomains'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import { useWorkspaceMembers } from '~/composables/useWorkspaceMembers'
import SearchableCheckboxList from './SearchableCheckboxList.vue'

const props = defineProps<{
  open: boolean
  templateId?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
  created: []
}>()

const toaster = useNuiToasts()
const { workspaceId } = useWorkspaceContext()
const { createTemplate, getTemplate, updateTemplate } = useBulkLinkTemplates()
const { items: collectionsItems, fetchCollections } = useUrlShortenerCollections()
const { domainOptions, fetchDomains } = useWorkspaceDomains()
const { members: workspaceMembers, fetchMembers: fetchWorkspaceMembers } = useWorkspaceMembers()

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

const isEditMode = computed(() => !!props.templateId)
const totalSteps = 7
const currentStep = ref(1)
const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})

type RuleForm = {
  uid: string
  targetUrlPattern: string
  conditionType: SmartLinkConditionType
  condition: Record<string, any>
  priority: number
  isActive: boolean
}

const formData = ref({
  name: '',
  description: '',
  fallbackUrlPattern: '{destination}',
  rules: [] as RuleForm[],
  collectionIds: [] as string[],
  visibility: 'public' as 'public' | 'private',
  visibilityRoles: [] as string[],
  visibilityMemberIds: [] as string[],
  expiresAt: null as string | null,
  clickLimit: null as number | null,
  isOneTime: false,
  hasPassword: false,
  password: '',
  clearPassword: false,
  domainType: 'default',
  domainValue: null as string | null,
  pixelEvents: [] as Array<{ pixelType: string; pixelId: string; eventType: string }>,
  webhookUrl: '',
  webhookMethod: 'POST',
  webhookHeaders: {} as Record<string, string>,
  webhookBodyTemplate: '',
})

// Geo data (simplified - reuse from SmartLinkWizard if needed)
const geoCountries = ref([
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
])

const createRule = (): RuleForm => ({
  uid: crypto.randomUUID(),
  targetUrlPattern: '{destination}',
  conditionType: 'GeoCountry',
  condition: { countries: [] },
  priority: (formData.value.rules.length + 1) * 10,
  isActive: true,
})

const addRule = () => {
  formData.value.rules.push(createRule())
}

const removeRule = (uid: string) => {
  formData.value.rules = formData.value.rules.filter(r => r.uid !== uid)
  // Recalculate priorities
  formData.value.rules.forEach((rule, index) => {
    rule.priority = (index + 1) * 10
  })
}

const moveRuleUp = (index: number) => {
  if (index === 0) return
  const rules = [...formData.value.rules]
  const temp = rules[index]
  rules[index] = rules[index - 1]
  rules[index - 1] = temp
  formData.value.rules = rules
  // Recalculate priorities
  formData.value.rules.forEach((rule, idx) => {
    rule.priority = (idx + 1) * 10
  })
}

const moveRuleDown = (index: number) => {
  if (index === formData.value.rules.length - 1) return
  const rules = [...formData.value.rules]
  const temp = rules[index]
  rules[index] = rules[index + 1]
  rules[index + 1] = temp
  formData.value.rules = rules
  // Recalculate priorities
  formData.value.rules.forEach((rule, idx) => {
    rule.priority = (idx + 1) * 10
  })
}

const collectionOptions = computed(() => {
  return collectionsItems.value.map(c => ({
    id: c.id,
    name: c.name,
  }))
})

const domains = computed(() => {
  const defaultDomain = { label: 'snap.ly', domainType: 'default', domainValue: null }
  return [defaultDomain, ...domainOptions.value]
})

const visibilityRoleOptions = [
  {
    value: 'Owner',
    label: 'Owner',
    description: 'Full control across workspace',
  },
  {
    value: 'Admin',
    label: 'Admin',
    description: 'Manage links and collections',
  },
  {
    value: 'Member',
    label: 'Editor',
    description: 'Create & edit assigned links',
  },
  {
    value: 'Viewer',
    label: 'Viewer',
    description: 'View-only access',
  },
]

const memberSearch = ref('')
const filteredWorkspaceMembers = computed(() => {
  if (!memberSearch.value.trim()) {
    return workspaceMembers.value
  }
  const search = memberSearch.value.toLowerCase()
  return workspaceMembers.value.filter(member =>
    member.displayName.toLowerCase().includes(search) ||
    member.email.toLowerCase().includes(search),
  )
})

const selectedVisibilityRoleLabels = computed(() => {
  return visibilityRoleOptions
    .filter(option => formData.value.visibilityRoles.includes(option.value))
    .map(option => option.label)
})

const toggleVisibilityRole = (role: string) => {
  const list = formData.value.visibilityRoles
  if (list.includes(role)) {
    formData.value.visibilityRoles = list.filter(item => item !== role)
  } else {
    formData.value.visibilityRoles = [...list, role]
  }
}

const toggleVisibilityMember = (memberId: string) => {
  const list = formData.value.visibilityMemberIds
  if (list.includes(memberId)) {
    formData.value.visibilityMemberIds = list.filter(item => item !== memberId)
  } else {
    formData.value.visibilityMemberIds = [...list, memberId]
  }
}

const pixelTypeOptions = [
  { value: 'google_tag', label: 'Google Tag / GA4' },
  { value: 'facebook', label: 'Facebook Pixel' },
  { value: 'tiktok', label: 'TikTok Pixel' },
  { value: 'linkedin', label: 'LinkedIn Insight Tag' },
]

const eventTypeOptions = [
  { value: 'PageView', label: 'PageView' },
  { value: 'Purchase', label: 'Purchase' },
  { value: 'Lead', label: 'Lead' },
  { value: 'AddToCart', label: 'AddToCart' },
  { value: 'InitiateCheckout', label: 'InitiateCheckout' },
]

const webhookMethodOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
]

const addWebhookHeader = () => {
  const key = `header_${Object.keys(formData.value.webhookHeaders).length + 1}`
  formData.value.webhookHeaders[key] = ''
}

const removeWebhookHeader = (key: string) => {
  delete formData.value.webhookHeaders[key]
}

const nextStep = () => {
  if (validateCurrentStep()) {
    if (currentStep.value < totalSteps) {
      currentStep.value++
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
    case 1: // Basic Info
      if (!formData.value.name.trim()) {
        errors.value.name = 'Template name is required'
        return false
      }
      if (!formData.value.fallbackUrlPattern?.trim()) {
        errors.value.fallbackUrlPattern = 'Fallback URL pattern is required'
        return false
      }
      return true

    case 2: // Rules (optional)
      return true

    case 3: // Collections (optional)
      return true

    case 4: // Visibility (optional)
      return true

    case 5: // Limits (optional)
      return true

    case 6: // Domain (optional)
      return true

    case 7: // Tracking (optional)
      return true

    default:
      return true
  }
}

const handleSubmit = async () => {
  if (!validateCurrentStep()) return

  isSubmitting.value = true

  try {
    const rules: BulkLinkTemplateRule[] = formData.value.rules.map(r => ({
      targetUrlPattern: r.targetUrlPattern,
      conditionType: r.conditionType,
      condition: r.condition,
      priority: r.priority,
      isActive: r.isActive,
    }))

    const pixelEventsDict = formData.value.pixelEvents.length > 0
      ? { pixels: formData.value.pixelEvents }
      : null

    const webhookHeadersDict = Object.keys(formData.value.webhookHeaders).length > 0
      ? formData.value.webhookHeaders
      : null

    const request: CreateBulkLinkTemplateRequest = {
      name: formData.value.name,
      description: formData.value.description || null,
      rules,
      fallbackUrlPattern: formData.value.fallbackUrlPattern || null,
      collectionIds: formData.value.collectionIds.length > 0 ? formData.value.collectionIds : null,
      isPublic: formData.value.visibility === 'public',
      visibilityRoles: formData.value.visibility === 'private' ? formData.value.visibilityRoles : null,
      visibilityMemberIds: formData.value.visibility === 'private' ? formData.value.visibilityMemberIds : null,
      expiresAt: formData.value.expiresAt,
      clickLimit: formData.value.clickLimit,
      isOneTime: formData.value.isOneTime,
      password: formData.value.hasPassword ? formData.value.password : null,
      domainType: formData.value.domainType || 'default',
      domainValue: formData.value.domainValue || null,
      pixelEvents: pixelEventsDict,
      webhookUrl: formData.value.webhookUrl || null,
      webhookMethod: formData.value.webhookUrl ? formData.value.webhookMethod || null : null,
      webhookHeaders: webhookHeadersDict,
      webhookBodyTemplate: formData.value.webhookBodyTemplate || null,
    }
    
    console.log('[BulkLinkTemplateWizard] Sending request (camelCase):', JSON.stringify(request, null, 2))

    if (isEditMode.value && props.templateId) {
      await updateTemplate(props.templateId, {
        ...request,
        clearPassword: formData.value.clearPassword,
      })
      
      toaster.add({
        title: 'Template updated',
        description: 'Your bulk link template has been updated successfully',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })
    } else {
      await createTemplate(request)
      
      toaster.add({
        title: 'Template created',
        description: 'Your bulk link template has been created successfully',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })
    }

    emit('created')
    isOpen.value = false
  } catch (error: any) {
    console.error('Failed to save template:', error)
    console.error('Error details:', {
      statusCode: error?.statusCode,
      statusMessage: error?.statusMessage,
      data: error?.data,
      message: error?.message,
    })
    console.error('Error data (stringified):', JSON.stringify(error?.data, null, 2))
    
    let errorMessage = 'Failed to save template. Please try again.'
    
    if (error?.data?.message) {
      errorMessage = error.data.message
    } else if (error?.data?.errors) {
      // Handle validation errors
      const validationErrors = Object.entries(error.data.errors || {})
        .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join('\n')
      errorMessage = `Validation errors:\n${validationErrors}`
    } else if (error?.message) {
      errorMessage = error.message
    } else if (error?.statusCode === 404) {
      errorMessage = 'API endpoint not found. Please ensure the UrlShortener API is running.'
    } else if (error?.statusCode === 401 || error?.statusCode === 403) {
      errorMessage = 'You do not have permission to perform this action.'
    } else if (error?.statusCode === 400) {
      errorMessage = error?.data?.title || error?.data?.message || 'Bad request. Please check your input.'
    } else if (error?.statusCode >= 500) {
      errorMessage = 'Server error. Please try again later.'
    }
    
    toaster.add({
      title: isEditMode.value ? 'Failed to update template' : 'Failed to create template',
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
    fallbackUrlPattern: '{destination}',
    rules: [],
    collectionIds: [],
    visibility: 'public',
    visibilityRoles: [],
    visibilityMemberIds: [],
    expiresAt: null,
    clickLimit: null,
    isOneTime: false,
    hasPassword: false,
    password: '',
    clearPassword: false,
    domainType: 'default',
    domainValue: null,
    pixelEvents: [],
    webhookUrl: '',
    webhookMethod: 'POST',
    webhookHeaders: {},
    webhookBodyTemplate: '',
  }
  errors.value = {}
}

const handleClose = () => {
  isOpen.value = false
}

const fetchWizardData = async () => {
  if (!workspaceId.value) return

  await Promise.all([
    fetchCollections({ force: true }),
    fetchDomains(),
    fetchWorkspaceMembers(),
  ])
}

onMounted(async () => {
  if (workspaceId.value) {
    await fetchWizardData()
  }
})

watch(isOpen, async (value) => {
  if (value) {
    await fetchWizardData()
    
    if (isEditMode.value && props.templateId) {
      // Load existing template
      const template = await getTemplate(props.templateId)
      if (template) {
        formData.value.name = template.name
        formData.value.description = template.description || ''
        formData.value.fallbackUrlPattern = template.fallbackUrlPattern || '{destination}'
        formData.value.rules = template.rules.map(r => ({
          uid: crypto.randomUUID(),
          targetUrlPattern: r.targetUrlPattern,
          conditionType: r.conditionType,
          condition: r.condition,
          priority: r.priority,
          isActive: r.isActive,
        }))
        formData.value.collectionIds = template.collectionIds
        formData.value.visibility = template.isPublic ? 'public' : 'private'
        formData.value.visibilityRoles = template.visibilityRoles || []
        formData.value.visibilityMemberIds = template.visibilityMemberIds || []
        formData.value.expiresAt = template.expiresAt || null
        formData.value.clickLimit = template.clickLimit || null
        formData.value.isOneTime = template.isOneTime
        formData.value.hasPassword = template.hasPassword
        formData.value.domainType = template.domainType
        formData.value.domainValue = template.domainValue || null
        formData.value.pixelEvents = template.pixelEvents?.pixels || []
        formData.value.webhookUrl = template.webhookUrl || ''
        formData.value.webhookMethod = template.webhookMethod || 'POST'
        formData.value.webhookHeaders = template.webhookHeaders || {}
        formData.value.webhookBodyTemplate = template.webhookBodyTemplate || ''
      }
    }
  }
})

const toggleCollection = (collectionId: string) => {
  const index = formData.value.collectionIds.indexOf(collectionId)
  if (index > -1) {
    formData.value.collectionIds.splice(index, 1)
  } else {
    formData.value.collectionIds.push(collectionId)
  }
}

const selectDomainOption = (option: { domainType: string; domainValue: string | null }) => {
  formData.value.domainType = option.domainType
  formData.value.domainValue = option.domainValue
}

const isDomainSelected = (option: { domainType: string; domainValue?: string | null }) => {
  return formData.value.domainType === option.domainType &&
    formData.value.domainValue === (option.domainValue || null)
}

const addPixelEvent = () => {
  formData.value.pixelEvents.push({
    pixelType: 'google_tag',
    pixelId: '',
    eventType: 'PageView',
  })
}

const removePixelEvent = (index: number) => {
  formData.value.pixelEvents.splice(index, 1)
}
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
              {{ isEditMode ? 'Edit Template' : 'Create Template' }}
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
          <!-- Step 1: Basic Info -->
          <div v-if="currentStep === 1" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-muted-100 mb-2">
                Template Information
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Give your template a name and description
              </BaseParagraph>
            </div>

            <TairoFormGroup label="Template Name *" :error="errors.name">
              <TairoInput
                v-model="formData.name"
                placeholder="e.g., Summer Campaign 2024"
                icon="solar:document-text-linear"
                rounded="lg"
              />
            </TairoFormGroup>

            <TairoFormGroup label="Description (optional)">
              <TairoTextarea
                v-model="formData.description"
                placeholder="Describe the purpose of this template..."
                rows="3"
              />
            </TairoFormGroup>

            <TairoFormGroup label="Fallback URL Pattern *" :error="errors.fallbackUrlPattern">
              <TairoInput
                v-model="formData.fallbackUrlPattern"
                placeholder="{destination}"
                icon="solar:link-linear"
                rounded="lg"
              />
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
                Use {destination} placeholder for the actual link URL. Example: {destination}/promo
              </BaseParagraph>
            </TairoFormGroup>
          </div>

          <!-- Step 2: Rules -->
          <div v-else-if="currentStep === 2" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-muted-100 mb-2">
                Routing Rules (Optional)
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Define conditional routing rules with placeholders
              </BaseParagraph>
            </div>

            <div class="flex justify-between items-center">
              <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
                {{ formData.rules.length }} rule(s) defined
              </BaseParagraph>
              <BaseButton size="sm" variant="outline" @click="addRule">
                <Icon name="ph:plus" class="size-4" />
                <span>Add Rule</span>
              </BaseButton>
            </div>

            <div v-if="formData.rules.length === 0" class="text-center py-8 border-2 border-dashed border-muted-300 dark:border-muted-600 rounded-lg">
              <Icon name="solar:widget-3-linear" class="size-12 mx-auto text-muted-400 mb-2" />
              <BaseParagraph class="text-muted-500 dark:text-muted-400">
                No rules yet. Click "Add Rule" to create conditional routing.
              </BaseParagraph>
            </div>

            <div v-else class="space-y-4">
              <BaseCard
                v-for="(rule, index) in formData.rules"
                :key="rule.uid"
                class="p-4 border border-muted-200 dark:border-muted-700"
              >
                <div class="space-y-4">
                  <div class="flex items-center gap-3">
                    <!-- Move Buttons -->
                    <div class="flex flex-col gap-1 shrink-0">
                      <BaseButton
                        variant="ghost"
                        size="xs"
                        class="p-1 h-6 w-6"
                        :disabled="index === 0"
                        @click="moveRuleUp(index)"
                      >
                        <Icon name="lucide:chevron-up" class="size-4" />
                      </BaseButton>
                      <BaseButton
                        variant="ghost"
                        size="xs"
                        class="p-1 h-6 w-6"
                        :disabled="index === formData.rules.length - 1"
                        @click="moveRuleDown(index)"
                      >
                        <Icon name="lucide:chevron-down" class="size-4" />
                      </BaseButton>
                    </div>
                    
                    <!-- Rule Info -->
                    <div class="flex-1 flex items-center justify-between">
                      <BaseHeading as="h5" size="sm" weight="medium" class="text-muted-700 dark:text-muted-200">
                        Rule {{ index + 1 }} (Priority: {{ rule.priority }})
                      </BaseHeading>
                      <BaseButton size="sm" variant="ghost" color="danger" @click="removeRule(rule.uid)">
                        <Icon name="solar:trash-bin-trash-linear" class="size-4" />
                        <span>Remove</span>
                      </BaseButton>
                    </div>
                  </div>

                  <TairoFormGroup label="Target URL Pattern">
                    <TairoInput
                      v-model="rule.targetUrlPattern"
                      placeholder="{destination}/us"
                      icon="solar:link-linear"
                      rounded="lg"
                    />
                    <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-1">
                      Use {destination} and {shortCode} placeholders
                    </BaseParagraph>
                  </TairoFormGroup>

                  <TairoFormGroup label="Condition Type">
                    <select
                      v-model="rule.conditionType"
                      class="w-full rounded-lg border border-muted-300 dark:border-muted-600 bg-white dark:bg-muted-800 px-3 py-2 text-sm"
                    >
                      <option value="GeoCountry">Country</option>
                      <option value="DeviceType">Device Type</option>
                      <option value="OperatingSystem">Operating System</option>
                      <option value="Browser">Browser</option>
                      <option value="Referrer">Referrer</option>
                      <option value="Schedule">Schedule</option>
                    </select>
                  </TairoFormGroup>

                  <div class="flex items-center gap-2">
                    <BaseCheckbox
                      v-model="rule.isActive"
                      rounded="sm"
                      color="primary"
                    />
                    <BaseText size="sm">Active</BaseText>
                  </div>
                </div>
              </BaseCard>
            </div>
          </div>

          <!-- Step 3: Collections -->
          <div v-else-if="currentStep === 3" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-muted-100 mb-2">
                Collections (Optional)
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                All SmartLinks created from this template will belong to these collections
              </BaseParagraph>
            </div>

            <div class="space-y-2 max-h-64 overflow-y-auto border border-muted-200 dark:border-muted-700 rounded-lg p-3">
              <div
                v-for="collection in collectionOptions"
                :key="collection.id"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-muted-50 dark:hover:bg-muted-800/50 cursor-pointer transition-colors"
                @click="toggleCollection(collection.id)"
              >
                <BaseCheckbox
                  :model-value="formData.collectionIds.includes(collection.id)"
                  rounded="sm"
                  color="primary"
                  @click.stop
                />
                <BaseText size="sm" class="text-muted-800 dark:text-muted-100">
                  {{ collection.name }}
                </BaseText>
              </div>
              <div
                v-if="collectionOptions.length === 0"
                class="text-center py-4 text-sm text-muted-500 dark:text-muted-400"
              >
                No collections available
              </div>
            </div>
          </div>

          <!-- Step 4: Visibility -->
          <div v-else-if="currentStep === 4" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-muted-100 mb-2">
                Visibility & Access
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Control who can access SmartLinks created from this template
              </BaseParagraph>
            </div>

            <div class="flex gap-4">
              <button
                type="button"
                class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium"
                :class="formData.visibility === 'public'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                  : 'border-muted-300 dark:border-muted-600 text-muted-600 hover:bg-muted-50'"
                @click="formData.visibility = 'public'"
              >
                <div class="font-medium mb-1">Public</div>
                <div class="text-xs opacity-75">Anyone with the link</div>
              </button>
              <button
                type="button"
                class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium"
                :class="formData.visibility === 'private'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                  : 'border-muted-300 dark:border-muted-600 text-muted-600 hover:bg-muted-50'"
                @click="formData.visibility = 'private'"
              >
                <div class="font-medium mb-1">Private</div>
                <div class="text-xs opacity-75">Specific roles/members</div>
              </button>
            </div>

            <div v-if="formData.visibility === 'private'" class="space-y-6">
              <BaseCard class="p-5">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-800 dark:text-white">
                      Allow workspace roles
                    </BaseHeading>
                    <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                      Members with these roles can see and manage SmartLinks from this template
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
                      formData.visibilityRoles.includes(option.value)
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
                        v-if="formData.visibilityRoles.includes(option.value)"
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
                      Only selected members can view analytics or edit SmartLinks from this template
                    </BaseParagraph>
                  </div>
                  <BaseTag
                    v-if="formData.visibilityMemberIds.length"
                    size="sm"
                    variant="pastel"
                    color="primary"
                  >
                    {{ formData.visibilityMemberIds.length }} selected
                  </BaseTag>
                </div>

                <div class="flex items-center gap-2 mb-3">
                  <TairoInput
                    v-model="memberSearch"
                    placeholder="Search by name or email"
                    icon="solar:magnifer-linear"
                    rounded="lg"
                  />
                </div>

                <div class="max-h-48 overflow-y-auto border border-muted-200 dark:border-muted-700 rounded-lg divide-y divide-muted-100 dark:divide-muted-800">
                  <div
                    v-for="member in filteredWorkspaceMembers"
                    :key="member.id"
                    class="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted-50 dark:hover:bg-muted-800/40 transition-colors"
                    @click="toggleVisibilityMember(member.id)"
                  >
                    <BaseCheckbox
                      :model-value="formData.visibilityMemberIds.includes(member.id)"
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
                    <BaseTag size="sm" variant="solid" color="muted">
                      {{ member.roleLabel }}
                    </BaseTag>
                  </div>
                  <div
                    v-if="!filteredWorkspaceMembers.length"
                    class="p-4 text-center text-sm text-muted-500 dark:text-muted-400"
                  >
                    No teammates match your search
                  </div>
                </div>
              </BaseCard>
            </div>
          </div>

          <!-- Step 5: Limits & Security -->
          <div v-else-if="currentStep === 5" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-muted-100 mb-2">
                Limits & Security
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Set expiration, click limits, and password protection
              </BaseParagraph>
            </div>

            <TairoFormGroup label="Expiration Date (optional)">
              <TairoInput
                v-model="formData.expiresAt"
                type="datetime-local"
                icon="solar:calendar-linear"
                rounded="lg"
              />
            </TairoFormGroup>

            <TairoFormGroup label="Click Limit (optional)">
              <TairoInput
                v-model.number="formData.clickLimit"
                type="number"
                min="1"
                placeholder="e.g., 1000"
                icon="solar:cursor-linear"
                rounded="lg"
              />
            </TairoFormGroup>

            <div class="flex items-center gap-3">
              <BaseCheckbox
                v-model="formData.isOneTime"
                rounded="sm"
                color="primary"
              />
              <div>
                <BaseText size="sm" weight="medium">One-time use</BaseText>
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                  SmartLinks can only be used once
                </BaseParagraph>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <BaseCheckbox
                v-model="formData.hasPassword"
                rounded="sm"
                color="primary"
              />
              <div>
                <BaseText size="sm" weight="medium">Password protect</BaseText>
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                  Require password to access SmartLinks
                </BaseParagraph>
              </div>
            </div>

            <TairoFormGroup v-if="formData.hasPassword" label="Password">
              <TairoInput
                v-model="formData.password"
                type="password"
                placeholder="Enter password"
                icon="solar:lock-linear"
                rounded="lg"
              />
            </TairoFormGroup>

            <div v-if="isEditMode && formData.hasPassword" class="flex items-center gap-3">
              <BaseCheckbox
                v-model="formData.clearPassword"
                rounded="sm"
                color="danger"
              />
              <div>
                <BaseText size="sm" weight="medium">Remove password</BaseText>
              </div>
            </div>
          </div>

          <!-- Step 6: Domain -->
          <div v-else-if="currentStep === 6" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-muted-100 mb-2">
                Domain Configuration
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Choose the domain for SmartLinks
              </BaseParagraph>
            </div>

            <div class="space-y-4">
              <BaseParagraph size="sm" weight="medium" class="text-muted-600 dark:text-muted-300">
                Default domain
              </BaseParagraph>
              <div class="grid gap-3 md:grid-cols-2">
                <BaseCard
                  class="p-4 border-2 transition-all cursor-pointer"
                  :class="isDomainSelected({ domainType: 'default', domainValue: null })
                    ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20'
                    : 'border-muted-200 dark:border-muted-700 hover:border-primary-300'"
                  @click="selectDomainOption({ domainType: 'default', domainValue: null })"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <BaseHeading as="h5" size="sm" weight="semibold">snap.ly</BaseHeading>
                      <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">Default</BaseParagraph>
                    </div>
                    <Icon
                      v-if="isDomainSelected({ domainType: 'default', domainValue: null })"
                      name="ph:check-circle"
                      class="size-5 text-primary-500"
                    />
                  </div>
                </BaseCard>
              </div>
            </div>

            <div v-if="domainOptions.length > 0" class="space-y-4">
              <BaseParagraph size="sm" weight="medium" class="text-muted-600 dark:text-muted-300">
                Workspace domains
              </BaseParagraph>
              <div class="grid gap-3 md:grid-cols-2">
                <BaseCard
                  v-for="domain in domainOptions"
                  :key="domain.value"
                  class="p-4 border-2 transition-all cursor-pointer"
                  :class="isDomainSelected(domain)
                    ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20'
                    : 'border-muted-200 dark:border-muted-700 hover:border-primary-300'"
                  @click="selectDomainOption(domain)"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <BaseHeading as="h5" size="sm" weight="semibold">{{ domain.label }}</BaseHeading>
                      <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                        {{ domain.domainType === 'subdomain' ? 'Subdomain' : 'Custom' }}
                      </BaseParagraph>
                    </div>
                    <Icon
                      v-if="isDomainSelected(domain)"
                      name="ph:check-circle"
                      class="size-5 text-primary-500"
                    />
                  </div>
                </BaseCard>
              </div>
            </div>
          </div>

          <!-- Step 7: Tracking -->
          <div v-else-if="currentStep === 7" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-muted-100 mb-2">
                Pixel Events & Webhooks
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Configure tracking pixels and webhooks
              </BaseParagraph>
            </div>

            <!-- Pixel Events Section -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <BaseHeading as="h4" size="sm" weight="semibold">
                    Official Pixel Events
                  </BaseHeading>
                  <BaseTooltip content="Track conversion events for different platforms (Google Analytics, Facebook Pixel, etc.)">
                    <button
                      type="button"
                      class="flex items-center justify-center size-5 rounded-full bg-muted-100 dark:bg-muted-800 hover:bg-muted-200 dark:hover:bg-muted-700 transition-colors"
                    >
                      <Icon name="lucide:help-circle" class="size-3.5 text-muted-500 dark:text-muted-400" />
                    </button>
                  </BaseTooltip>
                </div>
                <BaseButton
                  size="xs"
                  variant="outline"
                  color="primary"
                  @click="addPixelEvent"
                >
                  <Icon name="lucide:plus" class="size-4" />
                  Add Pixel
                </BaseButton>
              </div>

              <div v-if="formData.pixelEvents.length === 0" class="p-6 text-center border-2 border-dashed border-muted-200 dark:border-muted-800 rounded-lg">
                <Icon name="ph:chart-line" class="mx-auto size-8 text-muted-400" />
                <BaseParagraph size="sm" class="mt-2 text-muted-500">
                  No pixels configured. Add tracking pixels to monitor conversions.
                </BaseParagraph>
              </div>

              <div v-else class="space-y-3">
                <BaseCard
                  v-for="(pixel, index) in formData.pixelEvents"
                  :key="index"
                  class="p-4 border border-muted-200 dark:border-muted-800"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <TairoFormGroup label="Pixel Type">
                        <TairoSelect v-model="pixel.pixelType">
                          <BaseSelectItem
                            v-for="option in pixelTypeOptions"
                            :key="option.value"
                            :value="option.value"
                          >
                            {{ option.label }}
                          </BaseSelectItem>
                        </TairoSelect>
                      </TairoFormGroup>
                      <TairoFormGroup label="Pixel ID">
                        <TairoInput
                          v-model="pixel.pixelId"
                          placeholder="Enter pixel ID"
                        />
                      </TairoFormGroup>
                      <TairoFormGroup label="Event Type">
                        <TairoSelect v-model="pixel.eventType">
                          <BaseSelectItem
                            v-for="option in eventTypeOptions"
                            :key="option.value"
                            :value="option.value"
                          >
                            {{ option.label }}
                          </BaseSelectItem>
                        </TairoSelect>
                      </TairoFormGroup>
                    </div>
                    <BaseButton
                      variant="ghost"
                      size="xs"
                      color="danger"
                      @click="removePixelEvent(index)"
                    >
                      <Icon name="solar:trash-bin-trash-linear" class="size-4" />
                    </BaseButton>
                  </div>
                </BaseCard>
              </div>
            </div>

            <!-- Webhook Section -->
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <BaseHeading as="h4" size="sm" weight="semibold">
                  Webhook Configuration
                </BaseHeading>
                <BaseTooltip content="Send notifications to your URL when the link is clicked">
                  <button
                    type="button"
                    class="flex items-center justify-center size-5 rounded-full bg-muted-100 dark:bg-muted-800 hover:bg-muted-200 dark:hover:bg-muted-700 transition-colors"
                  >
                    <Icon name="lucide:help-circle" class="size-3.5 text-muted-500 dark:text-muted-400" />
                  </button>
                </BaseTooltip>
              </div>

              <TairoFormGroup label="Webhook URL">
                <TairoInput
                  v-model="formData.webhookUrl"
                  placeholder="https://example.com/webhook"
                  type="url"
                />
              </TairoFormGroup>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TairoFormGroup label="HTTP Method">
                  <TairoSelect v-model="formData.webhookMethod">
                    <BaseSelectItem
                      v-for="option in webhookMethodOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </BaseSelectItem>
                  </TairoSelect>
                </TairoFormGroup>
              </div>

              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <BaseHeading as="h5" size="xs" weight="semibold">
                    Custom Headers
                  </BaseHeading>
                  <BaseButton
                    size="xs"
                    variant="outline"
                    @click="addWebhookHeader"
                  >
                    <Icon name="lucide:plus" class="size-4" />
                    Add Header
                  </BaseButton>
                </div>

                <div v-if="Object.keys(formData.webhookHeaders).length === 0" class="p-4 text-center border border-dashed border-muted-200 dark:border-muted-800 rounded-lg">
                  <BaseParagraph size="xs" class="text-muted-500">
                    No custom headers. Headers are optional.
                  </BaseParagraph>
                </div>

                <div v-else class="space-y-2">
                  <div
                    v-for="(value, key) in formData.webhookHeaders"
                    :key="key"
                    class="flex items-center gap-2"
                  >
                    <TairoInput
                      :model-value="key"
                      placeholder="Header name"
                      class="flex-1"
                      @update:model-value="(newKey) => {
                        const oldValue = formData.webhookHeaders[key]
                        delete formData.webhookHeaders[key]
                        formData.webhookHeaders[newKey] = oldValue
                      }"
                    />
                    <TairoInput
                      v-model="formData.webhookHeaders[key]"
                      placeholder="Header value"
                      class="flex-1"
                    />
                    <BaseButton
                      variant="ghost"
                      size="xs"
                      color="danger"
                      @click="removeWebhookHeader(key)"
                    >
                      <Icon name="solar:trash-bin-trash-linear" class="size-4" />
                    </BaseButton>
                  </div>
                </div>
              </div>

              <TairoFormGroup label="Body Template (Optional)">
                <textarea
                  v-model="formData.webhookBodyTemplate"
                  rows="4"
                  placeholder='{"event": "click", "linkId": "{{linkId}}", "timestamp": "{{timestamp}}"}'
                  class="w-full px-4 py-3 rounded-lg border border-muted-300 dark:border-muted-600 bg-white dark:bg-muted-800 text-muted-800 dark:text-muted-100 placeholder:text-muted-400 dark:placeholder:text-muted-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200 resize-none"
                />
                <BaseParagraph size="xs" class="text-muted-500 mt-1" v-pre>
                  Use template variables like {{linkId}}, {{timestamp}}, {{shortUrl}}
                </BaseParagraph>
              </TairoFormGroup>
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
              <span>{{ isEditMode ? 'Update' : 'Create' }} Template</span>
            </BaseButton>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>


