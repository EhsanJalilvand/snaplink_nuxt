import { computed, toRefs, useState, watch } from '#imports'
import { useApi } from './useApi'
import { useSecurity } from './useSecurity'
import { useNuiToasts } from '#imports'
import { useWorkspace } from './useWorkspace'
import type {
  InviteTeamPayload,
  TeamListResponse,
  TeamMember,
  TeamMemberRole,
  UpdateTeamRolePayload,
} from '~/types/preferences'

interface TeamPreferencesState {
  members: TeamMember[]
  isLoading: boolean
  isInviting: boolean
  error: string | null
}

const ROLE_OPTIONS: Array<{ label: string; value: TeamMemberRole }> = [
  { label: 'Member', value: 'member' },
  { label: 'Admin', value: 'admin' },
  { label: 'Owner', value: 'owner' },
]

const initialState = (): TeamPreferencesState => ({
  members: [],
  isLoading: false,
  isInviting: false,
  error: null,
})

export const usePreferencesTeam = (workspaceId?: string | null) => {
  const api = useApi()
  const toasts = useNuiToasts()
  const security = useSecurity()
  const { currentWorkspaceId } = useWorkspace()

  const effectiveWorkspaceId = computed(() => workspaceId || currentWorkspaceId.value)

  const state = useState<TeamPreferencesState>('snaplink:preferences-team', initialState)

  const resetState = () => {
    Object.assign(state.value, initialState())
  }

  const sanitizeMember = (member: TeamMember): TeamMember => ({
    ...member,
    id: security.sanitizeInput(member.id, { trim: true }),
    name: security.sanitizeInput(member.name, { trim: true, replaceNewLines: true }),
    email: security.sanitizeInput(member.email, { trim: true, replaceNewLines: true }),
    role: member.role,
    avatar: member.avatar ? security.sanitizeInput(member.avatar, { trim: true }) : null,
    status: security.sanitizeInput(member.status, { trim: true }),
    createdAt: security.sanitizeInput(member.createdAt, { trim: true }),
  })

  const setMembers = (members: TeamMember[]) => {
    state.value.members = members.map(sanitizeMember)
    state.value.error = null
  }

  const fetchMembers = async () => {
    if (state.value.isLoading || !effectiveWorkspaceId.value) {
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<TeamListResponse>(`/workspaces/${effectiveWorkspaceId.value}/preferences/team`, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
        retry: 1,
        validate: (payload): payload is TeamListResponse =>
          typeof payload === 'object' && payload !== null && Array.isArray((payload as TeamListResponse).data),
      })

      if (response?.data?.length) {
        setMembers(response.data)
      } else {
        setMembers([])
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[usePreferencesTeam] Failed to load team members', error)
      }
      state.value.error = 'Unable to load team members.'
      setMembers([])
    } finally {
      state.value.isLoading = false
    }
  }

  const inviteMember = async (payload: InviteTeamPayload) => {
    if (state.value.isInviting || !effectiveWorkspaceId.value) {
      return
    }

    state.value.isInviting = true

    try {
      const sanitizedPayload: InviteTeamPayload = {
        email: security.sanitizeInput(payload.email, { trim: true, replaceNewLines: true }),
        role: payload.role,
      }

      const response = await api.post<{ data: TeamMember }>(`/workspaces/${effectiveWorkspaceId.value}/members`, {
        email: sanitizedPayload.email,
        displayName: sanitizedPayload.email.split('@')[0],
        role: sanitizedPayload.role,
      }, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
        retry: 0,
      })

      if (response?.data) {
        const newMember = sanitizeMember(response.data)
        state.value.members = [newMember, ...state.value.members]
      } else {
        // Fallback if response doesn't include member data
        const name = sanitizedPayload.email.split('@')[0]
        const newMember: TeamMember = sanitizeMember({
          id: `pending-${Date.now()}`,
          name,
          email: sanitizedPayload.email,
          role: sanitizedPayload.role,
          avatar: null,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
        state.value.members = [newMember, ...state.value.members]
      }

      toasts.add({
        title: 'Invitation sent',
        description: `We invited ${sanitizedPayload.email}.`,
        icon: 'ph:check',
        progress: true,
      })
    } catch (error) {
      toasts.add({
        title: 'Invitation failed',
        description: security.escapeHtml((error as Error)?.message ?? 'Unable to send invite.'),
        icon: 'ph:warning',
        progress: true,
      })
    } finally {
      state.value.isInviting = false
    }
  }

  const updateRole = async (memberId: string, role: TeamMemberRole) => {
    if (!effectiveWorkspaceId.value) {
      return
    }

    const sanitizedId = security.sanitizeInput(memberId, { trim: true })
    try {
      await api.put(`/workspaces/${effectiveWorkspaceId.value}/members/${sanitizedId}`, {
        role,
      }, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
        retry: 0,
      })

      const member = state.value.members.find((item) => item.id === sanitizedId)
      if (member) {
        member.role = role
      }

      toasts.add({
        title: 'Role updated',
        description: 'Team member role changed.',
        icon: 'ph:check',
        progress: true,
      })
    } catch (error) {
      toasts.add({
        title: 'Update failed',
        description: security.escapeHtml((error as Error)?.message ?? 'Unable to update role.'),
        icon: 'ph:warning',
        progress: true,
      })
    }
  }

  const removeMember = async (memberId: string) => {
    if (!effectiveWorkspaceId.value) {
      return
    }

    const sanitizedId = security.sanitizeInput(memberId, { trim: true })
    try {
      await api.delete(`/workspaces/${effectiveWorkspaceId.value}/members/${sanitizedId}`, {
        base: 'gateway',
        requiresAuth: true,
        quiet: true,
        timeout: 7000,
      })

      state.value.members = state.value.members.filter((member) => member.id !== sanitizedId)

      toasts.add({
        title: 'Member removed',
        description: 'The team member was removed from this workspace.',
        icon: 'ph:check',
        progress: true,
      })
    } catch (error) {
      toasts.add({
        title: 'Removal failed',
        description: security.escapeHtml((error as Error)?.message ?? 'Unable to remove team member.'),
        icon: 'ph:warning',
        progress: true,
      })
    }
  }

  const roleOptions = computed(() => ROLE_OPTIONS)

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

      fetchMembers()
    },
    { immediate: true },
  )

  return {
    ...toRefs(state.value),
    roleOptions,
    fetchMembers,
    inviteMember,
    updateRole,
    removeMember,
  }
}
