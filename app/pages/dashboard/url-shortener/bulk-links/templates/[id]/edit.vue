<script setup lang="ts">
import { computed, ref, watch, onMounted } from '#imports'
import type { BulkLinkTemplate, UpdateBulkLinkTemplateRequest, BulkLinkTemplateRuleDto } from '~/types/bulk-link'
import type { SmartLinkConditionType } from '~/types/url-shortener'
import { useBulkLinkTemplates } from '~/composables/useBulkLinkTemplates'
import { useUrlShortenerCollections } from '~/composables/useUrlShortenerCollections'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import { useWorkspaceDomains } from '~/composables/useWorkspaceDomains'
import { useWorkspaceMembers } from '~/composables/useWorkspaceMembers'
import SearchableCheckboxList from '~/components/url-shortener/SearchableCheckboxList.vue'

definePageMeta({
  title: 'Edit Template',
  layout: 'dashboard',
})

const createUid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

const route = useRoute()
const router = useRouter()
const toaster = useNuiToasts()

const { workspaceId } = useWorkspaceContext()
const { getTemplate, updateTemplate } = useBulkLinkTemplates()
const { items: collectionsItems, fetchCollections } = useUrlShortenerCollections()
const { domainOptions, fetchDomains } = useWorkspaceDomains()
const { members: workspaceMembers, fetchMembers: fetchWorkspaceMembers, isLoading: isLoadingMembers } = useWorkspaceMembers()

const templateId = computed(() => route.params.id as string)
const isLoading = ref(false)
const isSaving = ref(false)
const template = ref<BulkLinkTemplate | null>(null)
const existingPassword = ref(false)

type TemplateRuleForm = BulkLinkTemplateRuleDto & {
  uid: string
}

const tabs = [
  { key: 'basics', label: 'Basics', description: 'Name & URL pattern' },
  { key: 'rules', label: 'Routing Rules', description: 'Condition-based routing' },
  { key: 'collections', label: 'Collections', description: 'Organize templates' },
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
  fallbackUrlPattern: '',
  description: '',
  domainType: 'default',
  domainValue: null as string | null,
  collectionIds: [] as string[],
  visibility: 'public' as 'public' | 'private',
  visibilityRoles: [] as string[],
  visibilityMemberIds: [] as string[],
  expiresAt: null as string | null,
  clickLimit: null as number | null,
  isOneTime: false,
  hasPassword: false,
  password: '',
  pixelEvents: [] as Array<{ pixelType: string; pixelId: string; eventType: string }>,
  webhookUrl: '',
  webhookMethod: 'POST',
  webhookHeaders: {} as Record<string, string>,
  webhookBodyTemplate: '',
})

const rules = ref<TemplateRuleForm[]>([])

// Geo data (same as SmartLink)
const geoCountries = ref<Array<{ code: string; name: string; cities: Array<{ name: string; region?: string | null }> }>>([
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

const visibilityRoleOptions = [
  { value: 'Owner', label: 'Owner', description: 'Full control across workspace' },
  { value: 'Admin', label: 'Admin', description: 'Manage links & collections' },
  { value: 'Member', label: 'Editor', description: 'Create and edit assigned links' },
  { value: 'Viewer', label: 'Viewer', description: 'View-only' },
]

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
    default:
      return {}
  }
}

const createRule = (type: SmartLinkConditionType = 'GeoCountry'): TemplateRuleForm => ({
  uid: createUid(),
  targetUrlPattern: '',
  conditionType: type,
  condition: createConditionTemplate(type),
  priority: (rules.value.length + 1) * 10,
  isActive: false,
})

const countryItems = computed(() => {
  return geoCountries.value.map(country => ({
    value: country.code,
    label: country.name,
  }))
})

const getCityItems = (countryCode: string | null) => {
  if (!countryCode) return []
  const country = geoCountries.value.find(c => c.code === countryCode)
  if (!country) return []
  return country.cities.map(city => ({
    value: city.name,
    label: city.name,
  }))
}

