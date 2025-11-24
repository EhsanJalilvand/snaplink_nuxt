export interface Workspace {
  id: string
  name: string
  description?: string | null
  logo?: string | null
  members: number
  links: number
  createdAt?: string
}

export type WorkspaceMemberRole = 'Owner' | 'Admin' | 'Member' | 'Viewer'

export interface WorkspaceMemberSummary {
  id: string
  userId: string
  displayName: string
  email: string
  role: WorkspaceMemberRole
  avatarUrl?: string | null
  status?: string | null
  roleLabel?: string
}

export interface WorkspaceListResponse {
  data: Workspace[]
}

export interface WorkspaceSelectionPayload {
  workspace: Workspace | null
  previousWorkspace?: Workspace | null
}
