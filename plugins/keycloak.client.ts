export default defineNuxtPlugin(async () => {
  const { initKeycloak, handleCallback, isAuthenticated } = useKeycloak()
  
  // Initialize Keycloak on app start (client-side only)
  if (process.client) {
    try {
      await initKeycloak()
      
      // Check if we're on the callback route
      const route = useRoute()
      if (route.path === '/auth/callback') {
        console.log('[keycloak.client.ts] Handling callback...')
        const success = await handleCallback()
        
        if (success && isAuthenticated.value) {
          console.log('[keycloak.client.ts] Callback successful, redirecting to dashboard')
          // Wait a bit to ensure state is updated
          await new Promise(resolve => setTimeout(resolve, 200))
          await navigateTo('/dashboard')
        } else {
          console.log('[keycloak.client.ts] Callback failed, redirecting to login')
          await navigateTo('/auth/login')
        }
      }
    } catch (error) {
      console.error('Failed to initialize Keycloak:', error)
    }
  }
})

