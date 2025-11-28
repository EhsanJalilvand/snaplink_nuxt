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
import { useUrlShortenerCollections } from '~/composables/useUrlShortenerCollections'
import { useWorkspaceDomains } from '~/composables/useWorkspaceDomains'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import { useWorkspaceMembers } from '~/composables/useWorkspaceMembers'
import { useQRCode } from '~/composables/useQRCode'
import { onClickOutside } from '@vueuse/core'

type SmartLinkRuleForm = {
  uid: string
  targetUrl: string
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
const { createSmartLink } = useSmartLinks()
const { items: collectionsItems, fetchCollections } = useUrlShortenerCollections()
const { domainOptions, fetchDomains } = useWorkspaceDomains()
const { members: workspaceMembers, fetchMembers: fetchWorkspaceMembers, isLoading: isLoadingMembers } = useWorkspaceMembers()
const { getQRCodeUrl } = useQRCode()

const expandedRules = ref<Set<string>>(new Set())
const openCityDropdowns = ref<Set<string>>(new Set())
const openRegionDropdowns = ref<Set<string>>(new Set())

const toggleRuleExpanded = (ruleUid: string) => {
  if (expandedRules.value.has(ruleUid)) {
    expandedRules.value.delete(ruleUid)
  } else {
    expandedRules.value.add(ruleUid)
  }
}

const isRuleExpanded = (ruleUid: string) => {
  return expandedRules.value.has(ruleUid)
}

const validateUrl = (url: string): boolean => {
  if (!url.trim()) return false
  try {
    const uri = new URL(url)
    return uri.protocol === 'http:' || uri.protocol === 'https:'
  } catch {
    return false
  }
}

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

const totalSteps = 7
const currentStep = ref(1)
const isSubmitting = ref(false)
const createdResult = ref<{ id: string; shortUrl: string } | null>(null)

const errors = ref<Record<string, string>>({})

const formData = ref({
  name: '',
  fallbackUrl: '',
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
  visibility: 'public' as 'public' | 'private',
  visibilityRoles: [] as string[],
  visibilityMemberIds: [] as string[],
  pixelEvents: [] as Array<{ pixelType: string; pixelId: string; eventType: string }>,
  webhookUrl: '',
  webhookMethod: 'POST',
  webhookHeaders: {} as Record<string, string>,
  webhookBodyTemplate: '',
})

const geoCountries = ref<Array<{ code: string; name: string; cities: Array<{ id?: string; name: string; region?: string | null }> }>>([
  { code: 'US', name: 'United States', cities: [
    { name: 'New York', region: 'New York' },
    { name: 'Los Angeles', region: 'California' },
    { name: 'San Francisco', region: 'California' },
    { name: 'Chicago', region: 'Illinois' },
    { name: 'Miami', region: 'Florida' }
  ]},
  { code: 'CA', name: 'Canada', cities: [
    { name: 'Toronto', region: 'Ontario' },
    { name: 'Vancouver', region: 'British Columbia' },
    { name: 'Montreal', region: 'Quebec' },
    { name: 'Calgary', region: 'Alberta' }
  ]},
  { code: 'DE', name: 'Germany', cities: [
    { name: 'Berlin', region: 'Berlin' },
    { name: 'Munich', region: 'Bavaria' },
    { name: 'Hamburg', region: 'Hamburg' }
  ]},
  { code: 'IR', name: 'Iran', cities: [
    { name: 'Tehran', region: 'Tehran' },
    { name: 'Isfahan', region: 'Isfahan' },
    { name: 'Shiraz', region: 'Fars' },
    { name: 'Tabriz', region: 'East Azerbaijan' }
  ]},
  { code: 'AE', name: 'United Arab Emirates', cities: [
    { name: 'Dubai', region: 'Dubai' },
    { name: 'Abu Dhabi', region: 'Abu Dhabi' },
    { name: 'Sharjah', region: 'Sharjah' }
  ]},
])
const isGeoLoading = ref(false)

const conditionTypeOptions: { label: string; value: SmartLinkConditionType; description: string }[] = [
  { label: 'Country', value: 'GeoCountry', description: 'Route visitors based on country' },
  { label: 'City', value: 'GeoCity', description: 'Hyperlocal routing' },
  { label: 'Region', value: 'GeoRegion', description: 'Target specific regions or states' },
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


const createConditionTemplate = (type: SmartLinkConditionType): Record<string, any> => {
  switch (type) {
    case 'GeoCountry':
      return { countries: [] as string[], search: '' }
    case 'GeoRegion':
      return { 
        country: null as string | null,
        cities: [] as string[],
        regions: [] as string[],
        citySearch: '',
        regionSearch: ''
      }
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
  targetUrl: '',
  conditionType: type,
  condition: createConditionTemplate(type),
  priority: (rules.value.length + 1) * 10,
  isActive: false,
})

// Initialize with first rule
rules.value = [createRule()]

const collectionOptions = computed(() => {
  return collectionsItems.value.map(collection => ({
    id: collection.id,
    name: collection.name,
  }))
})

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

const selectedMembers = computed(() => {
  if (!formData.value.visibilityMemberIds.length) {
    return []
  }
  const selectedSet = new Set(formData.value.visibilityMemberIds)
  return workspaceMembers.value.filter(member => selectedSet.has(member.id))
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

const domains = computed(() => {
  const defaultDomain = { label: 'snap.ly', domainType: 'default', domainValue: null }
  return [defaultDomain, ...domainOptions.value]
})

const defaultDomainOption = computed(() => domains.value.find(domain => domain.domainType === 'default'))
const workspaceSubdomains = computed(() => domains.value.filter(domain => domain.domainType === 'subdomain'))
const workspaceCustomDomains = computed(() => domains.value.filter(domain => domain.domainType === 'custom'))


const pixelTypeOptions = [
  { value: 'google_tag', label: 'Google Tag / Google Ads Pixel / GA4 Tag' },
  { value: 'tiktok', label: 'TikTok Pixel' },
  { value: 'linkedin', label: 'LinkedIn Insight Tag' },
  { value: 'twitter', label: 'Twitter (X) Pixel' },
  { value: 'pinterest', label: 'Pinterest Tag' },
  { value: 'snapchat', label: 'Snapchat Pixel (Snap Pixel)' },
  { value: 'reddit', label: 'Reddit Conversion Pixel' },
  { value: 'microsoft_ads', label: 'Microsoft Ads UET Tag' },
  { value: 'quora', label: 'Quora Pixel' },
]

const eventTypeOptions = [
  { value: 'PageView', label: 'PageView' },
  { value: 'Purchase', label: 'Purchase' },
  { value: 'Lead', label: 'Lead' },
  { value: 'AddToCart', label: 'AddToCart' },
  { value: 'InitiateCheckout', label: 'InitiateCheckout' },
  { value: 'CompleteRegistration', label: 'CompleteRegistration' },
  { value: 'ViewContent', label: 'ViewContent' },
  { value: 'Search', label: 'Search' },
  { value: 'Custom', label: 'Custom' },
]

const webhookMethodOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
]

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

const addWebhookHeader = () => {
  const key = `header_${Object.keys(formData.value.webhookHeaders).length + 1}`
  formData.value.webhookHeaders[key] = ''
}

const removeWebhookHeader = (key: string) => {
  delete formData.value.webhookHeaders[key]
}

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
        cities: (country.cities ?? []).map((city: any) => ({
          id: city.id,
          name: typeof city === 'string' ? city : (city.name ?? city),
          region: typeof city === 'string' ? null : (city.region ?? null),
        })),
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
    fetchWorkspaceMembers(),
  ])
}

