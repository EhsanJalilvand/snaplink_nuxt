export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) {
    return
  }

  const { isAuthenticated: isAuthCustom } = useAuth()
  const { isAuthenticated: isAuthKeycloak, checkAuth: checkKeycloak } = useKeycloak()

  // Check Keycloak authentication status
  await checkKeycloak()

  // Check if user is authenticated (either Keycloak or custom)
  const isAuthenticated = isAuthCustom.value || isAuthKeycloak.value

  // If user is not authenticated and trying to access protected routes
  if (!isAuthenticated && to.path.startsWith('/dashboard')) {
    return navigateTo('/auth/login')
  }

  // If user is authenticated and trying to access auth pages (except callback)
  if (isAuthenticated && to.path.startsWith('/auth/') && !to.path.includes('/callback')) {
    return navigateTo('/dashboard')
  }
})