const getRegionItems = (countryCode: string | null, selectedCityNames: string[]) => {
  if (!countryCode || !selectedCityNames.length) return []
  const country = geoCountries.value.find(c => c.code === countryCode)
  if (!country) return []
  const selectedCities = country.cities.filter(city => selectedCityNames.includes(city.name))
  const regions = new Set(selectedCities.map(city => city.region).filter(Boolean))
  return Array.from(regions).map(region => ({
    value: region as string,
    label: region as string,
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
  rules.value = rules.value.filter(rule => rule.uid !== uid)
  updatePriorities()
}

const duplicateRule = (rule: TemplateRuleForm) => {
  const clone: TemplateRuleForm = {
    uid: createUid(),
    targetUrlPattern: rule.targetUrlPattern || '',
    conditionType: rule.conditionType,
    condition: JSON.parse(JSON.stringify(rule.condition)),
    priority: (rules.value.length + 1) * 10,
    isActive: rule.isActive,
  }
  rules.value.push(clone)
  updatePriorities()
  expandedRules.value.add(clone.uid)
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
const defaultDomainOption = computed(() => domains.value.find(domain => domain.domainType === 'default'))

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

const cleanRuleCondition = (rule: TemplateRuleForm) => {
  const clone = { ...rule.condition }
  delete clone.search
  delete clone.citySearch
  delete clone.regionSearch
  delete clone.countrySearch
  
  if (rule.conditionType === 'GeoRegion') {
    return { 
      regions: Array.isArray(clone.regions) ? clone.regions : []
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

// Load Template data
const fetchTemplateData = async () => {
  if (!templateId.value || !workspaceId.value) return

  isLoading.value = true
  try {
    const data = await getTemplate(templateId.value)
    if (data) {
      template.value = data
      existingPassword.value = data.hasPassword || false
      
      formData.value = {
        name: data.name || '',
        fallbackUrlPattern: data.fallbackUrlPattern || '',
        description: data.description || '',
        domainType: data.domainType || 'default',
        domainValue: data.domainValue || null,
        collectionIds: data.collectionIds || [],
        visibility: data.isPublic ? 'public' : 'private',
        visibilityRoles: data.visibilityRoles || [],
        visibilityMemberIds: data.visibilityMemberIds || [],
        expiresAt: formatDateTimeLocal(data.expiresAt),
        clickLimit: data.clickLimit || null,
        isOneTime: data.isOneTime || false,
        hasPassword: data.hasPassword || false,
        password: '',
        pixelEvents: (() => {
          if (!data.pixelEvents) return []
          // Handle both object with 'pixels' key and direct array
          if (typeof data.pixelEvents === 'object' && 'pixels' in data.pixelEvents && Array.isArray(data.pixelEvents.pixels)) {
            return data.pixelEvents.pixels
          }
          if (Array.isArray(data.pixelEvents)) {
            return data.pixelEvents
          }
          // If it's a string, try to parse it
          if (typeof data.pixelEvents === 'string') {
            try {
              const parsed = JSON.parse(data.pixelEvents)
              if (parsed && typeof parsed === 'object' && 'pixels' in parsed && Array.isArray(parsed.pixels)) {
                return parsed.pixels
              }
              if (Array.isArray(parsed)) {
                return parsed
              }
            } catch {
              return []
            }
          }
          return []
        })(),
        webhookUrl: data.webhookUrl || '',
        webhookMethod: data.webhookMethod || 'POST',
        webhookHeaders: (() => {
          if (!data.webhookHeaders) return {}
          // If it's already an object, return it
          if (typeof data.webhookHeaders === 'object' && !Array.isArray(data.webhookHeaders)) {
            return data.webhookHeaders
          }
          // If it's a string, try to parse it
          if (typeof data.webhookHeaders === 'string') {
            try {
              const parsed = JSON.parse(data.webhookHeaders)
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed
              }
            } catch {
              return {}
            }
          }
          return {}
        })(),
        webhookBodyTemplate: data.webhookBodyTemplate || '',
      }
      
      if (data.rules && data.rules.length > 0) {
        rules.value = data.rules.map(rule => ({
          uid: createUid(),
          targetUrlPattern: rule.targetUrlPattern || '',
          conditionType: rule.conditionType,
          condition: {
            ...rule.condition,
            search: '',
            citySearch: '',
            regionSearch: '',
            countrySearch: '',
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
        description: 'Template not found',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      router.push('/dashboard/url-shortener/bulk-links?tab=templates')
    }
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to load template',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
  } finally {
    isLoading.value = false
  }
}

// Save changes
const handleSave = async () => {
  errors.value = {}
  
  if (!formData.value.name || !formData.value.name.trim()) {
    errors.value.name = 'Template name is required'
    activeTab.value = 'basics'
    return
  }
  
  if (!formData.value.fallbackUrlPattern || !formData.value.fallbackUrlPattern.trim()) {
    errors.value.fallbackUrlPattern = 'Fallback URL pattern is required'
    activeTab.value = 'basics'
    return
  }

  if (formData.value.visibility === 'private') {
    if (formData.value.visibilityRoles.length === 0 && formData.value.visibilityMemberIds.length === 0) {
      errors.value.visibility = 'Select at least one role or member'
      activeTab.value = 'visibility'
      return
    }
  }

  isSaving.value = true
  try {
    const ruleInputs: BulkLinkTemplateRuleDto[] = rules.value.map(rule => ({
      targetUrlPattern: rule.targetUrlPattern,
      conditionType: rule.conditionType,
      condition: cleanRuleCondition(rule),
      priority: rule.priority,
      isActive: rule.isActive,
    }))

    const pixelEventsDict = formData.value.pixelEvents.length > 0
      ? { pixels: formData.value.pixelEvents }
      : null

    const webhookHeadersDict = Object.keys(formData.value.webhookHeaders).length > 0
      ? formData.value.webhookHeaders
      : null

    const request: UpdateBulkLinkTemplateRequest = {
      name: formData.value.name?.trim() || null,
      description: formData.value.description?.trim() || null,
      fallbackUrlPattern: formData.value.fallbackUrlPattern?.trim() || null,
      domainType: formData.value.domainType,
      domainValue: formData.value.domainValue,
      collectionIds: formData.value.collectionIds.length > 0 ? formData.value.collectionIds : null,
      rules: ruleInputs,
      isPublic: formData.value.visibility === 'public',
      visibilityRoles: formData.value.visibility === 'private' ? formData.value.visibilityRoles : null,
      visibilityMemberIds: formData.value.visibility === 'private' ? formData.value.visibilityMemberIds : null,
      expiresAt: toIsoString(formData.value.expiresAt),
      clickLimit: formData.value.clickLimit,
      isOneTime: formData.value.isOneTime,
      password: formData.value.hasPassword ? formData.value.password?.trim() || null : null,
      clearPassword: !formData.value.hasPassword && existingPassword.value,
      pixelEvents: pixelEventsDict,
      webhookUrl: formData.value.webhookUrl || null,
      webhookMethod: formData.value.webhookUrl ? formData.value.webhookMethod || null : null,
      webhookHeaders: webhookHeadersDict,
      webhookBodyTemplate: formData.value.webhookBodyTemplate || null,
    }

    await updateTemplate(templateId.value, request)
    router.push('/dashboard/url-shortener/bulk-links?tab=templates')
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error?.message || 'Failed to update template',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  router.push('/dashboard/url-shortener/bulk-links?tab=templates')
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
    fetchTemplateData(),
    fetchCollections({ force: true }),
    fetchDomains(),
    fetchWorkspaceMembers(),
  ])
})
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
          Edit Template
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
    <div v-else-if="!template && !isLoading" class="flex flex-col items-center justify-center py-12">
      <BaseHeading as="h2" size="xl" weight="semibold" class="text-muted-900 dark:text-white mb-2">
        Template not found
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-4">
        The template you're looking for doesn't exist or you don't have permission to view it.
      </BaseParagraph>
      <BaseButton variant="primary" @click="handleCancel">
        Back to Templates
      </BaseButton>
    </div>

    <!-- Form -->
    <div v-else-if="template" class="space-y-6">
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
            Provide essential details for your template.
          </BaseParagraph>
        </div>

        <TairoFormGroup
          label="Template name"
          :error="errors.name"
        >
          <TairoInput
            v-model="formData.name"
            placeholder="e.g. Summer Campaign Template"
            rounded="lg"
            size="sm"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Fallback URL Pattern" :error="errors.fallbackUrlPattern">
          <TairoInput
            v-model="formData.fallbackUrlPattern"
            placeholder="{destination}"
            rounded="lg"
            size="sm"
          />
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
            Use placeholders like {destination}, {shortCode}, {title}, {description}, {index}, {campaignName}, {templateName}
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
                  v-if="rule.targetUrlPattern"
                  size="xs"
                  variant="solid"
                  color="muted"
                >
                  Pattern set
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

                <TairoFormGroup label="Target URL Pattern" class="md:col-span-3">
                  <TairoInput
                    v-model="rule.targetUrlPattern"
                    placeholder="e.g., https://example.com/{destination}?ref={shortCode}"
                    rounded="lg"
                    size="sm"
                    class="w-full"
                  />
                  <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-1">
                    Use placeholders like {destination}, {shortCode}, {title}, etc.
                  </BaseParagraph>
                </TairoFormGroup>
              </div>

              <!-- Condition-specific fields -->
              <div v-if="rule.conditionType === 'GeoCountry'" class="space-y-3">
                <SearchableCheckboxList
                  label="countries"
                  search-placeholder="Search country"
                  :items="countryItems"
                  :model-value="Array.isArray(rule.condition.countries) ? rule.condition.countries : []"
                  :search="rule.condition.search || ''"
                  @update:model-value="(value) => { 
                    if (!rule.condition) rule.condition = {}
                    rule.condition.countries = Array.isArray(value) ? value : []
                  }"
                  @update:search="(value) => { 
                    if (!rule.condition) rule.condition = {}
                    rule.condition.search = value 
                  }"
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
                    @update:model-value="(value) => { 
                      if (!rule.condition) rule.condition = {}
                      rule.condition.country = value ? String(value) : null
                      if (!value) rule.condition.cities = []
                    }"
                    @update:search="(value) => { 
                      if (!rule.condition) rule.condition = {}
                      rule.condition.countrySearch = value 
                    }"
                  />
                  <SearchableCheckboxList
                    label="cities"
                    search-placeholder="Search city"
                    :items="getCityItems(rule.condition.country)"
                    :model-value="Array.isArray(rule.condition.cities) ? rule.condition.cities : []"
                    :search="rule.condition.citySearch || ''"
                    :disabled="!rule.condition.country"
                    empty-message="Select country first or no cities found"
                    @update:model-value="(value) => { 
                      if (!rule.condition) rule.condition = {}
                      rule.condition.cities = Array.isArray(value) ? value : []
                    }"
                    @update:search="(value) => { 
                      if (!rule.condition) rule.condition = {}
                      rule.condition.citySearch = value 
                    }"
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
                    @update:model-value="(value) => { 
                      if (!rule.condition) rule.condition = {}
                      rule.condition.country = value ? String(value) : null
                      if (!value) {
                        rule.condition.cities = []
                        rule.condition.regions = []
                      }
                    }"
                    @update:search="(value) => { 
                      if (!rule.condition) rule.condition = {}
                      rule.condition.countrySearch = value 
                    }"
                  />
                  <SearchableCheckboxList
                    label="cities"
                    search-placeholder="Search city"
                    :items="getCityItems(rule.condition.country)"
                    :model-value="Array.isArray(rule.condition.cities) ? rule.condition.cities : []"
                    :search="rule.condition.citySearch || ''"
                    :disabled="!rule.condition.country"
                    empty-message="Select country first or no cities found"
                    @update:model-value="(value) => { 
                      if (!rule.condition) rule.condition = {}
                      rule.condition.cities = Array.isArray(value) ? value : []
                    }"
                    @update:search="(value) => { 
                      if (!rule.condition) rule.condition = {}
                      rule.condition.citySearch = value 
                    }"
                  />
                  <SearchableCheckboxList
                    label="regions"
                    search-placeholder="Search region"
                    :items="getRegionItems(rule.condition.country, rule.condition.cities || [])"
                    :model-value="Array.isArray(rule.condition.regions) ? rule.condition.regions : []"
                    :search="rule.condition.regionSearch || ''"
                    :disabled="!rule.condition.country || !(rule.condition.cities || []).length"
                    empty-message="Select cities first to see available regions"
                    @update:model-value="(value) => { 
                      if (!rule.condition) rule.condition = {}
                      rule.condition.regions = Array.isArray(value) ? value : []
                    }"
                    @update:search="(value) => { 
                      if (!rule.condition) rule.condition = {}
                      rule.condition.regionSearch = value 
                    }"
                  />
                </div>
              </div>

              <div v-else-if="rule.conditionType === 'DeviceType'" class="space-y-3">
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
            Organize this template into collections for better management
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
        </TairoFormGroup>
      </BaseCard>

      <!-- Visibility Tab -->
      <BaseCard v-else-if="activeTab === 'visibility'" class="p-6 space-y-6">
        <div>
          <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
            Visibility & Access
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            Control who can access SmartLinks created from this template
          </BaseParagraph>
        </div>

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

        <div v-if="formData.visibility === 'private'" class="space-y-6">
          <BaseCard class="p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-800 dark:text-white">
                  Allow workspace roles
                </BaseHeading>
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                  Members with these roles can manage SmartLinks from this template
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
                  Select individual team members who can access SmartLinks from this template
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
        </div>
      </BaseCard>

      <!-- Limits & Security Tab -->
      <BaseCard v-else-if="activeTab === 'limits'" class="p-6 space-y-6">
        <div>
          <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
            Limits & Security
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            Set expiration, click limits, and password protection for SmartLinks created from this template
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
        >
          <TairoInput
            v-model="formData.expiresAt"
            type="datetime-local"
            icon="solar:calendar-linear"
            rounded="lg"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Click Limit (Optional)">
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
            <TairoFormGroup label="Password">
              <TairoInput
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter new password"
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
                Leave empty to keep existing password
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
            Choose the domain for SmartLinks created from this template
          </BaseParagraph>
        </div>

        <div class="space-y-6">
          <div class="space-y-3">
            <BaseParagraph size="sm" weight="medium" class="text-muted-600 dark:text-muted-300">
              Default domain
            </BaseParagraph>
            <div class="grid gap-3 md:grid-cols-2">
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
        </div>
      </BaseCard>

      <!-- Pixels & Webhooks Tab -->
      <BaseCard v-else-if="activeTab === 'pixels'" class="p-6 space-y-6">
        <div>
          <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
            Pixel Events & Webhooks
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            Configure tracking pixels and webhooks to monitor SmartLink performance
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

