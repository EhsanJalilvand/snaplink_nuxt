export type KYCStatus = 'not_started' | 'in_progress' | 'pending_review' | 'verified' | 'rejected'
export type KYBStatus = 'not_started' | 'in_progress' | 'pending_review' | 'verified' | 'rejected'
export type AMLStatus = 'pending' | 'passed' | 'flagged' | 'failed'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface ComplianceFilters {
  status: 'all' | KYCStatus | KYBStatus
  riskLevel: 'all' | RiskLevel
  country?: string
  dateRange?: {
    start: string
    end: string
  }
}

