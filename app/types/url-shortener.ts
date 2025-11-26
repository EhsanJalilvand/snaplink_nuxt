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

export type ShortenerLinkStatus = 'active' | 'paused' | 'expired' | 'disabled' | 'deleted'

export type ShortenerLinkType = 'urlShortener' | 'payment' | 'poll' | 'bio' | 'other'

// Backend LinkListDto mapping
export interface ShortenerLink {
  id: string
  shortCode: string
  shortUrl: string
  destinationUrl: string
  title?: string | null
  linkType: ShortenerLinkType
  linkStatus: ShortenerLinkStatus
  collectionIds?: string[] | null
  collectionNames?: string[] | null
  isPublic?: boolean | null
  visibilityRoles?: string[] | null
  visibilityMemberIds?: string[] | null
  currentClicks: number
  createdAt: string
  // Additional fields from LinkDto (for edit page)
  description?: string | null
  domainType?: string | null
  domainValue?: string | null
  customAlias?: string | null
  isOneTime?: boolean | null
  expiresAt?: string | null
  clickLimit?: number | null
  hasPassword?: boolean | null
  // Legacy fields for backward compatibility
  originalUrl?: string
  clicks?: number
  status?: ShortenerLinkStatus
  collection?: string | null
  collectionName?: string | null // For backward compatibility
}

// Backend PagedResult structure
export interface PagedResult<T> {
  items: T[]
  totalItems: number
  page: number
  pageSize: number
  totalPages: number
}

// Backend ApiResponse structure
export interface ApiResponse<T> {
  success: boolean
  data: T | null
  errors?: Array<{ message: string; code?: string | null }>
  meta?: unknown
}

// Response types
export interface ShortenerLinkListResponse {
  data: PagedResult<ShortenerLink> | ShortenerLink[]
}

// Backend CreateLinkResultDto
export interface CreateLinkResultDto {
  id: string
  shortUrl: string
  qrCodeBase64: string
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

// Backend CollectionListDto mapping
export interface ShortenerCollection {
  id: string
  name: string
  description?: string | null
  color: ShortenerCollectionColor
  linkCount: number
  totalClicks: number
  createdAt: string
}

// Response types
export interface ShortenerCollectionListResponse {
  data: PagedResult<ShortenerCollection> | ShortenerCollection[]
}

// Backend CreateCollectionRequest
export interface CreateCollectionRequest {
  name: string
  description?: string | null
  color?: string | null
  defaultExpirationHours?: number | null
  defaultPassword?: string | null
  tags?: string[] | null
}

// Backend CollectionDto (full collection details)
export interface ShortenerCollectionDto {
  id: string
  workspaceId: string
  name: string
  description?: string | null
  color: string
  defaultExpirationHours?: number | null
  isActive: boolean
  tags?: string[] | null
  linkCount: number
  totalClicks: number
  createdAt: string
  updatedAt: string
  createdBy: string
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

// Backend CreateLinkRequest
export interface CreateLinkRequest {
  collectionIds?: string[] | null
  destinationUrl: string
  title?: string | null
  description?: string | null
  linkType?: ShortenerLinkType | null
  customAlias?: string | null
  domainType?: string | null
  domainValue?: string | null
  password?: string | null
  expiresAt?: string | null
  clickLimit?: number | null
  isOneTime?: boolean | null
  isPublic?: boolean | null
  visibilityRoles?: string[] | null
  visibilityMemberIds?: string[] | null
  utmParameters?: {
    source?: string | null
    medium?: string | null
    campaign?: string | null
    term?: string | null
    content?: string | null
  } | null
  aiMetadata?: {
    summary?: string | null
    sentiment?: string | null
    category?: string | null
    language?: string | null
  } | null
}

// Backend UpdateLinkRequest
export interface UpdateLinkRequest {
  title?: string | null
  description?: string | null
  password?: string | null
  expiresAt?: string | null
  clickLimit?: number | null
  isPublic?: boolean | null
  isActive?: boolean | null
  visibilityRoles?: string[] | null
  visibilityMemberIds?: string[] | null
  isOneTime?: boolean | null
  domainType?: string | null
  domainValue?: string | null
  customAlias?: string | null
  collectionIds?: string[] | null
}

export type SmartLinkConditionType =
  | 'GeoCountry'
  | 'GeoRegion'
  | 'GeoCity'
  | 'DeviceType'
  | 'OperatingSystem'
  | 'Browser'
  | 'Referrer'
  | 'Schedule'
  | 'CustomExpression'

export interface SmartLinkRule {
  id?: string
  smartLinkId?: string
  targetLinkId: string
  conditionType: SmartLinkConditionType
  condition: Record<string, any>
  priority: number
  isActive: boolean
  summary?: string
}

export interface SmartLink {
  id: string
  workspaceId: string
  name: string
  shortCode: string
  shortUrl: string
  domainType: string
  domainValue?: string | null
  customAlias?: string | null
  description?: string | null
  defaultLinkId?: string | null
  isOneTime: boolean
  expiresAt?: string | null
  clickLimit?: number | null
  hasPassword: boolean
  currentClicks: number
  collectionIds?: string[] | null
  aiMetadata?: Record<string, any> | null
  createdAt: string
  updatedAt: string
  createdBy: string
  rules: SmartLinkRule[]
}

export interface CreateSmartLinkRuleInput {
  targetLinkId: string
  conditionType: SmartLinkConditionType
  condition: Record<string, any>
  priority: number
  isActive: boolean
}

export interface SmartLinkAiSuggestion {
  id: string
  title: string
  description: string
  recommendation: string
  score: number
  selected?: boolean
}

export interface SmartLinkAiInsightsRequest {
  goal: string
  kpi: string
  notes?: string | null
  defaultLinkId?: string | null
  rules: CreateSmartLinkRuleInput[]
}

export interface SmartLinkAiInsightsResponse {
  suggestions: SmartLinkAiSuggestion[]
}

export interface CreateSmartLinkRequest {
  name: string
  description?: string | null
  domainType?: string | null
  domainValue?: string | null
  customAlias?: string | null
  defaultLinkId?: string | null
  isOneTime?: boolean | null
  expiresAt?: string | null
  clickLimit?: number | null
  password?: string | null
  collectionIds?: string[] | null
  rules: CreateSmartLinkRuleInput[]
  aiMetadata?: Record<string, any> | null
}
