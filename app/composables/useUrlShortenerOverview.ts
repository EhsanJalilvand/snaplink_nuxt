import { computed, toRefs } from '#imports'
import type {
  ShortenerClicksPoint,
  ShortenerLink,
  ShortenerOverviewData,
  ShortenerOverviewResponse,
  ShortenerReferrer,
  ShortenerStats,
  ShortenerUserStats,
} from '~/types/url-shortener'

interface ShortenerOverviewState {
  data: ShortenerOverviewData | null
  isLoading: boolean
  error: string | null
  period: string
  lastFetchedPeriod?: string
}

const FALLBACK_DATA: ShortenerOverviewData = {
  stats: {
    totalClicks: 125_847,
    totalLinks: 342,
    activeLinks: 289,
    avgClicksPerLink: 435,
  },
  clicksOverTime: [
    { date: '2024-01-01', clicks: 1250 },
    { date: '2024-01-02', clicks: 1420 },
    { date: '2024-01-03', clicks: 1380 },
    { date: '2024-01-04', clicks: 1560 },
    { date: '2024-01-05', clicks: 1680 },
    { date: '2024-01-06', clicks: 1890 },
    { date: '2024-01-07', clicks: 2100 },
  ],
  topLinks: [
    {
      id: '1',
      shortUrl: 'snap.ly/abc123',
      originalUrl: 'https://example.com/very/long/url',
      clicks: 12_500,
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      shortUrl: 'snap.ly/xyz789',
      originalUrl: 'https://example.com/another/long/url',
      clicks: 8900,
      createdAt: '2024-01-20',
    },
    {
      id: '3',
      shortUrl: 'snap.ly/def456',
      originalUrl: 'https://example.com/yet/another/url',
      clicks: 6750,
      createdAt: '2024-02-01',
    },
    {
      id: '4',
      shortUrl: 'snap.ly/ghi321',
      originalUrl: 'https://example.com/more/urls',
      clicks: 5420,
      createdAt: '2024-02-10',
    },
    {
      id: '5',
      shortUrl: 'snap.ly/jkl654',
      originalUrl: 'https://example.com/final/url',
      clicks: 4200,
      createdAt: '2024-02-15',
    },
  ],
  topReferrers: [
    { source: 'Direct', clicks: 45_200, percentage: 36 },
    { source: 'Google', clicks: 38_900, percentage: 31 },
    { source: 'Facebook', clicks: 21_500, percentage: 17 },
    { source: 'Twitter', clicks: 12_800, percentage: 10 },
    { source: 'LinkedIn', clicks: 7447, percentage: 6 },
  ],
  userStats: {
    new: 45_200,
    returning: 80_647,
  },
}

const initialState = (): ShortenerOverviewState => ({
  data: null,
  isLoading: false,
  error: null,
  period: '30d',
  lastFetchedPeriod: undefined,
})

export const useUrlShortenerOverview = () => {
  const api = useApi()
  const state = useState<ShortenerOverviewState>('snaplink:url-shortener-overview', initialState)

  const setData = (payload: ShortenerOverviewData) => {
    state.value.data = payload
    state.value.error = null
    state.value.lastFetchedPeriod = state.value.period
  }

  const fetchOverview = async (options: { force?: boolean } = {}) => {
    if (state.value.isLoading) {
      return
    }

    if (!options.force && state.value.data && state.value.lastFetchedPeriod === state.value.period) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<ShortenerOverviewResponse>('/shortener/overview', {
        base: 'gateway',
        validate: (payload): payload is ShortenerOverviewResponse =>
          typeof payload === 'object' && payload !== null && 'data' in payload,
        retry: 0,
        timeout: 7000,
        quiet: true,
        query: {
          period: state.value.period,
        },
      })

      if (response?.data) {
        setData(response.data)
      } else {
        setData(FALLBACK_DATA)
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useUrlShortenerOverview] Falling back to static data', error)
      }
      state.value.error = 'Unable to load shortener analytics. Showing cached data.'
      setData(FALLBACK_DATA)
    } finally {
      state.value.isLoading = false
    }
  }

  const setPeriod = (period: string) => {
    if (state.value.period === period) {
      return
    }
    state.value.period = period
  }

  const stats = computed<ShortenerStats>(() => state.value.data?.stats ?? FALLBACK_DATA.stats)
  const clicksOverTime = computed<ShortenerClicksPoint[]>(
    () => state.value.data?.clicksOverTime ?? FALLBACK_DATA.clicksOverTime,
  )
  const topLinks = computed<ShortenerLink[]>(() => state.value.data?.topLinks ?? FALLBACK_DATA.topLinks)
  const topReferrers = computed<ShortenerReferrer[]>(
    () => state.value.data?.topReferrers ?? FALLBACK_DATA.topReferrers,
  )
  const userStats = computed<ShortenerUserStats>(() => state.value.data?.userStats ?? FALLBACK_DATA.userStats)

  const totalUsers = computed(() => userStats.value.new + userStats.value.returning)
  const newUserRatio = computed(() =>
    totalUsers.value === 0 ? 0 : Math.round((userStats.value.new / totalUsers.value) * 100),
  )

  const returningUserRatio = computed(() => 100 - newUserRatio.value)

  return {
    ...toRefs(state.value),
    stats,
    clicksOverTime,
    topLinks,
    topReferrers,
    userStats,
    totalUsers,
    newUserRatio,
    returningUserRatio,
    fetchOverview,
    setPeriod,
  }
}