watch(isOpen, (value) => {
  if (value) {
    fetchWizardData()
  }
}, { immediate: false })

watch(() => formData.value.visibility, (newValue) => {
  if (newValue === 'public') {
    formData.value.visibilityRoles = []
    formData.value.visibilityMemberIds = []
    delete errors.value.visibility
  }
})


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
  return country.cities.filter(city => 
    city.name.toLowerCase().includes(query) || 
    (city.region && city.region.toLowerCase().includes(query))
  )
}

const getAvailableRegions = (countryCode: string | null, selectedCityNames: string[]) => {
  if (!countryCode || !selectedCityNames.length) {
    return []
  }

  const country = geoCountries.value.find(country => country.code === countryCode)
  if (!country) {
    return []
  }

  const selectedCities = country.cities.filter(city => selectedCityNames.includes(city.name))
  const regions = selectedCities
    .map(city => city.region)
    .filter((region): region is string => region != null && region.trim() !== '')
  
  // Return unique regions
  return [...new Set(regions)].sort()
}

const toggleArrayValue = (array: string[] | undefined, value: string): string[] => {
  // Initialize array if it's undefined or null
  if (!array) {
    array = []
  }
  
  const index = array.indexOf(value)
  if (index > -1) {
    array.splice(index, 1)
  }
  else {
    array.push(value)
  }
  
  return array
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
  updatePriorities()
}

const addRule = () => {
  rules.value.push(createRule())
  updatePriorities()
}

