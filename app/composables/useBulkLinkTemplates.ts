import { ref, computed } from '#imports'
import type {
  BulkLinkTemplate,
  BulkLinkTemplateListItem,
  CreateBulkLinkTemplateRequest,
  UpdateBulkLinkTemplateRequest,
  ApplyTemplateUpdateRequest,
  ApplyTemplateUpdateResult,
} from '~/types/bulk-link'
import { useWorkspaceContext } from './useWorkspaceContext'

interface BulkLinkTemplatesState {
  items: BulkLinkTemplateListItem[]
  isLoading: boolean
  error: string | null
  lastFetched?: number
}

const initialState = (): BulkLinkTemplatesState => ({
  items: [],
  isLoading: false,
  error: null,
  lastFetched: undefined,
})

export const useBulkLinkTemplates = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const { workspaceId } = useWorkspaceContext()

  const state = useState<BulkLinkTemplatesState>('snaplink:bulk-link-templates', initialState)

  const setItems = (items: BulkLinkTemplateListItem[]) => {
    state.value.items = items
    state.value.error = null
    state.value.lastFetched = Date.now()
  }

  const fetchTemplates = async (options: { force?: boolean } = {}) => {
    if (state.value.isLoading) return

    if (!options.force && state.value.items.length > 0) return

    if (!workspaceId.value) {
      state.value.isLoading = false
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<BulkLinkTemplateListItem[]>(
        `/api/workspaces/${workspaceId.value}/bulk-link-templates`,
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
      state.value.error = error.message || 'Failed to fetch templates'
      console.error('[useBulkLinkTemplates] Fetch error:', error)
    }
    finally {
      state.value.isLoading = false
    }
  }

  const getTemplate = async (templateId: string): Promise<BulkLinkTemplate | null> => {
    if (!workspaceId.value) return null

    try {
      const response = await api.get<BulkLinkTemplate>(
        `/api/workspaces/${workspaceId.value}/bulk-link-templates/${templateId}`,
        {
          base: 'gateway',
          retry: 0,
          timeout: 7000,
        }
      )

      return response || null
    }
    catch (error: any) {
      console.error('[useBulkLinkTemplates] Get template error:', error)
      toasts.add({
        title: 'Error',
        description: error.message || 'Failed to fetch template',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return null
    }
  }

  const createTemplate = async (request: CreateBulkLinkTemplateRequest) => {
    if (!workspaceId.value) {
      throw new Error('Workspace ID is required')
    }

    try {
      // Convert camelCase to PascalCase for C# API
      const pascalCaseRequest = {
        Name: request.name,
        Description: request.description,
        Rules: request.rules,
        FallbackUrlPattern: request.fallbackUrlPattern,
        CollectionIds: request.collectionIds,
        IsPublic: request.isPublic,
        VisibilityRoles: request.visibilityRoles,
        VisibilityMemberIds: request.visibilityMemberIds,
        ExpiresAt: request.expiresAt,
        ClickLimit: request.clickLimit,
        IsOneTime: request.isOneTime,
        Password: request.password,
        DomainType: request.domainType,
        DomainValue: request.domainValue,
        PixelEvents: request.pixelEvents,
        WebhookUrl: request.webhookUrl,
        WebhookMethod: request.webhookMethod,
        WebhookHeaders: request.webhookHeaders,
        WebhookBodyTemplate: request.webhookBodyTemplate,
      }

      console.log('[useBulkLinkTemplates] Sending PascalCase request:', JSON.stringify(pascalCaseRequest, null, 2))

      const response = await api.post<{ id: string; name: string }>(
        `/api/workspaces/${workspaceId.value}/bulk-link-templates`,
        pascalCaseRequest,
        {
          base: 'gateway',
        }
      )

      toasts.add({
        title: 'Success',
        description: `Template "${response.name}" created successfully`,
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })

      await fetchTemplates({ force: true })
      return response
    }
    catch (error: any) {
      console.error('[useBulkLinkTemplates] Create error:', error)
      toasts.add({
        title: 'Error',
        description: error.message || 'Failed to create template',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      throw error
    }
  }

  const updateTemplate = async (templateId: string, request: UpdateBulkLinkTemplateRequest) => {
    if (!workspaceId.value) {
      throw new Error('Workspace ID is required')
    }

    try {
      // Convert camelCase to PascalCase for C# API
      const pascalCaseRequest = {
        Name: request.name,
        Description: request.description,
        Rules: request.rules,
        FallbackUrlPattern: request.fallbackUrlPattern,
        CollectionIds: request.collectionIds,
        IsPublic: request.isPublic,
        VisibilityRoles: request.visibilityRoles,
        VisibilityMemberIds: request.visibilityMemberIds,
        ExpiresAt: request.expiresAt,
        ClickLimit: request.clickLimit,
        IsOneTime: request.isOneTime,
        Password: request.password,
        ClearPassword: request.clearPassword,
        DomainType: request.domainType,
        DomainValue: request.domainValue,
        PixelEvents: request.pixelEvents,
        WebhookUrl: request.webhookUrl,
        WebhookMethod: request.webhookMethod,
        WebhookHeaders: request.webhookHeaders,
        WebhookBodyTemplate: request.webhookBodyTemplate,
      }

      const response = await api.put<BulkLinkTemplate>(
        `/api/workspaces/${workspaceId.value}/bulk-link-templates/${templateId}`,
        pascalCaseRequest,
        {
          base: 'gateway',
        }
      )

      toasts.add({
        title: 'Success',
        description: 'Template updated successfully',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })

      await fetchTemplates({ force: true })
      return response
    }
    catch (error: any) {
      console.error('[useBulkLinkTemplates] Update error:', error)
      toasts.add({
        title: 'Error',
        description: error.message || 'Failed to update template',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      throw error
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!workspaceId.value) {
      throw new Error('Workspace ID is required')
    }

    try {
      await api.delete(
        `/api/workspaces/${workspaceId.value}/bulk-link-templates/${templateId}`,
        {
          base: 'gateway',
        }
      )

      toasts.add({
        title: 'Success',
        description: 'Template deleted successfully',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })

      await fetchTemplates({ force: true })
    }
    catch (error: any) {
      console.error('[useBulkLinkTemplates] Delete error:', error)
      toasts.add({
        title: 'Error',
        description: error.message || 'Failed to delete template',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      throw error
    }
  }

  const applyTemplateUpdate = async (templateId: string, request?: ApplyTemplateUpdateRequest): Promise<ApplyTemplateUpdateResult> => {
    if (!workspaceId.value) {
      throw new Error('Workspace ID is required')
    }

    try {
      const response = await api.post<ApplyTemplateUpdateResult>(
        `/api/workspaces/${workspaceId.value}/bulk-link-templates/${templateId}/apply`,
        {
          body: request || {},
          base: 'gateway',
        }
      )

      toasts.add({
        title: 'Success',
        description: `Updated ${response.updatedSmartLinks} of ${response.totalSmartLinks} SmartLinks`,
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })

      return response
    }
    catch (error: any) {
      console.error('[useBulkLinkTemplates] Apply update error:', error)
      toasts.add({
        title: 'Error',
        description: error.message || 'Failed to apply template updates',
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
    fetchTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplateUpdate,
  }
}


