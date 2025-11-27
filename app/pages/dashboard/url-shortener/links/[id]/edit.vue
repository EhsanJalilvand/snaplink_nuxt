<script setup lang="ts">
import { computed, ref, watch, onMounted } from '#imports'
import type { UpdateLinkRequest, ShortenerLink } from '~/types/url-shortener'
import { useUrlShortenerLinks } from '~/composables/useUrlShortenerLinks'
import { useUrlShortenerCollections } from '~/composables/useUrlShortenerCollections'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import { useWorkspaceDomains } from '~/composables/useWorkspaceDomains'
import { useWorkspaceMembers } from '~/composables/useWorkspaceMembers'

definePageMeta({
  title: 'Edit Link',
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()
const toaster = useNuiToasts()

console.log('[Edit Link Page] Initializing...', { route: route.path, params: route.params })

const { workspaceId } = useWorkspaceContext()
const { getLink, updateLink, copyLink } = useUrlShortenerLinks()
const { items: collectionsList, fetchCollections } = useUrlShortenerCollections()
const { domainOptions, fetchDomains } = useWorkspaceDomains()
const { members: workspaceMembers, fetchMembers: fetchWorkspaceMembers, isLoading: isLoadingMembers } = useWorkspaceMembers()

const linkId = computed(() => {
  const id = route.params.id as string
  console.log('[Edit Link Page] linkId computed:', id)
  return id
})
const isLoading = ref(false)
const isSaving = ref(false)
const link = ref<ShortenerLink | null>(null)
const existingPassword = ref(false)

console.log('[Edit Link Page] workspaceId:', workspaceId.value)

// Form data
const formData = ref<UpdateLinkRequest>({
  title: null,
  description: null,
  password: null,
  expiresAt: null,
  clickLimit: null,
  isPublic: true,
  visibilityRoles: [],
  visibilityMemberIds: [],
  isOneTime: false,
  domainType: 'default',
  domainValue: null,
  customAlias: null,
  collectionIds: [],
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

const tabs = [
  { key: 'basics', label: 'Basics', description: 'Original + title' },
  { key: 'visibility', label: 'Visibility', description: 'Roles & teammates' },
  { key: 'limits', label: 'Limits', description: 'Security & expiration' },
  { key: 'domain', label: 'Domain', description: 'Domain & alias' },
  { key: 'organization', label: 'Collections', description: 'Organize links' },
]
const activeTab = ref(tabs[0].key)

watch(() => formData.value.isPublic, (isPublic) => {
  if (isPublic) {
    formData.value.visibilityRoles = []
    formData.value.visibilityMemberIds = []
    delete errors.value.visibility
  }
})

// Available domains
const domains = computed(() => {
  const defaultDomain = { value: 'snap.ly', label: 'snap.ly', domainType: 'default', domainValue: null }
  return [defaultDomain, ...domainOptions.value]
})
const defaultDomainOption = computed(() => domains.value.find(domain => domain.domainType === 'default'))
const workspaceSubdomains = computed(() => domainOptions.value.filter(domain => domain.domainType === 'subdomain'))
const workspaceCustomDomains = computed(() => domainOptions.value.filter(domain => domain.domainType === 'custom'))

// Available collections
const collections = computed(() => {
  return collectionsList.value.map(c => ({
    id: c.id,
    name: c.name,
  }))
})

const visibilityRoleOptions = [
  { value: 'Owner', label: 'Owner', description: 'Full control' },
  { value: 'Admin', label: 'Admin', description: 'Manage links & collections' },
  { value: 'Member', label: 'Editor', description: 'Create and edit assigned links' },
  { value: 'Viewer', label: 'Viewer', description: 'View-only' },
]

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
  const selected = formData.value.visibilityRoles ?? []
  return visibilityRoleOptions
    .filter(option => selected.includes(option.value))
    .map(option => option.label)
})

const selectedMembers = computed(() => {
  if (!formData.value.visibilityMemberIds?.length) {
    return []
  }
  const selectedSet = new Set(formData.value.visibilityMemberIds)
  return workspaceMembers.value.filter(member => selectedSet.has(member.id))
})

// Fetch link data
const fetchLinkData = async () => {
  console.log('[Edit Link Page] fetchLinkData called', { linkId: linkId.value, workspaceId: workspaceId.value })
  
  if (!linkId.value || !workspaceId.value) {
    console.log('[Edit Link Page] Missing linkId or workspaceId, skipping fetch')
    return
  }

  isLoading.value = true
  try {
    console.log('[Edit Link Page] Calling getLink...')
    const linkData = await getLink(linkId.value)
    console.log('[Edit Link Page] getLink result:', linkData)
    
    if (linkData) {
      link.value = linkData
        existingPassword.value = linkData.hasPassword === true
      
      // Populate form
      formData.value = {
        title: linkData.title || null,
        description: linkData.description || null,
        password: null, // Don't populate password
          expiresAt: formatDateTimeLocal(linkData.expiresAt ?? null),
        clickLimit: linkData.clickLimit || null,
        isPublic: linkData.isPublic ?? true,
        visibilityRoles: linkData.visibilityRoles ?? [],
        visibilityMemberIds: linkData.visibilityMemberIds ?? [],
        isOneTime: linkData.isOneTime ?? false,
        domainType: linkData.domainType || 'default',
        domainValue: linkData.domainValue || null,
        customAlias: linkData.customAlias || null,
        collectionIds: linkData.collectionIds || [],
      }
    } else {
      toaster.add({
        title: 'Error',
        description: 'Link not found',
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
      router.push('/dashboard/url-shortener/links')
    }
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to load link',
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
  console.log('[Edit Link Page] loadData called', { workspaceId: workspaceId.value, linkId: linkId.value })
  
  if (!workspaceId.value || !linkId.value) {
    console.log('[Edit Link Page] Missing workspaceId or linkId, skipping load')
    return
  }

  try {
    console.log('[Edit Link Page] Starting to fetch data...')
    await Promise.all([
      fetchLinkData(),
      fetchCollections({ force: true }),
      fetchDomains(),
      fetchWorkspaceMembers(),
    ])
    console.log('[Edit Link Page] Data loaded successfully')
  } catch (error) {
    console.error('[Edit Link Page] Error loading edit page data:', error)
  }
}

onMounted(() => {
  console.log('[Edit Link Page] onMounted called')
  loadData()
})

watch([workspaceId, linkId], () => {
  loadData()
}, { immediate: false })

// Toggle collection selection
const toggleCollection = (collectionId: string) => {
  const index = formData.value.collectionIds?.indexOf(collectionId) ?? -1
  if (index > -1) {
    formData.value.collectionIds?.splice(index, 1)
  } else {
    if (!formData.value.collectionIds) {
      formData.value.collectionIds = []
    }
    formData.value.collectionIds.push(collectionId)
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

// Validate form
const validate = (): boolean => {
  errors.value = {}

  if (formData.value.customAlias && formData.value.customAlias.length < 3) {
    errors.value.customAlias = 'Custom alias must be at least 3 characters'
    return false
  }

  if (formData.value.clickLimit !== null && formData.value.clickLimit < 1) {
    errors.value.clickLimit = 'Click limit must be at least 1'
    return false
  }

  if (formData.value.isPublic === false) {
    const roles = formData.value.visibilityRoles?.length ?? 0
    const members = formData.value.visibilityMemberIds?.length ?? 0
    if (!roles && !members) {
      errors.value.visibility = 'Select at least one role or teammate for private links'
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
    const payload: UpdateLinkRequest = {
      ...formData.value,
      expiresAt: toIsoString(formData.value.expiresAt),
      password: formData.value.password?.trim() ? formData.value.password : null,
      customAlias: formData.value.customAlias?.trim() ? formData.value.customAlias.trim() : null,
      description: formData.value.description?.trim() ? formData.value.description.trim() : null,
      title: formData.value.title?.trim() ? formData.value.title.trim() : null,
    }

    const result = await updateLink(linkId.value, payload)
    if (result) {
      toaster.add({
        title: 'Success',
        description: 'Link updated successfully',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })
      router.push('/dashboard/url-shortener/links')
    }
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to update link',
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
  router.push('/dashboard/url-shortener/links')
}

const isLinkActive = computed(() => link.value?.linkStatus?.toLowerCase() === 'active')

const toggleLinkStatus = async () => {
  if (!link.value) {
    return
  }

  const desiredState = !isLinkActive.value

  try {
    const result = await updateLink(linkId.value, { isActive: desiredState })
    if (result) {
      link.value = result
      await fetchLinkData()
      toaster.add({
        title: desiredState ? 'Link activated' : 'Link paused',
        description: desiredState ? 'Link is now live.' : 'Visitors will no longer be redirected.',
        icon: desiredState ? 'ph:play' : 'ph:pause',
        color: desiredState ? 'success' : 'warning',
        progress: true,
      })
    }
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Unable to update link status',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  }
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
          Edit Link
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
    <div v-else-if="!link && !isLoading" class="flex flex-col items-center justify-center py-12">
      <BaseHeading as="h2" size="xl" weight="semibold" class="text-muted-900 dark:text-white mb-2">
        Link not found
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-4">
        The link you're looking for doesn't exist or you don't have permission to view it.
      </BaseParagraph>
      <BaseButton variant="primary" @click="handleCancel">
        Back to Links
      </BaseButton>
    </div>

    <!-- Form -->
    <div v-else-if="link" class="space-y-6">
      <!-- Hero URLs & Stats -->
      <div class="space-y-6 pb-4 border-b border-muted-200 dark:border-muted-800">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
          <div class="flex-1 space-y-1">
            <BaseParagraph size="xs" class="uppercase tracking-[0.3em] text-muted-500 dark:text-muted-400">
              Destination URL
            </BaseParagraph>
            <div class="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <BaseText
                size="lg"
                weight="semibold"
                class="text-muted-900 dark:text-white leading-relaxed break-words"
              >
                {{ link.destinationUrl }}
              </BaseText>
              <BaseButton
                variant="outline"
                size="sm"
                class="shrink-0"
                @click="() => window.open(link.destinationUrl, '_blank')"
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
                :title="link.shortUrl"
              >
                {{ link.shortUrl }}
              </BaseHeading>
              <BaseButton
                class="shrink-0 min-w-[130px] bg-transparent shadow-none border-none"
                size="sm"
                variant="ghost"
                :style="isLinkActive
                  ? { color: '#dc2626' }
                  : { color: '#16a34a' }"
                @click="toggleLinkStatus"
                :aria-pressed="isLinkActive"
              >
                <Icon :name="isLinkActive ? 'ph:power-bold' : 'ph:play-circle-bold'" class="size-5" />
                <span>{{ isLinkActive ? 'Disable' : 'Enable' }}</span>
              </BaseButton>
              <BaseParagraph
                size="xs"
                class="text-muted-500 dark:text-muted-400 ms-auto"
              >
                Created {{ new Date(link.createdAt).toLocaleDateString() }}
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

      <!-- Basics Tab -->
      <BaseCard v-if="activeTab === 'basics'" class="p-6">
        <div class="space-y-6">
          <div>
            <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
              Basics
            </BaseHeading>
            <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
              Update the title and description of your link
            </BaseParagraph>
          </div>

          <TairoFormGroup label="Title">
            <TairoInput
              v-model="formData.title"
              type="text"
              placeholder="Enter link title"
              icon="solar:pen-linear"
              rounded="lg"
            />
          </TairoFormGroup>

          <TairoFormGroup label="Description">
            <textarea
              v-model="formData.description"
              placeholder="Enter link description"
              rows="4"
              class="w-full px-4 py-3 rounded-lg border border-muted-300 dark:border-muted-600 bg-white dark:bg-muted-800 text-muted-800 dark:text-muted-100 placeholder:text-muted-400 dark:placeholder:text-muted-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200 resize-none"
            />
          </TairoFormGroup>

          <TairoFormGroup label="Custom Alias" :error="errors.customAlias">
            <TairoInput
              v-model="formData.customAlias"
              type="text"
              placeholder="my-campaign-link"
              icon="solar:pen-linear"
              rounded="lg"
            />
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
              Leave empty to use the generated short code.
            </BaseParagraph>
          </TairoFormGroup>
        </div>
      </BaseCard>

      <!-- Visibility Tab -->
      <BaseCard v-else-if="activeTab === 'visibility'" class="p-6 space-y-6">
        <div>
          <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
            Visibility & Access
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            Decide who can see and manage this link inside your workspace
          </BaseParagraph>
        </div>

        <TairoFormGroup label="Visibility">
          <div class="flex gap-4">
            <button
              type="button"
              class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium text-left"
              :class="
                formData.isPublic
                  ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
              "
              @click="formData.isPublic = true"
            >
              <div class="font-medium mb-1">Public</div>
              <div class="text-xs opacity-75">Anyone with the link can access it</div>
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium text-left"
              :class="
                !formData.isPublic
                  ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
              "
              @click="formData.isPublic = false"
            >
              <div class="font-medium mb-1">Private</div>
              <div class="text-xs opacity-75">Restrict access to selected roles or teammates</div>
            </button>
          </div>
        </TairoFormGroup>

        <div v-if="!formData.isPublic" class="space-y-6">
          <BaseCard class="p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-800 dark:text-white">
                  Allow workspace roles
                </BaseHeading>
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                  Members with these roles can manage this link
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
                (formData.visibilityRoles ?? []).includes(option.value)
                  ? 'border-emerald-600 dark:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'border-muted-300 dark:border-muted-600 text-muted-700 dark:text-muted-200 hover:border-emerald-400/60'
              "
              @click="toggleVisibilityRole(option.value)"
            >
              <div class="flex items-center justify-between">
                <BaseText weight="semibold" size="sm">{{ option.label }}</BaseText>
                <Icon
                  v-if="formData.visibilityRoles?.includes(option.value)"
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

        <BaseCard class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-800 dark:text-white">
                Invite teammates
              </BaseHeading>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                Only selected members can view analytics or edit this link
              </BaseParagraph>
            </div>
            <BaseTag
              v-if="formData.visibilityMemberIds?.length"
              size="sm"
              variant="pastel"
              color="primary"
            >
              {{ formData.visibilityMemberIds.length }} selected
            </BaseTag>
          </div>

          <div class="flex items-center gap-2">
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
                :model-value="formData.visibilityMemberIds?.includes(member.id) ?? false"
                rounded="sm"
                color="primary"
                @update:model-value="toggleVisibilityMember(member.id)"
                @click.stop
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
          v-if="(formData.visibilityRoles?.length ?? 0) || (formData.visibilityMemberIds?.length ?? 0)"
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

    <!-- Limits Tab -->
    <BaseCard v-else-if="activeTab === 'limits'" class="p-6 space-y-6">
      <div>
        <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
          Limits & Security
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Configure expiration, password, and click limits
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
            <div class="text-xs opacity-75">Link expires after first use</div>
          </button>
        </div>
      </TairoFormGroup>

      <TairoFormGroup label="Expiration Date" :error="errors.expiresAt">
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
              {{ existingPassword ? 'Link is currently password protected. Enter a new password to replace it.' : 'Set a password to protect this link (leave empty to keep current)' }}
            </BaseParagraph>
          </div>
          <BaseButton variant="ghost" icon @click="showPassword = !showPassword">
            <Icon :name="showPassword ? 'ph:eye-slash' : 'ph:eye'" class="size-4" />
          </BaseButton>
        </div>
        <TairoInput
          v-model="formData.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Enter new password"
          icon="solar:lock-password-linear"
          rounded="lg"
        />
      </BaseCard>

      <TairoFormGroup label="Click limit" :error="errors.clickLimit">
        <TairoInput
          v-model.number="formData.clickLimit"
          type="number"
          min="1"
          placeholder="Enter click limit"
          icon="solar:mouse-linear"
          rounded="lg"
        />
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
          Link will be disabled after reaching this number of clicks
        </BaseParagraph>
      </TairoFormGroup>
    </BaseCard>

    <!-- Domain Tab -->
    <BaseCard v-else-if="activeTab === 'domain'" class="p-6 space-y-6">
      <div>
        <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
          Domain & Custom Alias
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Choose the domain visitors see and optionally set a custom alias
        </BaseParagraph>
      </div>

      <div class="space-y-3">
        <BaseParagraph size="sm" weight="medium" class="text-muted-600 dark:text-muted-300">
          Default domain
        </BaseParagraph>
        <div class="grid gap-3 md:grid-cols-2">
        <BaseCard
          v-if="defaultDomainOption"
          class="p-4 border-2 transition-all cursor-pointer"
          :class="isDomainSelected(defaultDomainOption) ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20' : 'border-muted-200 dark:border-muted-700 hover:border-primary-300'"
          @click="selectDomainOption({ domainType: 'default', domainValue: null })"
        >
          <div class="flex items-center justify-between">
            <div>
              <BaseHeading as="h5" size="sm" weight="semibold">snap.ly</BaseHeading>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">Managed by Snaplink</BaseParagraph>
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
            :class="isDomainSelected({ domainType: 'subdomain', domainValue: domain.domainValue }) ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20' : 'border-muted-200 dark:border-muted-700 hover:border-primary-300'"
            @click="selectDomainOption({ domainType: 'subdomain', domainValue: domain.domainValue })"
          >
            <div class="flex items-center justify-between">
              <div>
                <BaseHeading as="h5" size="sm" weight="semibold">{{ domain.label }}</BaseHeading>
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">Verified subdomain</BaseParagraph>
              </div>
              <Icon
                v-if="isDomainSelected({ domainType: 'subdomain', domainValue: domain.domainValue })"
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
            :class="isDomainSelected({ domainType: 'custom', domainValue: domain.domainValue }) ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20' : 'border-muted-200 dark:border-muted-700 hover:border-primary-300'"
            @click="selectDomainOption({ domainType: 'custom', domainValue: domain.domainValue })"
          >
            <div class="flex items-center justify-between">
              <div>
                <BaseHeading as="h5" size="sm" weight="semibold">{{ domain.label }}</BaseHeading>
                <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">Custom domain</BaseParagraph>
              </div>
              <Icon
                v-if="isDomainSelected({ domainType: 'custom', domainValue: domain.domainValue })"
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
    </BaseCard>

    <!-- Organization Tab -->
    <BaseCard v-else-if="activeTab === 'organization'" class="p-6 space-y-6">
      <div>
        <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
          Collections
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Organize your link into one or more collections
        </BaseParagraph>
      </div>

      <div class="space-y-2 max-h-64 overflow-y-auto border border-muted-200 dark:border-muted-700 rounded-lg p-3">
        <div
          v-for="collection in collections"
          :key="collection.id"
          class="flex items-center gap-3 p-2 rounded-lg hover:bg-muted-50 dark:hover:bg-muted-800/50 cursor-pointer transition-colors"
          @click="toggleCollection(collection.id)"
        >
          <BaseCheckbox
            :model-value="formData.collectionIds?.includes(collection.id) ?? false"
            rounded="sm"
            color="primary"
            @update:model-value="toggleCollection(collection.id)"
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
    </BaseCard>

  </div>
  </div>
</template>

