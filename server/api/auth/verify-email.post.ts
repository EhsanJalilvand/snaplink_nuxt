import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'
import { Configuration, FrontendApi } from '@ory/client'
import { getHeader } from 'h3'

// Sanitize code input (XSS prevention)
function sanitizeCode(code: string): string {
  return code.trim().replace(/[^0-9]/g, '') // Only digits
}

const verifyEmailSchema = z.object({
  code: z.string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must be 6 digits'),
  flow: z.string()
    .min(1, 'Verification flow ID is required'),
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

  const { code, flow } = validation.data

  try {
    // Use Kratos Verification Flow to verify email
    const kratosConfig = new Configuration({
      basePath: config.kratosPublicUrl,
    })
    const frontendApi = new FrontendApi(kratosConfig)

    // Get all cookies from request to forward to Kratos
    const requestCookies = getHeader(event, 'cookie') || ''

    // Get existing verification flow with cookies
    const { data: verificationFlow } = await frontendApi.getVerificationFlow({
      id: flow,
    }, {
      headers: requestCookies ? { Cookie: requestCookies } : undefined,
    })

    if (!verificationFlow?.id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid verification flow',
      })
    }

    // Check if flow is expired
    if (verificationFlow.expires_at && new Date(verificationFlow.expires_at) < new Date()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification code has expired. Please request a new code.',
      })
    }

    // Find CSRF token in flow
    const csrfToken = verificationFlow.ui?.nodes?.find(
      (node: any) => node.attributes?.name === 'csrf_token'
    )?.attributes?.value as string

    if (!csrfToken) {
      throw createError({
        statusCode: 500,
        statusMessage: 'CSRF token not found in verification flow',
      })
    }

    // Update verification flow with code - forward cookies for CSRF
    const sanitizedCode = sanitizeCode(code)
    
    if (import.meta.dev) {
      console.log('[auth/verify-email.post.ts] Verifying code:', sanitizedCode.substring(0, 2) + '****', 'for flow:', flow)
    }

    // Update verification flow with code
    const verificationResponse = await frontendApi.updateVerificationFlow({
      flow: verificationFlow.id,
      updateVerificationFlowBody: {
        method: 'code',
        code: sanitizedCode, // Verification code (6 digits)
        csrf_token: csrfToken,
      },
    }, {
      headers: requestCookies ? { Cookie: requestCookies } : undefined,
    })
    
    // Check if verification was successful
    if (!verificationResponse.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification failed. Please try again.',
      })
    }
    
    // Check if verification flow state is success
    if (verificationResponse.data.state === 'passed_challenge') {
      // Verification successful - email is now verified
      if (import.meta.dev) {
        console.log('[auth/verify-email.post.ts] Email verified successfully')
      }
      
      return {
        success: true,
        message: 'Email verified successfully',
      }
    }
    
    // If state is not passed, check for errors
    if (verificationResponse.data.ui?.messages) {
      const messages = verificationResponse.data.ui.messages
      const errorMessage = messages.find((m: any) => m.type === 'error')?.text
      if (errorMessage) {
        throw createError({
          statusCode: 400,
          statusMessage: errorMessage,
        })
      }
    }
    
    // If we get here, verification didn't complete
    if (import.meta.dev) {
      console.error('[auth/verify-email.post.ts] Verification state:', verificationResponse.data.state)
      console.error('[auth/verify-email.post.ts] Verification response:', JSON.stringify(verificationResponse.data, null, 2))
    }
    
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid verification code. Please check the code and try again.',
    })
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/verify-email.post.ts] Error:', error.statusCode || error.status)
      console.error('[auth/verify-email.post.ts] Error details:', error.response?.data || error.data || error.message)
    }
    
    // Re-throw if it's already a createError
    if (error.statusCode) {
      throw error
    }
    
    // Handle Kratos API errors
    if (error.response?.data) {
      // Check if it's a code validation error
      if (error.response.data.ui?.messages) {
        const messages = error.response.data.ui.messages
        const errorMessage = messages.find((m: any) => m.type === 'error')?.text
        if (errorMessage) {
          throw createError({
            statusCode: 400,
            statusMessage: errorMessage,
          })
        }
      }
      
      // Check for specific Kratos error types
      if (error.response.data.error?.message) {
        throw createError({
          statusCode: 400,
          statusMessage: error.response.data.error.message,
        })
      }
    }
    
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid verification code. Please check the code and try again.',
    })
  }
})
