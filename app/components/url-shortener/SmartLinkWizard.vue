<script setup lang="ts">
const createUid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

const cloneCondition = (condition: Record<string, any>) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(condition)
  }
  return JSON.parse(JSON.stringify(condition))
}
import type { CreateSmartLinkRequest, SmartLinkConditionType } from '~/types/url-shortener'
import { useSmartLinks } from '~/composables/useSmartLinks'
import { useUrlShortenerLinks } from '~/composables/useUrlShortenerLinks'
import { useUrlShortenerCollections } from '~/composables/useUrlShortenerCollections'
import { useWorkspaceDomains } from '~/composables/useWorkspaceDomains'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'

type SmartLinkRuleForm = {
  uid: string
  targetLinkId: string | null
  conditionType: SmartLinkConditionType
  condition: Record<string, any>
  priority: number
  isActive: boolean
}

type AiSuggestion = {
  id: string
  title: string
  description: string
  recommendation: string
  selected: boolean
  score?: number
}

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
  created: [payload: { id: string; shortUrl: string }]
}>()

const toaster = useNuiToasts()
const api = useApi()
const { workspaceId } = useWorkspaceContext()
const { createSmartLink, generateSmartLinkAiInsights } = useSmartLinks()
const { items: linkItems, fetchLinks } = useUrlShortenerLinks()
const { items: collectionsItems, fetchCollections } = useUrlShortenerCollections()
const { domainOptions, fetchDomains } = useWorkspaceDomains()

const isOpen = computed({
  get: () => props.open,
  set: (value) => {
    emit('update:open', value)
    if (!value) {
      emit('close')
      // Delay reset to avoid unmount errors
      nextTick(() => {
        resetWizard()
      })
    }
  },
})

const totalSteps = 6
const currentStep = ref(1)
const isSubmitting = ref(false)
const createdResult = ref<{ id: string; shortUrl: string } | null>(null)
const isAiLoading = ref(false)
const aiFetchError = ref<string | null>(null)

const errors = ref<Record<string, string>>({})

const formData = ref({
  name: '',
  defaultLinkId: null as string | null,
  isOneTime: false,
  expiresAt: null as string | null,
  clickLimit: null as number | null,
  hasPassword: false,
  password: '',
  domainType: 'default',
  domainValue: null as string | null,
  domainLabel: 'snap.ly',
  customAlias: '',
  description: '',
  collectionIds: [] as string[],
  aiGoal: 'traffic',
  aiKpi: 'ctr',
  aiNotes: '',
})

const geoCountries = ref<Array<{ code: string; name: string; cities: string[] }>>([
  { code: 'US', name: 'United States', cities: ['New York', 'Los Angeles', 'San Francisco', 'Chicago', 'Miami'] },
  { code: 'CA', name: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary'] },
  { code: 'DE', name: 'Germany', cities: ['Berlin', 'Munich', 'Hamburg'] },
  { code: 'IR', name: 'Iran', cities: ['Tehran', 'Isfahan', 'Shiraz', 'Tabriz'] },
  { code: 'AE', name: 'United Arab Emirates', cities: ['Dubai', 'Abu Dhabi', 'Sharjah'] },
])
const isGeoLoading = ref(false)

const conditionTypeOptions: { label: string; value: SmartLinkConditionType; description: string }[] = [
  { label: 'Country', value: 'GeoCountry', description: 'Route visitors based on country' },
  { label: 'Region', value: 'GeoRegion', description: 'Target specific regions or states' },
  { label: 'City', value: 'GeoCity', description: 'Hyperlocal routing' },
  { label: 'Device Type', value: 'DeviceType', description: 'Desktop, mobile or tablet' },
  { label: 'Operating System', value: 'OperatingSystem', description: 'iOS, Android, Windows, …' },
  { label: 'Browser', value: 'Browser', description: 'Chrome, Safari, Firefox, …' },
  { label: 'Referrer', value: 'Referrer', description: 'Send based on referring host' },
  { label: 'Schedule', value: 'Schedule', description: 'Time-based redirects' },
  { label: 'Custom Expression', value: 'CustomExpression', description: 'Combine multiple signals' },
]

const deviceOptions = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'tablet', label: 'Tablet' },
]

const osOptions = [
  'iOS',
  'Android',
  'Windows',
  'macOS',
  'Linux',
]

const browserOptions = [
  'Chrome',
  'Safari',
  'Firefox',
  'Edge',
  'Opera',
]

const dayOptions = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
]

const aiSuggestions = ref<AiSuggestion[]>([])
const hasGeneratedAi = ref(false)

