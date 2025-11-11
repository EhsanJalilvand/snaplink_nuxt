export interface PaymentNotificationChannels {
  email: boolean
  push: boolean
  sms: boolean
  webhook: boolean
}

export interface PaymentNotificationEvents {
  success: boolean
  failed: boolean
  refund: boolean
  dispute: boolean
}

export interface PaymentNotificationTemplates {
  success: string
  failed: string
}

export interface PaymentNotificationPreviewContext {
  customer: {
    name: string
    email: string
  }
  payment: {
    id: string
    amount: string
    currency: string
    error: string
  }
}

export interface PaymentNotificationPayload {
  channels: PaymentNotificationChannels
  events: PaymentNotificationEvents
  templates: PaymentNotificationTemplates
  previewContext: PaymentNotificationPreviewContext
}

export interface PaymentNotificationResponse extends PaymentNotificationPayload {}
