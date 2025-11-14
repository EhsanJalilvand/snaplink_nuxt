import { computed, toRefs, useState, watch } from '#imports'
import { useApi } from './useApi'
import { useNuiToasts } from '#imports'
import { useSecurity } from './useSecurity'
import { useWorkspace } from './useWorkspace'
import type {
  AppearanceSettings,
  AppearanceSettingsResponse,
  SaveAppearancePayload,
  AnimationSpeedOption,
  BorderRadiusOption,
  ThemeOption,
} from '~/types/preferences'

interface AppearanceState {
  settings: AppearanceSettings
  isLoading: boolean
  isSaving: boolean
  error: string | null
  lastSavedAt?: number
}

const FALLBACK_SETTINGS: AppearanceSettings = {
  primaryColor: '#6366f1',
  accentColor: '#8b5cf6',
  theme: 'light',
  fontFamily: 'Inter',
  borderRadius: 'md', // Default, not saved
  animationSpeed: 'normal', // Default, not saved
  logoUrl: '',
  faviconUrl: '',
}

const COLOR_PRESETS = [
  { name: 'Primary', value: '#6366f1' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f59e0b' },
]

const THEME_OPTIONS: Array<{ label: string; value: ThemeOption }> = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Auto', value: 'auto' },
]

const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Iran Sans', value: 'IRANSansX' },
]

const RADIUS_OPTIONS: Array<{ label: string; value: BorderRadiusOption }> = [
  { label: 'None', value: 'none' },
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
]

const ANIMATION_OPTIONS: Array<{ label: string; value: AnimationSpeedOption }> = [
  { label: 'Fast', value: 'fast' },
  { label: 'Normal', value: 'normal' },
  { label: 'Slow', value: 'slow' },
]

const initialState = (): AppearanceState => ({
  settings: { ...FALLBACK_SETTINGS },
  isLoading: false,
  isSaving: false,
  error: null,
  lastSavedAt: undefined,
})

