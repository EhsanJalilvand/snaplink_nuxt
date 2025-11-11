import { computed, useState } from '#imports'
import { useApi } from './useApi'
import { useSecurity } from './useSecurity'
import type {
  DashboardActivity,
  DashboardClicksPoint,
  DashboardOverviewPayload,
  DashboardOverviewResponse,
  DashboardQuickAction,
  DashboardService,
  DashboardStat,
  DashboardTopLink,
} from '~/types/dashboard'

interface DashboardOverviewState {
  stats: DashboardStat[]
  services: DashboardService[]
  activities: DashboardActivity[]
  topLinks: DashboardTopLink[]
  clicks: DashboardClicksPoint[]
  isLoading: boolean
  error: string | null
}

const FALLBACK_STATS: DashboardStat[] = [
  {
    id: 'links',
    title: 'Total Links',
    value: '1,234',
    change: '+12.5%',
    changeType: 'positive',
    icon: 'solar:link-linear',
    color: 'primary',
    link: '/dashboard/url-shortener/links',
  },
  {
    id: 'clicks',
    title: 'Total Clicks',
    value: '45.6K',
    change: '+8.2%',
    changeType: 'positive',
    icon: 'solar:mouse-linear',
    color: 'success',
    link: '/dashboard/url-shortener/overview',
  },
  {
    id: 'collections',
    title: 'Collections',
    value: '28',
    change: '+5',
    changeType: 'positive',
    icon: 'solar:folder-linear',
    color: 'info',
    link: '/dashboard/url-shortener/collections',
  },
  {
    id: 'revenue',
    title: 'Revenue',
    value: '$2,450',
    change: '+15.3%',
    changeType: 'positive',
    icon: 'solar:wallet-linear',
    color: 'warning',
    link: '/dashboard/billing/overview',
  },
]

const FALLBACK_SERVICES: DashboardService[] = [
  {
    id: 'url-shortener',
    name: 'URL Shortener',
    icon: 'solar:link-linear',
    count: 1234,
    color: 'primary',
    link: '/dashboard/url-shortener/overview',
  },
  {
    id: 'survey-link',
    name: 'Survey Link',
    icon: 'solar:clipboard-list-linear',
    count: 0,
    color: 'info',
    link: '/dashboard/survey-link/overview',
    comingSoon: true,
  },
  {
    id: 'biolink',
    name: 'BioLink',
    icon: 'solar:user-id-linear',
    count: 0,
    color: 'success',
    link: '/dashboard/biolink/overview',
    comingSoon: true,
  },
  {
    id: 'payment',
    name: 'Payment',
    icon: 'solar:wallet-bold-duotone',
    count: 0,
    color: 'warning',
    link: '/dashboard/payment/overview',
  },
  {
    id: 'quiz-link',
    name: 'Quiz Link',
    icon: 'solar:document-text-linear',
    count: 0,
    color: 'purple',
    link: '/dashboard/quiz-link/overview',
    comingSoon: true,
  },
]

const FALLBACK_ACTIVITIES: DashboardActivity[] = [
  {
    id: 'activity-1',
    type: 'link_created',
    title: 'New link created',
    description: 'snap.ly/abc123',
    time: '2 minutes ago',
    icon: 'solar:link-linear',
    color: 'primary',
  },
  {
    id: 'activity-2',
    type: 'link_clicked',
    title: 'Link clicked 50 times',
    description: 'snap.ly/xyz789',
    time: '15 minutes ago',
    icon: 'solar:mouse-linear',
    color: 'success',
  },
  {
    id: 'activity-3',
    type: 'collection_created',
    title: 'Collection created',
    description: 'Marketing Campaigns',
    time: '1 hour ago',
    icon: 'solar:folder-linear',
    color: 'info',
  },
  {
    id: 'activity-4',
    type: 'report_generated',
    title: 'Report generated',
    description: 'Monthly analytics report',
    time: '3 hours ago',
    icon: 'solar:chart-2-linear',
    color: 'warning',
  },
]

const FALLBACK_TOP_LINKS: DashboardTopLink[] = [
  {
    id: 'top-1',
    shortUrl: 'snap.ly/abc123',
    originalUrl: 'https://example.com/very/long/url/path',
    clicks: 12_500,
    change: '+12%',
    createdAt: '2024-01-15',
  },
  {
    id: 'top-2',
    shortUrl: 'snap.ly/xyz789',
    originalUrl: 'https://another-example.com/product/page',
    clicks: 8_900,
    change: '+8%',
    createdAt: '2024-01-20',
  },
  {
    id: 'top-3',
    shortUrl: 'snap.ly/def456',
    originalUrl: 'https://third-example.com/blog/post',
    clicks: 6_750,
    change: '+5%',
    createdAt: '2024-02-01',
  },
]

