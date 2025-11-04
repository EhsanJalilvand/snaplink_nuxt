import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'
import { Configuration, FrontendApi } from '@ory/client'

// Sanitize input (XSS prevention)
function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '')
}

const loginSchema = z.object({
  emailOrUsername: z.string()
    .min(1, 'Email or username is required')
    .max(255, 'Email or username is too long')
    .transform((val) => sanitizeString(val)),
  password: z.string()
    .min(1, 'Password is required')
    .max(500, 'Invalid password'),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

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
    const kratosPublicUrl = config.kratosPublicUrl || 'http://localhost:4433'
    
    if (import.meta.dev) {
      console.log('[auth/login.post.ts] Connecting to Kratos at:', kratosPublicUrl)
    }

    const kratosConfig = new Configuration({
      basePath: kratosPublicUrl,
      baseOptions: {
        timeout: 10000, // 10 seconds timeout
      },
    })
    const frontendApi = new FrontendApi(kratosConfig)

    // Get all cookies from request to forward to Kratos
    // This is important for CSRF cookie matching
    const requestCookies = getHeader(event, 'cookie') || ''
    
    // Create login flow using FrontendApi
    const { data: loginFlow } = await frontendApi.createBrowserLoginFlow({
      returnTo: config.public.siteUrl,
    }, {
      headers: {
        Cookie: requestCookies,
      },
    }).catch((error: any) => {
      if (import.meta.dev) {
        console.error('[auth/login.post.ts] Failed to create login flow:', error.message)
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message?.includes('connect')) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Kratos service is not available. Please make sure Kratos is running.',
          data: {
            kratosUrl: kratosPublicUrl,
            error: error.message,
          },
        })
      }
      
      throw error
    })

    if (!loginFlow?.id) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create login flow',
      })
    }

    // Find CSRF token in flow
    const csrfToken = loginFlow.ui?.nodes?.find(
      (node: any) => node.attributes?.name === 'csrf_token'
    )?.attributes?.value as string

    if (!csrfToken) {
      throw createError({
        statusCode: 500,
        statusMessage: 'CSRF token not found in login flow',
      })
    }

    // Update login flow with credentials using FrontendApi
    // Important: We need to forward cookies from the request to Kratos
    // This ensures CSRF cookie matches the CSRF token
    const { data: loginResponse } = await frontendApi.updateLoginFlow({
      flow: loginFlow.id,
      updateLoginFlowBody: {
        method: 'password',
        password: password,
        identifier: emailOrUsername,
        csrf_token: csrfToken,
      },
    }, {
      headers: {
        Cookie: requestCookies,
      },
    }).catch((error: any) => {
      if (import.meta.dev) {
        console.error('[auth/login.post.ts] Login flow update error:', error.response?.data || error.message)
      }
      
      // Check for CSRF errors first
      if (error.response?.status === 403 || error.response?.statusCode === 403) {
        const errorDetails = error.response?.data?.error || error.response?.data
        if (errorDetails?.reason?.includes('CSRF') || errorDetails?.hint?.includes('CSRF') || error.message?.includes('CSRF')) {
          throw createError({
            statusCode: 403,
            statusMessage: 'CSRF validation failed. Please refresh the page and try again.',
            data: [{ path: ['password'], message: 'CSRF validation failed. Please refresh the page and try again.' }],
          })
        }
      }

      // Check for validation errors
      if (error.response?.data?.ui?.messages) {
        const messages = error.response.data.ui.messages
        const errorMessage = messages.find((m: any) => m.type === 'error')?.text
        
        if (errorMessage) {
          throw createError({
            statusCode: 401,
            statusMessage: errorMessage || 'Invalid email or password',
            data: [{ path: ['password'], message: errorMessage || 'Invalid email or password' }],
          })
        }
      }
      
      throw createError({
        statusCode: error.response?.status || error.response?.statusCode || 401,
        statusMessage: 'Invalid email or password',
        data: [{ path: ['password'], message: 'Invalid email or password' }],
      })
    })

    // Check if login was successful
    if (loginResponse.session) {
      // Session created successfully - Kratos will set the session cookie
      // The cookie is HttpOnly and will be sent automatically by browser
      if (import.meta.dev) {
        console.log('[auth/login.post.ts] Login successful, session created')
      }

      return {
        success: true,
        message: 'Login successful',
        session: true,
      }
    } else {
      // No session - login failed
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password',
      })
    }
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/login.post.ts] Login error:', error)
    }

    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Check if it's a connection error
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message?.includes('connect')) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Kratos service is not available. Please make sure Kratos is running at ' + config.kratosPublicUrl,
        message: error.message || 'Kratos service is not available',
      })
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Login failed',
      message: error.message || 'Login failed',
    })
  }
})

