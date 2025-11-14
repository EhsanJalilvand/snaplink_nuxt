import { computed, useState, watch } from '#imports'
import { useWorkspace } from './useWorkspace'
import { useApi } from './useApi'
import { useWorkspaceTheme } from './useWorkspaceTheme'
import type { AppearanceSettings, AppearanceSettingsResponse } from '~/types/preferences'

interface BrandingState {
  settings: AppearanceSettings | null
  isLoading: boolean
  error: string | null
}

const initialState = (): BrandingState => ({
  settings: null,
  isLoading: false,
  error: null,
})

export const useWorkspaceBranding = () => {
  const api = useApi()
  const { currentWorkspaceId } = useWorkspace()
  const { applyTheme, resetTheme } = useWorkspaceTheme()
  const state = useState<BrandingState>('snaplink:workspace-branding', initialState)

  const fetchBranding = async (workspaceId: string) => {
    if (state.value.isLoading) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<AppearanceSettingsResponse>(`/workspaces/${workspaceId}/preferences/appearance`, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        retry: 1,
        timeout: 7000,
      })

      if (response?.data) {
        state.value.settings = response.data
        applyTheme(response.data)
      }
    } catch (error) {
      state.value.error = (error as Error)?.message ?? 'Failed to load branding.'
    } finally {
      state.value.isLoading = false
    }
  }

  watch(
    currentWorkspaceId,
    (newId) => {
      if (!import.meta.client) {
        return
      }

      if (!newId) {
        state.value.settings = null
        resetTheme()
        return
      }

      fetchBranding(newId)
    },
    { immediate: true },
  )

  const refreshBranding = () => {
    if (currentWorkspaceId.value) {
      fetchBranding(currentWorkspaceId.value)
    }
  }

  return {
    settings: computed(() => state.value.settings),
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),
    refreshBranding,
  }
}


