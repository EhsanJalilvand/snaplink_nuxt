import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'
import { Configuration, FrontendApi } from '@ory/client'

// Sanitize code input (XSS prevention)
function sanitizeCode(code: string): string {
  return code.trim().replace(/[^0-9A-Za-z]/g, '').toUpperCase()
}

const verifyEmailSchema = z.object({
  token: z.string()
    .min(1, 'Verification code is required')
    .max(500, 'Invalid code'),
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
    // Use Kratos Verification Flow to verify email
    const kratosConfig = new Configuration({
      basePath: config.kratosPublicUrl,
    })
    const frontendApi = new FrontendApi(kratosConfig)

    // Create verification flow
    // The token should be in the query parameter or flow context
    const { data: verificationFlow } = await frontendApi.createBrowserVerificationFlow({
      token, // Pass token to verification flow
    })

    if (!verificationFlow?.id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid verification code',
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

    // Update verification flow with code
    await frontendApi.updateVerificationFlow({
      flow: verificationFlow.id,
      updateVerificationFlowBody: {
        method: 'code',
        code: sanitizeCode(token), // Verification code
        csrf_token: csrfToken,
      },
    }).catch((error: any) => {
      if (import.meta.dev) {
        console.error('[auth/verify-email.post.ts] Failed to verify email:', error)
      }
      
      // Check if it's a code validation error
      if (error.response?.data?.ui?.messages) {
        const messages = error.response.data.ui.messages
        const errorMessage = messages.find((m: any) => m.type === 'error')?.text
        if (errorMessage) {
          throw createError({
            statusCode: 400,
            statusMessage: errorMessage,
          })
        }
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid verification code',
      })
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/verify-email.post.ts] Email verified successfully')
    }

    return {
      success: true,
      message: 'Email verified successfully',
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/verify-email.post.ts] Error:', error.statusCode || error.status)
    }
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid verification code',
    })
  }
})
