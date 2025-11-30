import type {
  ShortenerLink,
  ShortenerLinkListResponse,
  ShortenerLinkStatus,
  PagedResult,
  ApiResponse,
  CreateLinkRequest,
  CreateLinkResultDto,
} from '~/types/url-shortener'
import { computed, toRefs, watch } from '#imports'
import { useWorkspaceContext } from './useWorkspaceContext'

interface ShortenerLinksState {
  items: ShortenerLink[]
  isLoading: boolean
  error: string | null
  search: string
  perPage: number
  page: number
  selectedIds: string[]
  lastFetched?: number
}

// Map backend LinkStatus enum to frontend status string
const mapLinkStatus = (status: number | string): ShortenerLinkStatus => {
  if (typeof status === 'string') {
    return status.toLowerCase() as ShortenerLinkStatus
  }
  // Backend enum: Active = 1, Expired = 2, Disabled = 3, Deleted = 4
  switch (status) {
    case 1:
      return 'active'
    case 2:
      return 'expired'
    case 3:
      return 'disabled'
    case 4:
      return 'deleted'
    default:
      return 'active'
  }
}

// Map backend LinkType enum to frontend type string
const mapLinkType = (type: number | string): string => {
  if (typeof type === 'string') {
    return type
  }
  // Backend enum: UrlShortener = 1, Payment = 2, Poll = 3, Bio = 4, Other = 99
  switch (type) {
    case 1:
      return 'urlShortener'
    case 2:
      return 'payment'
    case 3:
      return 'poll'
    case 4:
      return 'bio'
    case 99:
      return 'other'
    default:
      return 'urlShortener'
  }
}

const initialState = (): ShortenerLinksState => ({
  items: [],
  isLoading: false,
  error: null,
  search: '',
  perPage: 10,
  page: 1,
  selectedIds: [],
  lastFetched: undefined,
})

