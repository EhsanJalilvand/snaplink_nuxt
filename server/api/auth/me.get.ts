export default defineEventHandler(async (event) => {
  try {
    // Check if user has Keycloak access token
    const accessToken = getCookie(event, 'kc_access')
    
    if (!accessToken) {
      return { 
        success: false,
        user: null,
        isAuthenticated: false 
      }
    }

    const config = useRuntimeConfig()
    const keycloakUrl = config.public.keycloakUrl || config.keycloakUrl || 'http://localhost:8080'
    const keycloakRealm = config.public.keycloakRealm || config.keycloakRealm || 'master'

    try {
      // Get user info from Keycloak
      const userInfo = await $fetch(
        `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      )

      // Parse token to get roles and other info
      let tokenParsed: any = null
      try {
        const tokenParts = accessToken.split('.')
        if (tokenParts.length === 3) {
          const payload = Buffer.from(tokenParts[1], 'base64').toString('utf-8')
          tokenParsed = JSON.parse(payload)
        }
      } catch (parseError) {
        console.error('[auth/me.get.ts] Error parsing token:', parseError)
      }

      const realmAccess = tokenParsed?.realm_access?.roles || []
      const clientId = config.keycloakClientId || config.public.keycloakClientId || 'my-client'
      const resourceAccess = tokenParsed?.resource_access?.[clientId]?.roles || []
      const allRoles = [...realmAccess, ...resourceAccess]

      const user = {
        id: userInfo.sub || tokenParsed?.sub || '',
        username: userInfo.preferred_username || userInfo.username || '',
        email: userInfo.email || '',
        firstName: userInfo.given_name || userInfo.firstName,
        lastName: userInfo.family_name || userInfo.lastName,
        emailVerified: userInfo.email_verified || tokenParsed?.email_verified || false,
        roles: allRoles,
      }

      // Don't log sensitive user information in production
      if (process.env.NODE_ENV === 'development') {
        console.log('[auth/me.get.ts] User info retrieved')
      }

      return {
        success: true,
        user,
        isAuthenticated: true
      }
    } catch (keycloakError: any) {
      console.error('[auth/me.get.ts] Keycloak error:', keycloakError)
      
      // If token is invalid/expired, clear cookies
      if (keycloakError.statusCode === 401 || keycloakError.status === 401) {
        deleteCookie(event, 'kc_access')
        deleteCookie(event, 'kc_refresh')
      }

      return {
        success: false,
        user: null,
        isAuthenticated: false
      }
    }
  } catch (error: any) {
    console.error('[auth/me.get.ts] Error:', error)
    
    return {
      success: false,
      user: null,
      isAuthenticated: false
    }
  }
})
