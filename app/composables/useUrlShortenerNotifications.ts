import { computed, toRefs } from '#imports'
import type {
  ShortenerNotificationResponse,
  ShortenerNotificationSettings,
} from '~/types/url-shortener'

interface ShortenerNotificationsState {
  settings: ShortenerNotificationSettings
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

const FALLBACK_SETTINGS: ShortenerNotificationSettings = {
  linkClick: {
    email: true,
    webhook: false,
    threshold: 100,
  },
  linkExpired: {
    email: true,
    webhook: false,
  },
  linkReachedLimit: {
    email: true,
    webhook: true,
  },
  dailySummary: {
    email: true,
    webhook: false,
    time: '09:00',
  },
  weeklyReport: {
    email: true,
    webhook: false,
    day: 'monday',
  },
}

const initialState = (): ShortenerNotificationsState => ({
  settings: structuredClone(FALLBACK_SETTINGS),
  isLoading: false,
  isSaving: false,
  error: null,
})

const sanitizeSettings = (settings: ShortenerNotificationSettings): ShortenerNotificationSettings => ({
  linkClick: {
    email: Boolean(settings.linkClick.email),
    webhook: Boolean(settings.linkClick.webhook),
    threshold: Number.isFinite(settings.linkClick.threshold) ? Math.max(0, settings.linkClick.threshold) : 0,
  },
  linkExpired: {
    email: Boolean(settings.linkExpired.email),
    webhook: Boolean(settings.linkExpired.webhook),
  },
  linkReachedLimit: {
    email: Boolean(settings.linkReachedLimit.email),
    webhook: Boolean(settings.linkReachedLimit.webhook),
  },
  dailySummary: {
    email: Boolean(settings.dailySummary.email),
    webhook: Boolean(settings.dailySummary.webhook),
    time: settings.dailySummary.time,
  },
  weeklyReport: {
    email: Boolean(settings.weeklyReport.email),
    webhook: Boolean(settings.weeklyReport.webhook),
    day: settings.weeklyReport.day,
  },
})

export const useUrlShortenerNotifications = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const security = useSecurity()

  const state = useState<ShortenerNotificationsState>('snaplink:url-shortener-notifications', initialState)

  const setSettings = (settings: ShortenerNotificationSettings) => {
    const sanitized = sanitizeSettings(settings)
    sanitized.dailySummary.time = security.sanitizeInput(sanitized.dailySummary.time ?? '09:00', { trim: true })
    sanitized.weeklyReport.day = security.sanitizeInput(sanitized.weeklyReport.day ?? 'monday', { trim: true })

    state.value.settings = structuredClone(sanitized)
    state.value.error = null
  }

  const fetchSettings = async () => {
    if (state.value.isLoading) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<ShortenerNotificationResponse>('/shortener/notifications', {
        base: 'gateway',
        validate: (payload): payload is ShortenerNotificationResponse =>
          typeof payload === 'object' && payload !== null && 'data' in payload,
        retry: 0,
        timeout: 7000,
        quiet: true,
      })

      if (response?.data) {
        setSettings(response.data)
      } else {
        setSettings(FALLBACK_SETTINGS)
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useUrlShortenerNotifications] Falling back to static settings', error)
      }
      state.value.error = 'Unable to load notification preferences. Showing cached data.'
      setSettings(FALLBACK_SETTINGS)
    } finally {
      state.value.isLoading = false
    }
  }

  const setThreshold = (threshold: number) => {
    state.value.settings.linkClick.threshold = Math.max(0, threshold)
  }

  const setDailySummaryTime = (time: string) => {
    state.value.settings.dailySummary.time = security.sanitizeInput(time, { trim: true })
  }

  const setWeeklyReportDay = (day: string) => {
    state.value.settings.weeklyReport.day = security.sanitizeInput(day, { trim: true })
  }

  const toggleChannel = (section: keyof ShortenerNotificationSettings, channel: 'email' | 'webhook', value: boolean) => {
    const sectionSettings = state.value.settings[section]
    if (section === 'dailySummary' || section === 'weeklyReport') {
      sectionSettings.email = value
      if (section === 'dailySummary') {
        sectionSettings.webhook = value && sectionSettings.webhook
      }
    } else {
      sectionSettings[channel] = value
    }
  }

  const saveSettings = async () => {
    if (state.value.isSaving) {
      return
    }

    state.value.isSaving = true

    try {
      const payload = sanitizeSettings(state.value.settings)
      payload.dailySummary.time = security.sanitizeInput(payload.dailySummary.time ?? '09:00', { trim: true })
      payload.weeklyReport.day = security.sanitizeInput(payload.weeklyReport.day ?? 'monday', { trim: true })

      await api.post('/shortener/notifications', payload, {
        base: 'gateway',
        quiet: true,
        timeout: 7000,
      })

      toasts.add({
        title: 'Settings saved',
        description: 'Notification preferences updated successfully.',
        icon: 'ph:check',
        color: 'success',
        progress: true,
      })
    } catch (error) {
      toasts.add({
        title: 'Save failed',
        description: 'Unable to update notification preferences. Please try again.',
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      if (import.meta.dev) {
        console.warn('[useUrlShortenerNotifications] Failed to save settings', error)
      }
    } finally {
      state.value.isSaving = false
    }
  }

  const linkClickEnabled = computed(() => state.value.settings.linkClick.email || state.value.settings.linkClick.webhook)
  const dailySummaryEnabled = computed(() => state.value.settings.dailySummary.email)
  const weeklyReportEnabled = computed(() => state.value.settings.weeklyReport.email)

  return {
    ...toRefs(state.value),
    fetchSettings,
    setThreshold,
    setDailySummaryTime,
    setWeeklyReportDay,
    toggleChannel,
    saveSettings,
    linkClickEnabled,
    dailySummaryEnabled,
    weeklyReportEnabled,
  }
}
