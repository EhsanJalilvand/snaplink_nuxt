import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'

// Sanitize email input (XSS prevention)
function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[<>]/g, '')
}

// Sanitize password (basic - don't log or expose)
function sanitizePassword(password: string): string {
  // Just return as-is, don't modify passwords
  // This is just for type safety
  return password
}

const loginSchema = z.object({
  emailOrUsername: z.string()
    .min(1, 'Email or username is required')
    .max(255, 'Email or username is too long')
    .transform((val) => val.trim().toLowerCase()),
  password: z.string()
    .min(1, 'Password is required')
    .max(500, 'Password is too long')
    .transform((val) => sanitizePassword(val)),
  trustDevice: z.boolean().optional().default(false),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  // Get client IP for rate limiting
  const clientIP = getClientIP(event)
  
  // Rate limiting: max 5 login attempts per 15 minutes per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    identifier: `login:${clientIP}`,
  })
  
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many login attempts. Please try again later.',
      data: {
        resetTime: rateLimit.resetTime,
      },
    })
  }

  // Validate input
  const validation = loginSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { emailOrUsername, password } = validation.data

  try {
    // Direct Access Grant - Exchange credentials for tokens
    // This sends credentials to Keycloak token endpoint
    // Requires "Direct Access Grants Enabled" in Keycloak client settings
    const keycloakUrl = config.keycloakUrl || config.public.keycloakUrl || 'http://localhost:8080'
    const keycloakRealm = config.keycloakRealm || config.public.keycloakRealm || 'master'
    const clientId = config.keycloakClientId || config.public.keycloakClientId || 'my-client'
    const clientSecret = config.keycloakClientSecret || ''

    const tokenUrl = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`
    
    // Request token from Keycloak using Direct Access Grant
    // Keycloak accepts both email and username in the 'username' field
    const tokenResponse = await $fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        ...(clientSecret ? { client_secret: clientSecret } : {}),
        username: emailOrUsername, // Can be either email or username
        password: password,
      }),
    }).catch((error: any) => {
      // Log error without exposing sensitive info
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/login.post.ts] Keycloak token error:', {
          statusCode: error.statusCode || error.status,
          statusMessage: error.statusMessage || error.message,
          error: error.data?.error,
          errorDescription: error.data?.error_description,
        })
      }
      
      // Check for specific error types
      const errorType = error.data?.error
      const errorDescription = error.data?.error_description || ''
      
      // Handle specific Keycloak errors
      if (errorType === 'invalid_grant') {
        // Invalid credentials
        throw createError({
          statusCode: 401,
          statusMessage: 'Invalid email or password',
        })
      } else if (errorType === 'unauthorized_client') {
        // Direct Access Grant not enabled
        // Return error that can be handled by frontend to show redirect option
        throw createError({
          statusCode: 400,
          statusMessage: 'Direct Access Grant not enabled',
          message: 'Direct Access Grant is not enabled. Please enable it in Keycloak client settings, or use redirect login.',
          data: {
            error: 'unauthorized_client',
            redirectToKeycloak: true,
            help: 'To enable: Keycloak Admin Console → Clients → your-client → Settings → Enable "Direct Access Grants"',
          },
        })
      } else if (errorType === 'invalid_client') {
        // Invalid client configuration
        throw createError({
          statusCode: 500,
          statusMessage: 'Authentication service configuration error',
        })
      }
      
      // Always return generic error message (security best practice)
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password',
      })
    }) as any

    if (!tokenResponse?.access_token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
      })
    }

    // Save tokens to HttpOnly cookies
    const isDev = process.env.NODE_ENV === 'development'
    const isSecure = !isDev && process.env.NODE_ENV === 'production'

    setCookie(event, 'kc_access', tokenResponse.access_token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    })

    if (tokenResponse.refresh_token) {
      setCookie(event, 'kc_refresh', tokenResponse.refresh_token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 14, // 14 days
      })
    }

    // Don't log sensitive information
    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/login.post.ts] Login successful')
    }

    return {
      success: true,
      message: 'Login successful',
    }
  } catch (error: any) {
    // Don't log sensitive information
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/login.post.ts] Login error:', error.statusCode || error.status)
    }
    
    if (error.statusCode) {
      throw error
    }
    
    // Always return generic error message
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    })
  }
})