const FALLBACK_CLICKS: DashboardClicksPoint[] = [
  { day: 'Mon', clicks: 1_250 },
  { day: 'Tue', clicks: 1_420 },
  { day: 'Wed', clicks: 1_380 },
  { day: 'Thu', clicks: 1_560 },
  { day: 'Fri', clicks: 1_680 },
  { day: 'Sat', clicks: 1_890 },
  { day: 'Sun', clicks: 2_100 },
]

const QUICK_ACTIONS: DashboardQuickAction[] = [
  {
    id: 'create-link',
    title: 'Create Link',
    description: 'Shorten any URL instantly',
    icon: 'solar:link-linear',
    color: 'primary',
    type: 'openWizard',
  },
  {
    id: 'create-collection',
    title: 'Create Collection',
    description: 'Organize your links',
    icon: 'solar:folder-linear',
    color: 'info',
    type: 'route',
    to: '/dashboard/url-shortener/collections',
  },
  {
    id: 'view-analytics',
    title: 'View Analytics',
    description: 'Track performance',
    icon: 'solar:chart-2-linear',
    color: 'success',
    type: 'route',
    to: '/dashboard/url-shortener/overview',
  },
  {
    id: 'generate-report',
    title: 'Generate Report',
    description: 'Export your data',
    icon: 'solar:document-text-linear',
    color: 'warning',
    type: 'route',
    to: '/dashboard/url-shortener/reports',
  },
]

const isValidAccent = (value: string | undefined): boolean => {
  return ['primary', 'success', 'info', 'warning', 'danger', 'muted', 'purple'].includes(value ?? '')
}

const createInitialState = (): DashboardOverviewState => ({
  stats: [],
  services: [],
  activities: [],
  topLinks: [],
  clicks: [],
  isLoading: false,
  error: null,
})

const ensureInternalPath = (value: unknown, fallback = '/dashboard'): string => {
  const sanitized = String(value ?? '').trim()
  if (!sanitized) {
    return fallback
  }

  return sanitized.startsWith('/') ? sanitized : `/${sanitized.replace(/^\/*/, '')}`
}

const normalizeStats = (
  items: DashboardStat[],
  sanitize: (value: unknown) => string,
): DashboardStat[] => {
  if (!Array.isArray(items) || items.length === 0) {
    return FALLBACK_STATS
  }

  return items.map((item, index) => ({
    id: sanitize(item?.id ?? `stat-${index}`),
    title: sanitize(item?.title ?? 'Stat'),
    value: sanitize(item?.value ?? '0'),
    change: sanitize(item?.change ?? '0%'),
    changeType: item?.changeType === 'negative' ? 'negative' : 'positive',
    icon: sanitize(item?.icon ?? 'solar:chart-2-linear'),
    color: isValidAccent(item?.color) ? item.color : 'muted',
    link: ensureInternalPath(sanitize(item?.link ?? '')),
  }))
}

const normalizeServices = (
  items: DashboardService[],
  sanitize: (value: unknown) => string,
): DashboardService[] => {
  if (!Array.isArray(items) || items.length === 0) {
    return FALLBACK_SERVICES
  }

  return items.map((service, index) => ({
    id: sanitize(service?.id ?? `service-${index}`),
    name: sanitize(service?.name ?? 'Service'),
    icon: sanitize(service?.icon ?? 'solar:app-linear'),
    count: Number.parseInt(String(service?.count ?? 0), 10) || 0,
    color: isValidAccent(service?.color) ? service.color : 'muted',
    link: ensureInternalPath(sanitize(service?.link ?? '')),
    comingSoon: Boolean(service?.comingSoon),
  }))
}

const normalizeActivities = (items: DashboardActivity[], sanitize: (value: unknown) => string): DashboardActivity[] => {
  if (!Array.isArray(items) || items.length === 0) {
    return FALLBACK_ACTIVITIES
  }

  return items.map((activity, index) => ({
    id: sanitize(activity?.id ?? `activity-${index}`),
    type: sanitize(activity?.type ?? 'activity'),
    title: sanitize(activity?.title ?? 'Activity'),
    description: sanitize(activity?.description ?? ''),
    time: sanitize(activity?.time ?? ''),
    icon: sanitize(activity?.icon ?? 'solar:clock-circle-linear'),
    color: isValidAccent(activity?.color) ? activity.color : 'muted',
  }))
}

