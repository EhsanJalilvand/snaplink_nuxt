import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'
import { Configuration, FrontendApi } from '@ory/client'

// Password strength validation (matches Kratos requirements)
function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }
  // Must contain at least one letter and one number (Kratos default)
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' }
  }
  return { valid: true }
}

const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required')
    .max(500, 'Invalid password'),
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
  
  // Rate limiting: max 5 password change attempts per 15 minutes per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    identifier: `change_password:${clientIP}`,
  })
  
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many password change attempts. Please try again later.',
      data: {
        resetTime: rateLimit.resetTime,
      },
    })
  }

  // Validate input
  const validation = changePasswordSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { currentPassword, newPassword } = validation.data

  // Get access token from cookie (Hydra token)
  const accessToken = getCookie(event, 'hydra_access_token')
  
  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  try {
    // Get user info from Hydra's /userinfo endpoint
    const hydraUserInfo = await $fetch(`${config.hydraPublicUrl}/userinfo`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).catch((error: any) => {
      if (import.meta.dev) {
        console.error('[auth/change-password.put.ts] Failed to get user info from Hydra:', error)
      }
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid access token',
      })
    })

    if (!hydraUserInfo || !hydraUserInfo.sub) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid access token or user info not found',
      })
    }

    // Get Kratos session cookie for settings flow
    const kratosSession = getCookie(event, 'ory_kratos_session')
    
    if (!kratosSession) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No active Kratos session found',
      })
    }

    // Use Kratos Settings Flow to change password
    // This requires creating a settings flow and updating it with password change
    const kratosConfig = new Configuration({
      basePath: config.kratosPublicUrl,
    })
    const frontendApi = new FrontendApi(kratosConfig)

    // Create settings flow
    const { data: settingsFlow } = await frontendApi.createBrowserSettingsFlow(undefined, {
      headers: {
        Cookie: `ory_kratos_session=${kratosSession}`,
      },
    })

    if (!settingsFlow?.id) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create settings flow',
      })
    }

    // Find CSRF token in flow
    const csrfToken = settingsFlow.ui?.nodes?.find(
      (node: any) => node.attributes?.name === 'csrf_token'
    )?.attributes?.value as string

    if (!csrfToken) {
      throw createError({
        statusCode: 500,
        statusMessage: 'CSRF token not found in settings flow',
      })
    }

    // Update settings flow with password change
    await frontendApi.updateSettingsFlow({
      flow: settingsFlow.id,
      updateSettingsFlowBody: {
        method: 'password',
        password: newPassword,
        csrf_token: csrfToken,
      },
    }, {
      headers: {
        Cookie: `ory_kratos_session=${kratosSession}`,
      },
    }).catch((error: any) => {
      if (import.meta.dev) {
        console.error('[auth/change-password.put.ts] Failed to update password:', error)
      }
      
      // Check if it's a password verification error
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
        statusCode: 500,
        statusMessage: 'Failed to update password',
      })
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/change-password.put.ts] Password changed successfully')
    }

    return {
      success: true,
      message: 'Password changed successfully',
    }
  }
  catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/change-password.put.ts] Error:', error.statusCode || error.status)
    }
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to change password',
    })
  }
})
