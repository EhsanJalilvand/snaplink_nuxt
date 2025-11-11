export type DashboardTrend = 'positive' | 'negative'

export type DashboardAccent =
  | 'primary'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'muted'
  | 'purple'

export interface DashboardStat {
  id: string
  title: string
  value: string
  change: string
  changeType: DashboardTrend
  icon: string
  color: DashboardAccent
  link: string
}

export type DashboardQuickActionType = 'route' | 'openWizard'

export interface DashboardQuickAction {
  id: string
  title: string
  description: string
  icon: string
  color: DashboardAccent
  type: DashboardQuickActionType
  to?: string
}

export interface DashboardService {
  id: string
  name: string
  icon: string
  count: number
  color: DashboardAccent
  link: string
  comingSoon?: boolean
}

export interface DashboardActivity {
  id: string
  type: string
  title: string
  description: string
  time: string
  icon: string
  color: DashboardAccent
}

export interface DashboardTopLink {
  id: string
  shortUrl: string
  originalUrl: string
  clicks: number
  change: string
  createdAt: string
}

export interface DashboardClicksPoint {
  day: string
  clicks: number
}

export interface DashboardOverviewPayload {
  stats: DashboardStat[]
  services: DashboardService[]
  activities: DashboardActivity[]
  topLinks: DashboardTopLink[]
  clicks: DashboardClicksPoint[]
}

export interface DashboardOverviewResponse {
  data: DashboardOverviewPayload
}

