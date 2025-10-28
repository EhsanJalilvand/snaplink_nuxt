export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Get the authorization header
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    // Verify token with Keycloak
    const userInfoUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/userinfo`
    
    const userInfo = await $fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    // Get user roles
    const rolesUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/userinfo`
    
    const rolesResponse = await $fetch(rolesUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const user = {
      id: userInfo.sub,
      username: userInfo.preferred_username || userInfo.username,
      email: userInfo.email,
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      emailVerified: userInfo.email_verified || false,
      roles: rolesResponse.realm_access?.roles || [],
    }

    return {
      success: true,
      user,
    }
  } catch (error: any) {
    console.error('Token verification error:', error)
    
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid token',
    })
  }
})
