import { computed, reactive, toRefs, useState } from '#imports'
import { useApi } from './useApi'
import { useSecurity } from './useSecurity'
import { useNuiToasts } from '#imports'
import type {
  CreateWebhookPayload,
  Webhook,
  WebhookListResponse,
  UpdateWebhookStatusPayload,
} from '~/types/preferences'

interface WebhookState {
  items: Webhook[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
  createModalOpen: boolean
  draft: CreateWebhookPayload
}

const FALLBACK_WEBHOOKS: Webhook[] = [
  {
    id: 'wh-1',
    name: 'Link Created',
    url: 'https://api.example.com/webhooks/link-created',
    events: ['link.created'],
    status: 'active',
    secret: 'whsec_sample',
    createdAt: '2024-01-15',
  },
  {
    id: 'wh-2',
    name: 'Link Clicked',
    url: 'https://api.example.com/webhooks/link-clicked',
    events: ['link.clicked'],
    status: 'inactive',
    secret: 'whsec_sample',
    createdAt: '2024-01-10',
  },
]

const EVENT_OPTIONS = [
  { label: 'Link Created', value: 'link.created' },
  { label: 'Link Updated', value: 'link.updated' },
  { label: 'Link Deleted', value: 'link.deleted' },
  { label: 'Link Clicked', value: 'link.clicked' },
  { label: 'Link Expired', value: 'link.expired' },
]

const initialState = (): WebhookState => ({
  items: [],
  isLoading: false,
  isSaving: false,
  error: null,
  createModalOpen: false,
  draft: {
    name: '',
    url: '',
    events: [],
  },
})

export const usePreferencesWebhooks = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const security = useSecurity()

  const state = useState<WebhookState>('snaplink:preferences-webhooks', initialState)

  const sanitizeWebhook = (webhook: Webhook): Webhook => ({
    ...webhook,
    id: security.sanitizeInput(webhook.id, { trim: true }),
    name: security.sanitizeInput(webhook.name, { trim: true, replaceNewLines: true }),
    url: security.sanitizeInput(webhook.url, { trim: true }),
    events: webhook.events.map((event) => security.sanitizeInput(event, { trim: true })),
    status: webhook.status === 'inactive' ? 'inactive' : 'active',
    secret: webhook.secret ? security.sanitizeInput(webhook.secret, { trim: true }) : null,
    createdAt: security.sanitizeInput(webhook.createdAt, { trim: true }),
  })

  const setWebhooks = (items: Webhook[]) => {
    state.value.items = items.map(sanitizeWebhook)
    state.value.error = null
  }

