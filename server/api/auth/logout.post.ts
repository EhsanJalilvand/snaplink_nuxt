export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  try {
    // Get the refresh token from Keycloak cookie
    const refreshToken = getCookie(event, 'kc_refresh')

    if (refreshToken) {
      try {
        // Revoke the token in Keycloak
        const revokeUrl = `${config.keycloakUrl || config.public.keycloakUrl}/realms/${config.keycloakRealm || config.public.keycloakRealm}/protocol/openid-connect/logout`
        
        await $fetch(revokeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: config.keycloakClientId || config.public.keycloakClientId || 'my-client',
            refresh_token: refreshToken,
          }),
        })
        console.log('[auth/logout.post.ts] Token revoked in Keycloak')
      } catch (revokeError) {
        console.error('[auth/logout.post.ts] Error revoking token in Keycloak:', revokeError)
        // Continue even if revoke fails
      }
    }

    // Clear Keycloak cookies
    deleteCookie(event, 'kc_access')
    deleteCookie(event, 'kc_refresh')
    deleteCookie(event, 'skip_userinfo')
    
    // Also clear old cookies if they exist
    deleteCookie(event, 'access_token')
    deleteCookie(event, 'refresh_token')

    console.log('[auth/logout.post.ts] Cookies cleared')

    return {
      success: true,
      message: 'Logged out successfully',
    }
  } catch (error: any) {
    console.error('[auth/logout.post.ts] Logout error:', error)
    
    // Even if Keycloak logout fails, we should still clear cookies
    deleteCookie(event, 'kc_access')
    deleteCookie(event, 'kc_refresh')
    deleteCookie(event, 'skip_userinfo')
    deleteCookie(event, 'access_token')
    deleteCookie(event, 'refresh_token')

    return {
      success: true,
      message: 'Logged out successfully',
    }
  }
})

