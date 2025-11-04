import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'
import { Configuration, FrontendApi, IdentityApi } from '@ory/client'
import { getHeader } from 'h3'

// Sanitize input (XSS prevention)
function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '')
}

const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .transform((val) => sanitizeString(val).toLowerCase()),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(500, 'Password is too long'),
  firstName: z.string()
    .max(100, 'First name is too long')
    .optional()
    .transform((val) => val ? sanitizeString(val) : undefined),
  lastName: z.string()
    .max(100, 'Last name is too long')
    .optional()
    .transform((val) => val ? sanitizeString(val) : undefined),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Get client IP for rate limiting
  const clientIP = getClientIP(event)
  
  // Rate limiting: max 5 registration attempts per 15 minutes per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    identifier: `register:${clientIP}`,
  })
  
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many registration attempts. Please try again later.',
      data: {
        resetTime: rateLimit.resetTime,
      },
    })
  }

  // Validate input
  const validation = registerSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { email, password, firstName, lastName } = validation.data

  try {
    // Use Kratos Admin API to create identity directly
    // This is simpler and avoids choose_method state issues
    const kratosAdminUrl = config.kratosAdminUrl || 'http://localhost:4434'
    
    if (import.meta.dev) {
      console.log('[auth/register.post.ts] Using Kratos Admin API at:', kratosAdminUrl)
    }

    const kratosAdminConfig = new Configuration({
      basePath: kratosAdminUrl,
      baseOptions: {
        timeout: 10000, // 10 seconds timeout
      },
    })
    const identityApi = new IdentityApi(kratosAdminConfig)

    // Check if identity with this email already exists
    try {
      // List identities to check for email conflicts
      const { data: existingIdentities } = await identityApi.listIdentities()
      
      const emailExists = existingIdentities?.some((identity: any) => {
        return identity.traits?.email?.toLowerCase() === email.toLowerCase()
      })

      if (emailExists) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Email is already registered',
          data: [{ path: ['email'], message: 'Email is already registered' }],
        })
      }
    } catch (error: any) {
      if (error.statusCode === 409) {
        throw error
      }
      // If listing fails, continue (might be permission issue, but we'll try to create)
      if (import.meta.dev) {
        console.warn('[auth/register.post.ts] Could not check existing identities:', error.message)
      }
    }

    // Create identity using Admin API
    const identityData: any = {
      schema_id: 'default',
      traits: {
        email: email,
      },
      credentials: {
        password: {
          config: {
            password: password,
          },
        },
      },
    }

    // Add name if provided
    if (firstName || lastName) {
      identityData.traits.name = {
        first: firstName || '',
        last: lastName || '',
      }
    }

    if (import.meta.dev) {
      console.log('[auth/register.post.ts] Creating identity with Admin API')
    }

    const { data: createdIdentity } = await identityApi.createIdentity({
      createIdentityBody: identityData,
    }).catch((error: any) => {
      if (import.meta.dev) {
        console.error('[auth/register.post.ts] Failed to create identity:', error.response?.data)
      }

      // Handle validation errors
      if (error.response?.data?.error?.validation) {
        const validationErrors = error.response.data.error.validation
        throw createError({
          statusCode: 400,
          statusMessage: 'Validation failed',
          data: validationErrors,
        })
      }

      // Handle duplicate email error
      if (error.response?.status === 409 || error.statusCode === 409) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Email is already registered',
          data: [{ path: ['email'], message: 'Email is already registered' }],
        })
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create account',
        message: error.message || 'Failed to create account',
      })
    })

    if (import.meta.dev) {
      console.log('[auth/register.post.ts] Identity created successfully:', createdIdentity.id)
    }

    // After creating identity, return success
    // Client will create verification flow from browser to ensure CSRF cookies are set properly
    // This is the same approach as login.vue - client-side flow creation ensures cookies work
    if (import.meta.dev) {
      console.log('[auth/register.post.ts] Identity created successfully, client will handle verification flow')
    }

    return {
      success: true,
      message: 'Account created! Please verify your email address.',
      verification: true,
      email: email,
    }
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/register.post.ts] Registration error:', error)
    }

    // Handle Kratos errors
    if (error.response?.data?.ui?.messages) {
      const messages = error.response.data.ui.messages
      const errorMessage = messages.find((m: any) => m.type === 'error')?.text
      
      if (errorMessage) {
        // Check if it's an email already exists error
        if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('already')) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Email is already registered',
            data: [{ path: ['email'], message: 'Email is already registered' }],
          })
        }
        
        throw createError({
          statusCode: 400,
          statusMessage: errorMessage,
          data: [{ path: ['email'], message: errorMessage }],
        })
      }
    }

    if (error.statusCode) {
      throw error
    }

    // Log more details about the error
    if (import.meta.dev) {
      console.error('[auth/register.post.ts] Full error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        status: error.status,
        response: error.response?.data,
        cause: error.cause,
      })
    }

    // Check if it's a connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message?.includes('connect')) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Kratos service is not available. Please make sure Kratos is running at ' + config.kratosPublicUrl,
        message: error.message || 'Kratos service is not available',
      })
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Registration failed',
      message: error.message || 'Registration failed',
    })
  }
})

