<script setup lang="ts">
import { computed, ref, watch, onMounted } from '#imports'
import type { UpdateSmartLinkRequest, SmartLink, SmartLinkConditionType, CreateSmartLinkRuleInput } from '~/types/url-shortener'
import { useSmartLinks } from '~/composables/useSmartLinks'
import { useUrlShortenerCollections } from '~/composables/useUrlShortenerCollections'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import { useWorkspaceDomains } from '~/composables/useWorkspaceDomains'
import { useWorkspaceMembers } from '~/composables/useWorkspaceMembers'
import SearchableCheckboxList from '~/components/url-shortener/SearchableCheckboxList.vue'

definePageMeta({
  title: 'Edit SmartLink',
  layout: 'dashboard',
})

const createUid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

const cloneCondition = (condition: Record<string, any>) => {
  return JSON.parse(JSON.stringify(condition))
}

const route = useRoute()
const router = useRouter()
const toaster = useNuiToasts()

const { workspaceId } = useWorkspaceContext()
const { getSmartLink, updateSmartLink } = useSmartLinks()
const { items: collectionsItems, fetchCollections } = useUrlShortenerCollections()
const { domainOptions, fetchDomains } = useWorkspaceDomains()
const { members: workspaceMembers, fetchMembers: fetchWorkspaceMembers, isLoading: isLoadingMembers } = useWorkspaceMembers()

const smartLinkId = computed(() => route.params.id as string)
const isLoading = ref(false)
const isSaving = ref(false)
const smartLink = ref<SmartLink | null>(null)
const existingPassword = ref(false)

type SmartLinkRuleForm = {
  uid: string
  targetUrl: string
  conditionType: SmartLinkConditionType
  condition: Record<string, any>
  priority: number
  isActive: boolean
}

const tabs = [
  { key: 'basics', label: 'Basics', description: 'Name, URL & description' },
  { key: 'rules', label: 'Routing Rules', description: 'Condition-based routing' },
  { key: 'collections', label: 'Collections', description: 'Organize links' },
  { key: 'visibility', label: 'Visibility', description: 'Roles & teammates' },
  { key: 'limits', label: 'Limits', description: 'Security & expiration' },
  { key: 'domain', label: 'Domain', description: 'Domain & alias' },
  { key: 'pixels', label: 'Pixels & Webhooks', description: 'Tracking & events' },
]
const activeTab = ref(tabs[0].key)

const errors = ref<Record<string, string>>({})
const expandedRules = ref<Set<string>>(new Set())
const showPassword = ref(false)

