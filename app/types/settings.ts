export interface TwoFactorStatus {
  enabled: boolean
  lastUpdated?: string
}

export interface SettingsSummaryLink {
  label: string
  description: string
  to: string
  icon: string
}

export interface AccountSettingsOverview {
  profile: SettingsSummaryLink[]
  security: SettingsSummaryLink[]
}

export interface TwoFactorStatusResponse {
  success: boolean
  enabled: boolean
  updated_at?: string
}

export interface ProfileFormValues {
  firstName: string
  lastName?: string | null
}

export interface ProfileUpdateResponse {
  success: boolean
}

export interface ProfileValidationError {
  path: string[]
  message: string
}
