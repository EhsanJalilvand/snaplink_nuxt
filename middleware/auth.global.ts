export default defineNuxtRouteMiddleware(async (to) => {
  // Allow public access to home page - skip auth check
  if (to.path === '/') {
    return
  }

  // Skip auth check for other public routes (not dashboard, not auth)
  if (!to.path.startsWith('/dashboard') && !to.path.startsWith('/auth')) {
    return
  }

  // For protected routes (dashboard) - check authentication from cookie
  if (to.path.startsWith('/dashboard')) {
    try {
      // Check authentication from server (reads HttpOnly cookies)
      const userResponse = await $fetch('/api/auth/me')

      // If user is not authenticated, redirect to login
      if (!userResponse.success || !userResponse.user || !userResponse.isAuthenticated) {
        return navigateTo('/auth/login')
      }

      return
    }
    catch (error) {
      console.error('[auth.global.ts] Error checking auth:', error)
      // On error, redirect to login (fail-secure)
      return navigateTo('/auth/login')
    }
  }

  // If user is authenticated and trying to access auth pages (except callback)
  if (to.path.startsWith('/auth/') && !to.path.includes('/callback')) {
    try {
      // Check authentication from server (reads HttpOnly cookies)
      const userResponse = await $fetch('/api/auth/me')

      if (userResponse.success && userResponse.user && userResponse.isAuthenticated) {
        return navigateTo('/dashboard')
      }
    }
    catch (error) {
      // If error, allow access to auth pages
      console.error('[auth.global.ts] Error checking auth:', error)
    }
  }
})
