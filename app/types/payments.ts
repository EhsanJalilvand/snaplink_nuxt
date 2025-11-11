export type TrendDirection = 'up' | 'down'

export interface PaymentTrend {
  value: string
  direction: TrendDirection
}

export interface PaymentBalanceSummary {
  total: number
  pending: number
  available: number
}

export interface PaymentSummaryTrends {
  total: PaymentTrend
  pending: PaymentTrend
  available: PaymentTrend
}

export type PaymentStatusColor = 'success' | 'warning' | 'danger'

export interface PaymentStatusItem {
  label: string
  value: number
  amount: number
  trend: string
  color: PaymentStatusColor
  icon: string
}

export interface PaymentInsight {
  label: string
  description: string
  icon: string
  badge?: string
}

export interface PaymentRevenuePoint {
  label: string
  revenue: number
  target: number
}

export interface PaymentRevenueDataset {
  period: string
  points: PaymentRevenuePoint[]
}

export interface PaymentRevenueMetrics {
  mrr: {
    value: number
    change: string
  }
  averageOrderValue: {
    value: number
    currency: string
  }
  refundRatio: {
    value: number
    change: string
  }
  netRevenuePace: {
    value: number
    currency: string
    timeframe: string
    progress: number
  }
}

export interface PaymentMetricCard {
  label: string
  value: string
  icon: string
  color?: string
  helper?: string
}

export interface PaymentPerformanceItem {
  id?: string
  name: string
  type: 'link' | 'product'
  revenue: number
  conversionRate: number
  trend: string
  sku?: string
  payments?: number
  status?: string
}

export interface PaymentQuickActionItem {
  id: string
  label: string
  description: string
  icon: string
  accent?: 'primary' | 'info' | 'success' | 'warning'
}

export interface PaymentActivityItem {
  id: string
  title: string
  description: string
  timestamp: string
  icon: string
  color: string
  amount?: number
  currency?: string
  link?: string
}

export interface PaymentAlertItem {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'danger'
  icon: string
  timestamp?: string
}

export interface PaymentConversionMetric {
  label: string
  value: string
  change: string
  status: 'increase' | 'decrease'
  progress?: number
  description?: string
}

export interface PaymentOverviewData {
  summary: PaymentBalanceSummary
  trends: PaymentSummaryTrends
  status: PaymentStatusItem[]
  insights: PaymentInsight[]
  revenue: PaymentRevenueDataset[]
  revenueMetrics: PaymentRevenueMetrics
  performance: PaymentPerformanceItem[]
  quickActions: PaymentQuickActionItem[]
  activities: PaymentActivityItem[]
  alerts: PaymentAlertItem[]
  conversions: PaymentConversionMetric[]
}

export interface PaymentLinksFilter {
  search?: string
  status?: string
  dateRange?: { start: string; end: string }
}

export interface PaymentLinkItem {
  id: string
  title: string
  amount: number
  status: 'active' | 'draft' | 'archived'
  createdAt: string
  conversionRate: number
  totalRevenue: number
  currency: string
}

export interface PaymentGatewayConfig {
  id: string
  provider: string
  status: 'active' | 'pending' | 'disabled'
  currency: string
  limits: {
    daily: number
    monthly: number
  }
  webhooks: Array<{ event: string; url: string }>
}

export interface PaymentNotificationPreference {
  id: string
  type: 'email' | 'push'
  label: string
  enabled: boolean
  triggers: string[]
}

export interface PaymentOverviewResponse {
  data: PaymentOverviewData
}
