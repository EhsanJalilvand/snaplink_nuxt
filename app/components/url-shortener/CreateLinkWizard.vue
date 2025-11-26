<script setup lang="ts">
import type { CreateLinkRequest } from '~/types/url-shortener'
import { useUrlShortenerLinks } from '~/composables/useUrlShortenerLinks'
import { useUrlShortenerCollections } from '~/composables/useUrlShortenerCollections'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import { useWorkspaceMembers } from '~/composables/useWorkspaceMembers'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'close': []
  'created': [link: any]
}>()

const toaster = useNuiToasts()

const isOpen = computed({
  get: () => props.open,
  set: (value) => {
    emit('update:open', value)
    if (!value) {
      emit('close')
      // Reset form when modal closes
      currentStep.value = 1
      formData.value = {
        originalUrl: '',
        visibility: 'public',
        visibilityRoles: [],
        visibilityMemberIds: [],
        type: 'permanent',
        expiresAt: null,
        hasPassword: false,
        password: '',
        domain: 'snap.ly',
        domainType: 'default',
        domainValue: null,
        customAlias: '',
        collectionIds: [],
        description: '',
        clickLimit: null,
      }
      errors.value = {}
      shortLink.value = ''
    }
  },
})

const currentStep = ref(1)
const totalSteps = 6
const isLoading = ref(false)

// Form data
const formData = ref({
  // Step 1: Original URL
  originalUrl: '',
  
  // Step 2: Settings
  visibility: 'public', // 'public' | 'private'
  visibilityRoles: [] as string[],
  visibilityMemberIds: [] as string[],
  type: 'permanent', // 'permanent' | 'one-time'
  expiresAt: null as string | null,
  hasPassword: false,
  password: '',
  domain: 'snap.ly',
  domainType: 'default' as string,
  domainValue: null as string | null,
  customAlias: '',
  collectionIds: [] as string[],
  description: '',
  clickLimit: null as number | null,
})

// Generated short link
const shortLink = ref('')
const showQRModal = ref(false)

// Available domains from workspace
const { domainOptions, fetchDomains: fetchWorkspaceDomains } = useWorkspaceDomains()
const { members: workspaceMembers, fetchMembers: fetchWorkspaceMembers, isLoading: isLoadingMembers } = useWorkspaceMembers()

// Default domain + workspace domains
const domains = computed(() => {
  const defaultDomain = { value: 'snap.ly', label: 'snap.ly', domainType: 'default', domainValue: null }
  return [defaultDomain, ...domainOptions.value]
})

const defaultDomainOption = computed(() => domains.value.find(domain => domain.domainType === 'default'))
const workspaceSubdomains = computed(() => domains.value.filter(domain => domain.domainType === 'subdomain'))
const workspaceCustomDomains = computed(() => domains.value.filter(domain => domain.domainType === 'custom'))

