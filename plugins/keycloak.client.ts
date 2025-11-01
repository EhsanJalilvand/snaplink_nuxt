export default defineNuxtPlugin(async () => {
  // Initialize Keycloak on ALL routes to preserve state after refresh
  if (process.client) {
    const { initKeycloak, handleCallback, isAuthenticated, checkAuth } = useKeycloak()
    const route = useRoute()
    
    try {
      // First, check authentication from server (reads HttpOnly cookies)
      // This ensures state is restored even after page refresh
      await checkAuth()
      
      // Initialize Keycloak if not already initialized
      // This will restore SSO state if user was logged in
      await initKeycloak()
      
      // Check authentication again after Keycloak initialization
      // This ensures state is synced between cookie and Keycloak
      await checkAuth()
      
      // Handle callback route
      if (route.path === '/auth/callback') {
        console.log('[keycloak.client.ts] Handling callback...')
        const success = await handleCallback()
        
        if (success && isAuthenticated.value) {
          console.log('[keycloak.client.ts] Callback successful, redirecting to dashboard')
          await new Promise(resolve => setTimeout(resolve, 200))
          await navigateTo('/dashboard')
        } else {
          console.log('[keycloak.client.ts] Callback failed, redirecting to login')
          await navigateTo('/auth/login')
        }
      }
    } catch (error) {
      console.error('[keycloak.client.ts] Failed to initialize Keycloak:', error)
    }
  }
})

