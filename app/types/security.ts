export interface SecurityPasswordFormValues {
  newPassword: string
  confirmPassword: string
}

export interface SecurityPasswordResponse {
  success: boolean
}

export interface TwoFactorStatus {
  enabled: boolean
  updatedAt?: string
}

export interface TwoFactorStatusResponse {
  success: boolean
  enabled: boolean
  updated_at?: string
}

export interface TwoFactorSetupResponse {
  success: boolean
  configured?: boolean
  qrCode?: string
  secret?: string
  flowId: string
  csrfToken: string
}

export interface TwoFactorVerifyResponse {
  success: boolean
}

export interface PasswordChangePayload {
  newPassword: string
  confirmPassword: string
}

export interface PasswordChangeResponse {
  success: boolean
}

export interface TwoFactorStatusPayload {
  enabled: boolean
  updated_at?: string
}

export interface TwoFactorStatusResponse {
  success: boolean
  enabled: boolean
  updated_at?: string
}

export interface TwoFactorSetupResponse {
  success: boolean
  configured?: boolean
  qrCode?: string
  secret?: string
  flowId: string
  csrfToken: string
}

export interface TwoFactorVerifyPayload {
  flow: string
  code: string
  csrf_token: string
}

export interface TwoFactorVerifyResponse {
  success: boolean
}

export interface TwoFactorTogglePayload {
  enabled: boolean
}

export interface TwoFactorToggleResponse {
  success: boolean
}
