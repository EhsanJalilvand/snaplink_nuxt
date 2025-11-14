import { computed, ref, useState, watch } from '#imports'
import { useApi } from './useApi'
import { useSecurity } from './useSecurity'
import { useNuiToasts } from '#imports'
import { useWorkspace } from './useWorkspace'
import type {
  Webhook,
  WebhookListResponse,
  CreateWebhookPayload,
  UpdateWebhookStatusPayload,
} from '~/types/preferences'

interface WebhookState {
  items: Webhook[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

const EVENT_OPTIONS = [
  { label: 'Link Created', value: 'link.created' },
  { label: 'Link Updated', value: 'link.updated' },
  { label: 'Link Deleted', value: 'link.deleted' },
  { label: 'Link Clicked', value: 'link.clicked' },
  { label: 'Workspace Created', value: 'workspace.created' },
  { label: 'Workspace Updated', value: 'workspace.updated' },
]

const initialState = (): WebhookState => ({
  items: [],
  isLoading: false,
  isSaving: false,
  error: null,
})

export const usePreferencesWebhooks = (workspaceId?: string | null) => {
  const api = useApi()
  const toasts = useNuiToasts()
  const security = useSecurity()
  const { currentWorkspaceId } = useWorkspace()

  const effectiveWorkspaceId = computed(() => workspaceId || currentWorkspaceId.value)

  const state = useState<WebhookState>('snaplink:preferences-webhooks', initialState)

  const createModalOpen = ref(false)
  const draft = ref<CreateWebhookPayload>({
    name: '',
    url: '',
    events: [],
  })

  const resetState = () => {
    Object.assign(state.value, initialState())
    draft.value = { name: '', url: '', events: [] }
    createModalOpen.value = false
  }

  const fetchWebhooks = async () => {
    if (state.value.isLoading || !effectiveWorkspaceId.value) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<WebhookListResponse>(`/workspaces/${effectiveWorkspaceId.value}/webhooks`, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
        retry: 1,
        validate: (payload): payload is WebhookListResponse =>
          typeof payload === 'object' && payload !== null && Array.isArray((payload as WebhookListResponse).data),
      })

      if (response?.data) {
        state.value.items = response.data.map((webhook) => ({
          ...webhook,
          id: security.sanitizeInput(webhook.id, { trim: true }),
          name: security.sanitizeInput(webhook.name, { trim: true, replaceNewLines: true }),
          url: security.sanitizeInput(webhook.endpoint || webhook.url, { trim: true }),
          isActive: webhook.isActive ?? true,
          status: webhook.isActive ? 'active' : 'inactive',
          createdAt: webhook.createdAt || new Date().toISOString(),
          lastTriggeredAt: webhook.lastTriggeredAt,
        }))
      } else {
        state.value.items = []
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[usePreferencesWebhooks] Failed to load webhooks', error)
      }
      state.value.error = 'Unable to load webhooks.'
      state.value.items = []
    } finally {
      state.value.isLoading = false
    }
  }

  const createWebhook = async () => {
    if (state.value.isSaving || !effectiveWorkspaceId.value) {
      return
    }

    if (!draft.value.name || !draft.value.url || draft.value.events.length === 0) {
      toasts.add({
        title: 'Validation failed',
        description: 'Please fill in all required fields.',
        icon: 'ph:warning',
        progress: true,
      })
      return
    }

    state.value.isSaving = true
    state.value.error = null

    try {
      const sanitizedPayload: CreateWebhookPayload = {
        name: security.sanitizeInput(draft.value.name, { trim: true, replaceNewLines: true }),
        url: security.sanitizeInput(draft.value.url, { trim: true }),
        events: draft.value.events.map((e) => security.sanitizeInput(e, { trim: true })),
      }

      const response = await api.post<{ data: Webhook }>(`/workspaces/${effectiveWorkspaceId.value}/webhooks`, sanitizedPayload, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
        retry: 0,
      })

      if (response?.data) {
        state.value.items = [response.data, ...state.value.items]
        draft.value = { name: '', url: '', events: [] }
        createModalOpen.value = false
        toasts.add({
          title: 'Webhook created',
          description: 'Webhook was created successfully.',
          icon: 'ph:check',
          progress: true,
        })
      }
    } catch (error) {
      state.value.error = 'Failed to create webhook.'
      toasts.add({
        title: 'Creation failed',
        description: security.escapeHtml((error as Error)?.message ?? 'Please try again later.'),
        icon: 'ph:warning',
        progress: true,
      })
    } finally {
      state.value.isSaving = false
    }
  }

  const removeWebhook = async (id: string) => {
    if (!effectiveWorkspaceId.value) {
      return
    }

    const sanitizedId = security.sanitizeInput(id, { trim: true })
    try {
      await api.delete(`/workspaces/${effectiveWorkspaceId.value}/webhooks/${sanitizedId}`, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
      })

      state.value.items = state.value.items.filter((webhook) => webhook.id !== sanitizedId)

      toasts.add({
        title: 'Webhook removed',
        description: 'The webhook was removed successfully.',
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
    if (!effectiveWorkspaceId.value) {
      return
    }

    const sanitizedId = security.sanitizeInput(id, { trim: true })
    const webhook = state.value.items.find((w) => w.id === sanitizedId)
    if (!webhook) {
      return
    }

    const newStatus = webhook.isActive ? 'inactive' : 'active'

    try {
      const response = await api.put<{ data: Webhook }>(
        `/workspaces/${effectiveWorkspaceId.value}/webhooks/${sanitizedId}/status`,
        { status: newStatus },
        {
          base: 'gateway',
          requiresAuth: true,
          quiet: true,
          timeout: 7000,
          retry: 0,
        }
      )

      if (response?.data) {
        const index = state.value.items.findIndex((w) => w.id === sanitizedId)
        if (index !== -1) {
          state.value.items[index] = {
            ...response.data,
            id: response.data.id,
            name: response.data.name,
            url: response.data.endpoint || response.data.url,
            isActive: response.data.isActive,
            status: response.data.isActive ? 'active' : 'inactive',
            createdAt: response.data.createdAt || new Date().toISOString(),
            lastTriggeredAt: response.data.lastTriggeredAt,
          }
        }
      } else {
        webhook.isActive = newStatus === 'active'
        webhook.status = newStatus
      }

      toasts.add({
        title: 'Status updated',
        description: `Webhook ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
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

  const openCreateModal = () => {
    draft.value = { name: '', url: '', events: [] }
    createModalOpen.value = true
  }

  const closeCreateModal = () => {
    createModalOpen.value = false
    draft.value = { name: '', url: '', events: [] }
  }

  const updateDraft = (updates: Partial<CreateWebhookPayload>) => {
    draft.value = { ...draft.value, ...updates }
  }

  const toggleDraftEvent = (event: string) => {
    const index = draft.value.events.indexOf(event)
    if (index === -1) {
      draft.value.events.push(event)
    } else {
      draft.value.events.splice(index, 1)
    }
  }

  watch(
    effectiveWorkspaceId,
    (newId, previousId) => {
      if (!newId) {
        resetState()
        return
      }

      if (newId !== previousId) {
        resetState()
      }

      fetchWebhooks()
    },
    { immediate: true },
  )

  return {
    items: computed(() => state.value.items),
    isLoading: computed(() => state.value.isLoading),
    isSaving: computed(() => state.value.isSaving),
    error: computed(() => state.value.error),
    createModalOpen,
    draft,
    eventOptions: EVENT_OPTIONS,
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
