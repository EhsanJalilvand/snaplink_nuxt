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

// Map role names to enum values (matching backend WorkspaceRole enum)
const roleToEnumMap: Record<typeof ROLES[number], number> = {
  Owner: 1,
  Admin: 2,
  Member: 3,
  Viewer: 4,
}

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

  const fetchPermissions = async (silent = false) => {
    if (!effectiveWorkspaceId.value) {
      return
    }

    if (!silent) {
      state.value.isLoading = true
      state.value.error = null
    }

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
        if (import.meta.dev) {
          console.log('[usePreferencesPermissions] Permissions loaded:', permissionsResponse.data.length)
        }
      }

      if (rolePermissionsResponse?.data) {
        state.value.rolePermissions = rolePermissionsResponse.data
        if (import.meta.dev) {
          console.log('[usePreferencesPermissions] Role permissions loaded:', {
            count: rolePermissionsResponse.data.length,
            sample: rolePermissionsResponse.data.slice(0, 5),
          })
        }
      } else {
        if (import.meta.dev) {
          console.warn('[usePreferencesPermissions] No role permissions in response:', rolePermissionsResponse)
        }
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[usePreferencesPermissions] Failed to load permissions', error)
      }
      if (!silent) {
        state.value.error = 'Unable to load permissions.'
      }
    } finally {
      if (!silent) {
        state.value.isLoading = false
      }
    }
  }

  const savePermissions = async (mappings: PermissionMapping[]) => {
    if (state.value.isSaving || !effectiveWorkspaceId.value) {
      return
    }

    state.value.isSaving = true
    state.value.error = null

    try {
      // Map role names to enum values
      const roleEnumMap: Record<string, number> = {
        Owner: 1,
        Admin: 2,
        Member: 3,
        Viewer: 4,
      }

      const requestBody = {
        Mappings: mappings.map(m => ({
          Role: roleEnumMap[m.role] || 0,
          Permission: m.permission,
          Allowed: m.allowed,
        })),
      }

      await api.put<{ data: WorkspaceRolePermission[] }>(
        `/workspaces/${effectiveWorkspaceId.value}/permissions`,
        requestBody,
        {
          base: 'gateway',
          requiresAuth: true,
        }
      )

      // Refresh permissions from server to ensure state is up to date (silent to avoid UI flicker)
      await fetchPermissions(true)

      toasts.add({
        title: 'Permissions updated',
        description: 'Role permissions saved successfully.',
        icon: 'ph:check',
        progress: true,
      })
    } catch (error: any) {
      if (import.meta.dev) {
        console.error('[usePreferencesPermissions] Save error:', {
          error,
          errorData: error?.data,
          errorMessage: error?.message,
          errorStatus: error?.status,
          errorStatusMessage: error?.statusMessage,
        })
        if (error?.data) {
          console.error('[usePreferencesPermissions] Error details:', JSON.stringify(error.data, null, 2))
        }
      }
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

    // Convert role name to enum value (backend returns role as number)
    const roleEnum = roleToEnumMap[role]
    
    const mapping = state.value.rolePermissions.find(
      (rp) => rp.role === roleEnum && rp.permission === permissionId
    )

    const result = mapping?.allowed ?? false

    // If no mapping exists, default to false (except Owner)
    return result
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

