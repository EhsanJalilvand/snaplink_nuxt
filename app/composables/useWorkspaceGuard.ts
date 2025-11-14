import { computed, ref } from '#imports'
import { useWorkspace } from './useWorkspace'
import { useRoute, usePanels } from '#imports'

/**
 * Routes that don't require a workspace to be selected
 */
const WORKSPACE_EXEMPT_ROUTES = [
  '/dashboard/accountsettings',
  '/dashboard/account',
  '/dashboard/settings',
] as const

/**
 * Composable for workspace guard functionality
 * Checks if current route requires a workspace and provides utilities for workspace selection
 */
export const useWorkspaceGuard = () => {
  const route = useRoute()
  const { currentWorkspaceId, fetchWorkspaces, selectWorkspace } = useWorkspace()
  const { open } = usePanels()
  
  // Track if workspace selector panel is open
  const isSelectorOpen = ref(false)

  /**
   * Check if current route requires a workspace
   */
  const requiresWorkspace = computed(() => {
    const path = route.path
    return !WORKSPACE_EXEMPT_ROUTES.some(exemptRoute => path.startsWith(exemptRoute))
  })

  /**
   * Check if workspace is selected
   * Also checks query parameter for workspaceId (for cases where workspace is passed via URL)
   */
  const hasWorkspace = computed(() => {
    const queryWorkspaceId = route.query.workspaceId as string | undefined
    return !!(currentWorkspaceId.value || queryWorkspaceId)
  })

  /**
   * Check if workspace guard should be active (route requires workspace but none is selected)
   * Guard should remain active until a workspace is actually selected
   * Also stays active while selector panel is open
   */
  const isGuardActive = computed(() => {
    if (!requiresWorkspace.value) {
      return false
    }
    // Guard is active if:
    // 1. No workspace is selected (neither in state nor in query)
    // 2. OR selector panel is open (to prevent content from showing while selecting)
    const active = !hasWorkspace.value || isSelectorOpen.value
    if (import.meta.dev) {
      console.log('[useWorkspaceGuard] isGuardActive computed', {
        requiresWorkspace: requiresWorkspace.value,
        hasWorkspace: hasWorkspace.value,
        currentWorkspaceId: currentWorkspaceId.value,
        queryWorkspaceId: route.query.workspaceId,
        isSelectorOpen: isSelectorOpen.value,
        active,
      })
    }
    return active
  })

  /**
   * Open workspace selector panel
   */
  const openWorkspaceSelector = async () => {
    try {
      isSelectorOpen.value = true
      await fetchWorkspaces({ force: true })

      const WorkspaceSelectorPanel = (await import('~/components/WorkspaceSelectorPanel.vue')).default

      const [selectedWorkspace] = await open(
        WorkspaceSelectorPanel,
        {
          currentWorkspaceId: currentWorkspaceId.value,
        },
        {
          position: 'right',
          size: 'md',
          overlay: true,
        },
      )

      isSelectorOpen.value = false

      if (selectedWorkspace) {
        selectWorkspace(selectedWorkspace, { silent: true })

        // If we're on a route that requires workspace, navigate to it with workspaceId
        if (requiresWorkspace.value) {
          await navigateTo({
            path: route.path,
            query: { ...route.query, workspaceId: selectedWorkspace.id },
          }, { replace: true })
        }

        return selectedWorkspace
      }

      return null
    } catch (error) {
      isSelectorOpen.value = false
      if (import.meta.dev) {
        console.error('[useWorkspaceGuard] Failed to open workspace selector:', error)
      }
      throw error
    }
  }

  return {
    requiresWorkspace,
    hasWorkspace,
    isGuardActive,
    openWorkspaceSelector,
    currentWorkspaceId,
  }
}