  const fetchWebhooks = async () => {
    if (state.value.isLoading) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<WebhookListResponse>('/preferences/webhooks', {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
        retry: 1,
        validate: (payload): payload is WebhookListResponse =>
          typeof payload === 'object' && payload !== null && Array.isArray((payload as WebhookListResponse).data),
      })

      if (response?.data?.length) {
        setWebhooks(response.data)
      } else {
        setWebhooks(FALLBACK_WEBHOOKS)
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[usePreferencesWebhooks] Falling back to static webhooks', error)
      }
      state.value.error = 'Unable to load webhooks. Showing cached data.'
      setWebhooks(FALLBACK_WEBHOOKS)
    } finally {
      state.value.isLoading = false
    }
  }

  const resetDraft = () => {
    state.value.draft = {
      name: '',
      url: '',
      events: [],
    }
  }

  const openCreateModal = () => {
    state.value.createModalOpen = true
  }

  const closeCreateModal = () => {
    state.value.createModalOpen = false
    resetDraft()
  }

  const updateDraft = (patch: Partial<CreateWebhookPayload>) => {
    state.value.draft = {
      ...state.value.draft,
      name:
        patch.name !== undefined
          ? security.sanitizeInput(patch.name, { trim: true, replaceNewLines: true })
          : state.value.draft.name,
      url:
        patch.url !== undefined
          ? security.sanitizeInput(patch.url, { trim: true })
          : state.value.draft.url,
      events: Array.isArray(patch.events)
        ? patch.events.map((event) => security.sanitizeInput(event, { trim: true }))
        : state.value.draft.events,
    }
  }

  const toggleDraftEvent = (value: string) => {
    const sanitized = security.sanitizeInput(value, { trim: true })
    const events = state.value.draft.events
    if (events.includes(sanitized)) {
      state.value.draft.events = events.filter((item) => item !== sanitized)
    } else {
      state.value.draft.events = [...events, sanitized]
    }
  }

  const createWebhook = async () => {
    if (state.value.isSaving) {
      return
    }

    if (!state.value.draft.name || !state.value.draft.url || state.value.draft.events.length === 0) {
      toasts.add({
        title: 'Incomplete details',
        description: 'Fill in name, URL, and at least one event.',
        icon: 'ph:warning',
        progress: true,
      })
      return
    }

    state.value.isSaving = true

    try {
      const payload: CreateWebhookPayload = {
        name: security.sanitizeInput(state.value.draft.name, { trim: true, replaceNewLines: true }),
        url: security.sanitizeInput(state.value.draft.url, { trim: true }),
        events: state.value.draft.events.map((event) => security.sanitizeInput(event, { trim: true })),
      }

      await api.post('/preferences/webhooks', payload, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
        retry: 0,
      })

      const newWebhook: Webhook = sanitizeWebhook({
        id: `webhook-${Date.now()}`,
        name: payload.name,
        url: payload.url,
        events: [...payload.events],
        status: 'active',
        secret: 'whsec_sample',
        createdAt: new Date().toISOString(),
      })

      state.value.items = [newWebhook, ...state.value.items]
      toasts.add({
        title: 'Webhook created',
        description: 'We will send events to your endpoint.',
        icon: 'ph:check',
        progress: true,
      })
      closeCreateModal()
    } catch (error) {
      toasts.add({
        title: 'Creation failed',
        description: security.escapeHtml((error as Error)?.message ?? 'Unable to create webhook.'),
        icon: 'ph:warning',
        progress: true,
      })
    } finally {
      state.value.isSaving = false
    }
  }

  const removeWebhook = async (id: string) => {
    const sanitizedId = security.sanitizeInput(id, { trim: true })
    try {
      await api.delete(`/preferences/webhooks/${sanitizedId}`, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
      })

      state.value.items = state.value.items.filter((item) => item.id !== sanitizedId)
      toasts.add({
        title: 'Webhook removed',
        description: 'We will stop sending events to that endpoint.',
        icon: 'ph:check',
        progress: true,
      })
    } catch (error) {
      toasts.add({
        title: 'Removal failed',
        description: security.escapeHtml((error as Error)?.message ?? 'Unable to remove webhook.'),
        icon: 'ph:warning',
        progress: true,
      })
    }
  }

  const toggleWebhookStatus = async (id: string) => {
    const sanitizedId = security.sanitizeInput(id, { trim: true })
    const webhook = state.value.items.find((item) => item.id === sanitizedId)
    if (!webhook) {
      return
    }

    const nextStatus = webhook.status === 'active' ? 'inactive' : 'active'

    try {
      const payload: UpdateWebhookStatusPayload = {
        id: sanitizedId,
        status: nextStatus,
      }

      await api.put('/preferences/webhooks/status', payload, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
      })

      webhook.status = nextStatus
      toasts.add({
        title: 'Webhook updated',
        description: `Webhook ${nextStatus === 'active' ? 'activated' : 'deactivated'}.`,
        icon: 'ph:check',
        progress: true,
      })
    } catch (error) {
      toasts.add({
        title: 'Update failed',
        description: security.escapeHtml((error as Error)?.message ?? 'Unable to update webhook status.'),
        icon: 'ph:warning',
        progress: true,
      })
    }
  }

  const eventOptions = computed(() => EVENT_OPTIONS)

  return {
    ...toRefs(state.value),
    eventOptions,
    fetchWebhooks,
    openCreateModal,
    closeCreateModal,
    updateDraft,
    toggleDraftEvent,
    createWebhook,
    removeWebhook,
    toggleWebhookStatus,
  }
}
