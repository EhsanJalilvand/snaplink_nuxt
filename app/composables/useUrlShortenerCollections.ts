import { computed, toRefs, watch } from '#imports'
import type {
  ShortenerCollection,
  ShortenerCollectionListResponse,
  ShortenerCollectionColor,
  PagedResult,
  ApiResponse,
  CreateCollectionRequest,
  ShortenerCollectionDto,
  UpdateCollectionRequest,
  CollectionLinkItem,
  CollectionLinksDto,
} from '~/types/url-shortener'
import { useWorkspaceContext } from './useWorkspaceContext'

interface ShortenerCollectionsState {
  items: ShortenerCollection[]
  isLoading: boolean
  error: string | null
  search: string
  perPage: number
  page: number
  selectedIds: string[]
  lastFetched?: number
}

// Map backend CollectionListDto to frontend ShortenerCollection
const mapCollectionListDto = (dto: any): ShortenerCollection => {
  return {
    id: dto.id ?? '',
    name: dto.name ?? '',
    description: dto.description ?? null,
    color: (dto.color ?? 'primary') as ShortenerCollectionColor,
    linkCount: dto.linkCount ?? 0,
    totalClicks: dto.totalClicks ?? 0,
    createdAt: dto.createdAt ?? new Date().toISOString(),
  }
}

const initialState = (): ShortenerCollectionsState => ({
  items: [],
  isLoading: false,
  error: null,
  search: '',
  perPage: 10,
  page: 1,
  selectedIds: [],
  lastFetched: undefined,
})

