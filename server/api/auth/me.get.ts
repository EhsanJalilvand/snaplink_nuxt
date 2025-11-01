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

    // Parse token first to get user info (in case userinfo endpoint fails)
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

    // Try to get user info from Admin API for accurate data
    let userInfo: any = null
    const skipUserInfo = getCookie(event, 'skip_userinfo')
    
    // If userinfo endpoint is not working, use Admin API
    if (skipUserInfo && tokenParsed?.sub) {
      try {
        // Get admin token for user operations
        const adminTokenUrl = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`
        
        const adminTokenResponse = await $fetch(adminTokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: config.keycloakClientId || 'my-client',
            client_secret: config.keycloakClientSecret || '0fA6K2dgvnr2ZZlt6mW0GcPad7ThGqvp',
          }),
        }) as any

        // Get user from Admin API
        const getUserUrl = `${keycloakUrl}/admin/realms/${keycloakRealm}/users/${tokenParsed.sub}`
        userInfo = await $fetch(getUserUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${adminTokenResponse.access_token}`,
          },
        })
      } catch (adminError: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[auth/me.get.ts] Admin API failed, using token data:', adminError.statusCode || adminError.status)
        }
      }
    } else if (!skipUserInfo) {
      // Try userinfo endpoint first
      try {
        userInfo = await $fetch(
          `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/userinfo`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        )
      } catch (keycloakError: any) {
        // If userinfo endpoint fails (403, 401, etc.), set cookie to skip
        if (keycloakError.statusCode === 403 || keycloakError.status === 403) {
          setCookie(event, 'skip_userinfo', '1', { maxAge: 60 * 60 }) // Skip for 1 hour
        }
        
        // If token is invalid/expired (401), clear cookies
        if (keycloakError.statusCode === 401 || keycloakError.status === 401) {
          deleteCookie(event, 'kc_access')
          deleteCookie(event, 'kc_refresh')
          return {
            success: false,
            user: null,
            isAuthenticated: false
          }
        }
        
        // For other errors (403, etc.), continue with token data
        // Don't return error, use token parsed data instead
      }
    }

    // Extract roles from token
    const realmAccess = tokenParsed?.realm_access?.roles || []
    const clientId = config.keycloakClientId || config.public.keycloakClientId || 'my-client'
    const resourceAccess = tokenParsed?.resource_access?.[clientId]?.roles || []
    const allRoles = [...realmAccess, ...resourceAccess]

    // Build user object - prioritize userInfo from endpoint, fallback to token data
    // Note: Keycloak uses given_name/family_name, not firstName/lastName
    const user = {
      id: userInfo?.sub || userInfo?.id || tokenParsed?.sub || '',
      username: userInfo?.preferred_username || userInfo?.username || tokenParsed?.preferred_username || tokenParsed?.username || '',
      email: userInfo?.email || tokenParsed?.email || '',
      firstName: userInfo?.firstName || userInfo?.given_name || tokenParsed?.given_name || tokenParsed?.firstName || tokenParsed?.preferred_username || '',
      lastName: userInfo?.lastName || userInfo?.family_name || tokenParsed?.family_name || tokenParsed?.lastName || '',
      emailVerified: userInfo?.emailVerified || userInfo?.email_verified || tokenParsed?.email_verified || false,
      roles: allRoles,
    }

    // Debug: Log token structure in development (without sensitive data)
    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/me.get.ts] User info retrieved', userInfo ? (userInfo.id ? 'from Admin API' : 'from userinfo endpoint') : 'from token')
      console.log('[auth/me.get.ts] Token fields:', {
        has_given_name: !!(tokenParsed?.given_name),
        has_family_name: !!(tokenParsed?.family_name),
        has_firstName: !!(tokenParsed?.firstName),
        has_lastName: !!(tokenParsed?.lastName),
        has_email: !!(tokenParsed?.email),
        has_preferred_username: !!(tokenParsed?.preferred_username),
      })
      console.log('[auth/me.get.ts] Final user object:', {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName || '(empty)',
        lastName: user.lastName || '(empty)',
      })
    }

    return {
      success: true,
      user,
      isAuthenticated: true
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
