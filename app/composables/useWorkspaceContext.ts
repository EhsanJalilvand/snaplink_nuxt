import { computed } from '#imports'
import { useWorkspace } from './useWorkspace'

/**
 * Composable that provides workspace context (workspaceId)
 * This is a convenience wrapper around useWorkspace for easier access to workspaceId
 */
export const useWorkspaceContext = () => {
  const { currentWorkspaceId } = useWorkspace()

  return {
    workspaceId: computed(() => currentWorkspaceId.value || undefined),
  }
}

