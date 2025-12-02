<script setup lang="ts">
import { computed, watch, onMounted, ref } from '#imports'
import BulkLinkTemplatesTable from '~/components/url-shortener/BulkLinkTemplatesTable.vue'
import BulkLinkCampaignsTable from '~/components/url-shortener/BulkLinkCampaignsTable.vue'
import BulkLinkTemplateWizard from '~/components/url-shortener/BulkLinkTemplateWizard.vue'
import BulkLinkCampaignWizard from '~/components/url-shortener/BulkLinkCampaignWizard.vue'
import { useBulkLinkTemplates } from '~/composables/useBulkLinkTemplates'
import { useBulkLinkCampaigns } from '~/composables/useBulkLinkCampaigns'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'

definePageMeta({
  title: 'Bulk Link Management',
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()
const { workspaceId } = useWorkspaceContext()

// Tab management
const activeTab = ref<'campaigns' | 'templates'>('campaigns')

// Templates
const {
  items: templates,
  isLoading: isLoadingTemplates,
  error: templatesError,
  fetchTemplates,
  deleteTemplate,
} = useBulkLinkTemplates()

// Campaigns
const {
  items: campaigns,
  isLoading: isLoadingCampaigns,
  error: campaignsError,
  fetchCampaigns,
  deleteCampaign,
} = useBulkLinkCampaigns()

// Wizards
const showTemplateWizard = ref(false)
const showCampaignWizard = ref(false)
const editingTemplateId = ref<string | null>(null)

// Fetch data when workspace changes
watch(workspaceId, (newWorkspaceId) => {
  if (newWorkspaceId) {
    if (activeTab.value === 'campaigns') {
      fetchCampaigns({ force: true })
    } else {
      fetchTemplates({ force: true })
    }
  }
}, { immediate: true })

// Fetch on mount
onMounted(() => {
  if (workspaceId.value) {
    fetchCampaigns({ force: true })
    fetchTemplates({ force: true })
  }
})

// Fetch when tab changes
watch(activeTab, (tab) => {
  if (tab === 'campaigns') {
    fetchCampaigns({ force: true })
  } else {
    fetchTemplates({ force: true })
  }
})

// Sync active tab with URL query
watch(
  () => route.query.tab,
  (value) => {
    if (value === 'templates') {
      activeTab.value = 'templates'
    } else {
      activeTab.value = 'campaigns'
    }
  },
  { immediate: true }
)

watch(activeTab, (tab) => {
  router.replace({
    query: {
      ...route.query,
      tab: tab === 'templates' ? 'templates' : undefined,
    },
  })
})

const handleCreateTemplate = () => {
  showTemplateWizard.value = true
}

const handleCreateCampaign = () => {
  showCampaignWizard.value = true
}

const handleTemplateCreated = async () => {
  await fetchTemplates({ force: true })
  showTemplateWizard.value = false
}

const handleCampaignCreated = async () => {
  await fetchCampaigns({ force: true })
  showCampaignWizard.value = false
}

const handleDeleteTemplate = async (templateId: string) => {
  if (confirm('Are you sure you want to delete this template?')) {
    try {
      await deleteTemplate(templateId)
    } catch (error) {
      // Error toast is shown in composable
    }
  }
}

const handleDeleteCampaign = async (campaignId: string, deleteSmartLinks: boolean = false) => {
  try {
    await deleteCampaign(campaignId, deleteSmartLinks)
  } catch (error) {
    // Error toast is shown in composable
  }
}

const handleEditTemplate = (templateId: string) => {
  editingTemplateId.value = templateId
  showTemplateWizard.value = true
}

const handleCloneTemplate = async (templateId: string) => {
  // TODO: Implement clone template
  console.log('Clone template:', templateId)
}

const handleViewTemplateCampaigns = (templateId: string) => {
  // Filter campaigns by template
  activeTab.value = 'campaigns'
  // TODO: Add filter by templateId
}

const handleViewCampaign = (campaignId: string) => {
  router.push(`/dashboard/url-shortener/bulk-links/campaigns/${campaignId}`)
}
</script>

<template>
  <div class="space-y-6 py-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-800 dark:text-muted-100"
        >
          Bulk Link Management
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Create reusable templates and launch bulk campaigns with SmartLink capabilities
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton
          v-if="activeTab === 'templates'"
          variant="primary"
          @click="handleCreateTemplate"
        >
          <Icon name="ph:plus" class="size-4" />
          <span>Create Template</span>
        </BaseButton>
        <BaseButton
          v-else
          variant="primary"
          @click="handleCreateCampaign"
        >
          <Icon name="ph:plus" class="size-4" />
          <span>Create Campaign</span>
        </BaseButton>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-muted-200 dark:border-muted-800">
      <div class="flex gap-2">
        <button
          type="button"
          class="relative px-4 py-3 text-sm font-medium transition-colors duration-200"
          :class="
            activeTab === 'campaigns'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-muted-500 dark:text-muted-400 hover:text-muted-700 dark:hover:text-muted-300'
          "
          @click="activeTab = 'campaigns'"
        >
          <div class="flex items-center gap-2">
            <Icon name="solar:layers-linear" class="size-4" />
            <span>Campaigns</span>
          </div>
        </button>
        <button
          type="button"
          class="relative px-4 py-3 text-sm font-medium transition-colors duration-200"
          :class="
            activeTab === 'templates'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-muted-500 dark:text-muted-400 hover:text-muted-700 dark:hover:text-muted-300'
          "
          @click="activeTab = 'templates'"
        >
          <div class="flex items-center gap-2">
            <Icon name="solar:document-text-linear" class="size-4" />
            <span>Templates</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Campaigns Tab Content -->
    <div v-if="activeTab === 'campaigns'" class="space-y-6">
      <div v-if="campaigns.length === 0 && !isLoadingCampaigns" class="py-12">
        <BasePlaceholderPage
          title="No campaigns yet"
          subtitle="Create your first bulk campaign from a template"
        >
          <template #image>
            <Icon name="solar:layers-linear" class="size-16 text-muted-400" />
          </template>
          <BaseButton variant="primary" @click="handleCreateCampaign">
            <Icon name="ph:plus" class="size-4" />
            <span>Create Campaign</span>
          </BaseButton>
        </BasePlaceholderPage>
      </div>

      <BaseCard v-else class="p-0 overflow-hidden">
        <BulkLinkCampaignsTable
          :campaigns="campaigns"
          :is-loading="isLoadingCampaigns"
          @view="handleViewCampaign"
          @delete="handleDeleteCampaign"
        />
      </BaseCard>
    </div>

    <!-- Templates Tab Content -->
    <div v-else-if="activeTab === 'templates'" class="space-y-6">
      <div v-if="templates.length === 0 && !isLoadingTemplates" class="py-12">
        <BasePlaceholderPage
          title="No templates yet"
          subtitle="Create your first reusable template with SmartLink features"
        >
          <template #image>
            <Icon name="solar:document-text-linear" class="size-16 text-muted-400" />
          </template>
          <BaseButton variant="primary" @click="handleCreateTemplate">
            <Icon name="ph:plus" class="size-4" />
            <span>Create Template</span>
          </BaseButton>
        </BasePlaceholderPage>
      </div>

      <BaseCard v-else class="p-0 overflow-hidden">
        <BulkLinkTemplatesTable
          :templates="templates"
          :is-loading="isLoadingTemplates"
          @edit="handleEditTemplate"
          @delete="handleDeleteTemplate"
          @clone="handleCloneTemplate"
          @view-campaigns="handleViewTemplateCampaigns"
        />
      </BaseCard>
    </div>

    <!-- Wizards -->
    <BulkLinkTemplateWizard
      v-model:open="showTemplateWizard"
      :template-id="editingTemplateId"
      @created="handleTemplateCreated"
      @close="editingTemplateId = null"
    />

    <BulkLinkCampaignWizard
      v-model:open="showCampaignWizard"
      @created="handleCampaignCreated"
    />
  </div>
</template>