const createConditionTemplate = (type: SmartLinkConditionType): Record<string, any> => {
  switch (type) {
    case 'GeoCountry':
      return { countries: [] as string[], search: '' }
    case 'GeoRegion':
      return { regions: [] as string[], notes: '' }
    case 'GeoCity':
      return { country: null as string | null, cities: [] as string[], citySearch: '' }
    case 'DeviceType':
      return { devices: [] as string[] }
    case 'OperatingSystem':
      return { systems: [] as string[] }
    case 'Browser':
      return { browsers: [] as string[] }
    case 'Referrer':
      return { hosts: '' }
    case 'Schedule':
      return {
        timezone: 'UTC',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        start: '08:00',
        end: '18:00',
      }
    case 'CustomExpression':
    default:
      return {
        expression: '',
        notes: '',
      }
  }
}

const rules = ref<SmartLinkRuleForm[]>([])

const createRule = (type: SmartLinkConditionType = 'GeoCountry'): SmartLinkRuleForm => ({
  uid: createUid(),
  targetLinkId: null,
  conditionType: type,
  condition: createConditionTemplate(type),
  priority: (rules.value.length + 1) * 10,
  isActive: true,
})

// Initialize with first rule
rules.value = [createRule()]

const linkOptions = computed(() => {
  return linkItems.value
    .filter(link => {
      const url = (link.destinationUrl || '').toLowerCase()
      return !url.includes('test') && !url.includes('example.com')
    })
    .map(link => ({
      value: link.id,
      label: link.shortUrl || link.destinationUrl,
      description: link.destinationUrl,
    }))
})

const collectionOptions = computed(() => {
  return collectionsItems.value.map(collection => ({
    id: collection.id,
    name: collection.name,
  }))
})

const domains = computed(() => {
  const defaultDomain = { label: 'snap.ly', domainType: 'default', domainValue: null }
  return [defaultDomain, ...domainOptions.value]
})

const aiGoals = [
  { value: 'traffic', label: 'Traffic growth' },
  { value: 'conversion', label: 'Conversion uplift' },
  { value: 'revenue', label: 'Revenue impact' },
]

const aiKpis = [
  { value: 'ctr', label: 'Click-through rate' },
  { value: 'cvr', label: 'Conversion rate' },
  { value: 'cpa', label: 'Acquisition cost' },
]

const fetchGeoData = async () => {
  if (!workspaceId.value) {
    return
  }
  isGeoLoading.value = true
  try {
    const response = await api.get<any>(
      '/api/public/geo/countries',
      {
        base: 'gateway',
        retry: 0,
        timeout: 6000,
        quiet: true,
      },
    )
    if (Array.isArray(response?.data ?? response)) {
      geoCountries.value = (response.data ?? response).map((country: any) => ({
        code: country.code ?? country.iso2 ?? country.id,
        name: country.name ?? country.title,
        cities: country.cities ?? [],
      }))
    }
  }
  catch {
    // swallow - fallback list already defined
  }
  finally {
    isGeoLoading.value = false
  }
}

const fetchWizardData = async () => {
  await Promise.all([
    fetchLinks({ force: true }),
    fetchCollections({ force: true }),
    fetchDomains(),
    fetchGeoData(),
  ])
}

watch(isOpen, (value) => {
  if (value) {
    fetchWizardData()
  }
}, { immediate: false })

watch(currentStep, (step) => {
  if (step === 5) {
    fetchAiSuggestions()
  }
})

watch(() => [formData.value.aiGoal, formData.value.aiKpi, formData.value.aiNotes], () => {
  hasGeneratedAi.value = false
  aiSuggestions.value = []
  aiFetchError.value = null
})

watch(rules, () => {
  hasGeneratedAi.value = false
  aiSuggestions.value = []
  aiFetchError.value = null
}, { deep: true })

const filteredCountries = (search: string) => {
  if (!search) {
    return geoCountries.value
  }
  const query = search.toLowerCase()
  return geoCountries.value.filter(country => country.name.toLowerCase().includes(query) || country.code.toLowerCase().includes(query))
}

const filteredCities = (countryCode: string | null, search: string) => {
  if (!countryCode) {
    return []
  }

  const country = geoCountries.value.find(country => country.code === countryCode)
  if (!country) {
    return []
  }

  if (!search) {
    return country.cities
  }

  const query = search.toLowerCase()
  return country.cities.filter(city => city.toLowerCase().includes(query))
}

const toggleArrayValue = (array: string[], value: string) => {
  const index = array.indexOf(value)
  if (index > -1) {
    array.splice(index, 1)
  }
  else {
    array.push(value)
  }
}

const removeRule = (uid: string) => {
  if (rules.value.length === 1) {
    toaster.add({
      title: 'At least one rule is required',
      icon: 'ph:warning',
      color: 'warning',
    })
    return
  }
  rules.value = rules.value.filter(rule => rule.uid !== uid)
}

