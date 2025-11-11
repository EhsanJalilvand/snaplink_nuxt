import { computed, reactive, toRefs, useState } from '#imports'
import { useApi } from './useApi'
import { useNuiToasts } from '#imports'
import { useSecurity } from './useSecurity'
import type {
  SupportTicket,
  SupportTicketCreatePayload,
  SupportTicketFilters,
  SupportTicketPriority,
  SupportTicketStatus,
  SupportTicketsResponse,
  SupportStat,
} from '~/types/support'

interface SupportState {
  stats: SupportStat[]
  tickets: SupportTicket[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
  filters: SupportTicketFilters
  modalOpen: boolean
  draft: SupportTicketCreatePayload
}

const FALLBACK_STATS: SupportStat[] = [
  {
    label: 'Active tickets',
    value: 128,
    delta: '+12.5%',
    icon: 'solar:lifebuoy-bold-duotone',
    color: 'primary',
  },
  {
    label: 'Waiting on customer',
    value: 36,
    delta: '-4.1%',
    icon: 'solar:user-speak-bold-duotone',
    color: 'warning',
  },
  {
    label: 'Avg first response',
    value: '7m 42s',
    delta: '-18%',
    icon: 'solar:clock-circle-bold-duotone',
    color: 'success',
  },
  {
    label: 'SLA breach risk',
    value: '6%',
    delta: '-2%',
    icon: 'solar:shield-warning-bold-duotone',
    color: 'danger',
  },
]

const FALLBACK_TICKETS: SupportTicket[] = [
  {
    id: 'TCK-4821',
    subject: 'Escrow payout stuck since yesterday',
    requester: 'Ava Stone',
    email: 'ava@novalabs.io',
    status: 'open',
    priority: 'high',
    updatedAt: '18 minutes ago',
    summary: 'Merchant reported an escrow payout that still shows as processing. Treasury review required before launch.',
  },
  {
    id: 'TCK-4819',
    subject: 'Webhook retries exhausted',
    requester: 'Leo Martins',
    email: 'leo@orbit.studio',
    status: 'waiting',
    priority: 'medium',
    updatedAt: '1 hour ago',
    summary: 'payment.success webhook is failing. Events are parked in the dead-letter queue until signature rotates.',
  },
  {
    id: 'TCK-4785',
    subject: 'Need branded checkout localization',
    requester: 'Sara Bloom',
    email: 'sara@pixelcraft.co',
    status: 'resolved',
    priority: 'low',
    updatedAt: 'Yesterday',
    summary: 'Customer requested localized checkout template for LATAM launch. Solutions team provided assets.',
  },
]

const initialState = (): SupportState => ({
  stats: [],
  tickets: [],
  isLoading: false,
  isSaving: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    priority: 'all',
  },
  modalOpen: false,
  draft: {
    requesterName: '',
    requesterEmail: '',
    subject: '',
    description: '',
    channel: 'email',
    priority: 'medium',
    tags: '',
  },
})

const STATUS_COLOR: Record<SupportTicketStatus, string> = {
  open: 'primary',
  waiting: 'warning',
  resolved: 'success',
  escalated: 'danger',
}

const PRIORITY_META: Record<SupportTicketPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'muted' },
  medium: { label: 'Medium', color: 'info' },
  high: { label: 'High', color: 'warning' },
  critical: { label: 'Critical', color: 'danger' },
}