export const useUrlShortenerCollections = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const { workspaceId } = useWorkspaceContext()

  const state = useState<ShortenerCollectionsState>('snaplink:url-shortener-collections', initialState)

  const setItems = (items: ShortenerCollection[]) => {
    state.value.items = items
    state.value.error = null
    state.value.lastFetched = Date.now()
  }

  const fetchCollections = async (options: { force?: boolean } = {}) => {
    if (state.value.isLoading) {
      console.log('[useUrlShortenerCollections] Already loading, skipping fetch')
      return
    }

    if (!options.force && state.value.items.length > 0) {
      console.log('[useUrlShortenerCollections] Items already loaded, skipping fetch')
      return
    }

    if (!workspaceId.value) {
      // Don't set error if workspaceId is not available yet - it might be loading
      console.warn('[useUrlShortenerCollections] workspaceId is not available')
      state.value.isLoading = false
      return
    }

    console.log('[useUrlShortenerCollections] Fetching collections for workspace:', workspaceId.value)
    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<ApiResponse<PagedResult<ShortenerCollection>> | PagedResult<ShortenerCollection>>(
        `/api/workspaces/${workspaceId.value}/url-shortener/collections`,
        {
          base: 'gateway',
          retry: 0,
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
      let pagedResult: PagedResult<ShortenerCollection>
      if ('success' in response && response.success && response.data) {
        // ApiResponse format
        pagedResult = response.data as PagedResult<ShortenerCollection>
      } else if ('items' in response) {
        // Direct PagedResult format
        pagedResult = response as PagedResult<ShortenerCollection>
      } else {
        throw new Error('Invalid response format')
      }

      const mappedItems = pagedResult.items.map(mapCollectionListDto)
      setItems(mappedItems)

      // Update pagination state from backend response
      if (pagedResult.totalPages > 0) {
        state.value.page = pagedResult.page
        state.value.perPage = pagedResult.pageSize
      }
    } catch (error) {
      if (import.meta.dev) {
        console.error('[useUrlShortenerCollections] Failed to fetch collections', error)
      }
      state.value.error = 'Unable to load collections. Please try again.'
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
      state.value.selectedIds = state.value.selectedIds.filter((item) => item !== id)
    } else {
      state.value.selectedIds = [...state.value.selectedIds, id]
    }
  }

  const toggleSelectMany = (ids: string[], selected: boolean) => {
    if (selected) {
      const merged = new Set([...state.value.selectedIds, ...ids])
      state.value.selectedIds = Array.from(merged)
    } else {
      state.value.selectedIds = state.value.selectedIds.filter((id) => !ids.includes(id))
    }
  }

  const createCollection = async (request: CreateCollectionRequest): Promise<ShortenerCollectionDto | null> => {
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
      const response = await api.post<ApiResponse<ShortenerCollectionDto>>(
        `/api/workspaces/${workspaceId.value}/url-shortener/collections`,
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
        : (response as any as ShortenerCollectionDto)

      if (result) {
        // Map to frontend format and add to list
        const mappedCollection = mapCollectionListDto(result)
        state.value.items = [mappedCollection, ...state.value.items]

        // Refresh collections list
        await fetchCollections({ force: true })

        toasts.add({
          title: 'Collection created',
          description: `Collection "${result.name}" has been created.`,
          icon: 'ph:check',
          color: 'success',
          progress: true,
        })

        return result
      }

      throw new Error('Invalid response from server')
    } catch (error: any) {
      const message = error?.data?.errors?.[0]?.message ?? error?.message ?? 'Failed to create collection'
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

  const removeCollection = async (collectionId: string) => {
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
        `/api/workspaces/${workspaceId.value}/url-shortener/collections/${collectionId}`,
        {
          base: 'gateway',
          retry: 0,
          timeout: 7000,
        }
      )

      // Remove from local state
      state.value.items = state.value.items.filter((collection) => collection.id !== collectionId)
      state.value.selectedIds = state.value.selectedIds.filter((id) => id !== collectionId)

      toasts.add({
        title: 'Collection deleted',
        description: 'Collection removed from your catalog.',
        icon: 'ph:trash',
        color: 'danger',
        progress: true,
      })
    } catch (error: any) {
      const message = error?.data?.errors?.[0]?.message ?? error?.message ?? 'Failed to delete collection'
      toasts.add({
        title: 'Error',
        description: message,
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
    }
  }

  const getCollection = async (collectionId: string): Promise<ShortenerCollectionDto | null> => {
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
      const response = await api.get<ApiResponse<ShortenerCollectionDto>>(
        `/api/workspaces/${workspaceId.value}/url-shortener/collections/${collectionId}`,
        {
          base: 'gateway',
          retry: 0,
          timeout: 7000,
        }
      )

      const result = 'success' in response && response.success && response.data
        ? response.data
        : (response as any as ShortenerCollectionDto)

      return result
    } catch (error: any) {
      const message = error?.data?.errors?.[0]?.message ?? error?.message ?? 'Failed to fetch collection'
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

  const updateCollection = async (collectionId: string, request: UpdateCollectionRequest): Promise<ShortenerCollectionDto | null> => {
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
      const response = await api.put<ApiResponse<ShortenerCollectionDto>>(
        `/api/workspaces/${workspaceId.value}/url-shortener/collections/${collectionId}`,
        request,
        {
          base: 'gateway',
          retry: 0,
          timeout: 10000,
        }
      )

      const result = 'success' in response && response.success && response.data
        ? response.data
        : (response as any as ShortenerCollectionDto)

      if (result) {
        // Refresh collections list
        await fetchCollections({ force: true })

        toasts.add({
          title: 'Collection updated',
          description: `Collection "${result.name}" has been updated.`,
          icon: 'ph:check',
          color: 'success',
          progress: true,
        })

        return result
      }

      throw new Error('Invalid response from server')
    } catch (error: any) {
      const message = error?.data?.errors?.[0]?.message ?? error?.message ?? 'Failed to update collection'
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

  const addLinksToCollection = async (collectionId: string, linkIds: string[]): Promise<ShortenerCollectionDto | null> => {
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
      const response = await api.post<ApiResponse<ShortenerCollectionDto>>(
        `/api/workspaces/${workspaceId.value}/url-shortener/collections/${collectionId}/links`,
        { linkIds },
        {
          base: 'gateway',
          retry: 0,
          timeout: 10000,
        }
      )

      const result = 'success' in response && response.success && response.data
        ? response.data
        : (response as any as ShortenerCollectionDto)

      if (result) {
        toasts.add({
          title: 'Links added',
          description: `${linkIds.length} link(s) added to collection.`,
          icon: 'ph:check',
          color: 'success',
          progress: true,
        })

        return result
      }

      throw new Error('Invalid response from server')
    } catch (error: any) {
      const message = error?.data?.errors?.[0]?.message ?? error?.message ?? 'Failed to add links to collection'
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

  const removeLinksFromCollection = async (collectionId: string, linkIds: string[]): Promise<boolean> => {
    if (!workspaceId.value) {
      toasts.add({
        title: 'Error',
        description: 'No workspace selected',
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return false
    }

    try {
      await api.delete<ApiResponse<boolean>>(
        `/api/workspaces/${workspaceId.value}/url-shortener/collections/${collectionId}/links`,
        {
          base: 'gateway',
          retry: 0,
          timeout: 10000,
          body: { linkIds },
        }
      )

      toasts.add({
        title: 'Links removed',
        description: `${linkIds.length} link(s) removed from collection.`,
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })

      return true
    } catch (error: any) {
      const message = error?.data?.errors?.[0]?.message ?? error?.message ?? 'Failed to remove links from collection'
      toasts.add({
        title: 'Error',
        description: message,
        icon: 'ph:warning',
        color: 'danger',
        progress: true,
      })
      return false
    }
  }

  const getCollectionLinks = async (collectionId: string): Promise<CollectionLinkItem[] | null> => {
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
      const response = await api.get<ApiResponse<CollectionLinksDto>>(
        `/api/workspaces/${workspaceId.value}/url-shortener/collections/${collectionId}/links`,
        {
          base: 'gateway',
          retry: 0,
          timeout: 7000,
        }
      )

      const result = 'success' in response && response.success && response.data
        ? response.data
        : (response as any as CollectionLinksDto)

      return result?.links ?? null
    } catch (error: any) {
      const message = error?.data?.errors?.[0]?.message ?? error?.message ?? 'Failed to fetch collection links'
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

  // Backend handles filtering, so we just return items
  const filteredItems = computed(() => state.value.items)

  // Backend handles pagination, so we just return items
  const paginatedItems = computed(() => state.value.items)

  // Calculate total pages from backend response
  const totalPages = computed(() => {
    // If we have items, estimate pages (backend will provide accurate count)
    return Math.max(1, Math.ceil(state.value.items.length / state.value.perPage))
  })

  const statusColorClass = (color: ShortenerCollectionColor) => {
    switch (color) {
      case 'success':
        return {
          container: 'bg-success-100 dark:bg-success-900/30',
          icon: 'text-success-600 dark:text-success-400',
        }
      case 'info':
        return {
          container: 'bg-info-100 dark:bg-info-900/30',
          icon: 'text-info-600 dark:text-info-400',
        }
      case 'warning':
        return {
          container: 'bg-warning-100 dark:bg-warning-900/30',
          icon: 'text-warning-600 dark:text-warning-400',
        }
      case 'purple':
        return {
          container: 'bg-purple-100 dark:bg-purple-900/30',
          icon: 'text-purple-600 dark:text-purple-400',
        }
      default:
        return {
          container: 'bg-primary-100 dark:bg-primary-900/30',
          icon: 'text-primary-600 dark:text-primary-400',
        }
    }
  }

  const allSelected = computed(() => paginatedItems.value.length > 0 && paginatedItems.value.every((item) => state.value.selectedIds.includes(item.id)))
  const selectionIndeterminate = computed(() => state.value.selectedIds.length > 0 && !allSelected.value)
  const hasSelection = computed(() => state.value.selectedIds.length > 0)

  // Watch for workspaceId changes to refetch collections
  watch(workspaceId, (newWorkspaceId) => {
    if (newWorkspaceId) {
      // Clear existing items when workspace changes
      state.value.items = []
      state.value.selectedIds = []
      state.value.page = 1
      fetchCollections({ force: true })
    } else {
      // Clear items when no workspace is selected
      state.value.items = []
      state.value.selectedIds = []
    }
  })

  // Watch for page/perPage/search changes to refetch
  watch([() => state.value.page, () => state.value.perPage, () => state.value.search], () => {
    if (workspaceId.value) {
      fetchCollections({ force: true })
    }
  })

  return {
    ...toRefs(state.value),
    filteredItems,
    paginatedItems,
    totalPages,
    allSelected,
    selectionIndeterminate,
    hasSelection,
    statusColorClass,
    fetchCollections,
    setSearch,
    setPerPage,
    setPage,
    clearSelection,
    toggleSelect,
    toggleSelectMany,
    createCollection,
    removeCollection,
    getCollection,
    updateCollection,
    addLinksToCollection,
    removeLinksFromCollection,
    getCollectionLinks,
  }
}
