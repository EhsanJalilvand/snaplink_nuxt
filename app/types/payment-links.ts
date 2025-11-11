export type PaymentLinkStatus = 'active' | 'paused' | 'completed'

export interface PaymentLink {
  id: string
  name: string
  reference: string
  amount: number
  currency: string
  payments: number
  conversion: number
  status: PaymentLinkStatus
  createdAt: string
}

export interface PaymentLinkListResponse {
  data: PaymentLink[]
}

export interface PaymentLinkFilters {
  search: string
  status: 'all' | PaymentLinkStatus
  currency: 'all' | string
}

export interface PaymentLinkCreatePayload {
  id: string
  description?: string
  amount: number
  currency: string
  link: string
  createdAt?: string
  status?: PaymentLinkStatus
}

export interface PaymentLinkActionContext {
  link: PaymentLink
  previousStatus?: PaymentLinkStatus
}
