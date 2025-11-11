import { computed } from '#imports'
import type { Workspace, WorkspaceListResponse, WorkspaceSelectionPayload } from '~/types/workspace'

interface WorkspaceState {
  items: Workspace[]
  isLoading: boolean
  error: string | null
  currentWorkspaceId?: string
  hydrated: boolean
  fetchedAt?: number
}

const STORAGE_KEY = 'snaplink-current-workspace'

const FALLBACK_WORKSPACES: Workspace[] = [
  {
    id: '1',
    name: 'Personal Workspace',
    description: 'My personal links and projects',
    members: 1,
    links: 0,
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Business Team',
    description: 'Marketing and sales team workspace',
    members: 5,
    links: 12,
    createdAt: '2024-01-15',
  },
  {
    id: '3',
    name: 'Development Hub',
    description: 'Development and engineering workspace',
    members: 8,
    links: 25,
    createdAt: '2024-02-01',
  },
  {
    id: '4',
    name: 'Client Projects',
    description: 'Client-facing projects and links',
    members: 3,
    links: 8,
    createdAt: '2024-02-10',
  },
  {
    id: '5',
    name: 'Marketing Campaigns',
    description: 'Marketing campaigns and promotional links',
    members: 4,
    links: 15,
    createdAt: '2024-02-20',
  },
]

const initialState = (): WorkspaceState => ({
  items: [],
  isLoading: false,
  error: null,
  currentWorkspaceId: undefined,
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

    state.value.hydrated = true

    if (!import.meta.client) {
      return
    }

    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored) {
      return
    }

    try {
      const parsed = JSON.parse(stored) as { id: string }
      state.value.currentWorkspaceId = parsed.id
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

  const workspaces = computed(() => state.value.items)

  const currentWorkspace = computed<Workspace | null>(() => {
    if (!state.value.currentWorkspaceId) {
      return null
    }

    return state.value.items.find((workspace) => workspace.id === state.value.currentWorkspaceId) ?? null
  })

  const currentWorkspaceLabel = computed(() => currentWorkspace.value?.name ?? 'Select a workspace')

  const persistWorkspace = (workspace: Workspace | null) => {
    if (!import.meta.client) {
      return
    }

    if (workspace) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ id: workspace.id, name: workspace.name }),
      )
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const emitSelection = (workspace: Workspace | null, previousWorkspace?: Workspace | null) => {
    events.emit<WorkspaceSelectionPayload>('workspace:selected', {
      workspace,
      previousWorkspace,
    })
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
      persistWorkspace(resolved)
    } else {
      state.value.currentWorkspaceId = undefined
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

      const items = response?.data && response.data.length > 0 ? response.data : FALLBACK_WORKSPACES
      setWorkspaceList(items)
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useWorkspace] Falling back to static workspaces', error)
      }
      state.value.error = 'Unable to load workspaces from gateway. Showing cached workspaces.'
      setWorkspaceList(FALLBACK_WORKSPACES)
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
  }
}
