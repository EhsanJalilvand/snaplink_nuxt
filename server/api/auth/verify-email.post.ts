import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'

// Sanitize code input (XSS prevention)
function sanitizeCode(code: string): string {
  return code.trim().replace(/[^0-9A-Za-z]/g, '').toUpperCase()
}

const verifyEmailSchema = z.object({
  token: z.string()
    .min(1, 'Verification token is required')
    .max(500, 'Invalid token'),
  email: z.string()
    .email('Invalid email address')
    .optional(), // Email is optional if token contains it
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Get client IP for rate limiting
  const clientIP = getClientIP(event)
  
  // Rate limiting: max 5 verification attempts per 15 minutes per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    identifier: `verify_email:${clientIP}`,
  })
  
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many verification attempts. Please try again later.',
      data: {
        resetTime: rateLimit.resetTime,
      },
    })
  }

  // Validate input
  const validation = verifyEmailSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { token, email } = validation.data

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
        client_id: config.keycloakClientId || 'my-client',
        client_secret: config.keycloakClientSecret || '0fA6K2dgvnr2ZZlt6mW0GcPad7ThGqvp',
      }),
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/verify-email.post.ts] Failed to get admin token:', error)
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Service temporarily unavailable',
      })
    }) as any

    // Keycloak email verification typically uses action tokens sent via email
    // The token should be validated and contain user ID
    // For now, if email is provided, find user and verify email directly
    
    if (email) {
      // Find user by email
      const searchUsersUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users`
      
      const users = await $fetch(searchUsersUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminTokenResponse.access_token}`,
        },
        query: {
          email: email.toLowerCase().trim(),
          exact: true,
        },
      }).catch(() => []) as any[]

      if (users && users.length > 0) {
        const user = users[0]
        
        // Verify email via Keycloak Admin API
        const verifyEmailUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${user.id}`
        
        await $fetch(verifyEmailUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminTokenResponse.access_token}`,
          },
          body: {
            ...user,
            emailVerified: true,
          },
        })

        return {
          success: true,
          message: 'Email verified successfully',
        }
      }
    }

    // If token validation is implemented, verify token here
    // For now, return error indicating proper token validation is needed
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid verification token',
    })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/verify-email.post.ts] Error:', error.statusCode || error.status)
    }
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid verification token',
    })
  }
})