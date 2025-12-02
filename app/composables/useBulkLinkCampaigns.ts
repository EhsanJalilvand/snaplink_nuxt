import { ref, computed } from '#imports'
import type {
  BulkLinkCampaign,
  BulkLinkCampaignDetail,
  CreateBulkLinkCampaignRequest,
  BulkLinkCampaignItem,
} from '~/types/bulk-link'
import { useWorkspaceContext } from './useWorkspaceContext'

interface BulkLinkCampaignsState {
  items: BulkLinkCampaign[]
  isLoading: boolean
  error: string | null
  lastFetched?: number
}

const initialState = (): BulkLinkCampaignsState => ({
  items: [],
  isLoading: false,
  error: null,
  lastFetched: undefined,
})

export const useBulkLinkCampaigns = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const { workspaceId } = useWorkspaceContext()

  const state = useState<BulkLinkCampaignsState>('snaplink:bulk-link-campaigns', initialState)

  const setItems = (items: BulkLinkCampaign[]) => {
    state.value.items = items
    state.value.error = null
    state.value.lastFetched = Date.now()
  }

  const fetchCampaigns = async (options: { force?: boolean } = {}) => {
    if (state.value.isLoading) return

    if (!options.force && state.value.items.length > 0) return

    if (!workspaceId.value) {
      state.value.isLoading = false
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<BulkLinkCampaign[]>(
        `/api/workspaces/${workspaceId.value}/bulk-link-campaigns`,
        {
          base: 'gateway',
          retry: 0,
          timeout: 7000,
          quiet: true,
        }
      )

      if (response && Array.isArray(response)) {
        setItems(response)
      }
    }
    catch (error: any) {
      state.value.error = error.message || 'Failed to fetch campaigns'
      console.error('[useBulkLinkCampaigns] Fetch error:', error)
    }
    finally {
      state.value.isLoading = false
    }
  }

  const getCampaign = async (campaignId: string): Promise<BulkLinkCampaignDetail | null> => {
    if (!workspaceId.value) return null

    try {
      const response = await api.get<BulkLinkCampaignDetail>(
        `/api/workspaces/${workspaceId.value}/bulk-link-campaigns/${campaignId}`,
        {
          base: 'gateway',
          retry: 0,
          timeout: 7000,
        }
      )

      return response || null
    }
    catch (error: any) {
      console.error('[useBulkLinkCampaigns] Get campaign error:', error)
      toasts.add({
        title: 'Error',
        description: error.message || 'Failed to fetch campaign',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return null
    }
  }

  const createCampaign = async (request: CreateBulkLinkCampaignRequest) => {
    if (!workspaceId.value) {
      throw new Error('Workspace ID is required')
    }

    try {
      // Convert camelCase to PascalCase for C# API
      const pascalCaseRequest = {
        TemplateId: request.templateId,
        Name: request.name,
        Description: request.description,
        Items: request.items?.map(item => ({
          DestinationUrl: item.destinationUrl,
          Title: item.title,
          Description: item.description,
        })),
      }

      const response = await api.post<{
        campaignId: string
        campaignName: string
        totalLinks: number
        createdLinks: number
        errors: string[]
      }>(
        `/api/workspaces/${workspaceId.value}/bulk-link-campaigns`,
        pascalCaseRequest,
        {
          base: 'gateway',
        }
      )

      const hasErrors = response.errors && response.errors.length > 0

      toasts.add({
        title: hasErrors ? 'Partial Success' : 'Success',
        description: hasErrors
          ? `Campaign created with ${response.createdLinks}/${response.totalLinks} links. ${response.errors.length} errors occurred.`
          : `Campaign "${response.campaignName}" created with ${response.createdLinks} SmartLinks`,
        icon: hasErrors ? 'ph:warning' : 'ph:check',
        color: hasErrors ? 'warning' : 'success',
        progress: true,
      })

      await fetchCampaigns({ force: true })
      return response
    }
    catch (error: any) {
      console.error('[useBulkLinkCampaigns] Create error:', error)
      toasts.add({
        title: 'Error',
        description: error.message || 'Failed to create campaign',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      throw error
    }
  }

  const deleteCampaign = async (campaignId: string, deleteSmartLinks: boolean = false) => {
    if (!workspaceId.value) {
      throw new Error('Workspace ID is required')
    }

    try {
      await api.delete(
        `/api/workspaces/${workspaceId.value}/bulk-link-campaigns/${campaignId}?deleteSmartLinks=${deleteSmartLinks}`,
        {
          base: 'gateway',
        }
      )

      toasts.add({
        title: 'Success',
        description: deleteSmartLinks
          ? 'Campaign and all SmartLinks deleted successfully'
          : 'Campaign deleted successfully (SmartLinks preserved)',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })

      await fetchCampaigns({ force: true })
    }
    catch (error: any) {
      console.error('[useBulkLinkCampaigns] Delete error:', error)
      toasts.add({
        title: 'Error',
        description: error.message || 'Failed to delete campaign',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      throw error
    }
  }

  return {
    items: computed(() => state.value.items),
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),
    fetchCampaigns,
    getCampaign,
    createCampaign,
    deleteCampaign,
  }
}


