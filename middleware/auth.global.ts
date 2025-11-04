/**
 * Global Auth Middleware
 * 
 * Flow:
 * 1. User opens app → calls /me → 401
 * 2. Redirect to Hydra auth (/api/auth/oauth/authorize)
 * 3. Hydra checks Kratos session → none
 * 4. Redirect to Kratos login
 * 5. Login → Kratos sets secure cookie
 * 6. Hydra issues tokens (access + refresh)
 * 7. Backend stores cookies HttpOnly
 * 8. User is IN → calls feed / tweet / profile
 * 9. Tokens auto refresh
 */

export default defineNuxtRouteMiddleware(async (to) => {
  // Allow public access to home page
  if (to.path === '/') {
    return
  }

  // Skip auth check for auth pages (except callback)
  if (to.path.startsWith('/auth') && !to.path.includes('/callback')) {
    // If user is already authenticated, redirect to dashboard
    try {
      const userResponse = await $fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (userResponse.success && userResponse.user && userResponse.isAuthenticated) {
        return navigateTo('/dashboard')
      }
    } catch (error) {
      // User is not authenticated, allow access to auth pages
    }
    return
  }

  // For protected routes (dashboard, etc.) - check authentication
  if (to.path.startsWith('/dashboard')) {
    try {
      // Check authentication from server (reads HttpOnly cookies)
      const userResponse = await $fetch('/api/auth/me', {
        credentials: 'include',
      })

      // If user is authenticated, check email verification
      if (userResponse.success && userResponse.user && userResponse.isAuthenticated) {
        // Check if email is verified
        if (!userResponse.user.emailVerified) {
          // Email not verified - redirect to verification page
          return navigateTo('/auth/verify-email')
        }
        return
      }

      // If not authenticated, redirect to OAuth2 authorization flow
      // This will eventually redirect to Kratos login if needed
      const returnTo = encodeURIComponent(to.fullPath)
      return navigateTo(`/api/auth/oauth/authorize?return_to=${returnTo}`)
    } catch (error: any) {
      // If /me returns 401, redirect to OAuth2 flow
      if (error.statusCode === 401 || error.status === 401) {
        const returnTo = encodeURIComponent(to.fullPath)
        return navigateTo(`/api/auth/oauth/authorize?return_to=${returnTo}`)
      }

      // On other errors, redirect to OAuth2 flow (fail-secure)
      if (import.meta.dev) {
        console.error('[auth.global.ts] Error checking auth:', error)
      }
      const returnTo = encodeURIComponent(to.fullPath)
      return navigateTo(`/api/auth/oauth/authorize?return_to=${returnTo}`)
    }
  }
})
