export type PaymentGatewayStatus = 'draft' | 'pending' | 'approved' | 'active' | 'suspended' | 'rejected'

export type GatewayMode = 'sandbox' | 'live'

export type RejectionPredefinedReason = 
  | 'incomplete_docs'
  | 'high_risk'
  | 'compliance_issue'
  | 'invalid_info'
  | 'business_not_allowed'
  | 'sanctions_match'
  | 'other'

export interface RejectionReason {
  predefined: RejectionPredefinedReason
  freeText?: string
}

export interface AuditLogEntry {
  id: string
  gatewayId: string
  action: 'created' | 'submitted' | 'approved' | 'rejected' | 'activated' | 'suspended' | 'updated' | 'deleted'
  userId: string
  userName: string
  userEmail?: string
  timestamp: string
  reason?: RejectionReason
  metadata?: Record<string, any>
  ipAddress?: string
}

export interface KYCDocument {
  id: string
  type: 'passport' | 'national_id' | 'drivers_license' | 'other'
  name: string
  fileUrl: string
  fileSize: number
  uploadedAt: string
  verifiedAt?: string
  status: 'pending' | 'verified' | 'rejected'
  rejectionReason?: string
}

export interface KYBDocument {
  id: string
  type: 'business_license' | 'tax_certificate' | 'bank_statement' | 'proof_of_address' | 'articles_of_incorporation' | 'other'
  name: string
  fileUrl: string
  fileSize: number
  uploadedAt: string
  verifiedAt?: string
  status: 'pending' | 'verified' | 'rejected'
  rejectionReason?: string
}

export interface KYCInfo {
  status: 'not_started' | 'in_progress' | 'pending_review' | 'verified' | 'rejected'
  documents: KYCDocument[]
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  nationality?: string
  submittedAt?: string
  verifiedAt?: string
  rejectedAt?: string
  rejectionReason?: RejectionReason
}

export interface KYBInfo {
  status: 'not_started' | 'in_progress' | 'pending_review' | 'verified' | 'rejected'
  documents: KYBDocument[]
  legalBusinessName?: string
  businessType?: string
  registrationNumber?: string
  taxId?: string
  country?: string
  address?: {
    line1: string
    line2?: string
    city: string
    state?: string
    postalCode: string
    country: string
  }
  submittedAt?: string
  verifiedAt?: string
  rejectedAt?: string
  rejectionReason?: RejectionReason
}

export interface RiskScore {
  value: number // 0-100
  level: 'low' | 'medium' | 'high' | 'critical'
  factors: Array<{
    factor: string
    impact: number
    description: string
  }>
  calculatedAt: string
  calculatedBy?: 'system' | 'manual'
  reviewedBy?: string
  reviewedAt?: string
}

export interface AMLCheck {
  id: string
  status: 'pending' | 'passed' | 'flagged' | 'failed'
  checkedAt: string
  checkedBy?: string
  flags?: Array<{
    type: string
    severity: 'info' | 'warning' | 'critical'
    description: string
  }>
  resolution?: string
  resolvedAt?: string
}

export interface ComplianceStatus {
  kyc: KYCInfo
  kyb: KYBInfo
  aml: AMLCheck
  riskScore: RiskScore
  overallStatus: 'incomplete' | 'pending' | 'approved' | 'rejected' | 'suspended'
  lastUpdatedAt: string
}

export interface ApiKey {
  id: string
  name: string
  key: string
  secret: string // masked in responses
  mode: GatewayMode
  permissions: string[]
  lastUsedAt?: string
  createdAt: string
  expiresAt?: string
  isActive: boolean
}

export interface Webhook {
  id: string
  url: string
  secret: string
  events: string[]
  retries: number
  timeout: number
  isActive: boolean
  lastTriggeredAt?: string
  lastSuccessAt?: string
  lastFailureAt?: string
  failureCount: number
  createdAt: string
}

export interface IPWhitelist {
  id: string
  ipAddress: string
  description?: string
  isActive: boolean
  createdAt: string
  createdBy: string
}

export interface MerchantGateway {
  id: string
  workspaceId: string
  name: string
  description?: string
  status: PaymentGatewayStatus
  mode: GatewayMode
  
  // Business Info
  businessInfo: {
    legalName: string
    displayName: string
    category: string
    businessType: string
    website?: string
    country: string
  }
  
  // Compliance
  compliance: ComplianceStatus
  
  // API Configuration
  apiKeys: ApiKey[]
  webhooks: Webhook[]
  ipWhitelist: IPWhitelist[]
  
  // Settings
  settings: {
    allowedCurrencies: string[]
    maxTransactionAmount: number
    dailyVolumeLimit: number
    monthlyVolumeLimit: number
    riskProfile: 'adaptive' | 'strict' | 'custom'
    autoSettlement: boolean
    settlementCurrency: string
  }
  
  // Audit & History
  auditLog: AuditLogEntry[]
  
  // Metadata
  createdAt: string
  updatedAt: string
  submittedAt?: string
  approvedAt?: string
  activatedAt?: string
  rejectedAt?: string
  suspendedAt?: string
  createdBy: string
  approvedBy?: string
  rejectedBy?: string
  suspendedBy?: string
}

export interface PaymentGatewayConnection {
  id: string
  gatewayId: string
  name: string
  status: PaymentGatewayStatus
  mode: GatewayMode
  volumeShare: number
  lastSync: string
  latency: string
}

export interface PaymentGatewayWebhookConfig {
  url: string
  secret: string
  retries: number
  timeout: number
  events: string[]
}

export interface PaymentGatewayCompliance {
  maxTransaction: number
  dailyVolume: number
  monthlyVolume?: number
  allowedCurrencies: string[]
  riskProfile: string
}

export interface PaymentGatewayReportItem {
  id: string
  gateway: string
  method: string
  amount: number
  currency: string
  status: string
  createdAt: string
}

export interface PaymentGatewayEventOption {
  label: string
  value: string
}

export interface PaymentGatewayResponse {
  connections: PaymentGatewayConnection[]
  webhook: PaymentGatewayWebhookConfig
  compliance: PaymentGatewayCompliance
  report: PaymentGatewayReportItem[]
  events: PaymentGatewayEventOption[]
}

// Gateway Creation/Update Payloads
export interface GatewayCreatePayload {
  name: string
  description?: string
  businessInfo: MerchantGateway['businessInfo']
  settings: Partial<MerchantGateway['settings']>
}

export interface GatewayUpdatePayload {
  name?: string
  description?: string
  businessInfo?: Partial<MerchantGateway['businessInfo']>
  settings?: Partial<MerchantGateway['settings']>
}

export interface GatewayApprovalPayload {
  approved: boolean
  reason?: RejectionReason
  notes?: string
}

// Gateway Filters
export interface GatewayFilters {
  search: string
  status: 'all' | PaymentGatewayStatus
  mode: 'all' | GatewayMode
  country?: string
}
