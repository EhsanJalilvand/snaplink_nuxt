export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()

  // If user is not authenticated and trying to access protected routes
  if (!isAuthenticated.value && to.path.startsWith('/dashboard')) {
    return navigateTo('/auth/login')
  }

  // If user is authenticated and trying to access auth pages
  if (isAuthenticated.value && to.path.startsWith('/auth/')) {
    return navigateTo('/dashboard')
  }
})


