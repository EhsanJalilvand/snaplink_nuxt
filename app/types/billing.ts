export type BillingStatus = 'active' | 'suspended' | 'low'

export type BillingUsagePeriod = 'month' | 'week' | 'year'

export interface BillingCostBreakdown {
  customerTotal: number
  vendorTotal: number
  grossMargin: number
  grossMarginPercent: number
  currency: string
}

export interface BillingUsageMetric {
  metricKey: string
  metricName: string
  unit: string
  usage: number
  included: number
  billable: number
  customerUnitPrice: number
  vendorUnitPrice: number
  customerTotal: number
  vendorTotal: number
  markupPercent: number
  currency: string
  billingNote?: string | null
  metadata?: Record<string, string>
}

export interface BillingUsageModule {
  moduleKey: string
  moduleName: string
  icon: string
  color: string
  cost: BillingCostBreakdown
  metrics: BillingUsageMetric[]
  tags?: Record<string, string>
}

export interface BillingUsageSummary {
  moduleCount: number
  metricCount: number
  totalCustomerCost: number
  totalVendorCost: number
  grossMargin: number
  grossMarginPercent: number
  averageUtilization: number
  currency: string
}

export interface BillingUsagePayload {
  modules: BillingUsageModule[]
  summary: BillingUsageSummary
}

export interface BillingUsageResponse {
  data: BillingUsagePayload
}

export interface BillingUsageAggregate {
  moduleKey: string
  metricKey: string
  metricName: string
  unit: string
  quantity: number
  customerTotal: number
  vendorTotal: number
  currency: string
}

export interface BillingMonthlyUsage {
  clicks: number
  apiCalls: number
  aggregates: BillingUsageAggregate[]
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

export interface BillingPaymentChannel {
  channelKey: string
  displayName: string
  currency: string
  enabled: boolean
  metadata?: Record<string, string>
}
