/**
 * Auth Plugin
 * Initializes authentication state on app start
 */

export default defineNuxtPlugin(async () => {
  // Only run on client-side
  if (process.server) {
    return
  }

  const { initAuth } = useAuth()
  const route = useRoute()

  // Initialize auth state
  await initAuth()

  // Handle OAuth2 callback if on callback page
  if (route.path === '/auth/callback') {
    // The callback page will handle the OAuth2 flow
    // This plugin just ensures auth state is initialized
    return
  }

  // Auto-refresh tokens if needed
  // This will be handled by the useAuth composable
})
