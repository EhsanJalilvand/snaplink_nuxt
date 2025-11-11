export interface ShortenerStats {
  totalClicks: number
  totalLinks: number
  activeLinks: number
  avgClicksPerLink: number
}

export interface ShortenerClicksPoint {
  date: string
  clicks: number
}

export type ShortenerLinkStatus = 'active' | 'paused' | 'expired'

export interface ShortenerLink {
  id: string
  shortUrl: string
  originalUrl: string
  clicks: number
  createdAt: string
  status: ShortenerLinkStatus
  collection: string | null
}

export interface ShortenerLinkListResponse {
  data: ShortenerLink[]
}

export interface ShortenerReferrer {
  source: string
  clicks: number
  percentage: number
}

export interface ShortenerUserStats {
  new: number
  returning: number
}

export type ShortenerCollectionColor = 'primary' | 'success' | 'info' | 'warning' | 'purple'

export interface ShortenerCollection {
  id: string
  name: string
  description?: string | null
  linkCount: number
  totalClicks: number
  createdAt: string
  color: ShortenerCollectionColor
}

export interface ShortenerCollectionListResponse {
  data: ShortenerCollection[]
}

export interface ShortenerNotificationSettings {
  linkClick: {
    email: boolean
    webhook: boolean
    threshold: number
  }
  linkExpired: {
    email: boolean
    webhook: boolean
  }
  linkReachedLimit: {
    email: boolean
    webhook: boolean
  }
  dailySummary: {
    email: boolean
    webhook: boolean
    time: string
  }
  weeklyReport: {
    email: boolean
    webhook: boolean
    day: string
  }
}

export interface ShortenerNotificationResponse {
  data: ShortenerNotificationSettings
}

export interface ShortenerOverviewData {
  stats: ShortenerStats
  clicksOverTime: ShortenerClicksPoint[]
  topLinks: ShortenerLink[]
  topReferrers: ShortenerReferrer[]
  userStats: ShortenerUserStats
}

export interface ShortenerOverviewResponse {
  data: ShortenerOverviewData
}
