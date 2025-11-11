import { computed, toRefs } from '#imports'
import type {
  ShortenerCollection,
  ShortenerCollectionListResponse,
  ShortenerCollectionColor,
} from '~/types/url-shortener'

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

const FALLBACK_COLLECTIONS: ShortenerCollection[] = [
  {
    id: '1',
    name: 'Marketing Campaigns',
    description: 'Links for marketing campaigns and promotions',
    linkCount: 45,
    totalClicks: 125_000,
    createdAt: '2024-01-10',
    color: 'primary',
  },
  {
    id: '2',
    name: 'Product Launch',
    description: 'Links for product launch announcements',
    linkCount: 28,
    totalClicks: 89_000,
    createdAt: '2024-02-01',
    color: 'success',
  },
  {
    id: '3',
    name: 'Social Media',
    description: 'Links shared on social media platforms',
    linkCount: 62,
    totalClicks: 156_000,
    createdAt: '2024-01-15',
    color: 'info',
  },
  {
    id: '4',
    name: 'Email Campaigns',
    description: 'Links used in email marketing campaigns',
    linkCount: 34,
    totalClicks: 78_000,
    createdAt: '2024-01-20',
    color: 'warning',
  },
  {
    id: '5',
    name: 'Blog Posts',
    description: 'Links embedded in blog posts',
    linkCount: 51,
    totalClicks: 95_000,
    createdAt: '2024-02-05',
    color: 'purple',
  },
]

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

  const state = useState<ShortenerCollectionsState>('snaplink:url-shortener-collections', initialState)

  const setItems = (items: ShortenerCollection[]) => {
    state.value.items = items
    state.value.error = null
    state.value.lastFetched = Date.now()
  }

  const fetchCollections = async (options: { force?: boolean } = {}) => {
    if (state.value.isLoading) {
      return
    }

    if (!options.force && state.value.items.length > 0) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<ShortenerCollectionListResponse>('/shortener/collections', {
        base: 'gateway',
        validate: (payload): payload is ShortenerCollectionListResponse =>
          typeof payload === 'object' && payload !== null && Array.isArray((payload as ShortenerCollectionListResponse).data),
        retry: 0,
        timeout: 7000,
        quiet: true,
        query: {
          page: state.value.page,
          perPage: state.value.perPage,
          search: state.value.search || undefined,
        },
      })

      const items = response?.data && response.data.length > 0 ? response.data : FALLBACK_COLLECTIONS
      setItems(items)
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useUrlShortenerCollections] Falling back to static collections', error)
      }
      state.value.error = 'Unable to load collections. Showing cached data.'
      setItems(FALLBACK_COLLECTIONS)
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

  const createCollection = (collection: ShortenerCollection) => {
    state.value.items = [collection, ...state.value.items]
    toasts.add({
      title: 'Collection created',
      description: `Collection "${collection.name}" has been created.`,
      icon: 'ph:check',
      color: 'success',
      progress: true,
    })
  }

  const removeCollection = (collectionId: string) => {
    state.value.items = state.value.items.filter((collection) => collection.id !== collectionId)
    state.value.selectedIds = state.value.selectedIds.filter((id) => id !== collectionId)
    toasts.add({
      title: 'Collection deleted',
      description: 'Collection removed from your catalog.',
      icon: 'ph:trash',
      color: 'danger',
      progress: true,
    })
  }

  const filteredItems = computed(() => {
    const query = state.value.search.trim().toLowerCase()
    if (!query) {
      return state.value.items
    }

    return state.value.items.filter((collection) =>
      collection.name.toLowerCase().includes(query) ||
      collection.description?.toLowerCase().includes(query),
    )
  })

  const paginatedItems = computed(() => {
    const start = (state.value.page - 1) * state.value.perPage
    const end = start + state.value.perPage
    return filteredItems.value.slice(start, end)
  })

  const totalPages = computed(() => {
    const count = filteredItems.value.length
    return Math.max(1, Math.ceil(count / state.value.perPage))
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
  }
}
