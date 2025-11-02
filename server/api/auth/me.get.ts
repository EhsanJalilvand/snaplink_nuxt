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

    // Always use Admin API for accurate data including custom attributes like avatar
    let userInfo: any = null
    
    if (tokenParsed?.sub) {
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
    }

    // Extract roles from token
    const realmAccess = tokenParsed?.realm_access?.roles || []
    const clientId = config.keycloakClientId || config.public.keycloakClientId || 'my-client'
    const resourceAccess = tokenParsed?.resource_access?.[clientId]?.roles || []
    const allRoles = [...realmAccess, ...resourceAccess]

    // Extract avatar from user attributes
    const avatar = userInfo?.attributes?.avatar?.[0] || null

    // Build user object - prioritize userInfo from endpoint, fallback to token data
    // Note: Keycloak uses given_name/family_name, not firstName/lastName
    const user = {
      id: userInfo?.sub || userInfo?.id || tokenParsed?.sub || '',
      username: userInfo?.preferred_username || userInfo?.username || tokenParsed?.preferred_username || tokenParsed?.username || '',
      email: userInfo?.email || tokenParsed?.email || '',
      firstName: userInfo?.firstName || userInfo?.given_name || tokenParsed?.given_name || tokenParsed?.firstName || tokenParsed?.preferred_username || '',
      lastName: userInfo?.lastName || userInfo?.family_name || tokenParsed?.family_name || tokenParsed?.lastName || '',
      emailVerified: userInfo?.emailVerified || userInfo?.email_verified || tokenParsed?.email_verified || false,
      avatar,
      roles: allRoles,
    }

    // Debug: Log token structure in development (without sensitive data)
    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/me.get.ts] User info retrieved', userInfo ? (userInfo.id ? 'from Admin API' : 'from userinfo endpoint') : 'from token')
      console.log('[auth/me.get.ts] Avatar found:', !!(avatar))
      if (avatar) {
        console.log('[auth/me.get.ts] Avatar preview:', avatar.substring(0, 50) + '...')
      }
      console.log('[auth/me.get.ts] Final user object:', {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName || '(empty)',
        lastName: user.lastName || '(empty)',
        hasAvatar: !!(user.avatar),
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
