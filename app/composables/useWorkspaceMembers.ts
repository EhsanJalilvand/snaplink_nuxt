import { ref, watch } from '#imports'
import type { WorkspaceMemberSummary } from '~/types/workspace'
import { useWorkspaceContext } from './useWorkspaceContext'
import { useApi } from './useApi'

export const useWorkspaceMembers = () => {
  const members = ref<WorkspaceMemberSummary[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const { workspaceId } = useWorkspaceContext()
  const api = useApi()

  const normalizeRole = (role: unknown): WorkspaceMemberSummary['role'] => {
    if (typeof role === 'number') {
      switch (role) {
        case 1:
          return 'Owner'
        case 2:
          return 'Admin'
        case 4:
          return 'Viewer'
        default:
          return 'Member'
      }
    }

    if (typeof role === 'string') {
      const lower = role.toLowerCase()
      if (lower === 'owner') return 'Owner'
      if (lower === 'admin') return 'Admin'
      if (lower === 'viewer') return 'Viewer'
      return 'Member'
    }

    return 'Member'
  }

  const convertMember = (member: any): WorkspaceMemberSummary => {
    const normalizedRole = normalizeRole(member.role)
    return {
      id: String(member.id),
      userId: member.userId ?? String(member.id),
      displayName: member.displayName ?? member.name ?? member.email ?? 'Unknown',
      email: member.email ?? '',
      role: normalizedRole,
      avatarUrl: member.avatarUrl ?? null,
      status: member.status ?? null,
      roleLabel: normalizedRole === 'Member' ? 'Editor' : normalizedRole,
    }
  }

  const fetchMembers = async () => {
    if (!workspaceId.value) {
      members.value = []
      error.value = 'No workspace selected'
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{ data: WorkspaceMemberSummary[] }>(
        `/workspaces/${workspaceId.value}/preferences/team`,
        {
          base: 'gateway',
          requiresAuth: true,
          quiet: true,
          timeout: 7000,
          retry: 0,
        },
      )

      members.value = (response?.data ?? []).map(convertMember)
    } catch (err: any) {
      error.value = err?.message ?? 'Failed to load workspace members'
      members.value = []
    } finally {
      isLoading.value = false
    }
  }

  watch(
    () => workspaceId.value,
    (newId, oldId) => {
      if (!newId) {
        members.value = []
        return
      }

      if (newId !== oldId) {
        fetchMembers()
      }
    },
    { immediate: true },
  )

  return {
    members,
    isLoading,
    error,
    fetchMembers,
  }
}


