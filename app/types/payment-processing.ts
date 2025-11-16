export type PaymentIntentStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded'

export type PaymentSessionStatus = 
  | 'created'
  | 'active'
  | 'completed'
  | 'expired'
  | 'canceled'

export type PaymentConfirmationStatus = 
  | 'pending'
  | 'confirmed'
  | 'failed'

export type RefundStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'

export type DisputeStatus = 
  | 'open'
  | 'under_review'
  | 'won'
  | 'lost'
  | 'canceled'

export interface PaymentIntent {
  id: string
  linkId?: string
  gatewayId: string
  amount: number
  currency: string
  status: PaymentIntentStatus
  paymentMethod?: string
  customerId?: string
  customerEmail?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  expiresAt?: string
  succeededAt?: string
  failedAt?: string
  failureReason?: string
}

export interface PaymentSession {
  id: string
  intentId: string
  gatewayId: string
  status: PaymentSessionStatus
  returnUrl?: string
  cancelUrl?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  expiresAt: string
  completedAt?: string
}

export interface PaymentConfirmation {
  id: string
  intentId: string
  sessionId: string
  status: PaymentConfirmationStatus
  transactionId?: string
  receiptUrl?: string
  confirmedAt?: string
  failedAt?: string
  failureReason?: string
}

export interface Refund {
  id: string
  paymentId: string
  amount: number
  currency: string
  status: RefundStatus
  reason?: string
  refundedAt?: string
  processedAt?: string
  failureReason?: string
  createdAt: string
  createdBy: string
}

export interface Dispute {
  id: string
  paymentId: string
  amount: number
  currency: string
  status: DisputeStatus
  reason: string
  evidence?: Array<{
    type: string
    url: string
    uploadedAt: string
  }>
  openedAt: string
  closedAt?: string
  resolution?: string
}

export interface ProcessingFilters {
  search: string
  status: 'all' | PaymentIntentStatus | PaymentSessionStatus | RefundStatus | DisputeStatus
  dateRange?: {
    start: string
    end: string
  }
  gatewayId?: string
  minAmount?: number
  maxAmount?: number
  currency?: string
}

