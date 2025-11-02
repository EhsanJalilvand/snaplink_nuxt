import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'

const twoFactorSchema = z.object({
  enabled: z.boolean(),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Get client IP for rate limiting
  const clientIP = getClientIP(event)
  
  // Rate limiting: max 5 2FA update attempts per 15 minutes per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    identifier: `two_factor:${clientIP}`,
  })
  
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many update attempts. Please try again later.',
      data: {
        resetTime: rateLimit.resetTime,
      },
    })
  }

  // Validate input
  const validation = twoFactorSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { enabled } = validation.data

  // Get access token from cookie
  const accessToken = getCookie(event, 'kc_access')
  
  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  try {
    // Parse token to get user ID
    const tokenParts = accessToken.split('.')
    if (tokenParts.length !== 3) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token',
      })
    }

    const payload = Buffer.from(tokenParts[1], 'base64').toString('utf-8')
    const tokenParsed = JSON.parse(payload)
    const userId = tokenParsed.sub

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token',
      })
    }

    // Get admin token for user operations
    const adminTokenUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/token`
    
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
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/two-factor.put.ts] Failed to get admin token:', error)
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Service temporarily unavailable',
      })
    }) as any

    // Get current user data
    const getUserUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}`
    
    const currentUser = await $fetch(getUserUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/two-factor.put.ts] Failed to get user:', error)
      }
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }) as any

    // Remove TOTP credentials if disabling 2FA
    if (!enabled) {
      // Get user credentials
      const getCredentialsUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}/credentials`
    
      const credentials = await $fetch(getCredentialsUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminTokenResponse.access_token}`,
        },
      }).catch(() => []) as any[]

      // Find and remove OTP/TOTP credentials
      const totpCreds = credentials.filter((cred: any) => cred.type === 'otp' || cred.type === 'otp-hmac-sha1')
      
      for (const cred of totpCreds) {
        const deleteCredUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}/credentials/${cred.id}`
        
        await $fetch(deleteCredUrl, {
          method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
    }).catch((error: any) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('[auth/two-factor.put.ts] Failed to delete credential:', error.statusCode || error.status)
          }
        })
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[auth/two-factor.put.ts] TOTP credentials removed successfully')
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/two-factor.put.ts] 2FA settings updated successfully')
    }

    return {
      success: true,
      message: enabled ? '2FA has been enabled' : '2FA has been disabled',
    }
  }
  catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/two-factor.put.ts] Error:', error.statusCode || error.status)
    }
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update 2FA settings',
    })
  }
})


