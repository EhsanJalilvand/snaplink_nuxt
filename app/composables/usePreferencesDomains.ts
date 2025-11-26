import { computed, useState, watch } from '#imports'
import { useApi } from './useApi'
import { useNuiToasts } from '#imports'
import { useSecurity } from './useSecurity'
import { useWorkspace } from './useWorkspace'
import type { DomainSettings } from '~/types/preferences'

interface WorkspaceProfile {
  name: string
  slug: string
  description?: string | null
}

interface DomainState {
  settings: DomainSettings
  workspace?: WorkspaceProfile
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

const initialState = (): DomainState => ({
  settings: {
    subdomain: undefined,
    customDomain: undefined,
    domainVerified: false,
  },
  workspace: undefined,
  isLoading: false,
  isSaving: false,
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

      const workspace = response?.data

      if (workspace) {
        state.value.settings = {
          subdomain: workspace.subdomain,
          customDomain: workspace.customDomain,
          domainVerified: workspace.domainVerified || false,
        }

        state.value.workspace = {
          name: workspace.name ?? '',
          slug: workspace.slug ?? '',
          description: workspace.description ?? '',
        }
      } else {
        state.value.workspace = undefined
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

  const ensureWorkspaceProfile = async (): Promise<WorkspaceProfile | null> => {
    if (!state.value.workspace && effectiveWorkspaceId.value) {
      await fetchSettings()
    }
    return state.value.workspace ?? null
  }

  const slugify = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || value
  }

  const saveSettings = async () => {
    if (state.value.isSaving || !effectiveWorkspaceId.value) {
      return
    }

    const workspaceProfile = await ensureWorkspaceProfile()
    if (!workspaceProfile || !workspaceProfile.name?.trim()) {
      state.value.error = 'Workspace information is unavailable. Refresh and try again.'
      toasts.add({
        title: 'Unable to save',
        description: 'Workspace profile could not be loaded. Please refresh and try again.',
        icon: 'ph:warning',
        color: 'warning',
        progress: true,
      })
      return
    }

    const normalizedName = workspaceProfile.name.trim()
    const normalizedSlug = workspaceProfile.slug?.trim() || slugify(normalizedName)
    const normalizedDescription = workspaceProfile.description ?? ''

    state.value.isSaving = true
    state.value.error = null

    try {
      await api.put(
        `/workspaces/${effectiveWorkspaceId.value}`,
        {
          name: normalizedName,
          slug: normalizedSlug,
          description: normalizedDescription,
          subdomain: state.value.settings.subdomain,
          customDomain: state.value.settings.customDomain,
        },
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      // Domain verification now handled asynchronously by backend team
      if (state.value.settings.customDomain) {
        state.value.settings.domainVerified = false
      }
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
    workspace: computed(() => state.value.workspace),
    isLoading: computed(() => state.value.isLoading),
    isSaving: computed(() => state.value.isSaving),
    error: computed(() => state.value.error),
    fetchSettings,
    saveSettings,
    updateSetting,
  }
}
