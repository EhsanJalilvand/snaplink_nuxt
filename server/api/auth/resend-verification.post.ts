import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'
import { Configuration, FrontendApi } from '@ory/client'

const resendVerificationSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Get client IP for rate limiting
  const clientIP = getClientIP(event)
  
  // Rate limiting: max 3 resend attempts per 5 minutes per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
    identifier: `resend_verification:${clientIP}`,
  })
  
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many resend attempts. Please try again later.',
      data: {
        resetTime: rateLimit.resetTime,
      },
    })
  }

  // Validate input
  const validation = resendVerificationSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { email } = validation.data

  try {
    const kratosConfig = new Configuration({
      basePath: config.kratosPublicUrl,
    })
    const frontendApi = new FrontendApi(kratosConfig)

    // Create verification flow
    const { data: verificationFlow } = await frontendApi.createBrowserVerificationFlow({
      returnTo: 'http://localhost:3000/auth/verify-email',
    })

    if (!verificationFlow?.id) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create verification flow',
      })
    }

    // Get CSRF token
    const csrfToken = verificationFlow.ui?.nodes?.find(
      (node: any) => node.attributes?.name === 'csrf_token'
    )?.attributes?.value as string

    if (!csrfToken) {
      throw createError({
        statusCode: 500,
        statusMessage: 'CSRF token not found in verification flow',
      })
    }

    // Submit verification request to resend code
    await frontendApi.updateVerificationFlow({
      flow: verificationFlow.id,
      updateVerificationFlowBody: {
        email: email,
        method: 'code',
        csrf_token: csrfToken,
      },
    })

    if (import.meta.dev) {
      console.log('[auth/resend-verification.post.ts] Verification code resent to:', email)
    }

    return {
      success: true,
      message: 'Verification code resent successfully',
      verificationFlowId: verificationFlow.id,
    }
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/resend-verification.post.ts] Error:', error)
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to resend verification code',
      message: error.message || 'Failed to resend verification code',
    })
  }
})

