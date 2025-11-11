export type SupportTicketStatus = 'open' | 'waiting' | 'resolved' | 'escalated'
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface SupportTicket {
  id: string
  subject: string
  requester: string
  email: string
  status: SupportTicketStatus
  priority: SupportTicketPriority
  updatedAt: string
  summary: string
}

export interface SupportStat {
  label: string
  value: string | number
  delta: string
  icon: string
  color: string
}

export interface SupportTicketFilters {
  search: string
  status: 'all' | SupportTicketStatus
  priority: 'all' | SupportTicketPriority
}

export interface SupportTicketCreatePayload {
  requesterName: string
  requesterEmail: string
  subject: string
  description: string
  channel: 'email' | 'chat' | 'api'
  priority: SupportTicketPriority
  tags?: string
}

export interface SupportTicketsResponse {
  stats: SupportStat[]
  tickets: SupportTicket[]
}