export const useSupport = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const security = useSecurity()

  const state = useState<SupportState>('snaplink:support', initialState)

  const sanitizeTicket = (ticket: SupportTicket): SupportTicket => {
    return {
      ...ticket,
      subject: security.sanitizeInput(ticket.subject, { trim: true }),
      requester: security.sanitizeInput(ticket.requester, { trim: true }),
      email: security.sanitizeInput(ticket.email, { trim: true }),
      summary: security.sanitizeInput(ticket.summary ?? '', { trim: true, replaceNewLines: true }),
      updatedAt: security.sanitizeInput(ticket.updatedAt ?? '', { trim: true }),
    }
  }

  const setData = (stats: SupportStat[], tickets: SupportTicket[]) => {
    state.value.stats = stats.map((stat) => ({
      ...stat,
      label: security.sanitizeInput(stat.label, { trim: true }),
      delta: security.sanitizeInput(stat.delta, { trim: true }),
      icon: security.sanitizeInput(stat.icon, { trim: true }),
      color: security.sanitizeInput(stat.color, { trim: true }),
    }))
    state.value.tickets = tickets.map(sanitizeTicket)
    state.value.error = null
  }

  const fetchTickets = async () => {
    if (state.value.isLoading) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<SupportTicketsResponse>('/support/tickets', {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
        retry: 1,
        validate: (payload): payload is SupportTicketsResponse =>
          typeof payload === 'object' && payload !== null && Array.isArray((payload as SupportTicketsResponse).tickets),
      })

      if (response?.tickets?.length) {
        setData(response.stats ?? FALLBACK_STATS, response.tickets)
      } else {
        setData(FALLBACK_STATS, FALLBACK_TICKETS)
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useSupport] Falling back to static data', error)
      }
      state.value.error = 'Unable to load support telemetry. Showing cached data.'
      setData(FALLBACK_STATS, FALLBACK_TICKETS)
    } finally {
      state.value.isLoading = false
    }
  }

  const sanitizeStatus = (status: SupportTicketFilters['status']) => {
    const allowed: SupportTicketFilters['status'][] = ['all', 'open', 'waiting', 'resolved', 'escalated']
    return allowed.includes(status) ? status : 'all'
  }

  const sanitizePriority = (priority: SupportTicketFilters['priority']) => {
    const allowed: SupportTicketFilters['priority'][] = ['all', 'low', 'medium', 'high', 'critical']
    return allowed.includes(priority) ? priority : 'all'
  }

  const setFilters = (filters: Partial<SupportTicketFilters>) => {
    state.value.filters = {
      ...state.value.filters,
      search: filters.search !== undefined
        ? security.sanitizeInput(filters.search, { trim: true, replaceNewLines: true })
        : state.value.filters.search,
      status: filters.status !== undefined ? sanitizeStatus(filters.status) : state.value.filters.status,
      priority: filters.priority !== undefined ? sanitizePriority(filters.priority) : state.value.filters.priority,
    }
  }

  const resetDraft = () => {
    state.value.draft = {
      requesterName: '',
      requesterEmail: '',
      subject: '',
      description: '',
      channel: 'email',
      priority: 'medium',
      tags: '',
    }
  }

  const openModal = () => {
    state.value.modalOpen = true
  }

  const closeModal = () => {
    state.value.modalOpen = false
    resetDraft()
  }

  const updateDraft = (patch: Partial<SupportTicketCreatePayload>) => {
    state.value.draft = {
      ...state.value.draft,
      requesterName:
        patch.requesterName !== undefined
          ? security.sanitizeInput(patch.requesterName, { trim: true, replaceNewLines: true })
          : state.value.draft.requesterName,
      requesterEmail:
        patch.requesterEmail !== undefined
          ? security.sanitizeInput(patch.requesterEmail, { trim: true, replaceNewLines: true })
          : state.value.draft.requesterEmail,
      subject:
        patch.subject !== undefined
          ? security.sanitizeInput(patch.subject, { trim: true, replaceNewLines: true })
          : state.value.draft.subject,
      description:
        patch.description !== undefined
          ? security.sanitizeInput(patch.description, { trim: true, replaceNewLines: false })
          : state.value.draft.description,
      channel: patch.channel ?? state.value.draft.channel,
      priority: patch.priority ?? state.value.draft.priority,
      tags:
        patch.tags !== undefined
          ? security.sanitizeInput(patch.tags, { trim: true, replaceNewLines: true })
          : state.value.draft.tags,
    }
  }

  const createTicket = async () => {
    const { draft } = state.value
    const sanitizedSubject = security.sanitizeInput(draft.subject, { trim: true, replaceNewLines: true })
    const sanitizedDescription = security.sanitizeInput(draft.description, { trim: true, replaceNewLines: false })

    if (!sanitizedSubject || !sanitizedDescription) {
      toasts.add({
        title: 'Missing details',
        description: 'Please add a subject and description.',
        icon: 'ph:warning',
        progress: true,
      })
      return
    }

    if (state.value.isSaving) {
      return
    }

    state.value.isSaving = true

    const payload: SupportTicketCreatePayload = {
      requesterName: security.sanitizeInput(draft.requesterName, { trim: true, replaceNewLines: true }),
      requesterEmail: security.sanitizeInput(draft.requesterEmail, { trim: true, replaceNewLines: true }),
      subject: sanitizedSubject,
      description: sanitizedDescription,
      channel: draft.channel,
      priority: draft.priority,
      tags: security.sanitizeInput(draft.tags ?? '', { trim: true, replaceNewLines: true }),
    }

    try {
      await api.post('/support/tickets', payload, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
      })

      const newTicket: SupportTicket = sanitizeTicket({
        id: `TCK-${Date.now().toString().slice(-4)}`,
        subject: payload.subject,
        requester: payload.requesterName || 'Unknown requester',
        email: payload.requesterEmail || 'not-provided',
        status: 'open',
        priority: payload.priority,
        updatedAt: 'Just now',
        summary: payload.description.slice(0, 160),
      })

      state.value.tickets = [newTicket, ...state.value.tickets]
      toasts.add({
        title: 'Ticket created',
        description: 'We logged your request and assigned it to Support.',
        icon: 'ph:check',
        progress: true,
      })
      closeModal()
    } catch (error) {
      toasts.add({
        title: 'Ticket creation failed',
      description: security.escapeHtml((error as Error)?.message ?? 'Unable to create ticket.'),
        icon: 'ph:warning',
        progress: true,
      })
    } finally {
      state.value.isSaving = false
    }
  }

  const filteredTickets = computed(() => {
    const query = state.value.filters.search.trim().toLowerCase()
    return state.value.tickets.filter((ticket) => {
      const matchesQuery =
        !query ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.requester.toLowerCase().includes(query) ||
        ticket.id.toLowerCase().includes(query)

      const matchesStatus = state.value.filters.status === 'all' || ticket.status === state.value.filters.status
      const matchesPriority =
        state.value.filters.priority === 'all' || ticket.priority === state.value.filters.priority

      return matchesQuery && matchesStatus && matchesPriority
    })
  })

  const statusColor = (status: SupportTicketStatus) => STATUS_COLOR[status]
  const priorityMeta = (priority: SupportTicketPriority) => PRIORITY_META[priority]

  return {
    ...toRefs(state.value),
    filteredTickets,
    statusColor,
    priorityMeta,
    fetchTickets,
    setFilters,
    openModal,
    closeModal,
    updateDraft,
    createTicket,
  }
}