const duplicateRule = (rule: SmartLinkRuleForm) => {
  try {
    // Deep clone the condition using structuredClone or JSON
    const clonedCondition = cloneCondition(rule.condition)
    
    // Ensure all arrays are properly cloned (not just references)
    // This is important because cloneCondition might not deep clone nested arrays
    if (clonedCondition.countries && Array.isArray(clonedCondition.countries)) {
      clonedCondition.countries = [...clonedCondition.countries]
    }
    if (clonedCondition.cities && Array.isArray(clonedCondition.cities)) {
      clonedCondition.cities = [...clonedCondition.cities]
    }
    if (clonedCondition.regions && Array.isArray(clonedCondition.regions)) {
      clonedCondition.regions = [...clonedCondition.regions]
    }
    if (clonedCondition.devices && Array.isArray(clonedCondition.devices)) {
      clonedCondition.devices = [...clonedCondition.devices]
    }
    if (clonedCondition.systems && Array.isArray(clonedCondition.systems)) {
      clonedCondition.systems = [...clonedCondition.systems]
    }
    if (clonedCondition.browsers && Array.isArray(clonedCondition.browsers)) {
      clonedCondition.browsers = [...clonedCondition.browsers]
    }
    if (clonedCondition.days && Array.isArray(clonedCondition.days)) {
      clonedCondition.days = [...clonedCondition.days]
    }
    
    // Create new rule with cloned condition
    const clone: SmartLinkRuleForm = {
      uid: createUid(),
      targetUrl: rule.targetUrl || '',
      conditionType: rule.conditionType,
      condition: clonedCondition,
      priority: (rules.value.length + 1) * 10,
      isActive: rule.isActive,
    }
    
    // Add to rules array
    rules.value.push(clone)
    updatePriorities()
    
    // Expand the new rule so user can see it
    expandedRules.value.add(clone.uid)
    
    toaster.add({
      title: 'Rule duplicated',
      description: 'The rule has been duplicated successfully',
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })
  } catch (error: any) {
    console.error('Error duplicating rule:', error)
    toaster.add({
      title: 'Error',
      description: error?.message || 'Failed to duplicate rule',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
  }
}

const moveRuleUp = (index: number) => {
  if (index > 0) {
    const temp = rules.value[index]
    rules.value[index] = rules.value[index - 1]
    rules.value[index - 1] = temp
    updatePriorities()
  }
}

const moveRuleDown = (index: number) => {
  if (index < rules.value.length - 1) {
    const temp = rules.value[index]
    rules.value[index] = rules.value[index + 1]
    rules.value[index + 1] = temp
    updatePriorities()
  }
}

const updatePriorities = () => {
  rules.value.forEach((rule, index) => {
    rule.priority = (index + 1) * 10
  })
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
  
  // Validate fallback URL
  if (!formData.value.fallbackUrl.trim()) {
    errors.value.fallbackUrl = 'Enter a fallback destination URL'
    return false
  }
  
  if (!validateUrl(formData.value.fallbackUrl)) {
    errors.value.fallbackUrl = 'Enter a valid HTTP or HTTPS URL'
    return false
  }
  
  // Only validate active rules
  const activeRules = rules.value.filter(rule => rule.isActive)
  
  // If all rules are inactive, only name and fallback are required
  if (activeRules.length === 0) {
    delete errors.value.rules
    delete errors.value.fallbackUrl
    return true
  }
  
  // If we have active rules, we need at least one rule
  if (!rules.value.length) {
    errors.value.rules = 'Add at least one routing rule'
    return false
  }
  
  for (const [index, rule] of rules.value.entries()) {
    // Skip validation for inactive rules
    if (!rule.isActive) {
      continue
    }
    
    if (!rule.targetUrl.trim()) {
      errors.value.rules = `Rule ${index + 1}: enter a destination URL`
      return false
    }
    
    if (!validateUrl(rule.targetUrl)) {
      errors.value.rules = `Rule ${index + 1}: enter a valid HTTP or HTTPS URL`
      return false
    }
    
    if (!validateRuleCondition(rule)) {
      return false
    }
  }
  delete errors.value.rules
  delete errors.value.fallbackUrl
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
    case 'GeoRegion': {
      const country = rule.condition.country
      const cities = rule.condition.cities ?? []
      const regions = rule.condition.regions ?? []
      if (!country || !cities.length) {
        errors.value.rules = 'Select country and cities for region-based rules'
        return false
      }
      // Check if there are available regions from selected cities
      const availableRegions = getAvailableRegions(country, cities)
      if (availableRegions.length === 0) {
        errors.value.rules = 'No regions available from selected cities. Please select cities that have regions.'
        return false
      }
      if (!regions.length) {
        errors.value.rules = 'Select at least one region from the available regions'
        return false
      }
      return true
    }
    case 'DeviceType': {
      const devices = rule.condition.devices ?? []
      if (!devices.length) {
        errors.value.rules = 'Select at least one device type'
        return false
      }
      return true
    }
    case 'OperatingSystem': {
      const systems = rule.condition.systems ?? []
      if (!systems.length) {
        errors.value.rules = 'Select operating systems to target'
        return false
      }
      return true
    }
    case 'Browser': {
      const browsers = rule.condition.browsers ?? []
      if (!browsers.length) {
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

  if (formData.value.visibility === 'private') {
    if (formData.value.visibilityRoles.length === 0 && formData.value.visibilityMemberIds.length === 0) {
      errors.value.visibility = 'Select at least one role or member to access this SmartLink'
      return false
    }
  }

  return true
}

const validateStep3 = () => {
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

const validateStep4 = () => {
  errors.value = {}
  if (!formData.value.domainType) {
    errors.value.domain = 'Pick a domain'
    return false
  }
  return true
}

const validateStep5 = () => {
  if (formData.value.customAlias && formData.value.customAlias.length < 3) {
    errors.value.customAlias = 'Alias should be at least 3 characters'
    return false
  }
  return true
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
  if (currentStep.value === 5 && !validateStep5()) {
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


const submitSmartLink = async () => {
  if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4() || !validateStep5()) {
    return
  }

  // Filter active rules
  const activeRules = rules.value
    .filter(rule => rule.isActive && rule.targetUrl.trim())
    .map(rule => ({
      targetUrl: rule.targetUrl.trim(),
      conditionType: rule.conditionType,
      condition: cleanRuleCondition(rule),
      priority: rule.priority,
      isActive: rule.isActive,
    }))

  const request: CreateSmartLinkRequest = {
    name: formData.value.name.trim(),
    description: formData.value.description?.trim() || null,
    domainType: formData.value.domainType || 'default',
    domainValue: formData.value.domainValue,
    customAlias: formData.value.customAlias?.trim() || null,
    fallbackUrl: formData.value.fallbackUrl.trim() || null,
    isOneTime: formData.value.isOneTime,
    expiresAt: formData.value.expiresAt ? new Date(formData.value.expiresAt).toISOString() : null,
    clickLimit: formData.value.clickLimit,
    password: formData.value.hasPassword ? formData.value.password : null,
    collectionIds: formData.value.collectionIds.length ? formData.value.collectionIds : null,
    rules: activeRules,
    pixelEvents: formData.value.pixelEvents.length > 0 ? formData.value.pixelEvents.filter(p => p.pixelId.trim()) : null,
    webhookUrl: formData.value.webhookUrl?.trim() || null,
    webhookMethod: formData.value.webhookUrl ? (formData.value.webhookMethod || 'POST') : null,
    webhookHeaders: formData.value.webhookUrl && Object.keys(formData.value.webhookHeaders).length > 0 ? formData.value.webhookHeaders : null,
    webhookBodyTemplate: formData.value.webhookUrl && formData.value.webhookBodyTemplate?.trim() ? formData.value.webhookBodyTemplate.trim() : null,
    visibility: formData.value.visibility,
    visibilityRoles: formData.value.visibility === 'private' && formData.value.visibilityRoles.length > 0 ? formData.value.visibilityRoles : undefined,
    visibilityMemberIds: formData.value.visibility === 'private' && formData.value.visibilityMemberIds.length > 0 ? formData.value.visibilityMemberIds : undefined,
  }

  isSubmitting.value = true
  try {
    const result = await createSmartLink(request)
    if (result) {
      createdResult.value = result
      currentStep.value = totalSteps
      emit('created', result)
    }
  } catch (error: any) {
    console.error('[SmartLinkWizard] Create error:', error)
    toaster.add({
      title: 'Error',
      description: error?.message || 'Failed to create SmartLink',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
  } finally {
    isSubmitting.value = false
  }
}

const cleanRuleCondition = (rule: SmartLinkRuleForm) => {
  const clone = { ...rule.condition }
  
  // Remove UI-only fields
  delete clone.search
  delete clone.citySearch
  
  // Ensure arrays are not undefined (convert to empty array if needed)
  if (clone.countries && !Array.isArray(clone.countries)) {
    clone.countries = []
  }
  if (clone.cities && !Array.isArray(clone.cities)) {
    clone.cities = []
  }
  if (clone.regions && !Array.isArray(clone.regions)) {
    clone.regions = []
  }
  if (clone.devices && !Array.isArray(clone.devices)) {
    clone.devices = []
  }
  if (clone.systems && !Array.isArray(clone.systems)) {
    clone.systems = []
  }
  if (clone.browsers && !Array.isArray(clone.browsers)) {
    clone.browsers = []
  }
  if (clone.days && !Array.isArray(clone.days)) {
    clone.days = []
  }
  
  // For GeoRegion, keep only regions (not cities or country) in the final condition
  if (rule.conditionType === 'GeoRegion') {
    const { country, cities, citySearch, ...rest } = clone
    return { 
      regions: Array.isArray(rest.regions) ? rest.regions : []
    }
  }
  
  // For GeoCity, keep only cities (not country or citySearch)
  if (rule.conditionType === 'GeoCity') {
    const { country, citySearch, ...rest } = clone
    return rest
  }
  
  // For GeoCountry, keep only countries (not search)
  if (rule.conditionType === 'GeoCountry') {
    const { search, ...rest } = clone
    return rest
  }
  
  return clone
}

const resetWizard = () => {
  currentStep.value = 1
  createdResult.value = null
  isSubmitting.value = false
  formData.value = {
    name: '',
    fallbackUrl: '',
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
    visibility: 'public',
    visibilityRoles: [],
    visibilityMemberIds: [],
    pixelEvents: [],
    webhookUrl: '',
    webhookMethod: 'POST',
    webhookHeaders: {},
    webhookBodyTemplate: '',
  }
  rules.value = [createRule()]
  errors.value = {}
  memberSearch.value = ''
  expandedRules.value = new Set()
  updatePriorities()
}

const handleClose = () => {
  isOpen.value = false
}

const copyLink = async () => {
  if (!createdResult.value?.shortUrl) return
  
  try {
    await navigator.clipboard.writeText(createdResult.value.shortUrl)
    toaster.add({
      title: 'Copied!',
      description: 'SmartLink copied to clipboard',
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })
  } catch (error) {
    console.error('Failed to copy link:', error)
    toaster.add({
      title: 'Error',
      description: 'Failed to copy link to clipboard',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
  }
}

const downloadQRCode = () => {
  if (!createdResult.value?.shortUrl) return
  
  const qrUrl = getQRCodeUrl(createdResult.value.shortUrl, 300)
  const linkElement = document.createElement('a')
  linkElement.href = qrUrl
  linkElement.download = `smartlink-qrcode-${createdResult.value.id}.png`
  linkElement.click()
}

const shareToSocial = (platform: string) => {
  if (!createdResult.value?.shortUrl) return
  const text = `Check out this SmartLink: ${createdResult.value.shortUrl}`
  let url = ''
  
  switch (platform) {
    case 'twitter':
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
      break
    case 'facebook':
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(createdResult.value.shortUrl)}`
      break
    case 'linkedin':
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(createdResult.value.shortUrl)}`
      break
    case 'whatsapp':
      url = `https://wa.me/?text=${encodeURIComponent(text)}`
      break
    case 'telegram':
      url = `https://t.me/share/url?url=${encodeURIComponent(createdResult.value.shortUrl)}&text=${encodeURIComponent(text)}`
      break
  }
  
  if (url) {
    window.open(url, '_blank', 'width=600,height=400')
  }
}

const getDomainDisplay = (domainType: string, domainValue: string | null) => {
  if (domainType === 'default') return 'snap.ly'
  if (domainType === 'subdomain') return domainValue || 'subdomain'
  if (domainType === 'custom') return domainValue || 'custom domain'
  return domainValue || 'unknown'
}

const activeRulesCount = computed(() => {
  return rules.value.filter(rule => rule.isActive && rule.targetUrl.trim()).length
})

const selectedCollectionsCount = computed(() => {
  return formData.value.collectionIds.length
})

// Close dropdowns when clicking outside
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('.relative')) {
      openCityDropdowns.value.clear()
      openRegionDropdowns.value.clear()
    }
  }
  document.addEventListener('click', handleClickOutside)
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
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
            
            <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
              <TairoFormGroup
                label="SmartLink name"
                :error="errors.name"
                class="md:col-span-1"
              >
                <TairoInput
                  v-model="formData.name"
                  placeholder="e.g. Holiday blend promo"
                  rounded="lg"
                  size="sm"
                />
              </TairoFormGroup>

              <TairoFormGroup label="Fallback destination" :error="errors.fallbackUrl" class="md:col-span-3">
                <div class="flex items-center gap-2">
                  <div class="flex-1 min-w-0">
                    <TairoInput
                      v-model="formData.fallbackUrl"
                      placeholder="Enter fallback URL (e.g., https://example.com)"
                      rounded="lg"
                      size="sm"
                      class="w-full"
                    />
                  </div>
                  <BaseTooltip content="The URL used when no rules match. Must be a valid HTTP or HTTPS URL.">
                    <button
                      type="button"
                      class="flex items-center justify-center size-5 rounded-full bg-muted-100 dark:bg-muted-800 hover:bg-muted-200 dark:hover:bg-muted-700 transition-colors shrink-0"
                    >
                      <Icon name="lucide:help-circle" class="size-3.5 text-muted-500 dark:text-muted-400" />
                    </button>
                  </BaseTooltip>
                </div>
              </TairoFormGroup>
            </div>

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

            <div class="space-y-3">
              <BaseCard
                v-for="(rule, index) in rules"
                :key="rule.uid"
                class="border border-muted-200 dark:border-muted-800 overflow-hidden"
              >
                <!-- Accordion Header -->
                <div class="flex items-center gap-3 px-4 py-3 hover:bg-muted-50 dark:hover:bg-muted-800/50 transition-colors">
                  <!-- Move Buttons -->
                  <div class="flex flex-col gap-1 shrink-0">
                    <BaseButton
                      variant="ghost"
                      size="xs"
                      class="p-1 h-6 w-6"
                      :disabled="index === 0"
                      @click.stop="moveRuleUp(index)"
                    >
                      <Icon name="lucide:chevron-up" class="size-4" />
                    </BaseButton>
                    <BaseButton
                      variant="ghost"
                      size="xs"
                      class="p-1 h-6 w-6"
                      :disabled="index === rules.length - 1"
                      @click.stop="moveRuleDown(index)"
                    >
                      <Icon name="lucide:chevron-down" class="size-4" />
                    </BaseButton>
                  </div>
                    
                    <!-- Rule Info -->
                    <div
                      class="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                      @click.stop="toggleRuleExpanded(rule.uid)"
                    >
                      <div class="text-sm font-semibold text-muted-900 dark:text-white">
                        Rule {{ rules.indexOf(rule) + 1 }}
                      </div>
                      <BaseTag
                        v-if="rule.conditionType"
                        size="xs"
                        variant="pastel"
                        color="primary"
                      >
                        {{ conditionTypeOptions.find(opt => opt.value === rule.conditionType)?.label }}
                      </BaseTag>
                      <BaseTag
                        v-if="rule.targetUrl"
                        size="xs"
                        variant="solid"
                        color="muted"
                      >
                        Destination set
                      </BaseTag>
                    </div>
                    
                    <!-- Actions -->
                    <div class="flex items-center gap-2 shrink-0">
                      <BaseSwitchBall
                        v-model="rule.isActive"
                        variant="primary"
                        @click.stop
                      />
                      <Icon
                        name="lucide:chevron-down"
                        class="size-4 text-muted-400 transition-transform duration-200 cursor-pointer"
                        :class="{ 'rotate-180': isRuleExpanded(rule.uid) }"
                        @click="toggleRuleExpanded(rule.uid)"
                      />
                    </div>
                  </div>

                  <!-- Accordion Content -->
                  <div
                    v-show="isRuleExpanded(rule.uid)"
                    class="space-y-5 p-5 border-t border-muted-200 dark:border-muted-800 bg-muted-50/50 dark:bg-muted-900/30"
                  >
                    <!-- Main Fields -->
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-start">
                      <TairoFormGroup label="Condition type" class="md:col-span-1">
                        <TairoSelect
                          v-model="rule.conditionType"
                          class="w-full"
                          size="sm"
                          @update:model-value="rule.condition = createConditionTemplate(rule.conditionType)"
                        >
                          <BaseSelectItem
                            v-for="option in conditionTypeOptions"
                            :key="option.value"
                            :value="option.value"
                          >
                            {{ option.label }}
                          </BaseSelectItem>
                        </TairoSelect>
                      </TairoFormGroup>

                      <TairoFormGroup label="Destination URL" class="md:col-span-3">
                        <div class="flex items-center gap-2">
                          <div class="flex-1 min-w-0">
                            <TairoInput
                              v-model="rule.targetUrl"
                              placeholder="Enter destination URL (e.g., https://example.com)"
                              rounded="lg"
                              size="sm"
                              class="w-full"
                            />
                          </div>
                          <BaseTooltip content="The target URL for this rule. Must be a valid HTTP or HTTPS URL.">
                            <button
                              type="button"
                              class="flex items-center justify-center size-5 rounded-full bg-muted-100 dark:bg-muted-800 hover:bg-muted-200 dark:hover:bg-muted-700 transition-colors shrink-0"
                            >
                              <Icon name="lucide:help-circle" class="size-3.5 text-muted-500 dark:text-muted-400" />
                            </button>
                          </BaseTooltip>
                        </div>
                      </TairoFormGroup>
                    </div>

                    <!-- Priority Info -->
                    <div class="flex items-center gap-2 text-xs text-muted-500 bg-muted-100 dark:bg-muted-800/50 rounded-lg px-3 py-2">
                      <BaseTooltip content="Priority is based on order: Rules are evaluated from top to bottom. Lower priority numbers are checked first.">
                        <button
                          type="button"
                          class="flex items-center justify-center size-4 rounded-full bg-white dark:bg-muted-700 hover:bg-muted-100 dark:hover:bg-muted-600 transition-colors"
                        >
                          <Icon name="lucide:help-circle" class="size-3 text-muted-500 dark:text-muted-400" />
                        </button>
                      </BaseTooltip>
                      <span>Priority: {{ rule.priority }} (evaluated in order from top to bottom)</span>
                    </div>

                    <!-- Condition-specific fields -->
                    <div v-if="rule.conditionType === 'GeoCountry'" class="space-y-3">
                      <TairoFormGroup label="Filter countries">
                        <TairoInput
                          v-model="rule.condition.search"
                          placeholder="Search country"
                          rounded="lg"
                          size="sm"
                        />
                      </TairoFormGroup>
                      <div class="max-h-48 overflow-y-auto border border-muted-200 dark:border-muted-700 rounded-lg p-3 space-y-2 bg-white dark:bg-muted-800">
                        <label
                          v-for="country in filteredCountries(rule.condition.search)"
                          :key="country.code"
                          class="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted-50 dark:hover:bg-muted-700/50 p-2 rounded transition-colors"
                        >
                          <BaseCheckbox
                            :model-value="(rule.condition.countries || []).includes(country.code)"
                            @update:model-value="() => { if (!rule.condition.countries) rule.condition.countries = []; toggleArrayValue(rule.condition.countries, country.code) }"
                            @click.stop
                          />
                          <span class="flex-1">{{ country.name }}</span>
                          <span class="text-xs text-muted-400">{{ country.code }}</span>
                        </label>
                      </div>
                    </div>

                    <div v-else-if="rule.conditionType === 'GeoCity'" class="space-y-4">
                      <div class="grid grid-cols-2 gap-4">
                        <TairoFormGroup label="Country">
                          <TairoSelect v-model="rule.condition.country" rounded="lg" size="sm">
                            <BaseSelectItem
                              v-for="country in geoCountries"
                              :key="country.code"
                              :value="country.code"
                            >
                              {{ country.name }}
                            </BaseSelectItem>
                          </TairoSelect>
                        </TairoFormGroup>
                        <TairoFormGroup label="City">
                          <div class="relative">
                            <div class="pointer-events-none">
                              <TairoSelect
                                :model-value="(rule.condition.cities || []).length > 0 ? `${(rule.condition.cities || []).length} selected` : null"
                                rounded="lg"
                                size="sm"
                                :disabled="!rule.condition.country"
                              >
                                <BaseSelectItem :value="null">
                                  {{ (rule.condition.cities || []).length > 0 ? `${(rule.condition.cities || []).length} selected` : 'Select cities...' }}
                                </BaseSelectItem>
                              </TairoSelect>
                            </div>
                            <div
                              class="absolute inset-0 cursor-pointer"
                              @click.stop="openCityDropdowns.has(rule.uid) ? openCityDropdowns.delete(rule.uid) : openCityDropdowns.add(rule.uid)"
                            ></div>
                            <div
                              v-if="openCityDropdowns.has(rule.uid)"
                              class="absolute z-50 w-full mt-1 bg-white dark:bg-muted-800 border border-muted-200 dark:border-muted-700 rounded-lg shadow-lg"
                              @click.stop
                            >
                              <div class="max-h-48 overflow-y-auto p-2 space-y-1">
                                <label
                                  v-for="city in filteredCities(rule.condition.country, '')"
                                  :key="city.name"
                                  class="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted-50 dark:hover:bg-muted-700/50 p-2 rounded transition-colors"
                                >
                                  <BaseCheckbox
                                    :model-value="(rule.condition.cities || []).includes(city.name)"
                                    @update:model-value="() => { if (!rule.condition.cities) rule.condition.cities = []; toggleArrayValue(rule.condition.cities, city.name) }"
                                    @click.stop
                                  />
                                  <span class="flex-1">{{ city.name }}</span>
                                  <span v-if="city.region" class="text-xs text-muted-400">{{ city.region }}</span>
                                </label>
                                <div v-if="!filteredCities(rule.condition.country, '').length" class="text-xs text-muted-400 text-center py-4">
                                  {{ !rule.condition.country ? 'Select country first' : 'No cities available' }}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TairoFormGroup>
                      </div>
                    </div>

                    <div v-else-if="rule.conditionType === 'GeoRegion'" class="space-y-4">
                      <div class="grid grid-cols-3 gap-4">
                        <TairoFormGroup label="Country">
                          <TairoSelect v-model="rule.condition.country" rounded="lg" size="sm">
                            <BaseSelectItem
                              v-for="country in geoCountries"
                              :key="country.code"
                              :value="country.code"
                            >
                              {{ country.name }}
                            </BaseSelectItem>
                          </TairoSelect>
                        </TairoFormGroup>
                        <TairoFormGroup label="City">
                          <div class="relative">
                            <div class="pointer-events-none">
                              <TairoSelect
                                :model-value="(rule.condition.cities || []).length > 0 ? `${(rule.condition.cities || []).length} selected` : null"
                                rounded="lg"
                                size="sm"
                                :disabled="!rule.condition.country"
                              >
                                <BaseSelectItem :value="null">
                                  {{ (rule.condition.cities || []).length > 0 ? `${(rule.condition.cities || []).length} selected` : 'Select cities...' }}
                                </BaseSelectItem>
                              </TairoSelect>
                            </div>
                            <div
                              class="absolute inset-0 cursor-pointer"
                              @click.stop="openCityDropdowns.has(rule.uid) ? openCityDropdowns.delete(rule.uid) : openCityDropdowns.add(rule.uid)"
                            ></div>
                            <div
                              v-if="openCityDropdowns.has(rule.uid)"
                              class="absolute z-50 w-full mt-1 bg-white dark:bg-muted-800 border border-muted-200 dark:border-muted-700 rounded-lg shadow-lg"
                              @click.stop
                            >
                              <div class="max-h-48 overflow-y-auto p-2 space-y-1">
                                <label
                                  v-for="city in filteredCities(rule.condition.country, '')"
                                  :key="city.name"
                                  class="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted-50 dark:hover:bg-muted-700/50 p-2 rounded transition-colors"
                                >
                                  <BaseCheckbox
                                    :model-value="(rule.condition.cities || []).includes(city.name)"
                                    @update:model-value="() => { if (!rule.condition.cities) rule.condition.cities = []; toggleArrayValue(rule.condition.cities, city.name) }"
                                    @click.stop
                                  />
                                  <span class="flex-1">{{ city.name }}</span>
                                  <span v-if="city.region" class="text-xs text-muted-400">{{ city.region }}</span>
                                </label>
                                <div v-if="!filteredCities(rule.condition.country, '').length" class="text-xs text-muted-400 text-center py-4">
                                  {{ !rule.condition.country ? 'Select country first' : 'No cities available' }}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TairoFormGroup>
                        <TairoFormGroup label="Region">
                          <div class="relative">
                            <div class="pointer-events-none">
                              <TairoSelect
                                :model-value="(rule.condition.regions || []).length > 0 ? `${(rule.condition.regions || []).length} selected` : null"
                                rounded="lg"
                                size="sm"
                                :disabled="!rule.condition.country || !(rule.condition.cities || []).length"
                              >
                                <BaseSelectItem :value="null">
                                  {{ (rule.condition.regions || []).length > 0 ? `${(rule.condition.regions || []).length} selected` : 'Select regions...' }}
                                </BaseSelectItem>
                              </TairoSelect>
                            </div>
                            <div
                              class="absolute inset-0 cursor-pointer"
                              @click.stop="openRegionDropdowns.has(rule.uid) ? openRegionDropdowns.delete(rule.uid) : openRegionDropdowns.add(rule.uid)"
                            ></div>
                            <div
                              v-if="openRegionDropdowns.has(rule.uid)"
                              class="absolute z-50 w-full mt-1 bg-white dark:bg-muted-800 border border-muted-200 dark:border-muted-700 rounded-lg shadow-lg"
                              @click.stop
                            >
                              <div class="max-h-48 overflow-y-auto p-2 space-y-1">
                                <template v-if="getAvailableRegions(rule.condition.country, rule.condition.cities || []).length > 0">
                                  <label
                                    v-for="region in getAvailableRegions(rule.condition.country, rule.condition.cities || [])"
                                    :key="region"
                                    class="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted-50 dark:hover:bg-muted-700/50 p-2 rounded transition-colors"
                                  >
                                    <BaseCheckbox
                                      :model-value="(rule.condition.regions || []).includes(region)"
                                      @update:model-value="() => { if (!rule.condition.regions) rule.condition.regions = []; toggleArrayValue(rule.condition.regions, region) }"
                                      @click.stop
                                    />
                                    <span class="flex-1">{{ region }}</span>
                                  </label>
                                </template>
                                <div v-else class="text-xs text-muted-400 text-center py-4">
                                  Select cities first to see available regions
                                </div>
                              </div>
                            </div>
                          </div>
                        </TairoFormGroup>
                      </div>
                    </div>

                    <div v-else-if="rule.conditionType === 'DeviceType'" class="space-y-3">
                      <div class="flex items-center gap-2">
                        <BaseParagraph size="xs" class="text-muted-500 font-medium">Select device types:</BaseParagraph>
                        <BaseTooltip content="Route based on device type (mobile, desktop, tablet)">
                          <button
                            type="button"
                            class="flex items-center justify-center size-4 rounded-full bg-muted-100 dark:bg-muted-800 hover:bg-muted-200 dark:hover:bg-muted-700 transition-colors"
                          >
                            <Icon name="lucide:help-circle" class="size-3 text-muted-500 dark:text-muted-400" />
                          </button>
                        </BaseTooltip>
                      </div>
                      <div class="grid grid-cols-3 gap-3">
                        <BaseCard
                          v-for="device in deviceOptions"
                          :key="device.value"
                          class="p-4 cursor-pointer transition-all hover:border-primary-500 dark:hover:border-primary-400"
                          :class="{ 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20': (rule.condition.devices || []).includes(device.value) }"
                          @click="() => { if (!rule.condition.devices) rule.condition.devices = []; toggleArrayValue(rule.condition.devices, device.value) }"
                        >
                          <div class="flex items-center gap-3">
                            <BaseCheckbox
                              :model-value="(rule.condition.devices || []).includes(device.value)"
                              @update:model-value="() => { if (!rule.condition.devices) rule.condition.devices = []; toggleArrayValue(rule.condition.devices, device.value) }"
                              @click.stop
                            />
                            <span class="text-sm font-medium">{{ device.label }}</span>
                          </div>
                        </BaseCard>
                      </div>
                    </div>

                    <div v-else-if="rule.conditionType === 'OperatingSystem'" class="space-y-3">
                      <BaseParagraph size="xs" class="text-muted-500 font-medium">Select operating systems:</BaseParagraph>
                      <div class="grid grid-cols-3 gap-3">
                        <BaseCard
                          v-for="system in osOptions"
                          :key="system"
                          class="p-4 cursor-pointer transition-all hover:border-primary-500 dark:hover:border-primary-400"
                          :class="{ 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20': (rule.condition.systems || []).includes(system) }"
                          @click="() => { if (!rule.condition.systems) rule.condition.systems = []; toggleArrayValue(rule.condition.systems, system) }"
                        >
                          <div class="flex items-center gap-3">
                            <BaseCheckbox
                              :model-value="(rule.condition.systems || []).includes(system)"
                              @update:model-value="() => { if (!rule.condition.systems) rule.condition.systems = []; toggleArrayValue(rule.condition.systems, system) }"
                              @click.stop
                            />
                            <span class="text-sm font-medium">{{ system }}</span>
                          </div>
                        </BaseCard>
                      </div>
                    </div>

                    <div v-else-if="rule.conditionType === 'Browser'" class="space-y-3">
                      <BaseParagraph size="xs" class="text-muted-500 font-medium">Select browsers:</BaseParagraph>
                      <div class="grid grid-cols-3 gap-3">
                        <BaseCard
                          v-for="browser in browserOptions"
                          :key="browser"
                          class="p-4 cursor-pointer transition-all hover:border-primary-500 dark:hover:border-primary-400"
                          :class="{ 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20': (rule.condition.browsers || []).includes(browser) }"
                          @click="() => { if (!rule.condition.browsers) rule.condition.browsers = []; toggleArrayValue(rule.condition.browsers, browser) }"
                        >
                          <div class="flex items-center gap-3">
                            <BaseCheckbox
                              :model-value="(rule.condition.browsers || []).includes(browser)"
                              @update:model-value="() => { if (!rule.condition.browsers) rule.condition.browsers = []; toggleArrayValue(rule.condition.browsers, browser) }"
                              @click.stop
                            />
                            <span class="text-sm font-medium">{{ browser }}</span>
                          </div>
                        </BaseCard>
                      </div>
                    </div>

                    <div v-else-if="rule.conditionType === 'Referrer'" class="space-y-3">
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

                    <div v-else-if="rule.conditionType === 'Schedule'" class="space-y-4">
                      <div class="flex items-center gap-2">
                        <BaseParagraph size="xs" class="text-muted-500 font-medium">Time-based routing:</BaseParagraph>
                        <BaseTooltip content="Route based on time and day of week">
                          <button
                            type="button"
                            class="flex items-center justify-center size-4 rounded-full bg-muted-100 dark:bg-muted-800 hover:bg-muted-200 dark:hover:bg-muted-700 transition-colors"
                          >
                            <Icon name="lucide:help-circle" class="size-3 text-muted-500 dark:text-muted-400" />
                          </button>
                        </BaseTooltip>
                      </div>
                      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <TairoFormGroup label="Time zone">
                          <TairoInput
                            v-model="rule.condition.timezone"
                            placeholder="UTC"
                            rounded="lg"
                            size="sm"
                          />
                        </TairoFormGroup>
                        <TairoFormGroup label="Start time">
                          <TairoInput
                            v-model="rule.condition.start"
                            type="time"
                            rounded="lg"
                            size="sm"
                          />
                        </TairoFormGroup>
                        <TairoFormGroup label="End time">
                          <TairoInput
                            v-model="rule.condition.end"
                            type="time"
                            rounded="lg"
                            size="sm"
                          />
                        </TairoFormGroup>
                      </div>
                      <div>
                        <BaseParagraph size="xs" class="text-muted-500 font-medium mb-2">Select days:</BaseParagraph>
                        <div class="flex flex-wrap gap-2">
                          <BaseButton
                            v-for="day in dayOptions"
                            :key="day"
                            size="xs"
                            :variant="(rule.condition.days || []).includes(day) ? 'solid' : 'outline'"
                            color="primary"
                            class="rounded-full"
                            @click="() => { if (!rule.condition.days) rule.condition.days = []; toggleArrayValue(rule.condition.days, day) }"
                          >
                            {{ day }}
                          </BaseButton>
                        </div>
                      </div>
                    </div>

                    <div v-else class="space-y-4">
                      <TairoFormGroup label="Expression">
                        <div class="flex items-center gap-2">
                          <textarea
                            v-model="rule.condition.expression"
                            rows="3"
                            placeholder='e.g. country == "US" && device == "mobile"'
                            class="flex-1 w-full px-4 py-3 rounded-lg border border-muted-300 dark:border-muted-600 bg-white dark:bg-muted-800 text-muted-800 dark:text-muted-100 placeholder:text-muted-400 dark:placeholder:text-muted-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200 resize-none"
                          />
                          <BaseTooltip content="Use custom expression to combine multiple conditions">
                            <button
                              type="button"
                              class="flex items-center justify-center size-5 rounded-full bg-muted-100 dark:bg-muted-800 hover:bg-muted-200 dark:hover:bg-muted-700 transition-colors shrink-0"
                            >
                              <Icon name="lucide:help-circle" class="size-3.5 text-muted-500 dark:text-muted-400" />
                            </button>
                          </BaseTooltip>
                        </div>
                      </TairoFormGroup>
                      <TairoFormGroup label="Notes">
                        <TairoInput
                          v-model="rule.condition.notes"
                          placeholder="Optional description"
                          rounded="lg"
                          size="sm"
                        />
                      </TairoFormGroup>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center justify-end gap-2 pt-3 border-t border-muted-200 dark:border-muted-700">
                      <BaseButton
                        variant="ghost"
                        size="sm"
                        @click="duplicateRule(rule)"
                      >
                        <Icon name="solar:copy-linear" class="size-4" />
                        Duplicate
                      </BaseButton>
                      <BaseButton
                        variant="ghost"
                        size="sm"
                        color="danger"
                        @click="removeRule(rule.uid)"
                      >
                        <Icon name="solar:trash-bin-trash-linear" class="size-4" />
                        Delete
                      </BaseButton>
                    </div>
                  </div>
                </BaseCard>
            </div>
          </div>

          <!-- Step 2: Visibility & Access -->
          <div v-else-if="currentStep === 2" class="space-y-6">
            <div>
              <BaseHeading
                as="h3"
                size="lg"
                weight="semibold"
                class="text-muted-800 dark:text-muted-100 mb-2"
              >
                Visibility & Access
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                Decide who can discover and manage this SmartLink inside your workspace
              </BaseParagraph>
            </div>

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
                  <div class="text-xs opacity-75">Anyone with the link can access it</div>
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
                  <div class="text-xs opacity-75">Restrict access to specific roles or teammates</div>
                </button>
              </div>
            </TairoFormGroup>

            <div v-if="formData.visibility === 'private'" class="space-y-6">
              <BaseCard class="p-5">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-800 dark:text-white">
                      Allow workspace roles
                    </BaseHeading>
                    <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                      Members with these roles can see and manage the SmartLink
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
                      Only selected members can view analytics or edit this SmartLink
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
                  <Icon
                    v-if="isLoadingMembers"
                    name="svg-spinners:ring-resize"
                    class="size-5 text-muted-400"
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
                    v-if="!filteredWorkspaceMembers.length && !isLoadingMembers"
                    class="p-4 text-center text-sm text-muted-500 dark:text-muted-400"
                  >
                    No teammates match your search
                  </div>
                </div>
              </BaseCard>

              <div v-if="errors.visibility" class="text-sm text-danger-600 dark:text-danger-400">
                {{ errors.visibility }}
              </div>

              <div
                v-if="selectedVisibilityRoleLabels.length || selectedMembers.length"
                class="space-y-2"
              >
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                  Currently visible to:
                </BaseParagraph>
                <div class="flex flex-wrap gap-2">
                  <BaseTag
                    v-for="role in selectedVisibilityRoleLabels"
                    :key="role"
                    size="sm"
                    variant="pastel"
                    color="primary"
                  >
                    Role · {{ role }}
                  </BaseTag>
                  <BaseTag
                    v-for="member in selectedMembers"
                    :key="member.id"
                    size="sm"
                    variant="pastel"
                    color="info"
                  >
                    {{ member.displayName }}
                  </BaseTag>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Limits & Security -->
          <div v-else-if="currentStep === 3" class="space-y-6">
            <div>
              <BaseHeading
                as="h3"
                size="lg"
                weight="semibold"
                class="text-muted-800 dark:text-muted-100 mb-2"
              >
                Limits & Security
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                Control link availability, lifetime, and access rules
              </BaseParagraph>
            </div>

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
                  <div class="text-xs opacity-75">Link expires after first visit</div>
                </button>
              </div>
            </TairoFormGroup>

            <TairoFormGroup
              v-if="formData.isOneTime"
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
                <div class="flex items-center gap-2">
                  <BaseTooltip content="Require a password before redirecting visitors to the destination link">
                    <button
                      type="button"
                      class="flex items-center justify-center size-5 rounded-full bg-muted-100 dark:bg-muted-800 hover:bg-muted-200 dark:hover:bg-muted-700 transition-colors"
                    >
                      <Icon name="lucide:help-circle" class="size-3.5 text-muted-500 dark:text-muted-400" />
                    </button>
                  </BaseTooltip>
                  <BaseSwitchBall v-model="formData.hasPassword" variant="primary" />
                </div>
              </div>

              <TairoInput
                v-if="formData.hasPassword"
                v-model="formData.password"
                type="password"
                placeholder="Set an access password"
                icon="solar:lock-password-linear"
                rounded="lg"
                :error="errors.password"
              />
            </BaseCard>

            <TairoFormGroup label="Click limit (optional)">
              <TairoInput
                v-model.number="formData.clickLimit"
                type="number"
                min="1"
                placeholder="e.g., 1000"
                icon="solar:mouse-linear"
                rounded="lg"
              />
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
                Link will be disabled automatically after reaching this limit
              </BaseParagraph>
            </TairoFormGroup>
          </div>

          <!-- Step 4: Domain Configuration -->
          <div v-else-if="currentStep === 4" class="space-y-6">
            <div>
              <BaseHeading
                as="h3"
                size="lg"
                weight="semibold"
                class="text-muted-800 dark:text-muted-100 mb-2"
              >
                Domain Configuration
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                Choose the domain visitors will see when they click your link
              </BaseParagraph>
            </div>

            <div class="space-y-4">
              <BaseParagraph size="sm" weight="medium" class="text-muted-600 dark:text-muted-300">
                Default domain
              </BaseParagraph>
              <BaseCard
                v-if="defaultDomainOption"
                class="p-4 border-2 transition-all cursor-pointer"
                :class="isDomainSelected(defaultDomainOption) ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20' : 'border-muted-200 dark:border-muted-700 hover:border-primary-300'"
                @click="selectDomainOption(defaultDomainOption)"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <BaseHeading as="h5" size="sm" weight="semibold">snap.ly</BaseHeading>
                    <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">Managed by Snaplink</BaseParagraph>
                  </div>
                  <Icon
                    v-if="isDomainSelected(defaultDomainOption)"
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
                v-if="workspaceSubdomains.length"
                class="grid gap-3 md:grid-cols-2"
              >
                <BaseCard
                  v-for="domain in workspaceSubdomains"
                  :key="domain.value"
                  class="p-4 border-2 transition-all cursor-pointer"
                  :class="isDomainSelected(domain) ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20' : 'border-muted-200 dark:border-muted-700 hover:border-primary-300'"
                  @click="selectDomainOption(domain)"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <BaseHeading as="h5" size="sm" weight="semibold">{{ domain.label }}</BaseHeading>
                      <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">Verified subdomain</BaseParagraph>
                    </div>
                    <Icon
                      v-if="isDomainSelected(domain)"
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
                No subdomains yet. Add one from workspace preferences.
              </div>
            </div>

            <div class="space-y-3">
              <BaseParagraph size="sm" weight="medium" class="text-muted-600 dark:text-muted-300">
                Workspace custom domains
              </BaseParagraph>
              <div
                v-if="workspaceCustomDomains.length"
                class="grid gap-3 md:grid-cols-2"
              >
                <BaseCard
                  v-for="domain in workspaceCustomDomains"
                  :key="domain.value"
                  class="p-4 border-2 transition-all cursor-pointer"
                  :class="isDomainSelected(domain) ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20' : 'border-muted-200 dark:border-muted-700 hover:border-primary-300'"
                  @click="selectDomainOption(domain)"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <BaseHeading as="h5" size="sm" weight="semibold">{{ domain.label }}</BaseHeading>
                      <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">Custom domain</BaseParagraph>
                    </div>
                    <Icon
                      v-if="isDomainSelected(domain)"
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
                No custom domains connected yet.
              </div>
            </div>

            <div v-if="errors.domain" class="text-sm text-danger-600 dark:text-danger-400">
              {{ errors.domain }}
            </div>
          </div>

          <!-- Step 5: Customize & Organize -->
          <div v-else-if="currentStep === 5" class="space-y-6">
            <div>
              <BaseHeading
                as="h3"
                size="lg"
                weight="semibold"
                class="text-muted-800 dark:text-muted-100 mb-2"
              >
                Customize & Organize
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                Add an alias, description, and categorize this SmartLink
              </BaseParagraph>
            </div>

            <TairoFormGroup label="Custom alias (optional)">
              <div class="flex items-center gap-2">
                <TairoInput
                  v-model="formData.customAlias"
                  placeholder="my-campaign-link"
                  icon="solar:pen-linear"
                  rounded="lg"
                  class="flex-1"
                  :error="errors.customAlias"
                />
                <BaseTooltip content="Custom name in the URL instead of auto-generated code">
                  <button
                    type="button"
                    class="flex items-center justify-center size-5 rounded-full bg-muted-100 dark:bg-muted-800 hover:bg-muted-200 dark:hover:bg-muted-700 transition-colors"
                  >
                    <Icon name="lucide:help-circle" class="size-3.5 text-muted-500 dark:text-muted-400" />
                  </button>
                </BaseTooltip>
              </div>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
                Leave empty to generate automatically
              </BaseParagraph>
            </TairoFormGroup>

            <TairoFormGroup label="Description (optional)">
              <textarea
                v-model="formData.description"
                placeholder="Add a helpful note for your team"
                rows="3"
                class="w-full px-4 py-3 rounded-lg border border-muted-300 dark:border-muted-600 bg-white dark:bg-muted-800 text-muted-800 dark:text-muted-100 placeholder:text-muted-400 dark:placeholder:text-muted-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200 resize-none"
              />
            </TairoFormGroup>

            <TairoFormGroup label="Collections (optional)">
              <div class="space-y-2 max-h-48 overflow-y-auto border border-muted-200 dark:border-muted-700 rounded-lg p-3">
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
                    @update:model-value="() => toggleCollection(collection.id)"
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
                  No collections available. Create one first.
                </div>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                  Use collections to organize campaigns, clients, or channels
                </BaseParagraph>
                <BaseTooltip content="Organize links into collections for better management of campaigns, clients, or channels">
                  <button
                    type="button"
                    class="flex items-center justify-center size-5 rounded-full bg-muted-100 dark:bg-muted-800 hover:bg-muted-200 dark:hover:bg-muted-700 transition-colors"
                  >
                    <Icon name="lucide:help-circle" class="size-3.5 text-muted-500 dark:text-muted-400" />
                  </button>
                </BaseTooltip>
              </div>
            </TairoFormGroup>
          </div>

          <!-- Step 6: Pixel Events & Webhooks -->
          <div v-else-if="currentStep === 6" class="space-y-6">
            <div>
              <BaseHeading as="h3" size="lg" weight="semibold">
                Pixel Events & Webhooks
              </BaseHeading>
              <BaseParagraph size="sm">
                Configure tracking pixels and webhooks to monitor link performance.
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

          <!-- Step 7: Success -->
          <div v-else-if="currentStep === 7" class="space-y-6">
            <div class="text-center space-y-4">
              <Icon name="ph:confetti-duotone" class="mx-auto size-12 text-success-500" />
              <BaseHeading as="h3" size="lg" weight="semibold">
                SmartLink ready
              </BaseHeading>
              <BaseParagraph size="sm">
                Share this dynamic link anywhere.
              </BaseParagraph>
              <div class="inline-flex items-center gap-3 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-primary-700 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-400">
                <Icon name="solar:link-linear" class="size-4" />
                <span>{{ createdResult?.shortUrl }}</span>
              </div>
            </div>

            <div v-if="createdResult?.shortUrl" class="flex flex-col gap-4 md:flex-row">
              <!-- QR Code Section -->
              <div class="flex-1 rounded-2xl border border-muted-200 bg-white/70 p-5 dark:border-muted-700/60 dark:bg-muted-900/40">
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-3">
                  QR code
                </BaseText>
                <div class="flex items-center justify-center rounded-xl border border-dashed border-primary-200 bg-primary-50/40 p-6 dark:border-primary-900/40 dark:bg-primary-900/20">
                  <img
                    :src="getQRCodeUrl(createdResult.shortUrl, 300)"
                    alt="QR code"
                    class="size-48 rounded-lg border border-white dark:border-muted-700 shadow-sm"
                  >
                </div>
                <div class="mt-3 flex items-center gap-2">
                  <BaseButton
                    size="sm"
                    variant="outline"
                    class="flex-1"
                    @click="copyLink"
                  >
                    <Icon name="ph:share-network" class="size-4" />
                    Copy Link
                  </BaseButton>
                  <BaseButton
                    size="sm"
                    variant="primary"
                    class="flex-1"
                    @click="downloadQRCode"
                  >
                    <Icon name="ph:download" class="size-4" />
                    Download QR
                  </BaseButton>
                </div>
              </div>

              <!-- Link Details Section -->
              <div class="flex-1 rounded-2xl border border-muted-200 bg-white/70 p-5 dark:border-muted-700/60 dark:bg-muted-900/40">
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400 mb-3">
                  Link details
                </BaseText>
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                      Name
                    </BaseText>
                    <BaseText size="xs" weight="medium" class="text-muted-800 dark:text-muted-100">
                      {{ formData.name || 'Untitled SmartLink' }}
                    </BaseText>
                  </div>
                  <div class="flex items-center justify-between">
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                      Short URL
                    </BaseText>
                    <BaseText size="xs" weight="medium" class="text-muted-800 dark:text-muted-100 font-mono truncate max-w-[200px]" :title="createdResult.shortUrl">
                      {{ createdResult.shortUrl }}
                    </BaseText>
                  </div>
                  <div class="flex items-center justify-between">
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                      Fallback URL
                    </BaseText>
                    <BaseText size="xs" weight="medium" class="text-muted-800 dark:text-muted-100 truncate max-w-[200px]" :title="formData.fallbackUrl">
                      {{ formData.fallbackUrl || 'Not set' }}
                    </BaseText>
                  </div>
                  <div class="flex items-center justify-between">
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                      Domain
                    </BaseText>
                    <BaseText size="xs" weight="medium" class="text-muted-800 dark:text-muted-100">
                      {{ getDomainDisplay(formData.domainType, formData.domainValue) }}
                    </BaseText>
                  </div>
                  <div class="flex items-center justify-between">
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                      Rules
                    </BaseText>
                    <BaseText size="xs" weight="medium" class="text-muted-800 dark:text-muted-100">
                      {{ activeRulesCount }} active
                    </BaseText>
                  </div>
                  <div class="flex items-center justify-between">
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                      Collections
                    </BaseText>
                    <BaseText size="xs" weight="medium" class="text-muted-800 dark:text-muted-100">
                      {{ selectedCollectionsCount || 'None' }}
                    </BaseText>
                  </div>
                  <div class="flex items-center justify-between">
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                      Visibility
                    </BaseText>
                    <BaseTag size="xs" :variant="formData.visibility === 'public' ? 'solid' : 'pastel'" :color="formData.visibility === 'public' ? 'success' : 'primary'">
                      {{ formData.visibility === 'public' ? 'Public' : 'Private' }}
                    </BaseTag>
                  </div>
                  <div v-if="formData.isOneTime || formData.expiresAt" class="flex items-center justify-between">
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                      Expiration
                    </BaseText>
                    <BaseText size="xs" weight="medium" class="text-muted-800 dark:text-muted-100">
                      {{ formData.isOneTime ? 'One-time use' : (formData.expiresAt ? new Date(formData.expiresAt).toLocaleString() : 'Never') }}
                    </BaseText>
                  </div>
                  <div v-if="formData.hasPassword" class="flex items-center justify-between">
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                      Password
                    </BaseText>
                    <BaseTag size="xs" variant="solid" color="warning">
                      Protected
                    </BaseTag>
                  </div>
                </div>
              </div>
            </div>

            <!-- Share Buttons Section -->
            <div v-if="createdResult?.shortUrl" class="rounded-2xl border border-muted-200 bg-white/70 p-5 dark:border-muted-700/60 dark:bg-muted-900/40">
              <div class="flex items-center gap-3 mb-4">
                <Icon name="solar:share-linear" class="size-5 text-primary-600 dark:text-primary-400" />
                <BaseText size="sm" weight="medium" class="text-muted-600 dark:text-muted-300">
                  Share on Social Media
                </BaseText>
              </div>
              <div class="flex flex-wrap gap-2">
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