const addRule = () => {
  rules.value.push(createRule())
}

const duplicateRule = (rule: SmartLinkRuleForm) => {
  const clone: SmartLinkRuleForm = {
    uid: createUid(),
    targetLinkId: rule.targetLinkId,
    conditionType: rule.conditionType,
    condition: cloneCondition(rule.condition),
    priority: (rules.value.length + 1) * 10,
    isActive: rule.isActive,
  }
  rules.value.push(clone)
}

const selectDomainOption = (option: { label: string; domainType: string; domainValue: string | null }) => {
  formData.value.domainType = option.domainType
  formData.value.domainValue = option.domainValue
  formData.value.domainLabel = option.label
  delete errors.value.domain
}

const isDomainSelected = (option: { domainType: string; domainValue: string | null }) => {
  if (option.domainType === 'default') {
    return formData.value.domainType === 'default'
  }
  return (
    formData.value.domainType === option.domainType &&
    formData.value.domainValue === option.domainValue
  )
}

const toggleCollection = (collectionId: string) => {
  if (formData.value.collectionIds.includes(collectionId)) {
    formData.value.collectionIds = formData.value.collectionIds.filter(id => id !== collectionId)
  }
  else {
    formData.value.collectionIds = [...formData.value.collectionIds, collectionId]
  }
}

const validateStep1 = () => {
  errors.value = {}
  if (!formData.value.name.trim()) {
    errors.value.name = 'Give this SmartLink a friendly name'
    return false
  }
  if (!rules.value.length) {
    errors.value.rules = 'Add at least one routing rule'
    return false
  }
  for (const [index, rule] of rules.value.entries()) {
    if (!rule.targetLinkId) {
      errors.value.rules = `Rule ${index + 1}: select a destination link`
      return false
    }
    if (!validateRuleCondition(rule)) {
      return false
    }
  }
  delete errors.value.rules
  return true
}

const validateRuleCondition = (rule: SmartLinkRuleForm) => {
  switch (rule.conditionType) {
    case 'GeoCountry': {
      const countries = rule.condition.countries ?? []
      if (!countries.length) {
        errors.value.rules = 'Add at least one country to each Geo rule'
        return false
      }
      return true
    }
    case 'GeoCity': {
      const country = rule.condition.country
      const cities = rule.condition.cities ?? []
      if (!country || !cities.length) {
        errors.value.rules = 'Select country and city for city-based rules'
        return false
      }
      return true
    }
    case 'DeviceType': {
      if (!rule.condition.devices?.length) {
        errors.value.rules = 'Select at least one device type'
        return false
      }
      return true
    }
    case 'OperatingSystem': {
      if (!rule.condition.systems?.length) {
        errors.value.rules = 'Select operating systems to target'
        return false
      }
      return true
    }
    case 'Browser': {
      if (!rule.condition.browsers?.length) {
        errors.value.rules = 'Select browsers to target'
        return false
      }
      return true
    }
    case 'Referrer': {
      if (!rule.condition.hosts?.trim()) {
        errors.value.rules = 'Add at least one host or pattern'
        return false
      }
      return true
    }
    case 'Schedule': {
      const start = rule.condition.start
      const end = rule.condition.end
      if (!start || !end) {
        errors.value.rules = 'Provide start and end time'
        return false
      }
      return true
    }
    default:
      return true
  }
}

const validateStep2 = () => {
  errors.value = {}
  if (formData.value.hasPassword && !formData.value.password.trim()) {
    errors.value.password = 'Provide a password'
    return false
  }
  if (formData.value.isOneTime && !formData.value.expiresAt) {
    errors.value.expiresAt = 'One-time SmartLinks need expiration'
    return false
  }
  return true
}

const validateStep3 = () => {
  errors.value = {}
  if (!formData.value.domainType) {
    errors.value.domain = 'Pick a domain'
    return false
  }
  return true
}

const validateStep4 = () => {
  if (formData.value.customAlias && formData.value.customAlias.length < 3) {
    errors.value.customAlias = 'Alias should be at least 3 characters'
    return false
  }
  return true
}

