export type SettlementStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'reversed'

export type EscrowStatus = 
  | 'locked'
  | 'released'
  | 'refunded'
  | 'disputed'

export interface SettlementLog {
  id: string
  gatewayId: string
  batchId: string
  amount: number
  currency: string
  fees: number
  netAmount: number
  status: SettlementStatus
  settlementDate: string
  completedAt?: string
  failedAt?: string
  failureReason?: string
  transactionCount: number
  metadata?: Record<string, any>
}

export interface SettlementFee {
  id: string
  gatewayId: string
  transactionId: string
  feeType: 'processing' | 'gateway' | 'platform' | 'refund' | 'dispute'
  amount: number
  currency: string
  rate?: number // percentage
  description: string
  appliedAt: string
}

export interface EscrowTransaction {
  id: string
  paymentId: string
  gatewayId: string
  amount: number
  currency: string
  status: EscrowStatus
  lockedAt: string
  releaseDate?: string
  releasedAt?: string
  refundedAt?: string
  disputeId?: string
  metadata?: Record<string, any>
}

