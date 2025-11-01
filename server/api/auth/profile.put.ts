import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'

// Sanitize input (XSS prevention)
function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '')
}

const profileSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name is too long')
    .transform((val) => sanitizeString(val)),
  lastName: z.string()
    .max(100, 'Last name is too long')
    .optional()
    .transform((val) => val ? sanitizeString(val) : undefined),
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .transform((val) => sanitizeString(val).toLowerCase()),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Get client IP for rate limiting
  const clientIP = getClientIP(event)
  
  // Rate limiting: max 10 profile updates per 15 minutes per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    identifier: `profile_update:${clientIP}`,
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
  const validation = profileSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { firstName, lastName, email } = validation.data

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
        console.error('[auth/profile.put.ts] Failed to get admin token:', error)
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
        console.error('[auth/profile.put.ts] Failed to get user:', error)
      }
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }) as any

    // Check if email is already taken by another user
    if (email) {
      const searchUsersUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users`
      
      const existingUsers = await $fetch(searchUsersUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminTokenResponse.access_token}`,
        },
        query: {
          email,
          exact: true,
        },
      }).catch(() => []) as any[]

      // If email exists and belongs to a different user, return error
      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers.find((u: any) => u.id !== userId)
        if (existingUser) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Email is already registered',
          })
        }
      }
    }

    // Check if email is changing
    const isEmailChanging = email && email !== currentUser.email

    // Update user in Keycloak
    const updateUserUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}`
    
    const updateData: any = {
      ...currentUser,
      firstName: firstName || currentUser.firstName,
      lastName: lastName !== undefined ? lastName : currentUser.lastName,
      email: email || currentUser.email,
    }

    // If email changed, mark as unverified
    if (isEmailChanging) {
      updateData.emailVerified = false
    }

    await $fetch(updateUserUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      body: updateData,
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/profile.put.ts] Failed to update user:', error)
      }
      
      if (error.statusCode === 409 || error.status === 409) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Email is already registered',
        })
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile',
      })
    })

    // If email changed, send verification email
    if (email && email !== currentUser.email) {
      const sendVerificationUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}/execute-actions-email`
      
      await $fetch(sendVerificationUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenResponse.access_token}`,
        },
        body: ['VERIFY_EMAIL'],
      }).catch((error: any) => {
        // Log but don't fail update if email sending fails
        if (process.env.NODE_ENV === 'development') {
          console.error('[auth/profile.put.ts] Failed to send verification email:', error.statusCode || error.status)
        }
      })
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/profile.put.ts] Profile updated successfully')
    }

    return {
      success: true,
      message: 'Profile updated successfully',
    }
  }
  catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/profile.put.ts] Error:', error.statusCode || error.status)
    }
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update profile',
    })
  }
})


