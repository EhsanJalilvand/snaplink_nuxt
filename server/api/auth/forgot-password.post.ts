import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'
import { Configuration, FrontendApi } from '@ory/client'

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
    // Use Kratos Recovery Flow to initiate password reset
    const kratosConfig = new Configuration({
      basePath: config.kratosPublicUrl,
    })
    const frontendApi = new FrontendApi(kratosConfig)

    // Create recovery flow
    const { data: recoveryFlow } = await frontendApi.createBrowserRecoveryFlow()

    if (!recoveryFlow?.id) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create recovery flow',
      })
    }

    // Find CSRF token in flow
    const csrfToken = recoveryFlow.ui?.nodes?.find(
      (node: any) => node.attributes?.name === 'csrf_token'
    )?.attributes?.value as string

    if (!csrfToken) {
      throw createError({
        statusCode: 500,
        statusMessage: 'CSRF token not found in recovery flow',
      })
    }

    // Update recovery flow with email
    // This will trigger Kratos to send a password reset email
    await frontendApi.updateRecoveryFlow({
      flow: recoveryFlow.id,
      updateRecoveryFlowBody: {
        method: 'code', // Kratos uses code-based recovery
        email,
        csrf_token: csrfToken,
      },
    }).catch((error: any) => {
      // Even if there's an error, don't reveal if email exists or not
      // This prevents email enumeration attacks
      if (import.meta.dev) {
        console.error('[auth/forgot-password.post.ts] Recovery flow error:', error)
      }
      // Don't throw error - always return success message
    })

    // Always return success to prevent email enumeration (security best practice)
    // Even if the email doesn't exist, we return the same message
    return {
      success: true,
      message: 'If the email exists, a password reset code has been sent.',
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/forgot-password.post.ts] Error:', error.statusCode || error.status)
    }
    
    // Always return success to prevent email enumeration (security best practice)
    // Even if there's an error, don't reveal it
    return {
      success: true,
      message: 'If the email exists, a password reset code has been sent.',
    }
  }
})
