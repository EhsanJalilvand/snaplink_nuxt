import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'

// Sanitize email input (XSS prevention)
function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[<>]/g, '')
}

const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .transform((val) => sanitizeEmail(val)),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Get client IP for rate limiting
  const clientIP = getClientIP(event)
  
  // Rate limiting: max 3 password reset requests per hour per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    identifier: `forgot_password:${clientIP}`,
  })
  
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many password reset requests. Please try again later.',
      data: {
        resetTime: rateLimit.resetTime,
      },
    })
  }

  // Validate input
  const validation = forgotPasswordSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { email } = validation.data

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
        console.error('[auth/forgot-password.post.ts] Failed to get admin token:', error)
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Service temporarily unavailable',
      })
    }) as any

    // Find user by email
    const searchUsersUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users`
    
    const users = await $fetch(searchUsersUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      query: {
        email,
        exact: true,
      },
    }).catch(() => []) as any[]

    if (!users || users.length === 0) {
      // Don't reveal if user exists or not for security (security best practice)
      // Always return success to prevent email enumeration
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      }
    }

    const user = users[0]

    // Send password reset email via Keycloak
    const sendResetUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${user.id}/execute-actions-email`
    
    await $fetch(sendResetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      body: ['UPDATE_PASSWORD'],
    }).catch((error: any) => {
      // Log but don't fail if email sending fails
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/forgot-password.post.ts] Failed to send reset email:', error.statusCode || error.status)
      }
    })

    // Always return success to prevent email enumeration (security best practice)
    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/forgot-password.post.ts] Error:', error.statusCode || error.status)
    }
    
    // Always return success to prevent email enumeration (security best practice)
    // Even if there's an error, don't reveal it
    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    }
  }
})