export const usePreferencesAppearance = (workspaceId?: string | null) => {
  const api = useApi()
  const toasts = useNuiToasts()
  const security = useSecurity()
  const { currentWorkspaceId } = useWorkspace()

  const effectiveWorkspaceId = computed(() => {
    const id = workspaceId || currentWorkspaceId.value
    if (import.meta.dev) {
      console.log('[usePreferencesAppearance] effectiveWorkspaceId computed', { workspaceId, currentWorkspaceId: currentWorkspaceId.value, effective: id })
    }
    return id
  })

  const state = useState<AppearanceState>('snaplink:preferences-appearance', initialState)

  const resetState = () => {
    Object.assign(state.value, initialState())
  }

  const resolveAssetUrl = (url?: string | null) => {
    if (!url) {
      return url ?? undefined
    }
    if (/^https?:\/\//i.test(url)) {
      return url
    }
    const baseUrl = api.getBaseUrl('gateway')
    return api.buildUrl(baseUrl, url)
  }

  const setSettings = (payload: AppearanceSettings | any) => {
    state.value.settings = {
      ...FALLBACK_SETTINGS,
      primaryColor: payload.primaryColor || FALLBACK_SETTINGS.primaryColor,
      accentColor: payload.accentColor || FALLBACK_SETTINGS.accentColor,
      theme: payload.theme || FALLBACK_SETTINGS.theme,
      fontFamily: payload.fontFamily || FALLBACK_SETTINGS.fontFamily,
      borderRadius: 'md', // Always default, ignore from API
      animationSpeed: 'normal', // Always default, ignore from API
      logoUrl: resolveAssetUrl(payload.logoUrl),
      faviconUrl: resolveAssetUrl(payload.faviconUrl),
    }
    state.value.error = null
  }

  const fetchSettings = async () => {
    if (state.value.isLoading || !effectiveWorkspaceId.value) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<AppearanceSettingsResponse>(`/workspaces/${effectiveWorkspaceId.value}/preferences/appearance`, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        retry: 1,
        timeout: 7000,
        validate: (payload): payload is AppearanceSettingsResponse =>
          typeof payload === 'object' && payload !== null && 'data' in payload,
      })

      if (response?.data) {
        setSettings(response.data)
      } else {
        setSettings(FALLBACK_SETTINGS)
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[usePreferencesAppearance] Falling back to defaults', error)
      }
      state.value.error = 'Unable to load appearance preferences. Showing cached defaults.'
      setSettings(FALLBACK_SETTINGS)
    } finally {
      state.value.isLoading = false
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

      fetchSettings()
    },
    { immediate: true },
  )

  const saveSettings = async () => {
    if (state.value.isSaving) {
      console.warn('[usePreferencesAppearance] Already saving, skipping...')
      return
    }

    if (!effectiveWorkspaceId.value) {
      console.error('[usePreferencesAppearance] Workspace ID is missing for save', { workspaceId, currentWorkspaceId: currentWorkspaceId.value })
      toasts.add({
        title: 'Save failed',
        description: 'Workspace ID is required. Please select a workspace first.',
        icon: 'ph:warning',
        progress: true,
      })
      return
    }

    console.log('[usePreferencesAppearance] Saving settings', { workspaceId: effectiveWorkspaceId.value, payload: state.value.settings })
    state.value.isSaving = true
    state.value.error = null

    try {
      // Build payload with all required fields for backend
      // Backend expects: PrimaryColor, AccentColor, FontFamily, Theme, BorderRadius, AnimationSpeed, LogoUrl, FaviconUrl
      // ASP.NET Core model binding is case-insensitive, so camelCase should work
      // But we'll send both to be safe, or let the JSON serializer handle it
      const payload = {
        primaryColor: state.value.settings.primaryColor || FALLBACK_SETTINGS.primaryColor,
        accentColor: state.value.settings.accentColor || FALLBACK_SETTINGS.accentColor || '#8b5cf6',
        theme: String(state.value.settings.theme || FALLBACK_SETTINGS.theme), // Ensure it's a string
        fontFamily: state.value.settings.fontFamily || FALLBACK_SETTINGS.fontFamily,
        borderRadius: 'md', // Always default
        animationSpeed: 'normal', // Always default
        logoUrl: state.value.settings.logoUrl || '',
        faviconUrl: state.value.settings.faviconUrl || '',
      }
      const url = `/workspaces/${effectiveWorkspaceId.value}/preferences/appearance`
      console.log('[usePreferencesAppearance] Making PUT request to:', url, { payload })
      const response = await api.put(url, payload, {
        base: 'gateway',
        requiresAuth: true,
        quiet: false, // Set to false to see error details
        retry: 0,
        timeout: 7000,
      })
      console.log('[usePreferencesAppearance] Save response:', response)
      
      // Refresh settings after save
      await fetchSettings()

      state.value.lastSavedAt = Date.now()
      toasts.add({
        title: 'Appearance updated',
        description: 'Visual preferences saved successfully.',
        icon: 'ph:check',
        progress: true,
      })
    } catch (error) {
      state.value.error = 'Failed to save appearance preferences.'
      toasts.add({
        title: 'Save failed',
        description: security.escapeHtml((error as Error)?.message ?? 'Please try again later.'),
        icon: 'ph:warning',
        progress: true,
      })
    } finally {
      state.value.isSaving = false
    }
  }

  const uploadLogo = async (file: File) => {
    if (!effectiveWorkspaceId.value) {
      console.error('[usePreferencesAppearance] Workspace ID is missing', { workspaceId, currentWorkspaceId: currentWorkspaceId.value })
      throw new Error('Workspace ID is required')
    }

    console.log('[usePreferencesAppearance] Uploading logo', { workspaceId: effectiveWorkspaceId.value, fileName: file.name })
    const formData = new FormData()
    formData.append('file', file)

    try {
      const url = `/workspaces/${effectiveWorkspaceId.value}/logo`
      console.log('[usePreferencesAppearance] Making POST request to:', url)
      const response = await api.post<{ data: { logoUrl?: string } }>(url, formData, {
        base: 'gateway',
        requiresAuth: true,
      })
      console.log('[usePreferencesAppearance] Upload response:', response)

      // Update logoUrl in settings if available
      if (response?.data?.logoUrl) {
        updateSetting('logoUrl', resolveAssetUrl(response.data.logoUrl))
      } else {
        // Refresh settings to get updated logoUrl
        await fetchSettings()
      }
      
      toasts.add({
        title: 'Logo uploaded',
        description: 'Workspace logo updated successfully.',
        icon: 'ph:check',
        progress: true,
      })
    } catch (error) {
      toasts.add({
        title: 'Upload failed',
        description: security.escapeHtml((error as Error)?.message ?? 'Please try again later.'),
        icon: 'ph:warning',
        progress: true,
      })
      throw error
    }
  }

  const deleteLogo = async () => {
    if (!effectiveWorkspaceId.value) {
      throw new Error('Workspace ID is required')
    }

    try {
      await api.delete(`/workspaces/${effectiveWorkspaceId.value}/logo`, {
        base: 'gateway',
        requiresAuth: true,
      })

      await fetchSettings()
      toasts.add({
        title: 'Logo removed',
        description: 'Workspace logo removed successfully.',
        icon: 'ph:check',
        progress: true,
      })
    } catch (error) {
      toasts.add({
        title: 'Delete failed',
        description: security.escapeHtml((error as Error)?.message ?? 'Please try again later.'),
        icon: 'ph:warning',
        progress: true,
      })
      throw error
    }
  }

  const updateSetting = <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
    state.value.settings = {
      ...state.value.settings,
      [key]: value,
    }
  }

  const colorPresets = computed(() => COLOR_PRESETS)
  const themeOptions = computed(() => THEME_OPTIONS)
  const fontOptions = computed(() => FONT_OPTIONS)

  return {
    ...toRefs(state.value),
    colorPresets,
    themeOptions,
    fontOptions,
    fetchSettings,
    saveSettings,
    updateSetting,
    uploadLogo,
    deleteLogo,
  }
}
