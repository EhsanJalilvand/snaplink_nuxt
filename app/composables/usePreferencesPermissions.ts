import { computed, useState, watch } from '#imports'
import { useApi } from './useApi'
import { useNuiToasts } from '#imports'
import { useSecurity } from './useSecurity'
import { useWorkspace } from './useWorkspace'
import type { WorkspacePermission, WorkspaceRolePermission, PermissionMapping } from '~/types/preferences'

interface PermissionState {
  permissions: WorkspacePermission[]
  rolePermissions: WorkspaceRolePermission[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

const ROLES = ['Owner', 'Admin', 'Member', 'Viewer'] as const

const initialState = (): PermissionState => ({
  permissions: [],
  rolePermissions: [],
  isLoading: false,
  isSaving: false,
  error: null,
})

export const usePreferencesPermissions = (workspaceId?: string | null) => {
  const api = useApi()
  const toasts = useNuiToasts()
  const security = useSecurity()
  const { currentWorkspaceId } = useWorkspace()

  const effectiveWorkspaceId = computed(() => workspaceId || currentWorkspaceId.value)

  const state = useState<PermissionState>('snaplink:preferences-permissions', initialState)

  const resetState = () => {
    Object.assign(state.value, initialState())
  }

  const fetchPermissions = async () => {
    if (!effectiveWorkspaceId.value) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const [permissionsResponse, rolePermissionsResponse] = await Promise.all([
        api.get<{ data: WorkspacePermission[] }>('/workspaces/permissions', {
          base: 'gateway',
          requiresAuth: true,
          quiet: true,
        }),
        api.get<{ data: WorkspaceRolePermission[] }>(`/workspaces/${effectiveWorkspaceId.value}/permissions`, {
          base: 'gateway',
          requiresAuth: true,
          quiet: true,
        }),
      ])

      if (permissionsResponse?.data) {
        state.value.permissions = permissionsResponse.data
      }

      if (rolePermissionsResponse?.data) {
        state.value.rolePermissions = rolePermissionsResponse.data
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[usePreferencesPermissions] Failed to load permissions', error)
      }
      state.value.error = 'Unable to load permissions.'
    } finally {
      state.value.isLoading = false
    }
  }

  const savePermissions = async (mappings: PermissionMapping[]) => {
    if (state.value.isSaving || !effectiveWorkspaceId.value) {
      return
    }

    state.value.isSaving = true
    state.value.error = null

    try {
      const response = await api.put<{ data: WorkspaceRolePermission[] }>(
        `/workspaces/${effectiveWorkspaceId.value}/permissions`,
        { mappings },
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      if (response?.data) {
        state.value.rolePermissions = response.data
        toasts.add({
          title: 'Permissions updated',
          description: 'Role permissions saved successfully.',
          icon: 'ph:check',
          progress: true,
        })
      }
    } catch (error) {
      state.value.error = 'Failed to save permissions.'
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

  const getPermissionForRole = (role: typeof ROLES[number], permissionId: number): boolean => {
    // Owner always has all permissions
    if (role === 'Owner') {
      return true
    }

    const mapping = state.value.rolePermissions.find(
      (rp) => rp.role === role && rp.permission === permissionId
    )

    // If no mapping exists, default to false (except Owner)
    return mapping?.allowed ?? false
  }

  const permissionsByCategory = computed(() => {
    const categories = new Map<string, WorkspacePermission[]>()
    state.value.permissions.forEach((perm) => {
      if (!categories.has(perm.category)) {
        categories.set(perm.category, [])
      }
      categories.get(perm.category)!.push(perm)
    })
    return Array.from(categories.entries()).map(([category, permissions]) => ({
      category,
      permissions,
    }))
  })

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

      fetchPermissions()
    },
    { immediate: true },
  )

  return {
    permissions: computed(() => state.value.permissions),
    rolePermissions: computed(() => state.value.rolePermissions),
    permissionsByCategory,
    roles: ROLES,
    isLoading: computed(() => state.value.isLoading),
    isSaving: computed(() => state.value.isSaving),
    error: computed(() => state.value.error),
    fetchPermissions,
    savePermissions,
    getPermissionForRole,
  }
}

