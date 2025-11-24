import { computed, useState, watch } from '#imports'
import type {
  ApiResponse,
  CreateSmartLinkRequest,
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
  lastFetched?: number
}

const initialState = (): SmartLinksState => ({
  items: [],
  isLoading: false,
  error: null,
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
    targetLinkId: dto.targetLinkId ?? '',
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
    defaultLinkId: dto.defaultLinkId ?? null,
    isOneTime: Boolean(dto.isOneTime),
    expiresAt: dto.expiresAt ?? null,
    clickLimit: dto.clickLimit ?? null,
    hasPassword: Boolean(dto.hasPassword),
    currentClicks: dto.currentClicks ?? 0,
    collectionIds: dto.collectionIds ? dto.collectionIds.map((id: any) => String(id)) : null,
    aiMetadata,
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

  const fetchSmartLinks = async (options: { force?: boolean } = {}) => {
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
      const response = await api.get<ApiResponse<SmartLink[]> | SmartLink[]>(
        `/api/workspaces/${workspaceId.value}/url-shortener/smart-links`,
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

  return {
    items: computed(() => state.value.items),
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),
    fetchSmartLinks,
    createSmartLink,
    getSmartLink,
    generateSmartLinkAiInsights,
    clearSmartLinks,
  }
}


