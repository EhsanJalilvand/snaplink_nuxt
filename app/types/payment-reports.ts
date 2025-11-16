export interface SalesReport {
  period: string
  totalRevenue: number
  transactionCount: number
  averageTransactionValue: number
  currency: string
  byGateway: Array<{
    gatewayId: string
    gatewayName: string
    revenue: number
    count: number
  }>
  byCurrency: Array<{
    currency: string
    revenue: number
    count: number
  }>
  trends: {
    revenue: number // percentage change
    transactions: number
  }
}

export interface SettlementReport {
  period: string
  totalSettlements: number
  totalFees: number
  netAmount: number
  currency: string
  settlementCount: number
  averageSettlementAmount: number
  byStatus: Array<{
    status: string
    count: number
    amount: number
  }>
}

export interface RiskReport {
  period: string
  totalTransactions: number
  flaggedTransactions: number
  riskDistribution: Array<{
    level: string
    count: number
    percentage: number
  }>
  topRiskFactors: Array<{
    factor: string
    count: number
    severity: string
  }>
  byCountry: Array<{
    country: string
    riskScore: number
    transactionCount: number
  }>
}

export interface ReportFilters {
  dateRange: {
    start: string
    end: string
  }
  gatewayId?: string
  currency?: string
  groupBy?: 'day' | 'week' | 'month' | 'year'
}

