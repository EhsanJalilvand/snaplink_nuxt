export type PaymentGatewayStatus = 'active' | 'standby'

export interface PaymentGatewayConnection {
  id: string
  name: string
  status: PaymentGatewayStatus
  mode: string
  volumeShare: number
  lastSync: string
  latency: string
}

export interface PaymentGatewayWebhookConfig {
  url: string
  secret: string
  retries: number
  events: string[]
}

export interface PaymentGatewayCompliance {
  maxTransaction: number
  dailyVolume: number
  allowedCurrencies: string[]
  riskProfile: string
}

export interface PaymentGatewayReportItem {
  id: string
  gateway: string
  method: string
  amount: number
  currency: string
  status: string
  createdAt: string
}

export interface PaymentGatewayEventOption {
  label: string
  value: string
}

export interface PaymentGatewayResponse {
  connections: PaymentGatewayConnection[]
  webhook: PaymentGatewayWebhookConfig
  compliance: PaymentGatewayCompliance
  report: PaymentGatewayReportItem[]
  events: PaymentGatewayEventOption[]
}
