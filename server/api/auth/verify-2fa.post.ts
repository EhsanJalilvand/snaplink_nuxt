import { z } from 'zod'

const verify2FASchema = z.object({
  code: z.string().min(6, 'Authentication code must be 6 digits').max(6, 'Authentication code must be 6 digits'),
  method: z.enum(['email', 'sms', 'app'], 'Invalid authentication method'),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Validate input
  const validation = verify2FASchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { code, method } = validation.data

  try {
    // Get admin token for user operations
    const adminTokenUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/token`
    
    const adminTokenResponse = await $fetch(adminTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.keycloakClientId,
        client_secret: config.keycloakClientSecret,
      }),
    })

    // In a real implementation, you would:
    // 1. Verify the 2FA code against what was sent/generated
    // 2. Check if the code is still valid (not expired)
    // 3. Find the user by session or temporary token
    // 4. Complete the authentication flow

    // For demo purposes, we'll simulate verification
    // In production, you should implement proper 2FA verification logic
    
    // Simulate finding user by 2FA session
    const mockUserId = 'user-123' // This would come from your 2FA session lookup

    // Get user info
    const getUserUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${mockUserId}`
    
    const userInfo = await $fetch(getUserUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
    })

    // Generate new access token for the user
    const tokenUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/token`
    
    const tokenResponse = await $fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.keycloakClientId,
        client_secret: config.keycloakClientSecret,
        username: userInfo.username,
        scope: 'openid profile email',
      }),
    })

    const user = {
      id: userInfo.id,
      username: userInfo.username,
      email: userInfo.email,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      emailVerified: userInfo.emailVerified || false,
      roles: userInfo.realm_access?.roles || [],
    }

    return {
      success: true,
      user,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresIn: tokenResponse.expires_in,
    }
  } catch (error: any) {
    console.error('2FA verification error:', error)
    
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid authentication code',
    })
  }
})
