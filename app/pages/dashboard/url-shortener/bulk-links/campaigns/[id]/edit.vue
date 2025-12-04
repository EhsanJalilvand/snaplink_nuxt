<script setup lang="ts">
import { computed, ref, onMounted, watch } from '#imports'
import type { BulkLinkCampaignDetail, BulkLinkTemplate } from '~/types/bulk-link'
import { useBulkLinkCampaigns } from '~/composables/useBulkLinkCampaigns'
import { useBulkLinkTemplates } from '~/composables/useBulkLinkTemplates'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import AddLinksToCampaignModal from '~/components/url-shortener/AddLinksToCampaignModal.vue'

definePageMeta({
  title: 'Edit Campaign',
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()
const toaster = useNuiToasts()

const { workspaceId } = useWorkspaceContext()
const { getCampaign, updateCampaign } = useBulkLinkCampaigns()
const { getTemplate, items: templates, fetchTemplates } = useBulkLinkTemplates()

const campaignId = computed(() => route.params.id as string)
const isLoading = ref(false)
const isSaving = ref(false)
const campaign = ref<BulkLinkCampaignDetail | null>(null)
const template = ref<BulkLinkTemplate | null>(null)
const showAddLinksModal = ref(false)

const tabs = [
  { key: 'basics', label: 'Basics', description: 'Name & description' },
  { key: 'template', label: 'Template Info', description: 'Template details' },
  { key: 'smartlinks', label: 'SmartLinks', description: 'Generated links' },
]
const activeTab = ref(tabs[0].key)

const errors = ref<Record<string, string>>({})

const formData = ref({
  name: '',
  description: '',
  isActive: true,
  templateId: '',
})

const fetchCampaignData = async () => {
  if (!campaignId.value || !workspaceId.value) return

  isLoading.value = true
  try {
    const data = await getCampaign(campaignId.value)
    if (data) {
      campaign.value = data
      
      formData.value = {
        name: data.name || '',
        description: data.description || '',
        isActive: data.isActive !== undefined ? data.isActive : true,
        templateId: data.templateId || '',
      }

      // Fetch template info
      if (data.templateId) {
        template.value = await getTemplate(data.templateId)
      }

      // Fetch all templates for dropdown
      await fetchTemplates({ force: true })
    } else {
      toaster.add({
        title: 'Error',
        description: 'Campaign not found',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      router.push('/dashboard/url-shortener/bulk-links')
    }
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to load campaign',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
  } finally {
    isLoading.value = false
  }
}

const handleSave = async () => {
  errors.value = {}
  
  if (!formData.value.name || !formData.value.name.trim()) {
    errors.value.name = 'Campaign name is required'
    activeTab.value = 'basics'
    return
  }

  if (!formData.value.templateId) {
    errors.value.template = 'Template is required'
    activeTab.value = 'template'
    return
  }

  isSaving.value = true
  try {
    await updateCampaign(campaignId.value, {
      name: formData.value.name?.trim() || undefined,
      description: formData.value.description?.trim() || undefined,
      isActive: formData.value.isActive,
      templateId: formData.value.templateId,
    })
    
    toaster.add({
      title: 'Success',
      description: 'Campaign updated successfully',
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })
    router.push('/dashboard/url-shortener/bulk-links')
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error?.message || 'Failed to update campaign',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  router.push('/dashboard/url-shortener/bulk-links')
}

const handleCopyLink = (shortUrl: string) => {
  navigator.clipboard.writeText(shortUrl)
  toaster.add({
    title: 'Copied',
    description: 'Short URL copied to clipboard',
    icon: 'ph:check',
    color: 'success',
    progress: true,
  })
}

const handleLinksAdded = async () => {
  // Refresh campaign data to show new links
  await fetchCampaignData()
}

const handleTemplateChange = async (templateId: string) => {
  if (templateId === formData.value.templateId) return
  
  formData.value.templateId = templateId
  errors.value.template = undefined
  
  // Load new template details for preview
  if (templateId) {
    template.value = await getTemplate(templateId)
  }
}

const toggleCampaignStatus = async (newValue?: boolean) => {
  if (!campaign.value) return

  const desiredState = newValue !== undefined ? newValue : !campaign.value.isActive
  const oldStatus = campaign.value.isActive

  // Optimistically update UI
  campaign.value.isActive = desiredState
  formData.value.isActive = desiredState

  try {
    await updateCampaign(campaignId.value, { isActive: desiredState })
    toaster.add({
      title: desiredState ? 'Campaign activated' : 'Campaign disabled',
      description: desiredState ? 'Campaign is now active.' : 'Campaign has been disabled.',
      icon: desiredState ? 'ph:play' : 'ph:pause',
      color: desiredState ? 'success' : 'warning',
      progress: true,
    })
  } catch (error: any) {
    // Revert on error
    campaign.value.isActive = oldStatus
    formData.value.isActive = oldStatus
    toaster.add({
      title: 'Error',
      description: error.message || 'Unable to update campaign status',
      icon: 'ph:warning',
      color: 'danger',
      progress: true,
    })
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  await fetchCampaignData()
})

watch([workspaceId, campaignId], () => {
  if (workspaceId.value && campaignId.value) {
    fetchCampaignData()
  }
}, { immediate: false })
</script>

<template>
  <div class="space-y-6 py-6">
    <!-- Header -->
    <div v-if="campaign" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <BaseHeading
            as="h1"
            size="2xl"
            weight="bold"
            class="text-muted-900 dark:text-white mb-2"
          >
            {{ campaign.name }}
          </BaseHeading>
          <BaseParagraph
            v-if="campaign.description"
            size="sm"
            class="text-muted-500 dark:text-muted-400"
          >
            {{ campaign.description }}
          </BaseParagraph>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <BaseButton
            variant="outline"
            @click="() => {
              navigator.clipboard.writeText(campaign.name)
              toaster.add({
                title: 'Copied',
                description: 'Campaign name copied to clipboard',
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
            class="text-muted-500 dark:text-muted-400"
          >
            {{ campaign.totalClicks || 0 }} clicks · {{ new Date(campaign.createdAt).toLocaleDateString() }}
          </BaseParagraph>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2">
            <BaseText size="sm" weight="medium" class="text-muted-700 dark:text-muted-300">
              {{ campaign.isActive ? 'Active' : 'Disabled' }}
            </BaseText>
            <BaseSwitchBall
              :model-value="campaign.isActive"
              variant="primary"
              @update:model-value="toggleCampaignStatus"
            />
          </div>
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
    <div v-else-if="!campaign && !isLoading" class="flex flex-col items-center justify-center py-12">
      <BaseHeading as="h2" size="xl" weight="semibold" class="text-muted-900 dark:text-white mb-2">
        Campaign not found
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-4">
        The campaign you're looking for doesn't exist or you don't have permission to view it.
      </BaseParagraph>
      <BaseButton variant="primary" @click="handleCancel">
        Back to Campaigns
      </BaseButton>
    </div>

    <!-- Form -->
    <div v-else-if="campaign" class="space-y-6">
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
            Update campaign name and description
          </BaseParagraph>
        </div>

        <TairoFormGroup
          label="Campaign name"
          :error="errors.name"
        >
          <TairoInput
            v-model="formData.name"
            placeholder="e.g. Summer 2024 Promotion"
            rounded="lg"
            size="sm"
          />
        </TairoFormGroup>

        <TairoFormGroup label="Description (optional)">
          <textarea
            v-model="formData.description"
            placeholder="Add a helpful note for your team"
            rows="3"
            class="w-full px-4 py-3 rounded-lg border border-muted-300 dark:border-muted-600 bg-white dark:bg-muted-800 text-muted-800 dark:text-muted-100 placeholder:text-muted-400 dark:placeholder:text-muted-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200 resize-none"
          />
        </TairoFormGroup>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mb-1">
              Created
            </BaseParagraph>
            <BaseText size="sm" class="text-muted-800 dark:text-muted-100">
              {{ formatDate(campaign.createdAt) }}
            </BaseText>
          </div>
          <div>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mb-1">
              Last Updated
            </BaseParagraph>
            <BaseText size="sm" class="text-muted-800 dark:text-muted-100">
              {{ formatDate(campaign.updatedAt) }}
            </BaseText>
          </div>
        </div>
      </BaseCard>

      <!-- Template Info Tab -->
      <BaseCard v-else-if="activeTab === 'template'" class="p-6 space-y-6">
        <div>
          <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
            Template Information
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            Select a template for this campaign
          </BaseParagraph>
        </div>

        <!-- Template Selector -->
        <TairoFormGroup label="Campaign Template">
          <select
            :value="formData.templateId"
            @change="(e) => handleTemplateChange((e.target as HTMLSelectElement).value)"
            class="w-full px-4 py-3 rounded-lg border border-muted-300 dark:border-muted-600 bg-white dark:bg-muted-800 text-muted-800 dark:text-muted-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
          >
            <option value="" disabled>Select a template</option>
            <option 
              v-for="tmpl in templates" 
              :key="tmpl.id" 
              :value="tmpl.id"
            >
              {{ tmpl.name }} ({{ tmpl.ruleCount }} rules)
            </option>
          </select>
        </TairoFormGroup>

        <div v-if="template" class="space-y-6">
          <div>
            <div class="flex items-center justify-between mb-4">
              <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-800 dark:text-white">
                {{ template.name }}
              </BaseHeading>
              <NuxtLink
                :to="`/dashboard/url-shortener/bulk-links/templates/${template.id}/edit`"
                class="text-primary-600 dark:text-primary-400 hover:underline text-sm"
              >
                <Icon name="ph:arrow-square-out" class="size-4 inline" />
                View Template
              </NuxtLink>
            </div>
            <BaseParagraph v-if="template.description" size="sm" class="text-muted-600 dark:text-muted-400">
              {{ template.description }}
            </BaseParagraph>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseCard class="p-4">
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mb-2">
                Fallback URL Pattern
              </BaseParagraph>
              <BaseText size="sm" class="text-muted-800 dark:text-muted-100 font-mono break-all">
                {{ template.fallbackUrlPattern || 'Not set' }}
              </BaseText>
            </BaseCard>

            <BaseCard class="p-4">
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mb-2">
                Routing Rules
              </BaseParagraph>
              <BaseText size="sm" class="text-muted-800 dark:text-muted-100">
                {{ template.rules?.length || 0 }} rule{{ (template.rules?.length || 0) !== 1 ? 's' : '' }}
              </BaseText>
            </BaseCard>

            <BaseCard class="p-4">
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mb-2">
                Domain
              </BaseParagraph>
              <BaseText size="sm" class="text-muted-800 dark:text-muted-100">
                {{ template.domainType === 'default' ? 'snap.ly' : template.domainValue || 'Custom domain' }}
              </BaseText>
            </BaseCard>

            <BaseCard class="p-4">
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mb-2">
                Security
              </BaseParagraph>
              <div class="flex items-center gap-2">
                <Icon
                  v-if="template.hasPassword"
                  name="ph:lock-fill"
                  class="size-4 text-secondary-500"
                  title="Password protected"
                />
                <Icon
                  v-if="template.isOneTime"
                  name="ph:clock-countdown-fill"
                  class="size-4 text-primary-500"
                  title="One-time use"
                />
                <BaseText v-if="!template.hasPassword && !template.isOneTime" size="sm" class="text-muted-600 dark:text-muted-400">
                  None
                </BaseText>
                <BaseText v-else size="sm" class="text-muted-800 dark:text-muted-100">
                  {{ template.hasPassword ? 'Password' : '' }}{{ template.hasPassword && template.isOneTime ? ', ' : '' }}{{ template.isOneTime ? 'One-time' : '' }}
                </BaseText>
              </div>
            </BaseCard>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <Icon name="svg-spinners:90-ring-with-bg" class="size-8 text-primary-500" />
          <BaseParagraph size="sm" class="text-muted-500 mt-2">
            Loading template information...
          </BaseParagraph>
        </div>
      </BaseCard>

      <!-- SmartLinks Tab -->
      <BaseCard v-else-if="activeTab === 'smartlinks'" class="p-6 space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white mb-2">
              Generated SmartLinks
            </BaseHeading>
            <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
              {{ campaign.createdLinks }} of {{ campaign.totalLinks }} SmartLinks created from this campaign
            </BaseParagraph>
          </div>
          <BaseButton variant="primary" @click="showAddLinksModal = true">
            <Icon name="ph:plus" class="size-4" />
            <span>Add Links</span>
          </BaseButton>
        </div>

        <div v-if="campaign.smartLinks && campaign.smartLinks.length > 0" class="space-y-3">
          <BaseCard
            v-for="link in campaign.smartLinks"
            :key="link.id"
            class="p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
          >
            <div class="flex items-center justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <NuxtLink
                    :to="`/dashboard/url-shortener/smart-links/${link.id}/edit`"
                    class="text-primary-600 dark:text-primary-400 hover:underline font-medium truncate"
                  >
                    {{ link.shortUrl }}
                  </NuxtLink>
                  <BaseButton
                    variant="ghost"
                    size="xs"
                    icon
                    @click="handleCopyLink(link.shortUrl)"
                  >
                    <Icon name="ph:copy" class="size-3.5" />
                  </BaseButton>
                </div>
                <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                  {{ link.name }}
                </BaseText>
              </div>

              <div class="flex items-center gap-4 shrink-0">
                <div class="text-right">
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    Clicks
                  </BaseText>
                  <BaseText size="sm" weight="semibold" class="text-primary-600 dark:text-primary-400">
                    {{ link.currentClicks }}
                  </BaseText>
                </div>

                <NuxtLink :to="`/dashboard/url-shortener/smart-links/${link.id}/edit`">
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    icon
                  >
                    <Icon name="ph:pencil" class="size-4" />
                  </BaseButton>
                </NuxtLink>
              </div>
            </div>
          </BaseCard>
        </div>

        <div v-else class="text-center py-12">
          <Icon name="solar:link-broken-linear" class="mx-auto size-12 text-muted-400 mb-4" />
          <BaseParagraph class="text-muted-500 dark:text-muted-400">
            No SmartLinks were created for this campaign
          </BaseParagraph>
        </div>
      </BaseCard>
    </div>

    <!-- Add Links Modal -->
    <AddLinksToCampaignModal
      v-model:open="showAddLinksModal"
      :campaign-id="campaignId"
      :campaign-name="campaign?.name || ''"
      @success="handleLinksAdded"
    />
  </div>
</template>