const fetchAiSuggestions = async (options: { force?: boolean } = {}) => {
  if (isAiLoading.value || (!options.force && hasGeneratedAi.value)) {
    return
  }

  isAiLoading.value = true
  aiFetchError.value = null

  try {
    const response = await generateSmartLinkAiInsights({
      goal: formData.value.aiGoal,
      kpi: formData.value.aiKpi,
      notes: formData.value.aiNotes,
      defaultLinkId: formData.value.defaultLinkId,
      rules: rules.value.map(rule => ({
        targetLinkId: rule.targetLinkId!,
        conditionType: rule.conditionType,
        condition: cleanRuleCondition(rule),
        priority: rule.priority,
        isActive: rule.isActive,
      })),
    })

    aiSuggestions.value = response?.suggestions?.map(suggestion => ({
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      recommendation: suggestion.recommendation,
      selected: true,
      score: suggestion.score,
    })) ?? []
    hasGeneratedAi.value = true
  }
  catch (error) {
    if (import.meta.dev) {
      console.error('[SmartLinkWizard] Failed to fetch AI insights', error)
    }
    aiFetchError.value = 'دریافت پیشنهادهای هوش مصنوعی با خطا مواجه شد.'
    aiSuggestions.value = []
  }
  finally {
    isAiLoading.value = false
  }
}

