import { computed, useState, watch } from '#imports'
import type {
  ApiResponse,
  CreateSmartLinkRequest,
  UpdateSmartLinkRequest,
  SmartLink,
  SmartLinkAiInsightsRequest,
  SmartLinkAiInsightsResponse,
  SmartLinkConditionType,
  SmartLinkRule,
} from '~/types/url-shortener'
import { useWorkspaceContext } from './useWorkspaceContext'

interface SmartLinksState {
  items: SmartLink[]
  isLoading: boolean
  error: string | null
  search: string
  perPage: number
  page: number
  selectedIds: string[]
  lastFetched?: number
}

const initialState = (): SmartLinksState => ({
  items: [],
  isLoading: false,
  error: null,
  search: '',
  perPage: 10,
  page: 1,
  selectedIds: [],
  lastFetched: undefined,
})

const conditionLabels: Record<SmartLinkConditionType, string> = {
  GeoCountry: 'country',
  GeoRegion: 'region',
  GeoCity: 'city',
  DeviceType: 'device type',
  OperatingSystem: 'operating system',
  Browser: 'browser',
  Referrer: 'referrer',
  Schedule: 'schedule',
  CustomExpression: 'expression',
}

const parseJsonField = (value: unknown) => {
  if (!value) {
    return null
  }
  if (typeof value === 'object') {
    return value as Record<string, any>
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    }
    catch {
      return null
    }
  }
  return null
}

const buildRuleSummary = (rule: SmartLinkRule) => {
  const label = conditionLabels[rule.conditionType] ?? 'condition'
  const condition = rule.condition ?? {}
  const entries = Object.entries(condition)
  if (!entries.length) {
    return `Match ${label}`
  }

  const printable = entries
    .map(([key, val]) => {
      if (Array.isArray(val)) {
        return `${key}: ${(val as string[]).join(', ')}`
      }
      if (typeof val === 'object' && val !== null) {
        return `${key}: ${Object.entries(val as Record<string, any>)
          .map(([k, v]) => `${k}=${v}`)
          .join('; ')}`
      }
      return `${key}: ${val}`
    })
    .join(' • ')

  return `Match ${label} → ${printable}`
}

const mapRuleDto = (dto: any): SmartLinkRule => {
  const condition = parseJsonField(dto.condition) ?? parseJsonField(dto.conditionData) ?? {}
  const rule: SmartLinkRule = {
    id: dto.id ?? undefined,
    smartLinkId: dto.smartLinkId ?? undefined,
    targetUrl: dto.targetUrl ?? '',
    conditionType: dto.conditionType ?? 'GeoCountry',
    condition,
    priority: dto.priority ?? 100,
    isActive: typeof dto.isActive === 'boolean' ? dto.isActive : true,
  }

  return {
    ...rule,
    summary: buildRuleSummary(rule),
  }
}

const mapSmartLinkDto = (dto: any): SmartLink => {
  const cleanedShortUrl = (dto.shortUrl ?? '').toString().trim()
  const aiMetadata = parseJsonField(dto.aiMetadata)

  return {
    id: dto.id ?? '',
    workspaceId: dto.workspaceId ?? '',
    name: dto.name ?? '',
    shortCode: dto.shortCode ?? '',
    shortUrl: cleanedShortUrl,
    domainType: dto.domainType ?? 'default',
    domainValue: dto.domainValue ?? null,
    customAlias: dto.customAlias ?? null,
    description: dto.description ?? null,
    fallbackUrl: dto.fallbackUrl ?? null,
    isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
    isOneTime: Boolean(dto.isOneTime),
    expiresAt: dto.expiresAt ?? null,
    clickLimit: dto.clickLimit ?? null,
    hasPassword: Boolean(dto.hasPassword),
    currentClicks: dto.currentClicks ?? 0,
    collectionIds: dto.collectionIds ? dto.collectionIds.map((id: any) => String(id)) : null,
    aiMetadata,
    pixelEvents: (() => {
      const parsed = parseJsonField(dto.pixelEvents)
      if (parsed && typeof parsed === 'object' && 'pixels' in parsed && Array.isArray(parsed.pixels)) {
        return parsed.pixels as any[]
      }
      if (Array.isArray(parsed)) {
        return parsed as any[]
      }
      return null
    })(),
    webhookUrl: dto.webhookUrl ?? null,
    webhookMethod: dto.webhookMethod ?? null,
    webhookHeaders: parseJsonField(dto.webhookHeaders) as any,
    webhookBodyTemplate: dto.webhookBodyTemplate ?? null,
    isPublic: dto.isPublic ?? true,
    visibilityRoles: dto.visibilityRoles ?? null,
    visibilityMemberIds: dto.visibilityMemberIds ? dto.visibilityMemberIds.map((id: any) => String(id)) : null,
    createdAt: dto.createdAt ?? new Date().toISOString(),
    updatedAt: dto.updatedAt ?? dto.createdAt ?? new Date().toISOString(),
    createdBy: dto.createdBy ?? 'system',
    rules: Array.isArray(dto.rules) ? dto.rules.map(mapRuleDto) : [],
  }
}