export const useUrlShortenerLinks = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const security = useSecurity()
  const { workspaceId } = useWorkspaceContext()

  const state = useState<ShortenerLinksState>('snaplink:url-shortener-links', initialState)

  // Map backend LinkDto or LinkListDto to frontend ShortenerLink
  const mapLinkListDto = (dto: any): ShortenerLink => {
    const status = mapLinkStatus(dto.linkStatus ?? dto.status ?? 1)
    const linkType = mapLinkType(dto.linkType ?? 'urlShortener')
    // Keep the shortUrl as-is from backend (it already has the correct protocol)
    const cleanedShortUrl = (dto.shortUrl ?? '').trim()

    // Handle collectionIds - convert Guid[] to string[] if needed
    let collectionIds: string[] | null = null
    if (dto.collectionIds) {
      collectionIds = Array.isArray(dto.collectionIds) 
        ? dto.collectionIds.map((id: any) => typeof id === 'string' ? id : id.toString())
        : null
    }

    // Handle both old single collectionName and new collectionNames array
    const collectionNames = dto.collectionNames ?? (dto.collectionName ? [dto.collectionName] : null)
    const collectionName = collectionNames && collectionNames.length > 0 ? collectionNames.join(', ') : null

    let visibilityMemberIds: string[] | null = null
    if (dto.visibilityMemberIds && Array.isArray(dto.visibilityMemberIds)) {
      visibilityMemberIds = dto.visibilityMemberIds.map((id: any) =>
        typeof id === 'string' ? id : String(id),
      )
    }

    const visibilityRoles = dto.visibilityRoles && Array.isArray(dto.visibilityRoles)
      ? dto.visibilityRoles.map((role: any) => String(role))
      : null

    return {
      id: dto.id ?? '',
      shortCode: dto.shortCode ?? '',
      shortUrl: cleanedShortUrl,
      destinationUrl: dto.destinationUrl ?? '',
      description: dto.description ?? null,
      title: dto.title ?? null,
      linkType: linkType as any,
      linkStatus: status,
      domainType: dto.domainType ?? 'default',
      domainValue: dto.domainValue ?? null,
      customAlias: dto.customAlias ?? null,
      isOneTime: typeof dto.isOneTime === 'boolean' ? dto.isOneTime : false,
      expiresAt: dto.expiresAt ?? null,
      clickLimit: typeof dto.clickLimit === 'number' ? dto.clickLimit : null,
      collectionIds: collectionIds,
      collectionNames: collectionNames,
      isPublic: typeof dto.isPublic === 'boolean' ? dto.isPublic : true,
      visibilityRoles,
      visibilityMemberIds,
      hasPassword: dto.hasPassword === true,
      currentClicks: dto.currentClicks ?? 0,
      createdAt: dto.createdAt ?? new Date().toISOString(),
      // Legacy fields for backward compatibility
      originalUrl: dto.destinationUrl ?? '',
      clicks: dto.currentClicks ?? 0,
      status,
      collection: collectionName,
      collectionName: collectionName,
    }
  }

  const setItems = (items: ShortenerLink[]) => {
    state.value.items = items
    state.value.lastFetched = Date.now()
    state.value.error = null
  }

  const fetchLinks = async (options: { force?: boolean } = {}) => {
    if (state.value.isLoading) {
      return
    }

    if (!options.force && state.value.items.length > 0) {
      return
    }

    if (!workspaceId.value) {
      // Don't set error if workspaceId is not available yet - it might be loading
      state.value.isLoading = false
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<ApiResponse<PagedResult<ShortenerLink>> | PagedResult<ShortenerLink>>(
        `/api/workspaces/${workspaceId.value}/url-shortener/links`,
        {
          base: 'gateway',
          retry: 1,
          timeout: 7000,
          quiet: true,
          query: {
            page: state.value.page,
            pageSize: state.value.perPage,
            search: state.value.search || undefined,
          },
        }
      )

      // Handle both ApiResponse<PagedResult<T>> and PagedResult<T> formats
      let pagedResult: PagedResult<ShortenerLink>
      if ('success' in response && response.success && response.data) {
        // ApiResponse format
        pagedResult = response.data as PagedResult<ShortenerLink>
      } else if ('items' in response) {
        // Direct PagedResult format
        pagedResult = response as PagedResult<ShortenerLink>
      } else {
        throw new Error('Invalid response format')
      }

      const mappedItems = pagedResult.items.map(mapLinkListDto)
      setItems(mappedItems)

      // Update pagination state from backend response
      if (pagedResult.totalPages > 0) {
        state.value.page = pagedResult.page
        state.value.perPage = pagedResult.pageSize
      }
    } catch (error) {
      if (import.meta.dev) {
        console.error('[useUrlShortenerLinks] Failed to fetch links', error)
      }
      state.value.error = 'Unable to load short links. Please try again.'
      // Keep existing items on error
    } finally {
      state.value.isLoading = false
    }
  }

  const setSearch = (value: string) => {
    state.value.search = value
    state.value.page = 1
  }

  const setPerPage = (value: number) => {
    state.value.perPage = value
    state.value.page = 1
  }

  const setPage = (value: number) => {
    state.value.page = value
  }

  const clearSelection = () => {
    state.value.selectedIds = []
  }

  const toggleSelect = (id: string) => {
    if (state.value.selectedIds.includes(id)) {
      state.value.selectedIds = state.value.selectedIds.filter(item => item !== id)
    } else {
      state.value.selectedIds = [...state.value.selectedIds, id]
    }
  }

  const selectMany = (ids: string[], select: boolean) => {
    if (select) {
      const merged = new Set([...state.value.selectedIds, ...ids])
      state.value.selectedIds = Array.from(merged)
    } else {
      state.value.selectedIds = state.value.selectedIds.filter(id => !ids.includes(id))
    }
  }

  const createLink = async (request: CreateLinkRequest): Promise<CreateLinkResultDto | null> => {
    if (!workspaceId.value) {
      toasts.add({
        title: 'Error',
        description: 'No workspace selected',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return null
    }

    try {
      const response = await api.post<ApiResponse<CreateLinkResultDto>>(
        `/api/workspaces/${workspaceId.value}/url-shortener/links`,
        request,
        {
          base: 'gateway',
          retry: 0,
          timeout: 10000,
        }
      )

      // Handle ApiResponse format
      const result = 'success' in response && response.success && response.data
        ? response.data
        : (response as any as CreateLinkResultDto)

      if (result) {
        // Refresh links list
        await fetchLinks({ force: true })

        toasts.add({
          title: 'Link created',
          description: 'Your short link is ready to share.',
          icon: 'ph:check',
          color: 'success',
          progress: true,
        })

        return result
      }

      throw new Error('Invalid response from server')
    } catch (error: any) {
      const message = error?.data?.errors?.[0]?.message ?? error?.message ?? 'Failed to create link'
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

  const removeLink = async (linkId: string) => {
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
        `/api/workspaces/${workspaceId.value}/url-shortener/links/${linkId}`,
        {
          base: 'gateway',
          retry: 0,
          timeout: 7000,
        }
      )

      // Remove from local state
      state.value.items = state.value.items.filter(link => link.id !== linkId)
      state.value.selectedIds = state.value.selectedIds.filter(id => id !== linkId)

      toasts.add({
        title: 'Link deleted',
        description: 'Short link removed from your catalog.',
        icon: 'ph:trash',
        color: 'danger',
        progress: true,
      })
    } catch (error: any) {
      const message = error?.data?.errors?.[0]?.message ?? error?.message ?? 'Failed to delete link'
      toasts.add({
        title: 'Error',
        description: message,
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
    }
  }

  const getLink = async (linkId: string): Promise<ShortenerLink | null> => {
    if (!workspaceId.value) {
      toasts.add({
        title: 'Error',
        description: 'No workspace selected',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return null
    }

    try {
      const response = await api.get<ApiResponse<any>>(
        `/api/workspaces/${workspaceId.value}/url-shortener/links/${linkId}`,
        {
          base: 'gateway',
          retry: 0,
          timeout: 7000,
        }
      )

      // Handle ApiResponse format
      const result = 'success' in response && response.success && response.data
        ? response.data
        : (response as any)

      if (result) {
        // Map the result (could be LinkDto or LinkListDto)
        const mapped = mapLinkListDto(result)
        
        // Ensure collectionIds is properly set (convert Guid[] to string[] if needed)
        if (result.collectionIds && Array.isArray(result.collectionIds)) {
          mapped.collectionIds = result.collectionIds.map((id: any) => 
            typeof id === 'string' ? id : String(id)
          )
        }
        
        return mapped
      }

      return null
    } catch (error: any) {
      const message = error?.data?.errors?.[0]?.message ?? error?.message ?? 'Failed to fetch link'
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

  const updateLink = async (linkId: string, request: UpdateLinkRequest): Promise<ShortenerLink | null> => {
    if (!workspaceId.value) {
      toasts.add({
        title: 'Error',
        description: 'No workspace selected',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return null
    }

    try {
      const response = await api.put<ApiResponse<ShortenerLink>>(
        `/api/workspaces/${workspaceId.value}/url-shortener/links/${linkId}`,
        request,
        {
          base: 'gateway',
          retry: 0,
          timeout: 10000,
        }
      )

      // Handle ApiResponse format
      const result = 'success' in response && response.success && response.data
        ? response.data
        : (response as any as ShortenerLink)

      if (result) {
        // Update local state
        const index = state.value.items.findIndex(link => link.id === linkId)
        if (index > -1) {
          state.value.items[index] = mapLinkListDto(result)
        }

        toasts.add({
          title: 'Link updated',
          description: 'Link has been updated successfully.',
          icon: 'ph:check',
          color: 'success',
          progress: true,
        })

        return mapLinkListDto(result)
      }

      throw new Error('Invalid response from server')
    } catch (error: any) {
      const message = error?.data?.errors?.[0]?.message ?? error?.message ?? 'Failed to update link'
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

  const copyLink = async (shortUrl: string) => {
    // shortUrl already has protocol from backend, use it as-is
    const normalized = shortUrl.startsWith('http://') || shortUrl.startsWith('https://')
      ? security.validateUrl(shortUrl, { allowedProtocols: ['http', 'https'] })
      : security.validateUrl(`http://${shortUrl}`, { allowedProtocols: ['http', 'https'] })

    if (!normalized) {
      toasts.add({
        title: 'Copy failed',
        description: 'Unable to copy link. Please try again.',
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      } as any)
      return
    }

    if (import.meta.client && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(normalized)
      toasts.add({
        title: 'Copied to clipboard',
        description: 'Short link copied successfully.',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      } as any)
    }
  }

  // Backend handles filtering, so we just return items
  const filteredItems = computed(() => state.value.items)

  // Backend handles pagination, so we just return items
  const paginatedItems = computed(() => state.value.items)

  // Calculate total pages from backend response
  const totalPages = computed(() => {
    // If we have items, estimate pages (backend will provide accurate count)
    // For now, we'll fetch on page change
    return Math.max(1, Math.ceil(state.value.items.length / state.value.perPage))
  })

  const statusConfig = (status: ShortenerLinkStatus) => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'success', icon: 'ph:check-circle' }
      case 'paused':
        return { label: 'Paused', color: 'warning', icon: 'ph:pause-circle' }
      case 'expired':
        return { label: 'Expired', color: 'muted', icon: 'ph:clock' }
      case 'disabled':
        return { label: 'Disabled', color: 'muted', icon: 'ph:x-circle' }
      case 'deleted':
        return { label: 'Deleted', color: 'danger', icon: 'ph:trash' }
      default:
        return { label: 'Unknown', color: 'muted', icon: 'ph:question' }
    }
  }

  const allVisibleSelected = computed(() => {
    return paginatedItems.value.every(item => state.value.selectedIds.includes(item.id))
  })
  const hasSelection = computed(() => state.value.selectedIds.length > 0)
  const selectionIndeterminate = computed(() => hasSelection.value && !allVisibleSelected.value)

  // Watch for page/perPage/search changes to refetch
  watch([() => state.value.page, () => state.value.perPage, () => state.value.search], () => {
    if (workspaceId.value) {
      fetchLinks({ force: true })
    }
  })

  // Watch for workspaceId changes to clear and refetch
  watch(workspaceId, (newWorkspaceId, oldWorkspaceId) => {
    if (newWorkspaceId && newWorkspaceId !== oldWorkspaceId) {
      state.value.items = []
      state.value.selectedIds = []
      state.value.lastFetched = undefined
      state.value.error = null
      if (newWorkspaceId) {
        fetchLinks({ force: true })
      }
    }
  })

  return {
    ...toRefs(state.value),
    filteredItems,
    paginatedItems,
    totalPages,
    statusConfig,
    allVisibleSelected,
    selectionIndeterminate,
    hasSelection,
    fetchLinks,
    setSearch,
    setPerPage,
    setPage,
    clearSelection,
    toggleSelect,
    selectMany,
    createLink,
    getLink,
    updateLink,
    removeLink,
    copyLink,
  }
}

