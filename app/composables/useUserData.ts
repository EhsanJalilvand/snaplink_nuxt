export const useUserData = () => {
  // Use Nuxt's useState to persist user data across components
  // This ensures all components share the same user data state
  const userDataState = useState<{
    user: any | null
    isAuthenticated: boolean
    isLoading: boolean
  }>('user-data', () => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  }))

  // Fetch user data from server
  const { data, refresh, pending } = useFetch('/api/auth/me', {
    key: 'shared-user-data',
    default: () => ({ success: false, user: null, isAuthenticated: false }),
  })

  // Watch data and update state when it changes
  watch(data, (newData) => {
    if (newData?.success && newData?.user) {
      userDataState.value.user = newData.user
      userDataState.value.isAuthenticated = newData.isAuthenticated
      userDataState.value.isLoading = false
    }
  }, { immediate: true })

  // Computed properties
  const user = computed(() => userDataState.value.user)
  const isAuthenticated = computed(() => userDataState.value.isAuthenticated)
  const isLoading = computed(() => userDataState.value.isLoading)

  // Refresh user data (triggers all components using this composable to update)
  const refreshUser = async () => {
    await refresh()
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
