export interface Workspace {
  id: string
  name: string
  description?: string | null
  logo?: string | null
  members: number
  links: number
  createdAt?: string
}

export interface WorkspaceListResponse {
  data: Workspace[]
}

export interface WorkspaceSelectionPayload {
  workspace: Workspace | null
  previousWorkspace?: Workspace | null
}
