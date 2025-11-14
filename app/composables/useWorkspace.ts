import { computed, useState } from '#imports'
import type { Workspace, WorkspaceListResponse, WorkspaceSelectionPayload } from '~/types/workspace'
import { useApi } from './useApi'
import { useEvents } from './useEvents'

interface WorkspaceState {
  items: Workspace[]
  isLoading: boolean
  error: string | null
  currentWorkspaceId?: string
  currentWorkspaceName?: string // Store name from localStorage for immediate display
  hydrated: boolean
  fetchedAt?: number
}

const STORAGE_KEY = 'snaplink-current-workspace'

const initialState = (): WorkspaceState => ({
  items: [],
  isLoading: false,
  error: null,
  currentWorkspaceId: undefined,
  currentWorkspaceName: undefined,
  hydrated: false,
  fetchedAt: undefined,
})

export const useWorkspace = () => {
  const api = useApi()
  const events = useEvents()

  const state = useState<WorkspaceState>('snaplink:workspaces', initialState)

  const hydrateFromStorage = () => {
    if (state.value.hydrated) {
      return
    }

    if (!import.meta.client) {
      return
    }

    state.value.hydrated = true

    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored) {
      return
    }

    try {
      const parsed = JSON.parse(stored) as { id: string; name?: string }
      state.value.currentWorkspaceId = parsed.id
      state.value.currentWorkspaceName = parsed.name // Store name for immediate display
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useWorkspace] Failed to parse stored workspace', error)
      }
    }
  }

  const setWorkspaceList = (items: Workspace[]) => {
    state.value.items = items
    state.value.error = null
    state.value.fetchedAt = Date.now()
  }

  if (import.meta.client) {
    hydrateFromStorage()
  }

  const workspaces = computed(() => state.value.items)

  const currentWorkspace = computed<Workspace | null>(() => {
    if (!state.value.currentWorkspaceId) {
      return null
    }

    return state.value.items.find((workspace) => workspace.id === state.value.currentWorkspaceId) ?? null
  })

  const currentWorkspaceLabel = computed(() => {
    // First try to get name from loaded workspace
    if (currentWorkspace.value?.name) {
      return currentWorkspace.value.name
    }
    // Fallback to stored name from localStorage (for immediate display after refresh)
    if (state.value.currentWorkspaceName) {
      return state.value.currentWorkspaceName
    }
    return 'Select a workspace'
  })

  const persistWorkspace = (workspace: Workspace | null) => {
    if (!import.meta.client) {
      return
    }

    if (workspace) {
      const data = { id: workspace.id, name: workspace.name }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      // Also update state for immediate display
      state.value.currentWorkspaceName = workspace.name
    } else {
      localStorage.removeItem(STORAGE_KEY)
      state.value.currentWorkspaceName = undefined
    }
  }

  const emitSelection = (workspace: Workspace | null, previousWorkspace?: Workspace | null) => {
    events.emit<WorkspaceSelectionPayload>('workspace:selected', {
      workspace,
      previousWorkspace,
    })
  }

  const onWorkspaceSelection = (callback: (payload: WorkspaceSelectionPayload) => void) => {
    return events.on<WorkspaceSelectionPayload>('workspace:selected', callback)
  }

  const selectWorkspace = (workspace: Workspace | string | null, options: { silent?: boolean } = {}) => {
    hydrateFromStorage()

    const resolved = (() => {
      if (!workspace) {
        return null
      }

      if (typeof workspace === 'string') {
        return state.value.items.find((item) => item.id === workspace) ?? null
      }

      return workspace
    })()

    const previous = currentWorkspace.value

    if (resolved) {
      state.value.currentWorkspaceId = resolved.id
      state.value.currentWorkspaceName = resolved.name
      persistWorkspace(resolved)
    } else {
      state.value.currentWorkspaceId = undefined
      state.value.currentWorkspaceName = undefined
      persistWorkspace(null)
    }

    if (!options.silent) {
      emitSelection(resolved, previous)
    }

    return resolved
  }

  const fetchWorkspaces = async (options: { force?: boolean } = {}) => {
    hydrateFromStorage()

    if (state.value.isLoading) {
      return
    }

    if (state.value.items.length > 0 && !options.force) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<WorkspaceListResponse>('/workspaces', {
        base: 'gateway',
        validate: (payload): payload is WorkspaceListResponse =>
          typeof payload === 'object' && payload !== null && Array.isArray((payload as WorkspaceListResponse).data),
        retry: 1,
        timeout: 15000,
        quiet: true,
      })

      const items = response?.data ?? []
      setWorkspaceList(items)
      
      // If we have a stored workspaceId but workspace wasn't found in list, clear it
      if (state.value.currentWorkspaceId && !items.find(w => w.id === state.value.currentWorkspaceId)) {
        if (import.meta.dev) {
          console.warn('[useWorkspace] Stored workspace not found in list, clearing selection')
        }
        state.value.currentWorkspaceId = undefined
        state.value.currentWorkspaceName = undefined
        persistWorkspace(null)
      } else if (state.value.currentWorkspaceId) {
        // Update stored name if workspace is found
        const found = items.find(w => w.id === state.value.currentWorkspaceId)
        if (found) {
          state.value.currentWorkspaceName = found.name
          persistWorkspace(found)
        }
      }
    } catch (error) {
      state.value.error = 'Unable to load workspaces from gateway.'
    } finally {
      state.value.isLoading = false

      if (!state.value.currentWorkspaceId && state.value.items.length > 0) {
        selectWorkspace(state.value.items[0], { silent: true })
      }
    }
  }

  const clearWorkspace = () => {
    const previous = currentWorkspace.value
    state.value.currentWorkspaceId = undefined
    state.value.currentWorkspaceName = undefined
    persistWorkspace(null)
    emitSelection(null, previous)
  }

  const error = computed(() => state.value.error)
  const isLoading = computed(() => state.value.isLoading)

  return {
    workspaces,
    currentWorkspace,
    currentWorkspaceLabel,
    currentWorkspaceId: computed(() => state.value.currentWorkspaceId),
    isLoading,
    error,
    fetchWorkspaces,
    selectWorkspace,
    clearWorkspace,
    hydrateFromStorage,
    onWorkspaceSelection,
  }
}
