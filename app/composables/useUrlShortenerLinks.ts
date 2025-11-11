import type {
  ShortenerLink,
  ShortenerLinkListResponse,
  ShortenerLinkStatus,
} from '~/types/url-shortener'
import { computed, toRefs } from '#imports'

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

const FALLBACK_LINKS: ShortenerLink[] = [
  {
    id: '1',
    shortUrl: 'snap.ly/abc123',
    originalUrl: 'https://example.com/very/long/url/path/that/needs/to/be/shortened',
    clicks: 12_500,
    createdAt: '2024-01-15',
    status: 'active',
    collection: 'Marketing Campaigns',
  },
  {
    id: '2',
    shortUrl: 'snap.ly/xyz789',
    originalUrl: 'https://example.com/another/very/long/url',
    clicks: 8900,
    createdAt: '2024-01-20',
    status: 'active',
    collection: null,
  },
  {
    id: '3',
    shortUrl: 'snap.ly/def456',
    originalUrl: 'https://example.com/yet/another/long/url/path',
    clicks: 6750,
    createdAt: '2024-02-01',
    status: 'active',
    collection: 'Product Launch',
  },
  {
    id: '4',
    shortUrl: 'snap.ly/ghi321',
    originalUrl: 'https://example.com/more/urls/to/shorten',
    clicks: 5420,
    createdAt: '2024-02-10',
    status: 'paused',
    collection: null,
  },
  {
    id: '5',
    shortUrl: 'snap.ly/jkl654',
    originalUrl: 'https://example.com/final/url/example',
    clicks: 4200,
    createdAt: '2024-02-15',
    status: 'active',
    collection: 'Marketing Campaigns',
  },
  {
    id: '6',
    shortUrl: 'snap.ly/mno987',
    originalUrl: 'https://example.com/short/url',
    clicks: 3200,
    createdAt: '2024-02-20',
    status: 'active',
    collection: null,
  },
  {
    id: '7',
    shortUrl: 'snap.ly/pqr654',
    originalUrl: 'https://example.com/another/example/url',
    clicks: 2100,
    createdAt: '2024-03-01',
    status: 'active',
    collection: 'Product Launch',
  },
  {
    id: '8',
    shortUrl: 'snap.ly/stu321',
    originalUrl: 'https://example.com/long/url/path/example',
    clicks: 1800,
    createdAt: '2024-03-05',
    status: 'expired',
    collection: null,
  },
]

const SUPPORTED_STATUSES: ShortenerLinkStatus[] = ['active', 'paused', 'expired']

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

  const state = useState<ShortenerLinksState>('snaplink:url-shortener-links', initialState)

  const normalizeLinks = (payload: unknown[]): ShortenerLink[] => {
    if (!Array.isArray(payload) || payload.length === 0) {
      return FALLBACK_LINKS
    }

    return payload.map((entry, index) => {
      const source = entry as Partial<ShortenerLink> & Record<string, unknown>

      const id = security.sanitizeInput(source?.id ?? `link-${index}`)
      const rawShortUrl = security.sanitizeInput(source?.shortUrl ?? '')
      const cleanedShortUrl = rawShortUrl.replace(/^https?:\/\//i, '').trim()
      const originalUrl = security.sanitizeInput(source?.originalUrl ?? '')

      const clicks = Number.parseInt(String(source?.clicks ?? 0), 10)
      const createdAt = security.sanitizeInput(source?.createdAt ?? new Date().toISOString())

      const statusCandidate = security.sanitizeInput(source?.status ?? '') as ShortenerLinkStatus
      const status = SUPPORTED_STATUSES.includes(statusCandidate) ? statusCandidate : 'active'

      const collection =
        typeof source?.collection === 'string'
          ? security.sanitizeInput(source.collection as string)
          : null

      return {
        id: id || `link-${index}`,
        shortUrl: cleanedShortUrl || id,
        originalUrl,
        clicks: Number.isFinite(clicks) && clicks >= 0 ? clicks : 0,
        createdAt,
        status,
        collection,
      }
    })
  }

  const setItems = (payload: unknown[]) => {
    const normalized = normalizeLinks(payload)
    state.value.items = normalized.length > 0 ? normalized : FALLBACK_LINKS
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

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<ShortenerLinkListResponse>('/shortener/links', {
        path: '/shortener/links',
        base: 'gateway',
        validate: (payload): payload is ShortenerLinkListResponse =>
          typeof payload === 'object' &&
          payload !== null &&
          Array.isArray((payload as ShortenerLinkListResponse).data),
        retry: 1,
        timeout: 7000,
        quiet: true,
        query: {
          page: state.value.page,
          perPage: state.value.perPage,
          search: state.value.search || undefined,
        },
      })

      setItems(response?.data ?? [])
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useUrlShortenerLinks] Falling back to static links', error)
      }
      state.value.error = 'Unable to load short links. Showing cached data.'
      setItems(FALLBACK_LINKS)
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

  const createLink = (link: ShortenerLink) => {
    const [normalizedLink] = normalizeLinks([link])
    const fallbackLink =
      FALLBACK_LINKS[0] ??
      {
        id: 'fallback-link',
        shortUrl: 'snap.ly/fallback',
        originalUrl: 'https://snaplink.dev',
        clicks: 0,
        createdAt: new Date().toISOString(),
        status: 'active' as ShortenerLinkStatus,
        collection: null,
      }

    const safeLink = normalizedLink ?? fallbackLink

    state.value.items = [safeLink, ...state.value.items]
    toasts.add({
      title: 'Link created',
      description: 'Your short link is ready to share.',
      icon: 'ph:check',
      color: 'success',
      progress: true,
    } as any)
  }

  const removeLink = (linkId: string) => {
    state.value.items = state.value.items.filter(link => link.id !== linkId)
    state.value.selectedIds = state.value.selectedIds.filter(id => id !== linkId)
    toasts.add({
      title: 'Link deleted',
      description: 'Short link removed from your catalog.',
      icon: 'ph:trash',
      color: 'danger',
      progress: true,
    } as any)
  }

  const copyLink = async (shortUrl: string) => {
    const normalized = security.validateUrl(`https://${shortUrl}`, {
      allowedProtocols: ['http', 'https'],
    })

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

  const filteredItems = computed(() => {
    const query = security
      .sanitizeInput(state.value.search, { stripHtml: true, trim: true })
      .toLowerCase()

    if (!query || query.length === 0) {
      return state.value.items
    }

    return state.value.items.filter(link => {
      const matchesShort = link.shortUrl.toLowerCase().includes(query)
      const matchesOriginal = link.originalUrl.toLowerCase().includes(query)
      const matchesCollection = (link.collection?.toLowerCase() ?? '').includes(query)

      return matchesShort || matchesOriginal || matchesCollection
    })
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

  const statusConfig = (status: ShortenerLinkStatus) => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'success', icon: 'ph:check-circle' }
      case 'paused':
        return { label: 'Paused', color: 'warning', icon: 'ph:pause-circle' }
      case 'expired':
        return { label: 'Expired', color: 'muted', icon: 'ph:clock' }
      default:
        return { label: 'Unknown', color: 'muted', icon: 'ph:question' }
    }
  }

  const allVisibleSelected = computed(() => {
    return paginatedItems.value.every(item => state.value.selectedIds.includes(item.id))
  })
  const hasSelection = computed(() => state.value.selectedIds.length > 0)
  const selectionIndeterminate = computed(() => hasSelection.value && !allVisibleSelected.value)

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
    removeLink,
    copyLink,
  }
}