const formData = ref({
  name: '',
  fallbackUrl: '',
  customAlias: '',
  description: '',
  isOneTime: false,
  expiresAt: null as string | null,
  clickLimit: null as number | null,
  hasPassword: false,
  password: '',
  domainType: 'default',
  domainValue: null as string | null,
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

const rules = ref<SmartLinkRuleForm[]>([])

// Geo data and options (same as wizard)
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

const osOptions = ['iOS', 'Android', 'Windows', 'macOS', 'Linux']
const browserOptions = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera']

const dayOptions = [
  { value: 'Mon', label: 'Monday' },
  { value: 'Tue', label: 'Tuesday' },
  { value: 'Wed', label: 'Wednesday' },
  { value: 'Thu', label: 'Thursday' },
  { value: 'Fri', label: 'Friday' },
  { value: 'Sat', label: 'Saturday' },
  { value: 'Sun', label: 'Sunday' },
]

const timezoneOptions = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'EST/EDT (Eastern Time)' },
  { value: 'America/Chicago', label: 'CST/CDT (Central Time)' },
  { value: 'America/Denver', label: 'MST/MDT (Mountain Time)' },
  { value: 'America/Los_Angeles', label: 'PST/PDT (Pacific Time)' },
  { value: 'Europe/London', label: 'GMT/BST (London)' },
  { value: 'Europe/Paris', label: 'CET/CEST (Paris)' },
  { value: 'Asia/Dubai', label: 'GST (Dubai)' },
  { value: 'Asia/Kolkata', label: 'IST (India)' },
  { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
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
        countrySearch: '',
        citySearch: '',
        regionSearch: ''
      }
    case 'GeoCity':
      return { country: null as string | null, cities: [] as string[], countrySearch: '', citySearch: '' }
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

const createRule = (type: SmartLinkConditionType = 'GeoCountry'): SmartLinkRuleForm => ({
  uid: createUid(),
  targetUrl: '',
  conditionType: type,
  condition: createConditionTemplate(type),
  priority: (rules.value.length + 1) * 10,
  isActive: false,
})

const countryItems = computed(() => {
  return geoCountries.value.map(country => ({
    value: country.code,
    label: country.name,
    subtitle: country.code,
  }))
})

const getCityItems = (countryCode: string | null) => {
  if (!countryCode) return []
  const country = geoCountries.value.find(c => c.code === countryCode)
  if (!country) return []
  return country.cities.map(city => ({
    value: city.name,
    label: city.name,
    subtitle: city.region || undefined,
  }))
}

const getAvailableRegions = (countryCode: string | null, selectedCityNames: string[]) => {
  if (!countryCode || !selectedCityNames.length) return []
  const country = geoCountries.value.find(country => country.code === countryCode)
  if (!country) return []
  const selectedCities = country.cities.filter(city => selectedCityNames.includes(city.name))
  const regions = new Set(selectedCities.map(city => city.region).filter(Boolean))
  return Array.from(regions) as string[]
}

const getRegionItems = (countryCode: string | null, selectedCityNames: string[]) => {
  const regions = getAvailableRegions(countryCode, selectedCityNames)
  return regions.map(region => ({
    value: region,
    label: region,
  }))
}

const toggleArrayValue = (array: string[] | undefined, value: string): string[] => {
  if (!array) array = []
  const index = array.indexOf(value)
  if (index > -1) {
    array.splice(index, 1)
  } else {
    array.push(value)
  }
  return array
}

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

const addRule = () => {
  rules.value.push(createRule())
  updatePriorities()
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

const duplicateRule = (rule: SmartLinkRuleForm) => {
  try {
    const clonedCondition = cloneCondition(rule.condition)
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
    const clone: SmartLinkRuleForm = {
      uid: createUid(),
      targetUrl: rule.targetUrl || '',
      conditionType: rule.conditionType,
      condition: clonedCondition,
      priority: (rules.value.length + 1) * 10,
      isActive: rule.isActive,
    }
    rules.value.push(clone)
    updatePriorities()
    expandedRules.value.add(clone.uid)
    toaster.add({
      title: 'Rule duplicated',
      description: 'The rule has been duplicated successfully',
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })
  } catch (error: any) {
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

const validateUrl = (url: string): boolean => {
  if (!url.trim()) return false
  try {
    const uri = new URL(url)
    return uri.protocol === 'http:' || uri.protocol === 'https:'
  } catch {
    return false
  }
}

const formatDateTimeLocal = (isoString: string | null | undefined): string | null => {
  if (!isoString) return null
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return null
  const pad = (value: number) => value.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const toIsoString = (value: string | null | undefined): string | null => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const collectionOptions = computed(() => {
  return collectionsItems.value.map(collection => ({
    id: collection.id,
    name: collection.name,
  }))
})

const domains = computed(() => {
  const defaultDomain = { value: 'snap.ly', label: 'snap.ly', domainType: 'default', domainValue: null }
  return [defaultDomain, ...domainOptions.value]
})

const workspaceSubdomains = computed(() => domainOptions.value.filter(domain => domain.domainType === 'subdomain'))
const workspaceCustomDomains = computed(() => domainOptions.value.filter(domain => domain.domainType === 'custom'))

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

const visibilityRoleOptions = [
  { value: 'Owner', label: 'Owner', description: 'Full control across workspace' },
  { value: 'Admin', label: 'Admin', description: 'Manage links & collections' },
  { value: 'Member', label: 'Editor', description: 'Create and edit assigned links' },
  { value: 'Viewer', label: 'Viewer', description: 'View-only' },
]

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

const toggleCollection = (collectionId: string) => {
  if (formData.value.collectionIds.includes(collectionId)) {
    formData.value.collectionIds = formData.value.collectionIds.filter(id => id !== collectionId)
  } else {
    formData.value.collectionIds = [...formData.value.collectionIds, collectionId]
  }
}

const toggleVisibilityRole = (role: string) => {
  if (!formData.value.visibilityRoles) {
    formData.value.visibilityRoles = []
  }
  const index = formData.value.visibilityRoles.indexOf(role)
  if (index > -1) {
    formData.value.visibilityRoles.splice(index, 1)
  } else {
    formData.value.visibilityRoles.push(role)
  }
}

const toggleVisibilityMember = (memberId: string) => {
  if (!formData.value.visibilityMemberIds) {
    formData.value.visibilityMemberIds = []
  }
  const index = formData.value.visibilityMemberIds.indexOf(memberId)
  if (index > -1) {
    formData.value.visibilityMemberIds.splice(index, 1)
  } else {
    formData.value.visibilityMemberIds.push(memberId)
  }
}

const selectDomainOption = (option: { domainType: string; domainValue: string | null }) => {
  formData.value.domainType = option.domainType
  formData.value.domainValue = option.domainValue
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

const defaultDomainOption = computed(() => domains.value.find(domain => domain.domainType === 'default'))

const cleanRuleCondition = (rule: SmartLinkRuleForm) => {
  const clone = { ...rule.condition }
  delete clone.search
  delete clone.citySearch
  delete clone.regionSearch
  delete clone.countrySearch
  
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
  
  if (rule.conditionType === 'GeoRegion') {
    const { country, cities, citySearch, countrySearch, ...rest } = clone
    return { 
      regions: Array.isArray(rest.regions) ? rest.regions : []
    }
  }
  
  if (rule.conditionType === 'GeoCity') {
    const { country, citySearch, countrySearch, ...rest } = clone
    return rest
  }
  
  if (rule.conditionType === 'GeoCountry') {
    const { search, ...rest } = clone
    return rest
  }
  
  return clone
}

// Load SmartLink data
const fetchSmartLinkData = async () => {
  if (!smartLinkId.value || !workspaceId.value) return

  isLoading.value = true
  try {
    const data = await getSmartLink(smartLinkId.value)
    if (data) {
      smartLink.value = data
      existingPassword.value = data.hasPassword || false
      
      // Populate form data
      formData.value = {
        name: data.name || '',
        fallbackUrl: data.fallbackUrl || '',
        customAlias: data.customAlias || '',
        description: data.description || '',
        isOneTime: data.isOneTime || false,
        expiresAt: formatDateTimeLocal(data.expiresAt),
        clickLimit: data.clickLimit || null,
        hasPassword: data.hasPassword || false,
        password: '',
        domainType: data.domainType || 'default',
        domainValue: data.domainValue || null,
        collectionIds: data.collectionIds || [],
        visibility: data.isPublic ? 'public' : 'private',
        visibilityRoles: data.visibilityRoles || [],
        visibilityMemberIds: data.visibilityMemberIds || [],
        pixelEvents: data.pixelEvents || [],
        webhookUrl: data.webhookUrl || '',
        webhookMethod: data.webhookMethod || 'POST',
        webhookHeaders: data.webhookHeaders || {},
        webhookBodyTemplate: data.webhookBodyTemplate || '',
      }
      
      // Populate rules
      if (data.rules && data.rules.length > 0) {
        rules.value = data.rules.map(rule => ({
          uid: createUid(),
          targetUrl: rule.targetUrl || '',
          conditionType: rule.conditionType,
          condition: {
            ...rule.condition,
            search: rule.condition.search || '',
            citySearch: rule.condition.citySearch || '',
            regionSearch: rule.condition.regionSearch || '',
            countrySearch: rule.condition.countrySearch || '',
          },
          priority: rule.priority || 100,
          isActive: rule.isActive !== undefined ? rule.isActive : true,
        }))
        updatePriorities()
      } else {
        rules.value = [createRule()]
      }
    } else {
      toaster.add({
        title: 'Error',
        description: 'SmartLink not found',
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
      router.push('/dashboard/url-shortener/smart-links')
    }
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to load SmartLink',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  } finally {
    isLoading.value = false
  }
}

// Save changes
const handleSave = async () => {
  console.log('[Edit SmartLink] handleSave called', { 
    name: formData.value.name, 
    fallbackUrl: formData.value.fallbackUrl,
    smartLinkId: smartLinkId.value 
  })
  
  errors.value = {}
  
  // Validate
  if (!formData.value.name || !formData.value.name.trim()) {
    errors.value.name = 'Give this SmartLink a friendly name'
    activeTab.value = 'basics'
    console.log('[Edit SmartLink] Validation failed: name is empty')
    return
  }
  
  if (!formData.value.fallbackUrl || !formData.value.fallbackUrl.trim()) {
    errors.value.fallbackUrl = 'Enter a fallback destination URL'
    activeTab.value = 'basics'
    console.log('[Edit SmartLink] Validation failed: fallbackUrl is empty')
    return
  }
  
  if (!validateUrl(formData.value.fallbackUrl)) {
    errors.value.fallbackUrl = 'Enter a valid HTTP or HTTPS URL'
    activeTab.value = 'basics'
    console.log('[Edit SmartLink] Validation failed: fallbackUrl is invalid')
    return
  }
  
  console.log('[Edit SmartLink] Validation passed, proceeding to save')
  
  if (formData.value.customAlias && formData.value.customAlias.length < 3) {
    errors.value.customAlias = 'Alias should be at least 3 characters'
    return
  }
  
  // Only require password if user is setting a new password (hasPassword is true but no existing password)
  // OR if user is changing password (hasPassword is true and password field is filled)
  // If hasPassword is true but password is empty and there's an existing password, that's OK (keeping existing password)
  if (formData.value.hasPassword && !existingPassword.value && (!formData.value.password || !formData.value.password.trim())) {
    errors.value.password = 'Provide a password'
    activeTab.value = 'limits'
    console.log('[Edit SmartLink] Validation failed: password is required for new password')
    return
  }
  
  if (formData.value.visibility === 'private') {
    if (formData.value.visibilityRoles.length === 0 && formData.value.visibilityMemberIds.length === 0) {
      errors.value.visibility = 'Select at least one role or member to access this SmartLink'
      activeTab.value = 'visibility'
      console.log('[Edit SmartLink] Validation failed: visibility roles/members required')
      return
    }
  }
  
  // Validate rules
  const activeRules = rules.value.filter(rule => rule.isActive)
  if (activeRules.length > 0) {
    for (const rule of activeRules) {
      if (!rule.targetUrl || !rule.targetUrl.trim() || !validateUrl(rule.targetUrl)) {
        errors.value.rules = 'All active rules must have valid target URLs'
        activeTab.value = 'rules'
        console.log('[Edit SmartLink] Validation failed: invalid rule targetUrl', rule)
        return
      }
    }
  }
  
  console.log('[Edit SmartLink] All validations passed, proceeding to save')

  isSaving.value = true
  try {
    console.log('[Edit SmartLink] Starting save process...')
    
    const ruleInputs: CreateSmartLinkRuleInput[] = rules.value.map(rule => ({
      targetUrl: rule.targetUrl,
      conditionType: rule.conditionType,
      condition: cleanRuleCondition(rule),
      priority: rule.priority,
      isActive: rule.isActive,
    }))

    const request: UpdateSmartLinkRequest = {
      name: formData.value.name?.trim() || null,
      description: formData.value.description?.trim() || null,
      fallbackUrl: formData.value.fallbackUrl?.trim() || null,
      customAlias: formData.value.customAlias?.trim() || null,
      isOneTime: formData.value.isOneTime,
      expiresAt: toIsoString(formData.value.expiresAt),
      clickLimit: formData.value.clickLimit,
      // Password handling:
      // - If hasPassword is true and password is provided: send the new password
      // - If hasPassword is true but password is empty and existingPassword is true: send null (keep existing)
      // - If hasPassword is false: send null (no password)
      password: formData.value.hasPassword 
        ? (formData.value.password?.trim() || null)
        : null,
      domainType: formData.value.domainType,
      domainValue: formData.value.domainValue,
      collectionIds: formData.value.collectionIds.length > 0 ? formData.value.collectionIds : null,
      rules: ruleInputs,
      pixelEvents: formData.value.pixelEvents.length > 0 ? formData.value.pixelEvents : null,
      webhookUrl: formData.value.webhookUrl?.trim() || null,
      webhookMethod: formData.value.webhookUrl ? (formData.value.webhookMethod || 'POST') : null,
      webhookHeaders: formData.value.webhookUrl && Object.keys(formData.value.webhookHeaders).length > 0 ? formData.value.webhookHeaders : null,
      webhookBodyTemplate: formData.value.webhookUrl && formData.value.webhookBodyTemplate?.trim() ? formData.value.webhookBodyTemplate.trim() : null,
      visibility: formData.value.visibility,
      visibilityRoles: formData.value.visibility === 'private' && formData.value.visibilityRoles.length > 0 ? formData.value.visibilityRoles : undefined,
      visibilityMemberIds: formData.value.visibility === 'private' && formData.value.visibilityMemberIds.length > 0 ? formData.value.visibilityMemberIds : undefined,
    }

    console.log('[Edit SmartLink] Calling updateSmartLink with:', { 
      smartLinkId: smartLinkId.value, 
      request: { ...request, password: request.password ? '***' : null } 
    })
    
    const result = await updateSmartLink(smartLinkId.value, request)
    console.log('[Edit SmartLink] updateSmartLink result:', result)
    
    if (result) {
      toaster.add({
        title: 'Success',
        description: 'SmartLink updated successfully',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })
      router.push('/dashboard/url-shortener/smart-links')
    } else {
      throw new Error('Update returned null result')
    }
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error?.message || error?.data?.errors?.[0]?.message || 'Failed to update SmartLink',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  router.push('/dashboard/url-shortener/smart-links')
}

watch(() => formData.value.visibility, (newValue) => {
  if (newValue === 'public') {
    formData.value.visibilityRoles = []
    formData.value.visibilityMemberIds = []
    delete errors.value.visibility
  }
})

// Load data on mount
onMounted(async () => {
  await Promise.all([
    fetchSmartLinkData(),
    fetchCollections({ force: true }),
    fetchDomains(),
    fetchWorkspaceMembers(),
  ])
})

watch([workspaceId, smartLinkId], () => {
  if (workspaceId.value && smartLinkId.value) {
    fetchSmartLinkData()
  }
}, { immediate: false })
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
          Edit SmartLink
        </BaseHeading>
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
          type="button"
          @click="() => {
            console.log('[Edit SmartLink] Save button clicked')
            handleSave()
          }"
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
    <div v-else-if="!smartLink && !isLoading" class="flex flex-col items-center justify-center py-12">
      <BaseHeading as="h2" size="xl" weight="semibold" class="text-muted-900 dark:text-white mb-2">
        SmartLink not found
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-4">
        The SmartLink you're looking for doesn't exist or you don't have permission to view it.
      </BaseParagraph>
      <BaseButton variant="primary" @click="handleCancel">
        Back to SmartLinks
      </BaseButton>
    </div>

    <!-- Form -->
    <div v-else-if="smartLink" class="space-y-6">
      <!-- Hero URLs & Stats -->
      <div class="space-y-6 pb-4 border-b border-muted-200 dark:border-muted-800">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
          <div class="flex-1 space-y-1">
            <BaseParagraph size="xs" class="uppercase tracking-[0.3em] text-muted-500 dark:text-muted-400">
              Fallback URL
            </BaseParagraph>
            <div class="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <BaseText
                size="lg"
                weight="semibold"
                class="text-muted-900 dark:text-white leading-relaxed break-words"
              >
                {{ smartLink.fallbackUrl || 'Not set' }}
              </BaseText>
              <BaseButton
                v-if="smartLink.fallbackUrl"
                variant="outline"
                size="sm"
                class="shrink-0"
                @click="() => window.open(smartLink.fallbackUrl, '_blank')"
              >
                <Icon name="ph:arrow-up-right" class="size-4" />
                <span>Open</span>
              </BaseButton>
            </div>
          </div>

          <div class="flex-1 space-y-1">
            <BaseParagraph size="xs" class="uppercase tracking-[0.3em] text-muted-500 dark:text-muted-400">
              Short URL
            </BaseParagraph>
            <div class="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <BaseHeading
                as="p"
                size="2xl"
                weight="bold"
                class="text-primary-600 dark:text-primary-300 truncate"
                :title="smartLink.shortUrl"
              >
                {{ smartLink.shortUrl }}
              </BaseHeading>
              <BaseButton
                variant="outline"
                size="sm"
                class="shrink-0"
                @click="() => {
                  navigator.clipboard.writeText(smartLink.shortUrl)
                  toaster.add({
                    title: 'Copied',
                    description: 'Short URL copied to clipboard',
                    icon: 'ph:check',
                    color: 'success',
                    progress: true,
                  })
                }"
              >
                <Icon name="ph:copy" class="size-4" />
                <span>Copy</span>
              </BaseButton>
              <BaseParagraph
                size="xs"
                class="text-muted-500 dark:text-muted-400 ms-auto"
              >
                {{ smartLink.currentClicks || 0 }} clicks · Created {{ new Date(smartLink.createdAt).toLocaleDateString() }}
              </BaseParagraph>
            </div>
          </div>
        </div>
      </div>
      <!-- Tabs -->
      <BaseCard class="p-4">
        <div class="flex flex-wrap gap-3">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="flex-1 min-w-[150px] rounded-xl border px-4 py-3 text-left transition-all"
            :class="
              activeTab === tab.key
                ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300'
                : 'border-muted-200 dark:border-muted-700 hover:border-primary-300 text-muted-700 dark:text-muted-300'
            "
            @click="activeTab = tab.key"
          >
            <div class="font-semibold">{{ tab.label }}</div>
            <div class="text-xs opacity-70">{{ tab.description }}</div>
          </button>
        </div>
      </BaseCard>

      <!-- Tab Content -->
      <!-- Basics Tab -->
      <BaseCard v-if="activeTab === 'basics'" class="p-6 space-y-6">
        <div>
          <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
            Basic Information
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            Provide essential details for your SmartLink.
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

        <TairoFormGroup label="Custom alias (optional)" :error="errors.customAlias">
          <div class="flex items-center gap-2">
            <TairoInput
              v-model="formData.customAlias"
              placeholder="my-campaign-link"
              icon="solar:pen-linear"
              rounded="lg"
              class="flex-1"
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
      </BaseCard>

      <!-- Routing Rules Tab -->
      <BaseCard v-else-if="activeTab === 'rules'" class="p-6 space-y-6">
        <div>
          <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
            Define routing rules
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            Decide how visitors flow to different destinations based on context.
          </BaseParagraph>
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
                  Rule {{ index + 1 }}
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
                <SearchableCheckboxList
                  label="countries"
                  search-placeholder="Search country"
                  :items="countryItems"
                  :model-value="rule.condition.countries || []"
                  :search="rule.condition.search || ''"
                  @update:model-value="(value) => { rule.condition.countries = value }"
                  @update:search="(value) => { rule.condition.search = value }"
                />
              </div>

              <div v-else-if="rule.conditionType === 'GeoCity'" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <SearchableCheckboxList
                    label="country"
                    search-placeholder="Search country"
                    :items="countryItems"
                    :model-value="rule.condition.country || null"
                    :search="rule.condition.countrySearch || ''"
                    :single-select="true"
                    @update:model-value="(value) => { rule.condition.country = value ? String(value) : null }"
                    @update:search="(value) => { rule.condition.countrySearch = value }"
                  />
                  <SearchableCheckboxList
                    label="cities"
                    search-placeholder="Search city"
                    :items="getCityItems(rule.condition.country)"
                    :model-value="rule.condition.cities || []"
                    :search="rule.condition.citySearch || ''"
                    :disabled="!rule.condition.country"
                    empty-message="Select country first or no cities found"
                    @update:model-value="(value) => { rule.condition.cities = value }"
                    @update:search="(value) => { rule.condition.citySearch = value }"
                  />
                </div>
              </div>

              <div v-else-if="rule.conditionType === 'GeoRegion'" class="space-y-4">
                <div class="grid grid-cols-3 gap-4">
                  <SearchableCheckboxList
                    label="country"
                    search-placeholder="Search country"
                    :items="countryItems"
                    :model-value="rule.condition.country || null"
                    :search="rule.condition.countrySearch || ''"
                    :single-select="true"
                    @update:model-value="(value) => { rule.condition.country = value ? String(value) : null }"
                    @update:search="(value) => { rule.condition.countrySearch = value }"
                  />
                  <SearchableCheckboxList
                    label="cities"
                    search-placeholder="Search city"
                    :items="getCityItems(rule.condition.country)"
                    :model-value="rule.condition.cities || []"
                    :search="rule.condition.citySearch || ''"
                    :disabled="!rule.condition.country"
                    empty-message="Select country first or no cities found"
                    @update:model-value="(value) => { rule.condition.cities = value }"
                    @update:search="(value) => { rule.condition.citySearch = value }"
                  />
                  <SearchableCheckboxList
                    label="regions"
                    search-placeholder="Search region"
                    :items="getRegionItems(rule.condition.country, rule.condition.cities || [])"
                    :model-value="rule.condition.regions || []"
                    :search="rule.condition.regionSearch || ''"
                    :disabled="!rule.condition.country || !(rule.condition.cities || []).length"
                    empty-message="Select cities first to see available regions"
                    @update:model-value="(value) => { rule.condition.regions = value }"
                    @update:search="(value) => { rule.condition.regionSearch = value }"
                  />
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
                    @click="() => { if (!rule.condition.devices) rule.condition.devices = []; rule.condition.devices = toggleArrayValue(rule.condition.devices, device.value) }"
                  >
                    <div class="flex items-center gap-3">
                      <BaseCheckbox
                        :model-value="(rule.condition.devices || []).includes(device.value)"
                        @update:model-value="() => { if (!rule.condition.devices) rule.condition.devices = []; rule.condition.devices = toggleArrayValue(rule.condition.devices, device.value) }"
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
                    @click="() => { if (!rule.condition.systems) rule.condition.systems = []; rule.condition.systems = toggleArrayValue(rule.condition.systems, system) }"
                  >
                    <div class="flex items-center gap-3">
                      <BaseCheckbox
                        :model-value="(rule.condition.systems || []).includes(system)"
                        @update:model-value="() => { if (!rule.condition.systems) rule.condition.systems = []; rule.condition.systems = toggleArrayValue(rule.condition.systems, system) }"
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
                    @click="() => { if (!rule.condition.browsers) rule.condition.browsers = []; rule.condition.browsers = toggleArrayValue(rule.condition.browsers, browser) }"
                  >
                    <div class="flex items-center gap-3">
                      <BaseCheckbox
                        :model-value="(rule.condition.browsers || []).includes(browser)"
                        @update:model-value="() => { if (!rule.condition.browsers) rule.condition.browsers = []; rule.condition.browsers = toggleArrayValue(rule.condition.browsers, browser) }"
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
                    <TairoSelect v-model="rule.condition.timezone" rounded="lg" size="sm">
                      <BaseSelectItem
                        v-for="tz in timezoneOptions"
                        :key="tz.value"
                        :value="tz.value"
                      >
                        {{ tz.label }}
                      </BaseSelectItem>
                    </TairoSelect>
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
                  <div class="grid grid-cols-3 gap-3">
                    <BaseCard
                      v-for="day in dayOptions"
                      :key="day.value"
                      class="p-4 cursor-pointer transition-all hover:border-primary-500 dark:hover:border-primary-400"
                      :class="{ 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20': (rule.condition.days || []).includes(day.value) }"
                      @click="() => { if (!rule.condition.days) rule.condition.days = []; rule.condition.days = toggleArrayValue(rule.condition.days, day.value) }"
                    >
                      <div class="flex items-center gap-3">
                        <BaseCheckbox
                          :model-value="(rule.condition.days || []).includes(day.value)"
                          @update:model-value="() => { if (!rule.condition.days) rule.condition.days = []; rule.condition.days = toggleArrayValue(rule.condition.days, day.value) }"
                          @click.stop
                        />
                        <div class="flex flex-col">
                          <span class="text-sm font-medium">{{ day.value }}</span>
                          <span class="text-xs text-muted-400">{{ day.label }}</span>
                        </div>
                      </div>
                    </BaseCard>
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
      </BaseCard>

      <!-- Collections Tab -->
      <BaseCard v-else-if="activeTab === 'collections'" class="p-6 space-y-6">
        <div>
          <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
            Collections
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            Organize this SmartLink into collections for better management
          </BaseParagraph>
        </div>

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
      </BaseCard>

      <!-- Visibility Tab -->
      <BaseCard v-else-if="activeTab === 'visibility'" class="p-6 space-y-6">
        <div>
          <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
            Visibility & Access
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
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
              <div class="text-xs opacity-75">Restrict access to selected roles or teammates</div>
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
                  Members with these roles can manage this SmartLink
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
              <div
                v-for="role in visibilityRoleOptions"
                :key="role.value"
                class="flex items-start gap-3 p-3 rounded-lg border border-muted-200 dark:border-muted-700 cursor-pointer transition-colors hover:bg-muted-50 dark:hover:bg-muted-800/50"
                :class="{ 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20': formData.visibilityRoles.includes(role.value) }"
                @click="toggleVisibilityRole(role.value)"
              >
                <BaseCheckbox
                  :model-value="formData.visibilityRoles.includes(role.value)"
                  rounded="sm"
                  color="primary"
                  @update:model-value="() => toggleVisibilityRole(role.value)"
                  @click.stop
                />
                <div class="flex-1 min-w-0">
                  <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-white">
                    {{ role.label }}
                  </BaseText>
                  <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                    {{ role.description }}
                  </BaseParagraph>
                </div>
              </div>
            </div>
          </BaseCard>

          <BaseCard class="p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-800 dark:text-white">
                  Allow specific teammates
                </BaseHeading>
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                  Select individual team members who can access this SmartLink
                </BaseParagraph>
              </div>
              <BaseTag
                v-if="selectedMembers.length"
                size="sm"
                variant="pastel"
                color="info"
              >
                {{ selectedMembers.length }} selected
              </BaseTag>
            </div>

            <TairoFormGroup label="Search teammates">
              <TairoInput
                v-model="memberSearch"
                placeholder="Search by name or email"
                icon="lucide:search"
                rounded="lg"
                size="sm"
              />
            </TairoFormGroup>

            <div class="max-h-48 overflow-y-auto border border-muted-200 dark:border-muted-700 rounded-lg divide-y divide-muted-100 dark:divide-muted-800 mt-3">
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
      </BaseCard>

      <!-- Limits & Security Tab -->
      <BaseCard v-else-if="activeTab === 'limits'" class="p-6 space-y-6">
        <div>
          <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
            Limits & Security
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
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
          v-if="!formData.isOneTime"
          label="Expiration Date (Optional)"
          :error="errors.expiresAt"
        >
          <TairoInput
            v-model="formData.expiresAt"
            type="datetime-local"
            icon="solar:calendar-linear"
            rounded="lg"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Click Limit (Optional)" :error="errors.clickLimit">
          <TairoInput
            v-model.number="formData.clickLimit"
            type="number"
            placeholder="e.g. 1000"
            icon="solar:click-linear"
            rounded="lg"
            min="1"
          />
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
            Maximum number of clicks before the link is disabled
          </BaseParagraph>
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
            <BaseSwitchBall
              v-model="formData.hasPassword"
              variant="primary"
            />
          </div>

          <div v-if="formData.hasPassword" class="space-y-3">
            <TairoFormGroup label="Password" :error="errors.password">
              <TairoInput
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter password"
                icon="solar:lock-password-linear"
                rounded="lg"
              >
                <template #trailing>
                  <button
                    type="button"
                    class="flex items-center justify-center size-8 rounded-lg hover:bg-muted-100 dark:hover:bg-muted-800 transition-colors"
                    @click="showPassword = !showPassword"
                  >
                    <Icon
                      :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'"
                      class="size-4 text-muted-500"
                    />
                  </button>
                </template>
              </TairoInput>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-1">
                Visitors will need to enter this password to access the link
              </BaseParagraph>
            </TairoFormGroup>
          </div>
        </BaseCard>
      </BaseCard>

      <!-- Domain Tab -->
      <BaseCard v-else-if="activeTab === 'domain'" class="p-6 space-y-6">
        <div>
          <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
            Domain Configuration
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            Choose the domain for your SmartLink
          </BaseParagraph>
        </div>

        <div class="space-y-6">
          <div class="space-y-3">
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
      </BaseCard>

      <!-- Pixels & Webhooks Tab -->
      <BaseCard v-else-if="activeTab === 'pixels'" class="p-6 space-y-6">
        <div>
          <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
            Pixel Events & Webhooks
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
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
              rounded="lg"
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
                  rounded="lg"
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
                  rounded="lg"
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
      </BaseCard>
    </div>
  </div>
</template>

