import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'
import { Configuration, FrontendApi } from '@ory/client'

// Password strength validation (matches Kratos requirements)
function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' }
  }
  return { valid: true }
}

const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Reset code is required')
    .max(500, 'Invalid code'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(500, 'Password is too long'),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  // Password match validation
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })
  }
  
  // Password strength validation
  const strengthCheck = validatePasswordStrength(data.newPassword)
  if (!strengthCheck.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: strengthCheck.error || 'Password does not meet requirements',
      path: ['newPassword'],
    })
  }
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Get client IP for rate limiting
  const clientIP = getClientIP(event)
  
  // Rate limiting: max 3 password reset attempts per hour per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    identifier: `reset_password:${clientIP}`,
  })
  
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many password reset attempts. Please try again later.',
      data: {
        resetTime: rateLimit.resetTime,
      },
    })
  }

  // Validate input
  const validation = resetPasswordSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { token, newPassword } = validation.data

  try {
    // Use Kratos Recovery Flow to reset password
    // The token is the recovery code sent via email
    const kratosConfig = new Configuration({
      basePath: config.kratosPublicUrl,
    })
    const frontendApi = new FrontendApi(kratosConfig)

    // Create recovery flow (Kratos will validate the token)
    // The token should be in the query parameter or flow context
    const { data: recoveryFlow } = await frontendApi.createBrowserRecoveryFlow({
      token, // Pass token to recovery flow
    })

    if (!recoveryFlow?.id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or expired reset code',
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

    // Update recovery flow with new password
    await frontendApi.updateRecoveryFlow({
      flow: recoveryFlow.id,
      updateRecoveryFlowBody: {
        method: 'code',
        code: token, // Verify code again
        password: newPassword, // Set new password
        csrf_token: csrfToken,
      },
    }).catch((error: any) => {
      if (import.meta.dev) {
        console.error('[auth/reset-password.post.ts] Failed to reset password:', error)
      }
      
      // Check if it's a token validation error
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
        statusMessage: 'Invalid or expired reset code',
      })
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/reset-password.post.ts] Password reset successfully')
    }

    return {
      success: true,
      message: 'Password reset successfully',
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/reset-password.post.ts] Error:', error.statusCode || error.status)
    }
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or expired reset code',
    })
  }
})
