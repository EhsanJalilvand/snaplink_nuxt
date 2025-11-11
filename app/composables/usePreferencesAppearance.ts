import { computed, toRefs, useState } from '#imports'
import { useApi } from './useApi'
import { useNuiToasts } from '#imports'
import { useSecurity } from './useSecurity'
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
  theme: 'light',
  fontFamily: 'Inter',
  borderRadius: 'md',
  animationSpeed: 'normal',
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

export const usePreferencesAppearance = () => {
  const api = useApi()
  const toasts = useNuiToasts()
  const security = useSecurity()

  const state = useState<AppearanceState>('snaplink:preferences-appearance', initialState)

  const setSettings = (payload: AppearanceSettings) => {
    state.value.settings = { ...FALLBACK_SETTINGS, ...payload }
    state.value.error = null
  }

  const fetchSettings = async () => {
    if (state.value.isLoading) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<AppearanceSettingsResponse>('/preferences/appearance', {
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

  const saveSettings = async () => {
    if (state.value.isSaving) {
      return
    }

    state.value.isSaving = true
    state.value.error = null

    try {
      const payload: SaveAppearancePayload = { ...state.value.settings }
      await api.put('/preferences/appearance', payload, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        retry: 0,
        timeout: 7000,
      })

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

  const updateSetting = <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
    state.value.settings = {
      ...state.value.settings,
      [key]: value,
    }
  }

  const colorPresets = computed(() => COLOR_PRESETS)
  const themeOptions = computed(() => THEME_OPTIONS)
  const fontOptions = computed(() => FONT_OPTIONS)
  const radiusOptions = computed(() => RADIUS_OPTIONS)
  const animationOptions = computed(() => ANIMATION_OPTIONS)

  return {
    ...toRefs(state.value),
    colorPresets,
    themeOptions,
    fontOptions,
    radiusOptions,
    animationOptions,
    fetchSettings,
    saveSettings,
    updateSetting,
  }
}
