export const useUserData = () => {
  // Fetch user data from server with shared key
  // This ensures all components use the same data and refresh triggers updates everywhere
  const { data, refresh, pending } = useFetch('/api/auth/me', {
    key: 'shared-user-data',
    default: () => ({ success: false, user: null, isAuthenticated: false }),
  })

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