// Collections from API
const { items: collectionsList, fetchCollections } = useUrlShortenerCollections()
const collections = computed(() => {
  return collectionsList.value.map(c => ({
    id: c.id,
    name: c.name,
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

// Fetch workspace domains and collections on mount and when wizard opens
const fetchData = async () => {
  await Promise.all([
    fetchWorkspaceDomains(),
    fetchCollections({ force: true }),
    fetchWorkspaceMembers(),
  ])
}

onMounted(async () => {
  await fetchData()
})

// Refetch when wizard opens
watch(isOpen, (newValue) => {
  if (newValue) {
    fetchData()
  }
}, { immediate: false })

const errors = ref<Record<string, string>>({})

watch(() => formData.value.visibility, (newValue) => {
  if (newValue === 'public') {
    formData.value.visibilityRoles = []
    formData.value.visibilityMemberIds = []
    delete errors.value.visibility
  }
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

const validateStep1 = () => {
  errors.value = {}
  if (!formData.value.originalUrl.trim()) {
    errors.value.originalUrl = 'Please enter a URL'
    return false
  }
  
  try {
    new URL(formData.value.originalUrl)
  } catch {
    errors.value.originalUrl = 'Please enter a valid URL'
    return false
  }
  
  return true
}

const validateVisibilityStep = () => {
  errors.value = {}

  if (formData.value.visibility === 'private') {
    if (formData.value.visibilityRoles.length === 0 && formData.value.visibilityMemberIds.length === 0) {
      errors.value.visibility = 'Select at least one role or member to access this link'
      return false
    }
  }

  return true
}

const validateLimitsStep = () => {
  errors.value = {}

  if (formData.value.hasPassword && !formData.value.password.trim()) {
    errors.value.password = 'Please enter a password'
    return false
  }

  if (formData.value.type === 'one-time' && !formData.value.expiresAt) {
    errors.value.expiresAt = 'Please select an expiration date'
    return false
  }

  return true
}

const validateDomainStep = () => {
  errors.value = {}

  if (!formData.value.domainType) {
    errors.value.domain = 'Please select a domain'
    return false
  }

  return true
}

const nextStep = async () => {
  if (currentStep.value === 1) {
    if (!validateStep1()) return
    await fetchData()
  } else if (currentStep.value === 2) {
    if (!validateVisibilityStep()) return
  } else if (currentStep.value === 3) {
    if (!validateLimitsStep()) return
  } else if (currentStep.value === 4) {
    if (!validateDomainStep()) return
  }

  if (currentStep.value < 5) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const { createLink: createLinkApi } = useUrlShortenerLinks()
const { workspaceId } = useWorkspaceContext()

const createLink = async () => {
  if (!validateLimitsStep() || !validateDomainStep()) {
    return
  }

  isLoading.value = true
  try {
    // Determine domain type and value from selected domain
    const selectedDomain = domains.value.find(d => d.value === formData.value.domain)
    const domainType = selectedDomain?.domainType === 'default' ? 'default' : (selectedDomain?.domainType === 'subdomain' ? 'subdomain' : 'custom')
    const domainValue = selectedDomain?.domainValue || (domainType !== 'default' ? formData.value.domain : null)

    // Map form data to CreateLinkRequest
    const request: CreateLinkRequest = {
      collectionIds: formData.value.collectionIds.length > 0 ? formData.value.collectionIds : null,
      destinationUrl: formData.value.originalUrl,
      title: formData.value.description || null,
      description: formData.value.description || null,
      linkType: 'urlShortener',
      customAlias: formData.value.customAlias || null,
      domainType,
      domainValue,
      password: formData.value.hasPassword ? formData.value.password : null,
      expiresAt: formData.value.expiresAt ? new Date(formData.value.expiresAt).toISOString() : null,
      clickLimit: formData.value.clickLimit || null,
      isOneTime: formData.value.type === 'one-time',
      isPublic: formData.value.visibility === 'public',
      visibilityRoles:
        formData.value.visibility === 'private' && formData.value.visibilityRoles.length > 0
          ? formData.value.visibilityRoles
          : null,
      visibilityMemberIds:
        formData.value.visibility === 'private' && formData.value.visibilityMemberIds.length > 0
          ? formData.value.visibilityMemberIds
          : null,
    }

    const result = await createLinkApi(request)

    if (result) {
      // Set short link from API response
      shortLink.value = result.shortUrl

      currentStep.value = 6
      
      // Emit created event
      emit('created', {
        id: result.id || Date.now().toString(),
        shortUrl: result.shortUrl,
        originalUrl: formData.value.originalUrl,
        ...formData.value,
      })
    }
  } catch (error: any) {
    const errorMessage = error?.data?.errors?.[0]?.message ?? error?.message ?? 'Failed to create link'
    toaster.add({
      title: 'Error',
      description: errorMessage,
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  } finally {
    isLoading.value = false
  }
}

const toggleCollection = (collectionId: string) => {
  const index = formData.value.collectionIds.indexOf(collectionId)
  if (index > -1) {
    formData.value.collectionIds.splice(index, 1)
  } else {
    formData.value.collectionIds.push(collectionId)
  }
}

const selectDomainOption = (option: { domainType: string; domainValue: string | null; label: string }) => {
  formData.value.domainType = option.domainType
  formData.value.domainValue = option.domainValue
  formData.value.domain = option.label
  if (errors.value.domain) {
    delete errors.value.domain
  }
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

const setOriginalUrl = (url: string) => {
  formData.value.originalUrl = url
  if (errors.value.originalUrl) {
    delete errors.value.originalUrl
  }
  if (currentStep.value !== 1) {
    currentStep.value = 1
  }
}

defineExpose({
  setOriginalUrl,
})

const copyLink = () => {
  navigator.clipboard.writeText(shortLink.value)
  toaster.add({
    title: 'Copied!',
    description: 'Link copied to clipboard',
    icon: 'ph:check',
    progress: true,
  })
}


const shareToSocial = (platform: string) => {
  const text = `Check out this link: ${shortLink.value}`
  let url = ''
  
  switch (platform) {
    case 'twitter':
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
      break
    case 'facebook':
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shortLink.value)}`
      break
    case 'linkedin':
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shortLink.value)}`
      break
    case 'whatsapp':
      url = `https://wa.me/?text=${encodeURIComponent(text)}`
      break
    case 'telegram':
      url = `https://t.me/share/url?url=${encodeURIComponent(shortLink.value)}&text=${encodeURIComponent(text)}`
      break
  }
  
  if (url) {
    window.open(url, '_blank', 'width=600,height=400')
  }
}

const handleClose = () => {
  isOpen.value = false
}

const finish = () => {
  emit('created', {
    id: Date.now().toString(),
    shortUrl: shortLink.value,
    originalUrl: formData.value.originalUrl,
    ...formData.value,
  })
  handleClose()
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
        class="fixed top-[5%] start-[50%] max-h-[90vh] w-[90vw] max-w-2xl translate-x-[-50%] rounded-lg overflow-hidden border border-muted-200 dark:border-muted-700 bg-white dark:bg-muted-800 focus:outline-none z-[100] transition-all duration-200 ease-out flex flex-col"
        @pointer-down-outside="handleClose"
        @escape-key-down="handleClose"
      >
        <!-- Header -->
        <div class="flex items-center justify-between w-full p-6 border-b border-muted-200 dark:border-muted-700">
          <div>
            <DialogTitle
              class="font-heading text-muted-900 text-xl font-bold leading-6 dark:text-white mb-2"
            >
              Create Short Link
            </DialogTitle>
            <DialogDescription class="text-sm text-muted-500 dark:text-muted-400">
              Step {{ currentStep }} of {{ totalSteps }}
            </DialogDescription>
          </div>
          <BaseButton
            size="sm"
            variant="ghost"
            @click="handleClose"
          >
            <Icon name="lucide:x" class="size-4" />
          </BaseButton>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Progress Bar -->
          <div class="mb-6">
            <div class="h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary-500 rounded-full transition-all duration-300"
                :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
              />
            </div>
          </div>

          <!-- Step 1: Original URL -->
          <div v-if="currentStep === 1" class="space-y-6">
            <div>
              <BaseHeading
                as="h3"
                size="lg"
                weight="semibold"
                class="text-muted-800 dark:text-muted-100 mb-2"
              >
                Enter Original URL
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                Enter the long URL you want to shorten
              </BaseParagraph>
            </div>

            <TairoFormGroup
              label="Original URL"
              :error="errors.originalUrl"
            >
              <TairoInput
                v-model="formData.originalUrl"
                type="url"
                placeholder="https://example.com/very/long/url"
                icon="solar:link-linear"
                rounded="lg"
                size="lg"
              />
            </TairoFormGroup>
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
                Decide who can discover and manage this link inside your workspace
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
                      Members with these roles can see and manage the link
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
                        ? 'border-primary-600 dark:border-primary-400 bg-primary-50/70 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'border-muted-300 dark:border-muted-600 text-muted-700 dark:text-muted-200 hover:border-primary-400/60'
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
                        class="size-4 text-primary-500"
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
                      Only selected members can view analytics or edit this link
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
                    formData.type === 'permanent'
                      ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
                  "
                  @click="formData.type = 'permanent'"
                >
                  <div class="font-medium mb-1">Permanent</div>
                  <div class="text-xs opacity-75">Link never expires</div>
                </button>
                <button
                  type="button"
                  class="flex-1 px-4 py-3 rounded-lg border transition-all text-sm font-medium text-left"
                  :class="
                    formData.type === 'one-time'
                      ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'border-muted-300 dark:border-muted-600 text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-700'
                  "
                  @click="formData.type = 'one-time'"
                >
                  <div class="font-medium mb-1">One-Time Use</div>
                  <div class="text-xs opacity-75">Link expires after first visit</div>
                </button>
              </div>
            </TairoFormGroup>

            <TairoFormGroup
              v-if="formData.type === 'one-time'"
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
                <BaseSwitchBall v-model="formData.hasPassword" variant="primary" />
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
                Add an alias, description, and categorize this link
              </BaseParagraph>
            </div>

            <TairoFormGroup label="Custom alias (optional)">
              <TairoInput
                v-model="formData.customAlias"
                placeholder="my-campaign-link"
                icon="solar:pen-linear"
                rounded="lg"
              />
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
                  v-for="collection in collections"
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
                  v-if="collections.length === 0"
                  class="text-center py-4 text-sm text-muted-500 dark:text-muted-400"
                >
                  No collections available. Create one first.
                </div>
              </div>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mt-2">
                Use collections to organize campaigns, clients, or channels
              </BaseParagraph>
            </TairoFormGroup>
          </div>

          <!-- Step 6: Success -->
          <div v-else-if="currentStep === 6" class="space-y-6">
            <div class="text-center">
              <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30">
                <Icon name="ph:check-circle" class="size-8 text-success-600 dark:text-success-400" />
              </div>
              <BaseHeading
                as="h3"
                size="lg"
                weight="semibold"
                class="text-muted-800 dark:text-muted-100 mb-2"
              >
                Link Created Successfully!
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-6">
                Your short link is ready to share
              </BaseParagraph>
            </div>

            <!-- Short Link Box -->
            <BaseCard class="p-6">
              <div class="flex items-center gap-2 mb-4">
                <Icon name="solar:link-linear" class="size-5 text-primary-600 dark:text-primary-400" />
                <BaseText size="sm" weight="semibold" class="text-muted-800 dark:text-muted-100">
                  Your Short Link
                </BaseText>
              </div>
              <div class="px-4 py-3 rounded-lg bg-muted-50 dark:bg-muted-800/50 border border-muted-200 dark:border-muted-700 text-muted-800 dark:text-muted-100 font-mono text-sm break-all mb-4">
                {{ shortLink }}
              </div>
              <div class="flex items-center gap-3">
                <BaseButton
                  variant="primary"
                  class="flex-1"
                  @click="copyLink"
                >
                  <Icon name="ph:copy" class="size-4" />
                  <span>Copy</span>
                </BaseButton>
                <BaseButton
                  variant="outline"
                  class="flex-1"
                  @click="showQRModal = true"
                >
                  <Icon name="solar:qr-code-linear" class="size-4" />
                  <span>QR Code</span>
                </BaseButton>
              </div>
            </BaseCard>

            <!-- Share Options -->
            <BaseCard class="p-6">
              <div class="flex items-center gap-3 mb-4">
                <Icon name="solar:share-linear" class="size-5 text-primary-600 dark:text-primary-400" />
                <BaseText size="sm" weight="medium" class="text-muted-500 dark:text-muted-400">
                  Share on Social Media
                </BaseText>
              </div>
              <div class="flex flex-wrap gap-2">
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
              </div>
            </BaseCard>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="flex items-center justify-between w-full p-6 border-t border-muted-200 dark:border-muted-700">
          <BaseButton
            v-if="currentStep > 1 && currentStep < 6"
            variant="outline"
            @click="prevStep"
          >
            <Icon name="lucide:chevron-left" class="size-4" />
            <span>Previous</span>
          </BaseButton>
          <div v-else />

          <div class="flex items-center gap-2">
            <BaseButton
              variant="ghost"
              @click="handleClose"
            >
              Cancel
            </BaseButton>
            <BaseButton
              v-if="currentStep < 5"
              variant="primary"
              @click="nextStep"
            >
              <span>Next</span>
              <Icon name="lucide:chevron-right" class="size-4" />
            </BaseButton>
            <BaseButton
              v-else-if="currentStep === 5"
              variant="primary"
              :disabled="isLoading"
              @click="createLink"
            >
              <Icon v-if="!isLoading" name="ph:check" class="size-4" />
              <Icon v-else name="svg-spinners:ring-resize" class="size-4" />
              <span>{{ isLoading ? 'Creating...' : 'Create Link' }}</span>
            </BaseButton>
            <BaseButton
              v-else-if="currentStep === 6"
              variant="primary"
              @click="finish"
            >
              <Icon name="ph:check" class="size-4" />
              <span>Done</span>
            </BaseButton>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>

  <!-- QR Code Modal -->
  <QRCodeModal
    :open="showQRModal"
    :url="shortLink"
    download-file-name="qrcode"
    description="Scan this QR code to access your link"
    @update:open="(value) => { showQRModal = value }"
  />
</template>
