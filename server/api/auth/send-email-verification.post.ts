import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'

const sendEmailVerificationSchema = z.object({
  newEmail: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long'),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Get client IP for rate limiting
  const clientIP = getClientIP(event)
  
  // Rate limiting: max 3 email verification requests per 15 minutes per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
    identifier: `send_email_verification:${clientIP}`,
  })
  
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Please try again later.',
      data: {
        resetTime: rateLimit.resetTime,
      },
    })
  }

  // Validate input
  const validation = sendEmailVerificationSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { newEmail } = validation.data

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

    // Get admin token
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
        console.error('[auth/send-email-verification.post.ts] Failed to get admin token:', error)
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
        console.error('[auth/send-email-verification.post.ts] Failed to get user:', error)
      }
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }) as any

    // Check if new email is different from current email
    if (newEmail.toLowerCase().trim() === currentUser.email?.toLowerCase().trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'New email must be different from current email',
      })
    }

    // Check if new email is already taken
    const searchUsersUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users`
    
    const existingUsers = await $fetch(searchUsersUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      query: {
        email: newEmail.toLowerCase().trim(),
        exact: true,
      },
    }).catch(() => []) as any[]

    if (existingUsers && existingUsers.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email is already registered',
      })
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Store verification code in a temporary cookie (valid for 15 minutes)
    const expirationTime = Date.now() + (15 * 60 * 1000) // 15 minutes
    setCookie(event, 'email_change_code', verificationCode, {
      maxAge: 15 * 60, // 15 minutes in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    // Store new email in cookie as well
    setCookie(event, 'email_change_new_email', newEmail.toLowerCase().trim(), {
      maxAge: 15 * 60, // 15 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    // Store expiration time for timer in frontend
    setCookie(event, 'email_change_expires_at', expirationTime.toString(), {
      maxAge: 15 * 60,
      httpOnly: false, // Frontend needs this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    // TODO: Send verification code via email using Keycloak email service
    // For now, in development, we'll log it
    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/send-email-verification.post.ts] Email verification code:', verificationCode)
      console.log('[auth/send-email-verification.post.ts] New email:', newEmail)
      console.log('[auth/send-email-verification.post.ts] Email sent to:', currentUser.email)
    }

    return {
      success: true,
      message: 'Verification code sent to your current email',
      expiresIn: 15 * 60, // 15 minutes in seconds
      // In development, send code back for testing
      ...(process.env.NODE_ENV === 'development' && {
        code: verificationCode,
      }),
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/send-email-verification.post.ts] Error:', error.statusCode || error.status)
    }
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send verification code',
    })
  }
})
