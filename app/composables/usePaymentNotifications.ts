import { computed, watch } from '#imports'
import type {
  PaymentNotificationChannels,
  PaymentNotificationEvents,
  PaymentNotificationPayload,
  PaymentNotificationPreviewContext,
  PaymentNotificationResponse,
  PaymentNotificationTemplates,
} from '~/types/payment-notifications'
import { useWorkspace } from './useWorkspace'

interface PaymentNotificationState extends PaymentNotificationPayload {
  isLoading: boolean
  error: string | null
  lastFetchedAt?: number
}

const initialState = (): PaymentNotificationState => ({
  channels: {
    email: false,
    push: false,
    sms: false,
    webhook: false,
  },
  events: {
    success: false,
    failed: false,
    refund: false,
    dispute: false,
  },
  templates: {
    success: '',
    failed: '',
  },
  previewContext: {
    customer: {
      name: '',
      email: '',
    },
    payment: {
      id: '',
      amount: '',
      currency: '',
      error: '',
    },
  },
  isLoading: false,
  error: null,
  lastFetchedAt: undefined,
})

const TOKEN_PATTERN = /{{\s*([\w.]+)\s*}}/g

export const usePaymentNotifications = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const security = useSecurity()
  const { currentWorkspaceId } = useWorkspace()

  const state = useState<PaymentNotificationState>('snaplink:payment-notifications', initialState)

  const setStateFromPayload = (payload: PaymentNotificationPayload) => {
    state.value.channels = payload.channels
    state.value.events = payload.events
    state.value.templates = payload.templates
    state.value.previewContext = payload.previewContext
    state.value.lastFetchedAt = Date.now()
    state.value.error = null
  }

  const fetchNotifications = async (options: { force?: boolean } = {}) => {
    if (state.value.isLoading) {
      return
    }

    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentNotifications] Workspace ID is required')
      }
      return
    }

    if (state.value.lastFetchedAt && !options.force) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentNotifications] Fetching notifications...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/notifications`,
        })
      }

      const response = await api.get<PaymentNotificationResponse>(`/api/payment/workspaces/${workspaceId}/notifications`, {
        base: 'gateway',
        validate: (payload): payload is PaymentNotificationResponse =>
          typeof payload === 'object' && payload !== null && 'channels' in payload,
        retry: 1,
        timeout: 15000,
        quiet: false,
      })

      if (response) {
        setStateFromPayload(response)
      } else {
        // API returned empty data
        setStateFromPayload({
          channels: { email: false, push: false, sms: false, webhook: false },
          events: { success: false, failed: false, refund: false, dispute: false },
          templates: { success: '', failed: '' },
          previewContext: {
            customer: { name: '', email: '' },
            payment: { id: '', amount: '', currency: '', error: '' },
          },
        })
      }
    } catch (error) {
      if (import.meta.dev) {
        console.error('[usePaymentNotifications] Failed to load notification preferences', error)
      }
      state.value.error = 'Unable to load notification preferences. Please try again.'
      // Keep existing data if available, otherwise reset to empty state
      if (!state.value.channels.email && !state.value.channels.push) {
        setStateFromPayload({
          channels: { email: false, push: false, sms: false, webhook: false },
          events: { success: false, failed: false, refund: false, dispute: false },
          templates: { success: '', failed: '' },
          previewContext: {
            customer: { name: '', email: '' },
            payment: { id: '', amount: '', currency: '', error: '' },
          },
        })
      }
    } finally {
      state.value.isLoading = false
    }
  }

  const setChannel = (channel: keyof PaymentNotificationChannels, value: boolean) => {
    state.value.channels[channel] = value
  }

  const setEvent = (event: keyof PaymentNotificationEvents, value: boolean) => {
    state.value.events[event] = value
  }

  const updateTemplate = (key: keyof PaymentNotificationTemplates, content: string) => {
    state.value.templates[key] = security.sanitizeInput(content, {
      stripHtml: false,
      trim: false,
    })
  }

  const formatTemplate = (template: string) => {
    return template.replace(TOKEN_PATTERN, (_, token) => {
      const segments = token.split('.')
      let value: unknown = state.value.previewContext
      for (const segment of segments) {
        if (value && typeof value === 'object' && segment in value) {
          value = (value as Record<string, unknown>)[segment]
        } else {
          value = ''
          break
        }
      }
      return typeof value === 'string' ? value : ''
    })
  }

  const previewSuccess = computed(() => formatTemplate(state.value.templates.success))
  const previewFailed = computed(() => formatTemplate(state.value.templates.failed))

  const saveConfiguration = async () => {
    const workspaceId = currentWorkspaceId.value
    if (!workspaceId) {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentNotifications] Workspace ID is required')
      }
      toasts.add({
        title: 'Save failed',
        description: 'Workspace ID is required. Please select a workspace first.',
        icon: 'ph:warning',
        progress: true,
      })
      return
    }

    try {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentNotifications] Saving notifications...', {
          workspaceId,
          endpoint: `/api/payment/workspaces/${workspaceId}/notifications`,
        })
      }

      await api.post(`/api/payment/workspaces/${workspaceId}/notifications`, {
        channels: state.value.channels,
        events: state.value.events,
        templates: state.value.templates,
      }, {
        base: 'gateway',
        quiet: false,
      })

      toasts.add({
        title: 'Notifications saved',
        description: 'Payment notification preferences updated successfully.',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })
    } catch (error) {
      toasts.add({
        title: 'Save failed',
        description: 'Unable to save notification preferences. Please try again.',
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      if (import.meta.dev) {
        console.warn('[usePaymentNotifications] Failed to save configuration', error)
      }
    }
  }

  const isLoading = computed(() => state.value.isLoading)
  const error = computed(() => state.value.error)

  // Watch for workspace changes and refresh data
  watch(
    currentWorkspaceId,
    (newWorkspaceId, previousWorkspaceId) => {
      if (import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[usePaymentNotifications] Workspace changed', {
          from: previousWorkspaceId,
          to: newWorkspaceId,
        })
      }

      if (!newWorkspaceId) {
        // Clear state if no workspace selected
        Object.assign(state.value, initialState())
        return
      }

      // If workspace changed, reset state and fetch new data
      if (newWorkspaceId !== previousWorkspaceId) {
        if (import.meta.dev) {
          // eslint-disable-next-line no-console
          console.warn('[usePaymentNotifications] Resetting state and fetching new data for workspace:', newWorkspaceId)
        }
        Object.assign(state.value, initialState())
        fetchNotifications({ force: true })
      }
    },
    { immediate: false },
  )

  return {
    ...toRefs(state.value),
    isLoading,
    error,
    fetchNotifications,
    setChannel,
    setEvent,
    updateTemplate,
    previewSuccess,
    previewFailed,
    saveConfiguration,
  }
}
