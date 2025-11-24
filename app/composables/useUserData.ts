export const useUserData = () => {
  // Fetch user data from server with shared key
  // This ensures all components use the same data and refresh triggers updates everywhere
  // Use useAsyncData with lazy: true to avoid warning when component is already mounted
  const { data, refresh, pending } = useAsyncData(
    'shared-user-data',
    async () => {
      if (!import.meta.client) {
        return { success: false, user: null, isAuthenticated: false }
      }
      try {
        // Use $fetch directly for Nuxt server API endpoints (not through gateway)
        const response = await $fetch<{ success: boolean; user: any; isAuthenticated: boolean }>('/api/auth/me', {
          method: 'GET',
          credentials: 'include', // Include cookies for session/auth
        })
        return response || { success: false, user: null, isAuthenticated: false }
      } catch (error) {
        if (import.meta.dev) {
          console.error('[useUserData] Failed to fetch user data:', error)
        }
        return { success: false, user: null, isAuthenticated: false }
      }
    },
    {
      default: () => ({ success: false, user: null, isAuthenticated: false }),
      lazy: true, // Lazy loading to avoid warning
      server: false, // Only fetch on client side
    }
  )

  // Computed properties - directly from data
  const user = computed(() => data.value?.user || null)
  const isAuthenticated = computed(() => data.value?.isAuthenticated || false)
  const isLoading = computed(() => pending.value)

  // Refresh user data (triggers all components using this composable to update)
  const refreshUser = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[useUserData] Refreshing user data...')
    }
    await refresh()
    if (process.env.NODE_ENV === 'development') {
      console.log('[useUserData] User data refreshed, current user:', data.value?.user?.firstName, 'has avatar:', !!(data.value?.user?.avatar))
    }
  }

  // Get user display name
  const userDisplayName = computed(() => {
    const currentUser = user.value
    if (!currentUser) return ''
    return currentUser.firstName
      ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
      : currentUser.username || currentUser.email || 'User'
  })

  return {
    user,
    isAuthenticated,
    isLoading,
    userDisplayName,
    refreshUser,
  }
}
