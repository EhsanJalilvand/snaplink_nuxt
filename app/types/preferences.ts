export type ThemeOption = 'light' | 'dark' | 'auto'
export type BorderRadiusOption = 'none' | 'sm' | 'md' | 'lg'
export type AnimationSpeedOption = 'fast' | 'normal' | 'slow'

export type PreferencesTabId = 'appearance' | 'team' | 'webhooks'

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
  status: 'active' | 'inactive'
  secret?: string
  createdAt: string
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
