export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  try {
    // Get the refresh token from the request
    const refreshToken = getCookie(event, 'refresh_token') || 
                        getHeader(event, 'authorization')?.replace('Bearer ', '')

    if (refreshToken) {
      // Revoke the token in Keycloak
      const revokeUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/logout`
      
      await $fetch(revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.keycloakClientId,
          client_secret: config.keycloakClientSecret,
          refresh_token: refreshToken,
        }),
      })
    }

    // Clear cookies
    deleteCookie(event, 'access_token')
    deleteCookie(event, 'refresh_token')

    return {
      success: true,
      message: 'Logged out successfully',
    }
  } catch (error: any) {
    console.error('Logout error:', error)
    
    // Even if Keycloak logout fails, we should still clear local tokens
    deleteCookie(event, 'access_token')
    deleteCookie(event, 'refresh_token')

    return {
      success: true,
      message: 'Logged out successfully',
    }
  }
})
