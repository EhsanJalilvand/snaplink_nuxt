export type ThemeOption = 'light' | 'dark' | 'auto'
export type BorderRadiusOption = 'none' | 'sm' | 'md' | 'lg'
export type AnimationSpeedOption = 'fast' | 'normal' | 'slow'

export type PreferencesTabId = 'appearance' | 'domains' | 'permissions' | 'team' | 'webhooks'

export interface PreferencesTab {
  id: PreferencesTabId
  label: string
  icon: string
}

export interface AppearanceSettings {
  primaryColor: string
  theme: ThemeOption
  fontFamily: string
  borderRadius: BorderRadiusOption
  animationSpeed: AnimationSpeedOption
  logoUrl?: string
}

export interface AppearanceSettingsResponse {
  data: AppearanceSettings
}

export interface SaveAppearancePayload extends AppearanceSettings {}

export type TeamMemberStatus = 'active' | 'pending' | 'inactive'
export type TeamMemberRole = 'member' | 'admin' | 'owner'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamMemberRole
  avatar: string | null
  status: TeamMemberStatus
  createdAt?: string
}

export interface TeamListResponse {
  data: TeamMember[]
}

export interface InviteTeamPayload {
  email: string
  role: TeamMemberRole
}

export interface UpdateTeamRolePayload {
  memberId: string
  role: TeamMemberRole
}

export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  status?: 'active' | 'inactive' // Computed from isActive for backward compatibility
  secret?: string
  createdAt: string
  lastTriggeredAt?: string
}

export interface WebhookListResponse {
  data: Webhook[]
}

export interface CreateWebhookPayload {
  name: string
  url: string
  events: string[]
}

export interface UpdateWebhookStatusPayload {
  id: string
  status: 'active' | 'inactive'
}

export interface DomainSettings {
  subdomain?: string
  customDomain?: string
  domainVerified: boolean
}

export interface DomainValidationResult {
  isValid: boolean
  isVerified: boolean
  errorMessage?: string
}

export interface WorkspacePermission {
  id: number
  permission: number
  name: string
  category: string
  description: string
}

export interface WorkspaceRolePermission {
  id: string
  workspaceId: string
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer'
  permission: number
  allowed: boolean
}

export interface PermissionMapping {
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer'
  permission: number
  allowed: boolean
}
