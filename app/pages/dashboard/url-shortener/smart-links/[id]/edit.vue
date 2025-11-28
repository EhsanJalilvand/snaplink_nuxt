<script setup lang="ts">
import { computed, ref, watch, onMounted } from '#imports'
import type { SmartLink } from '~/types/url-shortener'
import { useSmartLinks } from '~/composables/useSmartLinks'
import { useUrlShortenerCollections } from '~/composables/useUrlShortenerCollections'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import { useWorkspaceDomains } from '~/composables/useWorkspaceDomains'
import { useWorkspaceMembers } from '~/composables/useWorkspaceMembers'

definePageMeta({
  title: 'Edit SmartLink',
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()
const toaster = useNuiToasts()

const { workspaceId } = useWorkspaceContext()
const { getSmartLink, updateSmartLink } = useSmartLinks()
const { items: collectionsList, fetchCollections } = useUrlShortenerCollections()
const { domainOptions, fetchDomains } = useWorkspaceDomains()
const { members: workspaceMembers, fetchMembers: fetchWorkspaceMembers, isLoading: isLoadingMembers } = useWorkspaceMembers()

const smartLinkId = computed(() => {
  const id = route.params.id as string
  return id
})

const isLoading = ref(false)
const isSaving = ref(false)
const smartLink = ref<SmartLink | null>(null)

// Form data - using CreateSmartLinkRequest structure for now
const formData = ref({
  name: '',
  description: '',
  fallbackUrl: '',
  isOneTime: false,
  expiresAt: null as string | null,
  clickLimit: null as number | null,
  hasPassword: false,
  password: '',
  domainType: 'default',
  domainValue: null as string | null,
  customAlias: '',
  collectionIds: [] as string[],
  visibility: 'public' as 'public' | 'private',
  visibilityRoles: [] as string[],
  visibilityMemberIds: [] as string[],
})

const errors = ref<Record<string, string>>({})
const showPassword = ref(false)
const memberSearch = ref('')

const formatDateTimeLocal = (isoString: string | null | undefined): string | null => {
  if (!isoString) {
    return null
  }
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  const pad = (value: number) => value.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const toIsoString = (value: string | null | undefined): string | null => {
  if (!value) {
    return null
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

// Fetch SmartLink data
const fetchSmartLinkData = async () => {
  if (!smartLinkId.value || !workspaceId.value) {
    return
  }

  isLoading.value = true
  try {
    const linkData = await getSmartLink(smartLinkId.value)
    
    if (linkData) {
      smartLink.value = linkData
      
      // Populate form
      formData.value = {
        name: linkData.name || '',
        description: linkData.description || '',
        fallbackUrl: linkData.fallbackUrl || '',
        isOneTime: linkData.isOneTime ?? false,
        expiresAt: formatDateTimeLocal(linkData.expiresAt ?? null),
        clickLimit: linkData.clickLimit || null,
        hasPassword: linkData.hasPassword ?? false,
        password: '',
        domainType: linkData.domainType || 'default',
        domainValue: linkData.domainValue || null,
        customAlias: linkData.customAlias || '',
        collectionIds: linkData.collectionIds || [],
        visibility: linkData.isPublic !== false ? 'public' : 'private',
        visibilityRoles: linkData.visibilityRoles || [],
        visibilityMemberIds: linkData.visibilityMemberIds || [],
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

// Fetch initial data
const loadData = async () => {
  if (!workspaceId.value || !smartLinkId.value) {
    return
  }

  try {
    await Promise.all([
      fetchSmartLinkData(),
      fetchCollections({ force: true }),
      fetchDomains(),
      fetchWorkspaceMembers(),
    ])
  } catch (error) {
    console.error('[Edit SmartLink Page] Error loading data:', error)
  }
}

onMounted(() => {
  loadData()
})

watch([workspaceId, smartLinkId], () => {
  loadData()
}, { immediate: false })

const toggleCollection = (collectionId: string) => {
  const index = formData.value.collectionIds.indexOf(collectionId)
  if (index > -1) {
    formData.value.collectionIds.splice(index, 1)
  } else {
    formData.value.collectionIds.push(collectionId)
  }
}

const toggleVisibilityRole = (role: string) => {
  const index = formData.value.visibilityRoles.indexOf(role)
  if (index > -1) {
    formData.value.visibilityRoles.splice(index, 1)
  } else {
    formData.value.visibilityRoles.push(role)
  }
}

const toggleVisibilityMember = (memberId: string) => {
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

const validate = () => {
  errors.value = {}
  
  if (!formData.value.name.trim()) {
    errors.value.name = 'Name is required'
    return false
  }
  
  if (!formData.value.fallbackUrl.trim()) {
    errors.value.fallbackUrl = 'Fallback URL is required'
    return false
  }
  
  try {
    new URL(formData.value.fallbackUrl)
  } catch {
    errors.value.fallbackUrl = 'Enter a valid HTTP or HTTPS URL'
    return false
  }
  
  if (formData.value.hasPassword && !formData.value.password.trim()) {
    errors.value.password = 'Password is required'
    return false
  }
  
  if (formData.value.visibility === 'private') {
    if (formData.value.visibilityRoles.length === 0 && formData.value.visibilityMemberIds.length === 0) {
      errors.value.visibility = 'Select at least one role or member'
      return false
    }
  }
  
  return true
}

// Save changes
const handleSave = async () => {
  if (!validate()) return

  isSaving.value = true
  try {
    const result = await updateSmartLink(smartLinkId.value, {
      name: formData.value.name.trim(),
      description: formData.value.description?.trim() || null,
      fallbackUrl: formData.value.fallbackUrl.trim(),
      isOneTime: formData.value.isOneTime,
      expiresAt: toIsoString(formData.value.expiresAt),
      clickLimit: formData.value.clickLimit,
      password: formData.value.hasPassword ? (formData.value.password?.trim() || null) : null,
      domainType: formData.value.domainType,
      domainValue: formData.value.domainValue,
      customAlias: formData.value.customAlias?.trim() || null,
      collectionIds: formData.value.collectionIds.length > 0 ? formData.value.collectionIds : undefined,
      isPublic: formData.value.visibility === 'public',
      visibilityRoles: formData.value.visibility === 'private' && formData.value.visibilityRoles.length > 0 ? formData.value.visibilityRoles : undefined,
      visibilityMemberIds: formData.value.visibility === 'private' && formData.value.visibilityMemberIds.length > 0 ? formData.value.visibilityMemberIds : undefined,
    })
    
    if (result) {
      toaster.add({
        title: 'Success',
        description: 'SmartLink has been updated successfully.',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })
      router.push('/dashboard/url-shortener/smart-links')
    }
  } catch (error: any) {
    console.error('[Edit SmartLink] Error updating:', error)
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to update SmartLink',
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
  router.push('/dashboard/url-shortener/smart-links')
}

const filteredWorkspaceMembers = computed(() => {
  if (!memberSearch.value.trim()) {
    return workspaceMembers.value
  }
  const search = memberSearch.value.toLowerCase()
  return workspaceMembers.value.filter(member =>
    member.displayName?.toLowerCase().includes(search) ||
    member.email?.toLowerCase().includes(search)
  )
})

const visibilityRoleOptions = [
  { value: 'Owner', label: 'Owner', description: 'Full workspace access' },
  { value: 'Admin', label: 'Admin', description: 'Manage workspace settings' },
  { value: 'Editor', label: 'Editor', description: 'Create & edit assigned links' },
  { value: 'Viewer', label: 'Viewer', description: 'View-only access' },
]

const domains = computed(() => {
  const defaultDomain = { label: 'snap.ly', domainType: 'default', domainValue: null }
  return [defaultDomain, ...domainOptions.value]
})

const defaultDomainOption = computed(() => domains.value.find(domain => domain.domainType === 'default'))
const workspaceSubdomains = computed(() => domains.value.filter(domain => domain.domainType === 'subdomain'))
const workspaceCustomDomains = computed(() => domains.value.filter(domain => domain.domainType === 'custom'))

const isDomainSelected = (option: { domainType: string; domainValue: string | null }) => {
  if (option.domainType === 'default') {
    return formData.value.domainType === 'default'
  }
  return (
    formData.value.domainType === option.domainType &&
    formData.value.domainValue === option.domainValue
  )
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
          Edit SmartLink
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Update your SmartLink settings and rules
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
      <!-- Basic Information -->
      <BaseCard class="p-6 space-y-4">
        <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-white">
          Basic Information
        </BaseHeading>
        
        <TairoFormGroup label="Name" :error="errors.name">
          <TairoInput
            v-model="formData.name"
            placeholder="My SmartLink"
            rounded="lg"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Description" :error="errors.description">
          <TairoInput
            v-model="formData.description"
            placeholder="Describe your SmartLink"
            rounded="lg"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Fallback URL" :error="errors.fallbackUrl">
          <TairoInput
            v-model="formData.fallbackUrl"
            placeholder="https://example.com"
            icon="solar:link-linear"
            rounded="lg"
          />
        </TairoFormGroup>
      </BaseCard>

      <!-- Domain & Alias -->
      <BaseCard class="p-6 space-y-4">
        <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-white">
          Domain & Alias
        </BaseHeading>
        
        <div class="space-y-4">
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

          <div v-if="workspaceSubdomains.length > 0" class="space-y-3">
            <BaseParagraph size="sm" weight="medium" class="text-muted-600 dark:text-muted-300">
              Workspace subdomains
            </BaseParagraph>
            <div class="grid gap-3 md:grid-cols-2">
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
          </div>

          <div v-if="workspaceCustomDomains.length > 0" class="space-y-3">
            <BaseParagraph size="sm" weight="medium" class="text-muted-600 dark:text-muted-300">
              Workspace custom domains
            </BaseParagraph>
            <div class="grid gap-3 md:grid-cols-2">
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
          </div>
        </div>

        <TairoFormGroup label="Custom Alias (optional)" :error="errors.customAlias">
          <TairoInput
            v-model="formData.customAlias"
            placeholder="my-smartlink"
            icon="ph:hash"
            rounded="lg"
          />
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
            Leave empty to use auto-generated code
          </BaseParagraph>
        </TairoFormGroup>
      </BaseCard>

      <!-- Limits & Security -->
      <BaseCard class="p-6 space-y-4">
        <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-white">
          Limits & Security
        </BaseHeading>

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

        <TairoFormGroup label="Click Limit (optional)">
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

        <div class="flex items-center justify-between p-4 rounded-lg border border-muted-200 dark:border-muted-700">
          <div>
            <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-800 dark:text-white">
              Password protection
            </BaseHeading>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              Require a password before redirecting visitors
            </BaseParagraph>
          </div>
          <BaseSwitchBall v-model="formData.hasPassword" variant="primary" />
        </div>

        <TairoFormGroup
          v-if="formData.hasPassword"
          label="Password"
          :error="errors.password"
        >
          <TairoInput
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Set an access password"
            icon="solar:lock-password-linear"
            rounded="lg"
          />
        </TairoFormGroup>
      </BaseCard>

      <!-- Rules Info -->
      <BaseCard class="p-6">
        <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-white mb-4">
          Routing Rules
        </BaseHeading>
        <BaseAlert
          color="info"
          variant="pastel"
          class="rounded-xl mb-4"
        >
          <template #title>
            Rules cannot be edited here
          </template>
          <p class="text-sm text-muted-600 dark:text-muted-300">
            SmartLink has {{ smartLink.rules?.length || 0 }} active rule(s). To modify rules, please recreate the SmartLink using the wizard.
          </p>
        </BaseAlert>
        
        <div v-if="smartLink.rules && smartLink.rules.length > 0" class="space-y-3">
          <div
            v-for="(rule, index) in smartLink.rules"
            :key="rule.id || index"
            class="p-4 rounded-lg border border-muted-200 dark:border-muted-700 bg-muted-50/50 dark:bg-muted-800/30"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2">
                <BaseTag
                  :color="rule.isActive ? 'success' : 'muted'"
                  size="sm"
                >
                  {{ rule.isActive ? 'Active' : 'Inactive' }}
                </BaseTag>
                <BaseText size="sm" weight="semibold" class="text-muted-700 dark:text-muted-200">
                  Rule {{ index + 1 }}
                </BaseText>
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  Priority: {{ rule.priority }}
                </BaseText>
              </div>
            </div>
            <div class="space-y-2">
              <div>
                <BaseText size="xs" weight="medium" class="text-muted-500 dark:text-muted-400 uppercase tracking-wide">
                  Condition
                </BaseText>
                <BaseText size="sm" class="text-muted-700 dark:text-muted-200 mt-1">
                  {{ rule.summary || `${rule.conditionType}` }}
                </BaseText>
              </div>
              <div v-if="rule.targetUrl">
                <BaseText size="xs" weight="medium" class="text-muted-500 dark:text-muted-400 uppercase tracking-wide">
                  Target URL
                </BaseText>
                <BaseText size="sm" class="text-primary-600 dark:text-primary-400 mt-1 break-all">
                  {{ rule.targetUrl }}
                </BaseText>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-muted-500 dark:text-muted-400">
          <Icon name="ph:info" class="size-8 mx-auto mb-2 opacity-50" />
          <BaseText size="sm">No routing rules configured</BaseText>
        </div>
      </BaseCard>

      <!-- Collections -->
      <BaseCard class="p-6 space-y-4">
        <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-white">
          Collections
        </BaseHeading>
        <div v-if="collectionsList.length === 0" class="text-sm text-muted-500 dark:text-muted-400">
          No collections available. Create one from the collections page.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="collection in collectionsList"
            :key="collection.id"
            class="flex items-center gap-3 p-3 rounded-lg border border-muted-200 dark:border-muted-700 cursor-pointer hover:bg-muted-50 dark:hover:bg-muted-800/40 transition-colors"
            @click="toggleCollection(collection.id)"
          >
            <BaseCheckbox
              :model-value="formData.collectionIds.includes(collection.id)"
              rounded="sm"
              color="primary"
            />
            <div class="flex-1">
              <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-white">
                {{ collection.name }}
              </BaseText>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                {{ collection.description || 'No description' }}
              </BaseParagraph>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Visibility -->
      <BaseCard class="p-6 space-y-4">
        <BaseHeading as="h3" size="lg" weight="semibold" class="text-muted-800 dark:text-white">
          Visibility & Access
        </BaseHeading>

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

        <div v-if="formData.visibility === 'private'" class="space-y-4">
          <BaseCard class="p-5">
            <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-800 dark:text-white mb-4">
              Allow workspace roles
            </BaseHeading>
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
            <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-800 dark:text-white mb-4">
              Invite specific teammates
            </BaseHeading>
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
            </div>
          </BaseCard>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

