import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Validate input
  const validation = loginSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { username, password, rememberMe } = validation.data

  try {
    // Keycloak token endpoint
    const tokenUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/token`
    
    const tokenResponse = await $fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: config.keycloakClientId,
        client_secret: config.keycloakClientSecret,
        username,
        password,
        scope: 'openid profile email',
      }),
    })

    // Get user info
    const userInfoUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/userinfo`
    
    const userInfo = await $fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    })

    // Get user roles
    const rolesUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/userinfo`
    
    const rolesResponse = await $fetch(rolesUrl, {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`,
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
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresIn: tokenResponse.expires_in,
    }
  } catch (error: any) {
    console.error('Keycloak login error:', error)
    
    // Handle specific Keycloak errors
    if (error.status === 401) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
      })
    }
    
    if (error.status === 400) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request',
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication failed',
    })
  }
})
