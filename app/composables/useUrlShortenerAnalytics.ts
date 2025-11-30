import { useApi } from './useApi'
import { useWorkspace } from './useWorkspace'

interface AnalyticsOverview {
  stats: {
    totalClicks: number
    uniqueClicks: number
    avgClicksPerDay: number
    clickThroughRate: number
    previousPeriodClicks?: number
    clicksChangePercent?: number
  }
  clicksOverTime: Array<{
    date: string
    clicks: number
    uniqueClicks: number
  }>
  topLinks: Array<{
    linkId: string
    shortUrl: string
    title?: string
    clicks: number
    uniqueClicks: number
  }>
}

interface GeographicAnalytics {
  countries: Array<{
    countryCode: string
    countryName: string
    clicks: number
    uniqueClicks: number
    percentage: number
  }>
  cities: Array<{
    city: string
    countryCode?: string
    clicks: number
    uniqueClicks: number
    percentage: number
  }>
  continents: Array<{
    continent: string
    clicks: number
    uniqueClicks: number
    percentage: number
  }>
}

interface DeviceTechnologyAnalytics {
  deviceTypes: Array<{
    deviceType: string
    clicks: number
    uniqueClicks: number
    percentage: number
  }>
  operatingSystems: Array<{
    operatingSystem: string
    clicks: number
    uniqueClicks: number
    percentage: number
  }>
  browsers: Array<{
    browser: string
    browserVersion?: string
    clicks: number
    uniqueClicks: number
    percentage: number
  }>
}

interface ReferralSourceAnalytics {
  referrers: Array<{
    referrer: string
    clicks: number
    uniqueClicks: number
    percentage: number
  }>
  sources: Array<{
    source: string
    clicks: number
    uniqueClicks: number
    percentage: number
  }>
}

interface UserBehaviorAnalytics {
  clickFrequencies: Array<{
    frequency: string
    users: number
    percentage: number
  }>
  activeHours: Array<{
    hour: string
    clicks: number
  }>
  activeDays: Array<{
    day: string
    short: string
    clicks: number
  }>
  repeatClickers: Array<{
    userId: string
    clicks: number
    lastClick: string
    status: string
  }>
}

interface GeoDeviceAnalytics {
  combinations: Array<{
    country: string
    deviceType: string
    clicks: number
    uniqueClicks: number
    percentage: number
  }>
}

export const useUrlShortenerAnalytics = () => {
  const api = useApi()
  const { currentWorkspaceId } = useWorkspace()

  const fetchOverview = async (
    linkIds: string[],
    period: string,
  ): Promise<AnalyticsOverview | null> => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) return null

    try {
      const response = await api.get<{ data: AnalyticsOverview }>(
        `/api/workspaces/${workspaceId}/url-shortener/analytics/overview`,
        {
          base: 'gateway',
          requiresAuth: true,
          query: {
            linkIds: linkIds.join(','),
            period,
          },
          quiet: true,
        },
      )

      return response.data
    } catch (error) {
      if (import.meta.dev) {
        console.error('[useUrlShortenerAnalytics] Error fetching overview:', error)
      }
      return null
    }
  }

  const fetchGeographic = async (
    linkIds: string[],
    period: string,
  ): Promise<GeographicAnalytics | null> => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) return null

    try {
      const response = await api.get<{ data: GeographicAnalytics }>(
        `/api/workspaces/${workspaceId}/url-shortener/analytics/geographic`,
        {
          base: 'gateway',
          requiresAuth: true,
          query: {
            linkIds: linkIds.join(','),
            period,
          },
          quiet: true,
        },
      )

      return response.data
    } catch (error) {
      if (import.meta.dev) {
        console.error('[useUrlShortenerAnalytics] Error fetching geographic:', error)
      }
      return null
    }
  }

  const fetchDeviceTechnology = async (
    linkIds: string[],
    period: string,
  ): Promise<DeviceTechnologyAnalytics | null> => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) return null

    try {
      const response = await api.get<{ data: DeviceTechnologyAnalytics }>(
        `/api/workspaces/${workspaceId}/url-shortener/analytics/device-technology`,
        {
          base: 'gateway',
          requiresAuth: true,
          query: {
            linkIds: linkIds.join(','),
            period,
          },
          quiet: true,
        },
      )

      return response.data
    } catch (error) {
      if (import.meta.dev) {
        console.error('[useUrlShortenerAnalytics] Error fetching device technology:', error)
      }
      return null
    }
  }

  const fetchReferralSource = async (
    linkIds: string[],
    period: string,
  ): Promise<ReferralSourceAnalytics | null> => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) return null

    try {
      const response = await api.get<{ data: ReferralSourceAnalytics }>(
        `/api/workspaces/${workspaceId}/url-shortener/analytics/referral-source`,
        {
          base: 'gateway',
          requiresAuth: true,
          query: {
            linkIds: linkIds.join(','),
            period,
          },
          quiet: true,
        },
      )

      return response.data
    } catch (error) {
      if (import.meta.dev) {
        console.error('[useUrlShortenerAnalytics] Error fetching referral source:', error)
      }
      return null
    }
  }

  const fetchUserBehavior = async (
    linkIds: string[],
    period: string,
  ): Promise<UserBehaviorAnalytics | null> => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) return null

    try {
      const response = await api.get<{ data: UserBehaviorAnalytics }>(
        `/api/workspaces/${workspaceId}/url-shortener/analytics/user-behavior`,
        {
          base: 'gateway',
          requiresAuth: true,
          query: {
            linkIds: linkIds.join(','),
            period,
          },
          quiet: true,
        },
      )

      return response.data
    } catch (error) {
      if (import.meta.dev) {
        console.error('[useUrlShortenerAnalytics] Error fetching user behavior:', error)
      }
      return null
    }
  }

  const fetchGeoDevice = async (
    linkIds: string[],
    period: string,
  ): Promise<GeoDeviceAnalytics | null> => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) return null

    try {
      const response = await api.get<{ data: GeoDeviceAnalytics }>(
        `/api/workspaces/${workspaceId}/url-shortener/analytics/geo-device`,
        {
          base: 'gateway',
          requiresAuth: true,
          query: {
            linkIds: linkIds.join(','),
            period,
          },
          quiet: true,
        },
      )

      return response.data
    } catch (error) {
      if (import.meta.dev) {
        console.error('[useUrlShortenerAnalytics] Error fetching geo device:', error)
      }
      return null
    }
  }

  return {
    fetchOverview,
    fetchGeographic,
    fetchDeviceTechnology,
    fetchReferralSource,
    fetchUserBehavior,
    fetchGeoDevice,
  }
}

