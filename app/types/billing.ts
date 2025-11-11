export type BillingStatus = 'active' | 'suspended' | 'low'

export interface BillingMonthlyUsage {
  clicks: number
  apiCalls: number
}

export interface BillingOverviewData {
  balance: number
  status: BillingStatus
  monthlyUsage: BillingMonthlyUsage
  usageChart: {
    labels: string[]
    clicks: number[]
    apiCalls: number[]
  }
}

export interface BillingOverviewResponse {
  data: BillingOverviewData
}

export type BillingUsagePeriod = 'month' | 'week' | 'year'

export type BillingUsageColor = 'primary' | 'success' | 'info' | 'warning' | 'purple' | 'orange'

export interface BillingUsageItem {
  id: string
  service: string
  icon: string
  current: number
  limit: number
  cost: number
  color: BillingUsageColor
}

export interface BillingUsageSummaryMetrics {
  totalServices: number
  totalCost: number
  averageUtilization: number
}

export interface BillingUsagePayload {
  period: BillingUsagePeriod
  items: BillingUsageItem[]
  summary: BillingUsageSummaryMetrics
}

export interface BillingUsageResponse {
  data: BillingUsagePayload
}

export type BillingInvoiceStatus = 'paid' | 'pending' | 'failed'

export interface BillingInvoiceItem {
  id: string
  date: string
  amount: number
  status: BillingInvoiceStatus
  method: string
  description: string
}

export interface BillingPlanInfo {
  planType: string
  billingCycle: string
  pricing: Array<{ label: string; value: string }>
}

export interface BillingInvoicePayload {
  items: BillingInvoiceItem[]
  plan: BillingPlanInfo
}

export interface BillingInvoicesResponse {
  data: BillingInvoicePayload
}

export interface BillingNotificationChannels {
  email: boolean
  webhook: boolean
}

export interface BillingLowBalanceAlertSettings extends BillingNotificationChannels {
  enabled: boolean
  threshold: number
}

export interface BillingSpendingLimitSettings {
  enabled: boolean
  monthlyLimit: number
}

export interface BillingAlertSettings {
  lowBalanceAlert: BillingLowBalanceAlertSettings
  spendingLimit: BillingSpendingLimitSettings
  billingAlerts: BillingNotificationChannels
}

export interface BillingAlertsResponse {
  data: BillingAlertSettings
}