const normalizeTopLinks = (items: DashboardTopLink[], sanitize: (value: unknown) => string): DashboardTopLink[] => {
  if (!Array.isArray(items) || items.length === 0) {
    return FALLBACK_TOP_LINKS
  }

  return items.map((link, index) => ({
    id: sanitize(link?.id ?? `top-link-${index}`),
    shortUrl: sanitize(link?.shortUrl ?? ''),
    originalUrl: sanitize(link?.originalUrl ?? ''),
    clicks: Number.parseInt(String(link?.clicks ?? 0), 10) || 0,
    change: sanitize(link?.change ?? '0%'),
    createdAt: sanitize(link?.createdAt ?? ''),
  }))
}

const normalizeClicks = (items: DashboardClicksPoint[]): DashboardClicksPoint[] => {
  if (!Array.isArray(items) || items.length === 0) {
    return FALLBACK_CLICKS
  }

  return items
    .map((point, index) => ({
      day: typeof point?.day === 'string' ? point.day.slice(0, 12) : `Day ${index + 1}`,
      clicks: Number.parseInt(String(point?.clicks ?? 0), 10) || 0,
    }))
    .filter((point) => point.day.length > 0)
}

export const useDashboardOverview = () => {
  const api = useApi()
  const security = useSecurity()

  const state = useState<DashboardOverviewState>('snaplink:dashboard:overview', createInitialState)

  const setOverviewData = (payload: DashboardOverviewPayload) => {
    state.value.stats = normalizeStats(payload?.stats ?? [], security.sanitizeInput)
    state.value.services = normalizeServices(payload?.services ?? [], security.sanitizeInput)
    state.value.activities = normalizeActivities(payload?.activities ?? [], security.sanitizeInput)
    state.value.topLinks = normalizeTopLinks(payload?.topLinks ?? [], security.sanitizeInput)
    state.value.clicks = normalizeClicks(payload?.clicks ?? [])
    state.value.error = null
  }

  const resetToFallback = (message?: string) => {
    state.value.stats = FALLBACK_STATS
    state.value.services = FALLBACK_SERVICES
    state.value.activities = FALLBACK_ACTIVITIES
    state.value.topLinks = FALLBACK_TOP_LINKS
    state.value.clicks = FALLBACK_CLICKS
    state.value.error = message ?? 'Unable to load dashboard data. Showing cached insights.'
  }

  const fetchOverview = async ({ force = false } = {}) => {
    if (state.value.isLoading) {
      return
    }

    if (!force && state.value.stats.length > 0) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<DashboardOverviewResponse>('/dashboard/overview', {
        base: 'gateway',
        validate: (payload): payload is DashboardOverviewResponse =>
          typeof payload === 'object' && payload !== null && 'data' in payload,
        retry: 1,
        timeout: 6000,
        quiet: true,
      })

      if (response?.data) {
        setOverviewData(response.data)
      } else {
        resetToFallback()
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useDashboardOverview] Falling back to static data', error)
      }
      resetToFallback('Unable to reach the dashboard service. Displaying cached data.')
    } finally {
      state.value.isLoading = false
    }
  }

  const maxClicks = computed(() => {
    if (state.value.clicks.length === 0) {
      return Math.max(...FALLBACK_CLICKS.map((point) => point.clicks))
    }
    return Math.max(...state.value.clicks.map((point) => point.clicks))
  })

  return {
    stats: computed(() => (state.value.stats.length ? state.value.stats : FALLBACK_STATS)),
    services: computed(() => (state.value.services.length ? state.value.services : FALLBACK_SERVICES)),
    activities: computed(() => (state.value.activities.length ? state.value.activities : FALLBACK_ACTIVITIES)),
    topLinks: computed(() => (state.value.topLinks.length ? state.value.topLinks : FALLBACK_TOP_LINKS)),
    clicks: computed(() => (state.value.clicks.length ? state.value.clicks : FALLBACK_CLICKS)),
    quickActions: computed(() => QUICK_ACTIONS),
    maxClicks,
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),
    fetchOverview,
  }
}

