import type { SmartLinkConditionType } from './url-shortener'

export interface BulkLinkTemplate {
  id: string
  workspaceId: string
  name: string
  description?: string | null
  rules: BulkLinkTemplateRule[]
  fallbackUrlPattern?: string | null
  collectionIds: string[]
  isPublic: boolean
  visibilityRoles?: string[] | null
  visibilityMemberIds?: string[] | null
  expiresAt?: string | null
  clickLimit?: number | null
  isOneTime: boolean
  hasPassword: boolean
  domainType: string
  domainValue?: string | null
  pixelEvents?: Record<string, any> | null
  webhookUrl?: string | null
  webhookMethod?: string | null
  webhookHeaders?: Record<string, string> | null
  webhookBodyTemplate?: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
  campaignCount: number
}

export interface BulkLinkTemplateRule {
  targetUrlPattern: string
  conditionType: SmartLinkConditionType
  condition: Record<string, any>
  priority: number
  isActive: boolean
}

export interface BulkLinkTemplateListItem {
  id: string
  name: string
  description?: string | null
  ruleCount: number
  campaignCount: number
  totalLinks: number
  isOneTime: boolean
  hasPassword: boolean
  createdAt: string
  updatedAt: string
}

export interface BulkLinkCampaign {
  id: string
  workspaceId: string
  templateId: string
  templateName: string
  name: string
  description?: string | null
  isActive: boolean
  totalLinks: number
  createdLinks: number
  totalClicks: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface BulkLinkCampaignDetail extends BulkLinkCampaign {
  smartLinks: CampaignSmartLink[]
}

export interface CampaignSmartLink {
  id: string
  shortCode: string
  shortUrl: string
  name: string
  fallbackUrl?: string | null
  currentClicks: number
  createdAt: string
}

export interface BulkLinkCampaignItem {
  destinationUrl: string
  title?: string | null
  description?: string | null
}

export interface CreateBulkLinkTemplateRequest {
  name: string
  description?: string | null
  rules: BulkLinkTemplateRule[]
  fallbackUrlPattern?: string | null
  collectionIds?: string[] | null
  isPublic: boolean
  visibilityRoles?: string[] | null
  visibilityMemberIds?: string[] | null
  expiresAt?: string | null
  clickLimit?: number | null
  isOneTime: boolean
  password?: string | null
  domainType: string
  domainValue?: string | null
  pixelEvents?: Record<string, any> | null
  webhookUrl?: string | null
  webhookMethod?: string | null
  webhookHeaders?: Record<string, string> | null
  webhookBodyTemplate?: string | null
}

export interface UpdateBulkLinkTemplateRequest extends CreateBulkLinkTemplateRequest {
  clearPassword: boolean
}

export interface CreateBulkLinkCampaignRequest {
  templateId: string
  name: string
  description?: string | null
  items: BulkLinkCampaignItem[]
}

export interface ApplyTemplateUpdateRequest {
  campaignId?: string | null
}

export interface ApplyTemplateUpdateResult {
  totalSmartLinks: number
  updatedSmartLinks: number
  errors: string[]
}




