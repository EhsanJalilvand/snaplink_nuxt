import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'

// Password strength validation
function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' }
  }
  // Must contain at least one letter and one number
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' }
  }
  return { valid: true }
}

const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required')
    .max(500, 'Invalid password'),
  newPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(500, 'Password is too long'),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  // Password match validation
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })
  }
  
  // Password strength validation
  const strengthCheck = validatePasswordStrength(data.newPassword)
  if (!strengthCheck.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: strengthCheck.error || 'Password does not meet requirements',
      path: ['newPassword'],
    })
  }
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Get client IP for rate limiting
  const clientIP = getClientIP(event)
  
  // Rate limiting: max 5 password change attempts per 15 minutes per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    identifier: `change_password:${clientIP}`,
  })
  
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many password change attempts. Please try again later.',
      data: {
        resetTime: rateLimit.resetTime,
      },
    })
  }

  // Validate input
  const validation = changePasswordSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { currentPassword, newPassword } = validation.data

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

    // Verify current password by attempting to get a token
    const keycloakUrl = config.keycloakUrl || config.public.keycloakUrl || 'http://localhost:8080'
    const keycloakRealm = config.keycloakRealm || config.public.keycloakRealm || 'master'
    const clientId = config.keycloakClientId || config.public.keycloakClientId || 'my-client'
    const clientSecret = config.keycloakClientSecret || ''

    // Get user info to get username/email
    const getUserUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}`
    
    // Get admin token for user operations
    const adminTokenUrl = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`
    
    const adminTokenResponse = await $fetch(adminTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret || '0fA6K2dgvnr2ZZlt6mW0GcPad7ThGqvp',
      }),
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/change-password.put.ts] Failed to get admin token:', error)
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Service temporarily unavailable',
      })
    }) as any

    // Get user to verify current password
    const user = await $fetch(getUserUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/change-password.put.ts] Failed to get user:', error)
      }
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }) as any

    // Verify current password by attempting to get a token
    const tokenUrl = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`
    
    try {
      await $fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: clientId,
          ...(clientSecret ? { client_secret: clientSecret } : {}),
          username: user.username || user.email,
          password: currentPassword,
        }),
      })
    }
    catch (verifyError: any) {
      // If password verification fails, return 401
      throw createError({
        statusCode: 401,
        statusMessage: 'Current password is incorrect',
      })
    }

    // Update password in Keycloak
    const updatePasswordUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}/reset-password`
    
    await $fetch(updatePasswordUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      body: {
        type: 'password',
        value: newPassword,
        temporary: false,
      },
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/change-password.put.ts] Failed to update password:', error)
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update password',
      })
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/change-password.put.ts] Password changed successfully')
    }

    return {
      success: true,
      message: 'Password changed successfully',
    }
  }
  catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/change-password.put.ts] Error:', error.statusCode || error.status)
    }
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to change password',
    })
  }
})