export const useSmartLinks = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const { workspaceId } = useWorkspaceContext()

  const state = useState<SmartLinksState>('snaplink:smart-links', initialState)

  const setItems = (items: SmartLink[]) => {
    state.value.items = items
    state.value.lastFetched = Date.now()
    state.value.error = null
  }

  const fetchSmartLinks = async (options: { force?: boolean; hasCampaign?: boolean } = {}) => {
    if (!workspaceId.value) {
      state.value.items = []
      return
    }

    if (state.value.isLoading) {
      return
    }

    if (!options.force && state.value.items.length > 0) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const queryParams = new URLSearchParams()
      if (options.hasCampaign !== undefined) {
        queryParams.append('hasCampaign', String(options.hasCampaign))
      }
      
      const url = `/api/workspaces/${workspaceId.value}/url-shortener/smart-links${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await api.get<ApiResponse<SmartLink[]> | SmartLink[]>(
        url,
        {
          base: 'gateway',
          retry: 0,
          timeout: 8000,
          quiet: true,
        },
      )

      const payload = Array.isArray(response)
        ? response
        : (response as ApiResponse<SmartLink[]>).data ?? []

      const items = payload.map(mapSmartLinkDto)
      setItems(items)
    }
    catch (error) {
      if (import.meta.dev) {
        console.error('[useSmartLinks] Failed to fetch smart links', error)
      }
      state.value.error = 'Unable to load SmartLinks.'
    }
    finally {
      state.value.isLoading = false
    }
  }

  const getSmartLink = async (smartLinkId: string): Promise<SmartLink | null> => {
    if (!workspaceId.value) {
      return null
    }

    try {
      const response = await api.get<ApiResponse<any>>(
        `/api/workspaces/${workspaceId.value}/url-shortener/smart-links/${smartLinkId}`,
        {
          base: 'gateway',
          retry: 0,
          timeout: 7000,
        },
      )

      const dto = response?.data ?? response
      return dto ? mapSmartLinkDto(dto) : null
    }
    catch (error) {
      if (import.meta.dev) {
        console.error('[useSmartLinks] Failed to fetch smart link', error)
      }
      return null
    }
  }

  const createSmartLink = async (request: CreateSmartLinkRequest) => {
    if (!workspaceId.value) {
      toasts.add({
        title: 'No workspace selected',
        description: 'Please choose a workspace first.',
        icon: 'ph:warning',
        color: 'warning',
      })
      return null
    }

    try {
      const payload = {
        ...request,
        collectionIds: request.collectionIds?.length ? request.collectionIds : null,
        rules: request.rules?.map(rule => ({
          ...rule,
          condition: rule.condition ?? {},
        })) ?? [],
        pixelEvents: request.pixelEvents?.length ? request.pixelEvents : null,
        webhookUrl: request.webhookUrl || null,
        webhookMethod: request.webhookUrl ? (request.webhookMethod || 'POST') : null,
        webhookHeaders: request.webhookUrl && request.webhookHeaders && Object.keys(request.webhookHeaders).length > 0 ? request.webhookHeaders : null,
        webhookBodyTemplate: request.webhookUrl && request.webhookBodyTemplate ? request.webhookBodyTemplate : null,
      }

      const response = await api.post<ApiResponse<{ id: string; shortUrl: string }>>(
        `/api/workspaces/${workspaceId.value}/url-shortener/smart-links`,
        payload,
        {
          base: 'gateway',
          retry: 0,
          timeout: 12000,
        },
      )

      toasts.add({
        title: 'SmartLink created',
        description: 'Dynamic routing is ready.',
        icon: 'ph:sparkle',
        color: 'success',
        progress: true,
      })

      await fetchSmartLinks({ force: true })

      if ('data' in response && response?.data) {
        return response.data
      }

      return response as any
    }
    catch (error: any) {
      const message = error?.data?.errors?.[0]?.message ?? error?.message ?? 'Failed to create SmartLink'
      toasts.add({
        title: 'Error',
        description: message,
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return null
    }
  }

  const updateSmartLink = async (smartLinkId: string, request: UpdateSmartLinkRequest) => {
    console.log('[useSmartLinks] updateSmartLink called', { smartLinkId, workspaceId: workspaceId.value, request })
    
    if (!workspaceId.value) {
      toasts.add({
        title: 'No workspace selected',
        description: 'Please choose a workspace first.',
        icon: 'ph:warning',
        color: 'warning',
      })
      return null
    }

    try {
      console.log('[useSmartLinks] Preparing payload...')
      const payload = {
        ...request,
        collectionIds: request.collectionIds?.length ? request.collectionIds : null,
        rules: request.rules?.map(rule => ({
          ...rule,
          condition: rule.condition ?? {},
        })) ?? null,
        pixelEvents: request.pixelEvents?.length ? request.pixelEvents : null,
        webhookUrl: request.webhookUrl || null,
        webhookMethod: request.webhookUrl ? (request.webhookMethod || 'POST') : null,
        webhookHeaders: request.webhookUrl && request.webhookHeaders && Object.keys(request.webhookHeaders).length > 0 ? request.webhookHeaders : null,
        webhookBodyTemplate: request.webhookUrl && request.webhookBodyTemplate ? request.webhookBodyTemplate : null,
        // Ensure visibility fields are sent correctly
        visibility: request.visibility,
        visibilityRoles: request.visibility === 'private' && request.visibilityRoles?.length ? request.visibilityRoles : undefined,
        visibilityMemberIds: request.visibility === 'private' && request.visibilityMemberIds?.length ? request.visibilityMemberIds : undefined,
      }

      console.log('[useSmartLinks] Calling API PUT...', { url: `/api/workspaces/${workspaceId.value}/url-shortener/smart-links/${smartLinkId}`, payload })
      
      const response = await api.put<ApiResponse<SmartLink>>(
        `/api/workspaces/${workspaceId.value}/url-shortener/smart-links/${smartLinkId}`,
        payload,
        {
          base: 'gateway',
          retry: 0,
          timeout: 12000,
        },
      )

      console.log('[useSmartLinks] API response received', response)

      await fetchSmartLinks({ force: true })

      const dto = response?.data ?? response
      const result = dto ? mapSmartLinkDto(dto) : null
      console.log('[useSmartLinks] Returning mapped result', result)
      return result
    }
    catch (error: any) {
      console.error('[useSmartLinks] updateSmartLink error', error)
      // Don't show toast here - let the calling component handle it
      throw error
    }
  }

  const generateSmartLinkAiInsights = async (payload: SmartLinkAiInsightsRequest) => {
    if (!workspaceId.value) {
      throw new Error('Workspace not selected')
    }

    const response = await api.post<ApiResponse<SmartLinkAiInsightsResponse>>(
      `/api/workspaces/${workspaceId.value}/url-shortener/smart-links/ai-insights`,
      payload,
      {
        base: 'gateway',
        retry: 0,
        timeout: 10000,
      },
    )

    return 'data' in response && response.data
      ? response.data
      : (response as SmartLinkAiInsightsResponse)
  }

  const deleteSmartLink = async (smartLinkId: string) => {
    if (!workspaceId.value) {
      toasts.add({
        title: 'Error',
        description: 'No workspace selected',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return
    }

    try {
      await api.delete<ApiResponse<boolean>>(
        `/api/workspaces/${workspaceId.value}/url-shortener/smart-links/${smartLinkId}`,
        {
          base: 'gateway',
          retry: 0,
          timeout: 7000,
        },
      )

      // Remove from local state
      state.value.items = state.value.items.filter(link => link.id !== smartLinkId)
      state.value.selectedIds = state.value.selectedIds.filter(id => id !== smartLinkId)

      toasts.add({
        title: 'SmartLink deleted',
        description: 'SmartLink removed from your catalog.',
        icon: 'ph:trash',
        color: 'danger',
        progress: true,
      })
    } catch (error: any) {
      const message = error?.data?.errors?.[0]?.message ?? error?.message ?? 'Failed to delete SmartLink'
      toasts.add({
        title: 'Error',
        description: message,
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
    }
  }

  const chatWithAi = async (payload: {
    conversationId?: string | null
    message: string
    context?: any
  }) => {
    if (!workspaceId.value) {
      throw new Error('Workspace not selected')
    }

    const response = await api.post<ApiResponse<any>>(
      `/api/workspaces/${workspaceId.value}/url-shortener/smart-links/ai/chat`,
      payload,
      {
        base: 'gateway',
        retry: 0,
        timeout: 30000,
      },
    )

    return 'data' in response && response.data
      ? response.data
      : response
  }

  const clearSmartLinks = () => {
    state.value.items = []
    state.value.lastFetched = undefined
  }

  watch(workspaceId, (newWorkspaceId, oldWorkspaceId) => {
    if (newWorkspaceId && newWorkspaceId !== oldWorkspaceId) {
      state.value.items = []
      state.value.lastFetched = undefined
      state.value.error = null
      if (newWorkspaceId) {
        fetchSmartLinks({ force: true })
      }
    }
  })

  const setSearch = (value: string) => {
    state.value.search = value
    state.value.page = 1 // Reset to first page on search
  }

  const setPerPage = (value: number) => {
    state.value.perPage = value
    state.value.page = 1 // Reset to first page on perPage change
  }

  const setPage = (value: number) => {
    state.value.page = value
  }

  const toggleSelect = (id: string) => {
    const index = state.value.selectedIds.indexOf(id)
    if (index > -1) {
      state.value.selectedIds.splice(index, 1)
    } else {
      state.value.selectedIds.push(id)
    }
  }

  const selectMany = (ids: string[], selected: boolean) => {
    if (selected) {
      ids.forEach(id => {
        if (!state.value.selectedIds.includes(id)) {
          state.value.selectedIds.push(id)
        }
      })
    } else {
      state.value.selectedIds = state.value.selectedIds.filter(id => !ids.includes(id))
    }
  }

  const clearSelection = () => {
    state.value.selectedIds = []
  }

  const filteredItems = computed(() => {
    if (!state.value.search.trim()) {
      return state.value.items
    }
    const searchLower = state.value.search.toLowerCase()
    return state.value.items.filter(link =>
      link.name?.toLowerCase().includes(searchLower) ||
      link.shortUrl?.toLowerCase().includes(searchLower) ||
      link.shortCode?.toLowerCase().includes(searchLower) ||
      link.description?.toLowerCase().includes(searchLower) ||
      link.customAlias?.toLowerCase().includes(searchLower)
    )
  })

  const totalPages = computed(() => {
    return Math.ceil(filteredItems.value.length / state.value.perPage)
  })

  const paginatedItems = computed(() => {
    const start = (state.value.page - 1) * state.value.perPage
    const end = start + state.value.perPage
    return filteredItems.value.slice(start, end)
  })

  const allVisibleSelected = computed(() => {
    if (paginatedItems.value.length === 0) return false
    return paginatedItems.value.every(link => state.value.selectedIds.includes(link.id))
  })

  const selectionIndeterminate = computed(() => {
    const selectedCount = paginatedItems.value.filter(link => state.value.selectedIds.includes(link.id)).length
    return selectedCount > 0 && selectedCount < paginatedItems.value.length
  })

  const hasSelection = computed(() => state.value.selectedIds.length > 0)

  return {
    items: computed(() => state.value.items),
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),
    search: computed(() => state.value.search),
    perPage: computed(() => state.value.perPage),
    page: computed(() => state.value.page),
    selectedIds: computed(() => state.value.selectedIds),
    filteredItems,
    paginatedItems,
    totalPages,
    allVisibleSelected,
    selectionIndeterminate,
    hasSelection,
    fetchSmartLinks,
    createSmartLink,
    getSmartLink,
    updateSmartLink,
    deleteSmartLink,
    generateSmartLinkAiInsights,
    chatWithAi,
    clearSmartLinks,
    setSearch,
    setPerPage,
    setPage,
    toggleSelect,
    selectMany,
    clearSelection,
  }
}


