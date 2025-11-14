import { computed, useState, watch } from '#imports'
import { useApi } from './useApi'
import { useNuiToasts } from '#imports'
import { useSecurity } from './useSecurity'
import { useWorkspace } from './useWorkspace'
import type { DomainSettings, DomainValidationResult } from '~/types/preferences'

interface DomainState {
  settings: DomainSettings
  isLoading: boolean
  isSaving: boolean
  isValidating: boolean
  error: string | null
}

const initialState = (): DomainState => ({
  settings: {
    subdomain: undefined,
    customDomain: undefined,
    domainVerified: false,
  },
  isLoading: false,
  isSaving: false,
  isValidating: false,
  error: null,
})

export const usePreferencesDomains = (workspaceId?: string | null) => {
  const api = useApi()
  const toasts = useNuiToasts()
  const security = useSecurity()
  const { currentWorkspaceId } = useWorkspace()

  const effectiveWorkspaceId = computed(() => workspaceId || currentWorkspaceId.value)

  const state = useState<DomainState>('snaplink:preferences-domains', initialState)

  const resetState = () => {
    Object.assign(state.value, initialState())
  }

  const fetchSettings = async () => {
    if (state.value.isLoading || !effectiveWorkspaceId.value) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<{ data: DomainSettings }>(`/workspaces/${effectiveWorkspaceId.value}`, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
      })

      if (response?.data) {
        state.value.settings = {
          subdomain: response.data.subdomain,
          customDomain: response.data.customDomain,
          domainVerified: response.data.domainVerified || false,
        }
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[usePreferencesDomains] Failed to load settings', error)
      }
      state.value.error = 'Unable to load domain settings.'
    } finally {
      state.value.isLoading = false
    }
  }

  const validateDomain = async (subdomain?: string, customDomain?: string): Promise<DomainValidationResult> => {
    if (!effectiveWorkspaceId.value) {
      throw new Error('Workspace ID is required')
    }

    state.value.isValidating = true
    try {
      const response = await api.post<{ data: DomainValidationResult }>(
        `/workspaces/${effectiveWorkspaceId.value}/domains/validate`,
        { subdomain, customDomain },
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      return response?.data || { isValid: false, isVerified: false, errorMessage: 'Validation failed' }
    } catch (error) {
      return {
        isValid: false,
        isVerified: false,
        errorMessage: (error as Error)?.message || 'Validation failed',
      }
    } finally {
      state.value.isValidating = false
    }
  }

  const saveSettings = async () => {
    if (state.value.isSaving || !effectiveWorkspaceId.value) {
      return
    }

    // Validate before saving
    const validation = await validateDomain(state.value.settings.subdomain, state.value.settings.customDomain)
    if (!validation.isValid) {
      toasts.add({
        title: 'Validation failed',
        description: validation.errorMessage || 'Domain validation failed',
        icon: 'ph:warning',
        progress: true,
      })
      return
    }

    state.value.isSaving = true
    state.value.error = null

    try {
      await api.put(
        `/workspaces/${effectiveWorkspaceId.value}`,
        {
          name: '', // Will be ignored if empty
          subdomain: state.value.settings.subdomain,
          customDomain: state.value.settings.customDomain,
        },
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      state.value.settings.domainVerified = validation.isVerified
      toasts.add({
        title: 'Domains updated',
        description: 'Domain settings saved successfully.',
        icon: 'ph:check',
        progress: true,
      })
    } catch (error) {
      state.value.error = 'Failed to save domain settings.'
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

  const updateSetting = <K extends keyof DomainSettings>(key: K, value: DomainSettings[K]) => {
    state.value.settings = {
      ...state.value.settings,
      [key]: value,
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

  return {
    settings: computed(() => state.value.settings),
    isLoading: computed(() => state.value.isLoading),
    isSaving: computed(() => state.value.isSaving),
    isValidating: computed(() => state.value.isValidating),
    error: computed(() => state.value.error),
    fetchSettings,
    saveSettings,
    validateDomain,
    updateSetting,
  }
}