const nextStep = async () => {
  if (currentStep.value === 1 && !validateStep1()) {
    return
  }
  if (currentStep.value === 2 && !validateStep2()) {
    return
  }
  if (currentStep.value === 3 && !validateStep3()) {
    return
  }
  if (currentStep.value === 4 && !validateStep4()) {
    return
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

const buildAiMetadata = () => {
  const suggestions = aiSuggestions.value
    .filter(suggestion => suggestion.selected)
    .map(suggestion => ({
      id: suggestion.id,
      title: suggestion.title,
      recommendation: suggestion.recommendation,
    }))

  return {
    goal: formData.value.aiGoal,
    kpi: formData.value.aiKpi,
    notes: formData.value.aiNotes,
    suggestions,
  }
}

const submitSmartLink = async () => {
  if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) {
    return
  }

  const request: CreateSmartLinkRequest = {
    name: formData.value.name.trim(),
    description: formData.value.description?.trim() || null,
    domainType: formData.value.domainType,
    domainValue: formData.value.domainValue,
    customAlias: formData.value.customAlias?.trim() || null,
    defaultLinkId: formData.value.defaultLinkId,
    isOneTime: formData.value.isOneTime,
    expiresAt: formData.value.expiresAt ? new Date(formData.value.expiresAt).toISOString() : null,
    clickLimit: formData.value.clickLimit,
    password: formData.value.hasPassword ? formData.value.password : null,
    collectionIds: formData.value.collectionIds.length ? formData.value.collectionIds : null,
    rules: rules.value.map(rule => ({
      targetLinkId: rule.targetLinkId!,
      conditionType: rule.conditionType,
      condition: cleanRuleCondition(rule),
      priority: rule.priority,
      isActive: rule.isActive,
    })),
    aiMetadata: buildAiMetadata(),
  }

  isSubmitting.value = true
  try {
    const result = await createSmartLink(request)
    if (result) {
      createdResult.value = result
      currentStep.value = totalSteps
      emit('created', result)
    }
  }
  finally {
    isSubmitting.value = false
  }
}

const cleanRuleCondition = (rule: SmartLinkRuleForm) => {
  const clone = { ...rule.condition }
  delete clone.search
  delete clone.citySearch
  return clone
}

const resetWizard = () => {
  currentStep.value = 1
  createdResult.value = null
  isSubmitting.value = false
  formData.value = {
    name: '',
    defaultLinkId: null,
    isOneTime: false,
    expiresAt: null,
    clickLimit: null,
    hasPassword: false,
    password: '',
    domainType: 'default',
    domainValue: null,
    domainLabel: 'snap.ly',
    customAlias: '',
    description: '',
    collectionIds: [],
    aiGoal: 'traffic',
    aiKpi: 'ctr',
    aiNotes: '',
  }
  rules.value = [createRule()]
  aiSuggestions.value = []
  hasGeneratedAi.value = false
  errors.value = {}
}

const handleClose = () => {
  isOpen.value = false
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
        class="fixed top-[4%] start-1/2 max-h-[92vh] w-[92vw] max-w-4xl -translate-x-1/2 rounded-2xl border border-muted-200 dark:border-muted-700 bg-white dark:bg-muted-900 focus:outline-none z-[100] flex flex-col"
        @pointer-down-outside="handleClose"
        @escape-key-down="handleClose"
      >
        <div class="flex items-center justify-between border-b border-muted-200 dark:border-muted-800 px-6 py-4">
          <div>
            <DialogTitle class="font-heading text-xl font-semibold text-muted-900 dark:text-white">
              Create SmartLink
            </DialogTitle>
            <DialogDescription class="text-sm text-muted-500 dark:text-muted-400">
              Step {{ currentStep }} of {{ totalSteps }}
            </DialogDescription>
          </div>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="handleClose"
          >
            <Icon name="lucide:x" class="size-4" />
          </BaseButton>
        </div>

        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          <div class="h-2 bg-muted-200 dark:bg-muted-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary-500 rounded-full transition-all duration-300"
              :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
            />
          </div>

          <!-- Step 1 -->
          <div v-if="currentStep === 1" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold">
                Define routing rules
              </BaseHeading>
              <BaseParagraph size="sm">
                Decide how visitors flow to different destinations based on context.
              </BaseParagraph>
            </div>
            <TairoFormGroup
              label="SmartLink name"
              :error="errors.name"
            >
              <TairoInput
                v-model="formData.name"
                placeholder="e.g. Holiday blend promo"
                rounded="lg"
              />
            </TairoFormGroup>

            <TairoFormGroup label="Fallback destination">
              <TairoSelect
                v-model="formData.defaultLinkId"
                placeholder="Optional fallback link"
              >
                <BaseSelectItem
                  v-for="option in linkOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  <div class="flex flex-col">
                    <span>{{ option.label }}</span>
                    <span class="text-xs text-muted-400">{{ option.description }}</span>
                  </div>
                </BaseSelectItem>
              </TairoSelect>
            </TairoFormGroup>

            <div class="flex items-center justify-between">
              <BaseHeading as="h4" size="sm" weight="semibold">
                Routing matrix
              </BaseHeading>
              <BaseButton
                variant="outline"
                color="primary"
                size="xs"
                @click="addRule"
              >
                <Icon name="lucide:plus" class="size-4" />
                Add rule
              </BaseButton>
            </div>

            <div v-if="errors.rules" class="text-danger-500 text-sm">
              {{ errors.rules }}
            </div>

            <div class="space-y-4">
              <BaseCard
                v-for="rule in rules"
                :key="rule.uid"
                class="border border-muted-200 dark:border-muted-800"
              >
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-muted-200 dark:border-muted-800 px-4 py-3">
                  <div class="text-sm font-semibold text-muted-900 dark:text-white">
                    Rule {{ rules.indexOf(rule) + 1 }}
                  </div>
                  <div class="flex items-center gap-2">
                    <BaseSwitchBall
                      v-model="rule.isActive"
                      color="primary"
                      label="Active"
                    />
                    <BaseButton
                      variant="ghost"
                      size="xs"
                      @click="duplicateRule(rule)"
                    >
                      <Icon name="solar:copy-linear" class="size-4" />
                    </BaseButton>
                    <BaseButton
                      variant="ghost"
                      size="xs"
                      color="danger"
                      @click="removeRule(rule.uid)"
                    >
                      <Icon name="solar:trash-bin-trash-linear" class="size-4" />
                    </BaseButton>
                  </div>
                </div>

                <div class="space-y-4 p-4">
                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TairoFormGroup label="Condition type">
                      <TairoSelect
                        v-model="rule.conditionType"
                        @update:model-value="rule.condition = createConditionTemplate(rule.conditionType)"
                      >
                        <BaseSelectItem
                          v-for="option in conditionTypeOptions"
                          :key="option.value"
                          :value="option.value"
                        >
                          <div class="flex flex-col">
                            <span>{{ option.label }}</span>
                            <span class="text-xs text-muted-500">{{ option.description }}</span>
                          </div>
                        </BaseSelectItem>
                      </TairoSelect>
                    </TairoFormGroup>

                    <TairoFormGroup label="Destination link">
                      <TairoSelect v-model="rule.targetLinkId">
                        <BaseSelectItem
                          v-for="option in linkOptions"
                          :key="option.value"
                          :value="option.value"
                        >
                          <div class="flex flex-col">
                            <span>{{ option.label }}</span>
                            <span class="text-xs text-muted-400">{{ option.description }}</span>
                          </div>
                        </BaseSelectItem>
                      </TairoSelect>
                    </TairoFormGroup>
                  </div>

                  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <TairoFormGroup label="Priority">
                      <TairoInput
                        v-model.number="rule.priority"
                        type="number"
                        min="1"
                      />
                    </TairoFormGroup>
                    <div class="md:col-span-2">
                      <BaseParagraph size="xs" class="text-muted-500">
                        Lower numbers run first. Default is in increments of 10.
                      </BaseParagraph>
                    </div>
                  </div>

                  <div v-if="rule.conditionType === 'GeoCountry'" class="space-y-3">
                    <TairoFormGroup label="Filter countries">
                      <TairoInput
                        v-model="rule.condition.search"
                        placeholder="Search country"
                      />
                    </TairoFormGroup>
                    <div class="max-h-40 overflow-y-auto border border-muted-200 dark:border-muted-700 rounded-lg p-3 space-y-2">
                      <label
                        v-for="country in filteredCountries(rule.condition.search)"
                        :key="country.code"
                        class="flex items-center gap-3 text-sm cursor-pointer"
                      >
                        <BaseCheckbox
                          :model-value="rule.condition.countries?.includes(country.code)"
                          @update:model-value="toggleArrayValue(rule.condition.countries, country.code)"
                          @click.stop
                        />
                        <span>{{ country.name }}</span>
                        <span class="text-xs text-muted-400">{{ country.code }}</span>
                      </label>
                    </div>
                  </div>

                  <div v-else-if="rule.conditionType === 'GeoCity'" class="space-y-4">
                    <TairoFormGroup label="Country">
                      <TairoSelect v-model="rule.condition.country">
                        <BaseSelectItem
                          v-for="country in geoCountries"
                          :key="country.code"
                          :value="country.code"
                        >
                          {{ country.name }}
                        </BaseSelectItem>
                      </TairoSelect>
                    </TairoFormGroup>
                    <TairoFormGroup label="Filter city">
                      <TairoInput
                        v-model="rule.condition.citySearch"
                        placeholder="Search city"
                      />
                    </TairoFormGroup>
                    <div class="max-h-40 overflow-y-auto border border-muted-200 dark:border-muted-700 rounded-lg p-3 space-y-2">
                      <label
                        v-for="city in filteredCities(rule.condition.country, rule.condition.citySearch)"
                        :key="city"
                        class="flex items-center gap-3 text-sm cursor-pointer"
                      >
                        <BaseCheckbox
                          :model-value="rule.condition.cities?.includes(city)"
                          @update:model-value="toggleArrayValue(rule.condition.cities, city)"
                          @click.stop
                        />
                        <span>{{ city }}</span>
                      </label>
                    </div>
                  </div>

                  <div v-else-if="rule.conditionType === 'DeviceType'">
                    <div class="flex flex-wrap gap-3">
                      <BaseButton
                        v-for="device in deviceOptions"
                        :key="device.value"
                        size="sm"
                        :variant="rule.condition.devices?.includes(device.value) ? 'solid' : 'outline'"
                        color="primary"
                        class="rounded-full"
                        @click="toggleArrayValue(rule.condition.devices, device.value)"
                      >
                        {{ device.label }}
                      </BaseButton>
                    </div>
                  </div>

                  <div v-else-if="rule.conditionType === 'OperatingSystem'">
                    <div class="flex flex-wrap gap-3">
                      <BaseButton
                        v-for="system in osOptions"
                        :key="system"
                        size="sm"
                        :variant="rule.condition.systems?.includes(system) ? 'solid' : 'outline'"
                        color="primary"
                        class="rounded-full"
                        @click="toggleArrayValue(rule.condition.systems, system)"
                      >
                        {{ system }}
                      </BaseButton>
                    </div>
                  </div>

                  <div v-else-if="rule.conditionType === 'Browser'">
                    <div class="flex flex-wrap gap-3">
                      <BaseButton
                        v-for="browser in browserOptions"
                        :key="browser"
                        size="sm"
                        :variant="rule.condition.browsers?.includes(browser) ? 'solid' : 'outline'"
                        color="primary"
                        class="rounded-full"
                        @click="toggleArrayValue(rule.condition.browsers, browser)"
                      >
                        {{ browser }}
                      </BaseButton>
                    </div>
                  </div>

                  <div v-else-if="rule.conditionType === 'Referrer'">
                    <TairoFormGroup label="Allowed referrers">
                      <textarea
                        v-model="rule.condition.hosts"
                        rows="3"
                        placeholder="example.com, ads.google.com, facebook.com"
                        class="w-full px-4 py-3 rounded-lg border border-muted-300 dark:border-muted-600 bg-white dark:bg-muted-800 text-muted-800 dark:text-muted-100 placeholder:text-muted-400 dark:placeholder:text-muted-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200 resize-none"
                      />
                      <BaseParagraph size="xs" class="text-muted-400 mt-1">
                        Separate hosts with comma or newline.
                      </BaseParagraph>
                    </TairoFormGroup>
                  </div>

                  <div v-else-if="rule.conditionType === 'Schedule'">
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <TairoFormGroup label="Time zone">
                        <TairoInput
                          v-model="rule.condition.timezone"
                          placeholder="UTC"
                        />
                      </TairoFormGroup>
                      <TairoFormGroup label="Start time">
                        <TairoInput
                          v-model="rule.condition.start"
                          type="time"
                        />
                      </TairoFormGroup>
                      <TairoFormGroup label="End time">
                        <TairoInput
                          v-model="rule.condition.end"
                          type="time"
                        />
                      </TairoFormGroup>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <BaseButton
                        v-for="day in dayOptions"
                        :key="day"
                        size="xs"
                        :variant="rule.condition.days?.includes(day) ? 'solid' : 'outline'"
                        color="primary"
                        class="rounded-full"
                        @click="toggleArrayValue(rule.condition.days, day)"
                      >
                        {{ day }}
                      </BaseButton>
                    </div>
                  </div>

                  <div v-else>
                    <TairoFormGroup label="Expression">
                      <textarea
                        v-model="rule.condition.expression"
                        rows="3"
                        placeholder='e.g. country == "US" && device == "mobile"'
                        class="w-full px-4 py-3 rounded-lg border border-muted-300 dark:border-muted-600 bg-white dark:bg-muted-800 text-muted-800 dark:text-muted-100 placeholder:text-muted-400 dark:placeholder:text-muted-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200 resize-none"
                      />
                    </TairoFormGroup>
                    <TairoFormGroup label="Notes">
                      <TairoInput
                        v-model="rule.condition.notes"
                        placeholder="Optional description"
                      />
                    </TairoFormGroup>
                  </div>
                </div>
              </BaseCard>
            </div>
          </div>

          <!-- Step 2 -->
          <div v-else-if="currentStep === 2" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold">
                Limitations
              </BaseHeading>
              <BaseParagraph size="sm">
                Control how many clicks and when this SmartLink stays active.
              </BaseParagraph>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <BaseCard class="p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-semibold">One-time link</div>
                    <div class="text-sm text-muted-500">Disable after first click</div>
                  </div>
                  <BaseSwitchBall v-model="formData.isOneTime" color="primary" />
                </div>
                <TairoFormGroup
                  v-if="formData.isOneTime"
                  label="Expiration"
                  :error="errors.expiresAt"
                >
                  <TairoInput
                    v-model="formData.expiresAt"
                    type="datetime-local"
                  />
                </TairoFormGroup>
              </BaseCard>

              <BaseCard class="p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-semibold">Password protect</div>
                    <div class="text-sm text-muted-500">Ask for password before redirect</div>
                  </div>
                  <BaseSwitchBall v-model="formData.hasPassword" color="primary" />
                </div>
                <TairoFormGroup
                  v-if="formData.hasPassword"
                  label="Password"
                  :error="errors.password"
                >
                  <TairoInput
                    v-model="formData.password"
                    type="password"
                  />
                </TairoFormGroup>
              </BaseCard>
            </div>

            <TairoFormGroup label="Click limit">
              <TairoInput
                v-model.number="formData.clickLimit"
                type="number"
                placeholder="Unlimited"
                min="0"
              />
            </TairoFormGroup>
          </div>

          <!-- Step 3 -->
          <div v-else-if="currentStep === 3" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold">
                Domain configuration
              </BaseHeading>
              <BaseParagraph size="sm">
                Choose where your SmartLink lives.
              </BaseParagraph>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <button
                v-for="domain in domains"
                :key="domain.label"
                type="button"
                class="flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition"
                :class="isDomainSelected(domain) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-muted-200 dark:border-muted-700 hover:bg-muted-50 dark:hover:bg-muted-800'"
                @click="selectDomainOption(domain)"
              >
                <span class="font-semibold">{{ domain.label }}</span>
                <span class="text-xs text-muted-500">
                  {{ domain.domainType === 'default' ? 'snap.ly default' : domain.domainType }}
                </span>
              </button>
            </div>

            <div v-if="errors.domain" class="text-sm text-danger-500">
              {{ errors.domain }}
            </div>
          </div>

          <!-- Step 4 -->
          <div v-else-if="currentStep === 4" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold">
                Customization & collections
              </BaseHeading>
              <BaseParagraph size="sm">
                Tailor the alias, description and internal organization.
              </BaseParagraph>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TairoFormGroup
                label="Custom alias"
                :error="errors.customAlias"
              >
                <TairoInput
                  v-model="formData.customAlias"
                  placeholder="promo-2025"
                />
              </TairoFormGroup>

              <TairoFormGroup label="Description">
                <TairoInput
                  v-model="formData.description"
                  placeholder="Internal notes"
                />
              </TairoFormGroup>
            </div>

            <TairoFormGroup label="Collections">
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="collection in collectionOptions"
                  :key="collection.id"
                  type="button"
                  class="rounded-full border px-3 py-1 text-sm transition"
                  :class="formData.collectionIds.includes(collection.id) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-muted-200 dark:border-muted-700 hover:bg-muted-50 dark:hover:bg-muted-800'"
                  @click="toggleCollection(collection.id)"
                >
                  {{ collection.name }}
                </button>
                <BaseParagraph v-if="!collectionOptions.length" size="sm" class="text-muted-400">
                  No collections yet.
                </BaseParagraph>
              </div>
            </TairoFormGroup>
          </div>

          <!-- Step 5 -->
          <div v-else-if="currentStep === 5" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold">
                AI optimizer
              </BaseHeading>
              <BaseParagraph size="sm">
                Capture your campaign context so AI can suggest smarter splits.
              </BaseParagraph>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <TairoFormGroup label="Goal">
                <TairoSelect v-model="formData.aiGoal">
                  <BaseSelectItem
                    v-for="goal in aiGoals"
                    :key="goal.value"
                    :value="goal.value"
                  >
                    {{ goal.label }}
                  </BaseSelectItem>
                </TairoSelect>
              </TairoFormGroup>
              <TairoFormGroup label="Primary KPI">
                <TairoSelect v-model="formData.aiKpi">
                  <BaseSelectItem
                    v-for="kpi in aiKpis"
                    :key="kpi.value"
                    :value="kpi.value"
                  >
                    {{ kpi.label }}
                  </BaseSelectItem>
                </TairoSelect>
              </TairoFormGroup>
              <TairoFormGroup label="Notes">
                <TairoInput
                  v-model="formData.aiNotes"
                  placeholder="Seasonality, promo code, etc."
                />
              </TairoFormGroup>
            </div>

            <div class="flex items-center justify-between">
              <BaseHeading as="h4" size="sm" weight="semibold">
                Suggested experiments
              </BaseHeading>
              <BaseButton
                size="xs"
                variant="outline"
                color="primary"
                :loading="isAiLoading"
                @click="fetchAiSuggestions({ force: true })"
              >
                <Icon name="ph:sparkle" class="size-4" />
                Refresh
              </BaseButton>
            </div>

            <BaseParagraph
              v-if="aiFetchError"
              size="sm"
              class="text-danger-500"
            >
              {{ aiFetchError }}
            </BaseParagraph>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <BaseCard
                v-if="isAiLoading"
                class="p-6 border border-dashed border-muted-200 dark:border-muted-800 text-center"
              >
                <Icon name="ph:spinner-gap" class="mx-auto size-6 animate-spin text-primary-500" />
                <BaseParagraph size="sm" class="mt-2 text-muted-500">
                  در حال تحلیل سیگنال‌ها...
                </BaseParagraph>
              </BaseCard>
              <BaseCard
                v-for="suggestion in aiSuggestions"
                :key="suggestion.id"
                class="p-4 space-y-2 border border-muted-200 dark:border-muted-800"
              >
                <div class="flex items-center justify-between">
                  <div class="font-semibold">{{ suggestion.title }}</div>
                  <BaseSwitchBall v-model="suggestion.selected" color="primary" />
                </div>
                <BaseParagraph size="sm" class="text-muted-500">
                  {{ suggestion.description }}
                </BaseParagraph>
                <BaseTag color="info" rounded="full" size="sm">
                  {{ suggestion.recommendation }}
                </BaseTag>
              </BaseCard>

              <BaseCard
                v-if="!isAiLoading && !aiSuggestions.length"
                class="p-6 text-center border-dashed border-2 border-muted-200 dark:border-muted-800"
              >
                <Icon name="ph:sparkle" class="mx-auto size-8 text-primary-500" />
                <BaseHeading as="h4" size="sm" weight="semibold" class="mt-2">
                  No signals yet
                </BaseHeading>
                <BaseParagraph size="sm" class="text-muted-500">
                  Generate a first pass to let AI highlight quick wins.
                </BaseParagraph>
              </BaseCard>
            </div>
          </div>

          <!-- Step 6 -->
          <div v-else class="space-y-6">
            <div class="text-center space-y-4">
              <Icon name="ph:confetti-duotone" class="mx-auto size-12 text-success-500" />
              <BaseHeading as="h3" size="lg" weight="semibold">
                SmartLink ready
              </BaseHeading>
              <BaseParagraph size="sm">
                Share this dynamic link anywhere. AI will keep optimizing behind the scenes.
              </BaseParagraph>
              <div class="inline-flex items-center gap-3 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-primary-700">
                <Icon name="solar:link-linear" class="size-4" />
                <span>{{ createdResult?.shortUrl }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-muted-200 dark:border-muted-800 px-6 py-4 flex items-center justify-between">
          <BaseButton
            v-if="currentStep > 1 && currentStep < totalSteps"
            variant="outline"
            @click="prevStep"
          >
            Back
          </BaseButton>
          <span v-else />

          <div class="flex gap-2">
            <BaseButton
              v-if="currentStep < totalSteps - 1"
              color="primary"
              @click="nextStep"
            >
              Next
            </BaseButton>
            <BaseButton
              v-else-if="currentStep === totalSteps - 1"
              color="primary"
              :loading="isSubmitting"
              @click="submitSmartLink"
            >
              Launch SmartLink
            </BaseButton>
            <BaseButton
              v-else
              color="primary"
              variant="solid"
              @click="handleClose"
            >
              Done
            </BaseButton>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>


