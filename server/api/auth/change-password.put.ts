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

  const { newPassword } = validation.data

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
    // Forward all cookies from the request to Kratos
    const requestCookies = getHeader(event, 'cookie') || ''
    const cookieHeader = requestCookies || `ory_kratos_session=${kratosSession}`
    
    const { data: settingsFlow } = await frontendApi.createBrowserSettingsFlow(undefined, {
      headers: {
        Cookie: cookieHeader,
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
    // Note: Kratos requires password_confirmation for password updates
    // The current password check is typically done by Kratos automatically
    try {
      await frontendApi.updateSettingsFlow({
        flow: settingsFlow.id,
        updateSettingsFlowBody: {
          method: 'password',
          password: newPassword,
          password_confirm: newPassword, // Kratos requires password confirmation
          csrf_token: csrfToken,
        },
      }, {
        headers: {
          Cookie: cookieHeader,
        },
      })

      if (import.meta.dev) {
        console.log('[auth/change-password.put.ts] Password changed successfully')
      }

      return {
        success: true,
        message: 'Password changed successfully',
      }
    } catch (updateError: any) {
      if (import.meta.dev) {
        console.error('[auth/change-password.put.ts] Failed to update password:', updateError)
        console.error('[auth/change-password.put.ts] Error response:', JSON.stringify(updateError.response?.data || updateError.body || updateError, null, 2))
        console.error('[auth/change-password.put.ts] Error response status:', updateError.response?.status)
        console.error('[auth/change-password.put.ts] Error response headers:', updateError.response?.headers)
        console.error('[auth/change-password.put.ts] Error message:', updateError.message)
      }
      
      // Check for session refresh required error (403)
      if (updateError.response?.status === 403 || updateError.response?.data?.error?.code === 403) {
        const errorData = updateError.response?.data?.error
        const errorMessage = errorData?.reason || errorData?.message || 'Your session has expired. Please log in again to change your password.'
        
        throw createError({
          statusCode: 403,
          statusMessage: String(errorMessage),
          message: String(errorMessage),
        })
      }
      
      // Check for Kratos UI nodes with errors (this is where validation errors usually come from)
      if (updateError.response?.data?.ui?.nodes) {
        const nodes = updateError.response.data.ui.nodes
        const errorNodes = nodes.filter((n: any) => n.messages && n.messages.some((m: any) => m.type === 'error'))
        if (errorNodes.length > 0) {
          // Get the first error message
          const errorMessage = errorNodes[0].messages.find((m: any) => m.type === 'error')?.text
          if (errorMessage) {
            throw createError({
              statusCode: 400,
              statusMessage: String(errorMessage),
              message: String(errorMessage),
              data: updateError.response.data, // Include full error data for frontend
            })
          }
        }
      }
      
      // Check if it's a password verification error from Kratos UI messages
      if (updateError.response?.data?.ui?.messages) {
        const messages = updateError.response.data.ui.messages
        const errorMessage = messages.find((m: any) => m.type === 'error')?.text
        if (errorMessage) {
          throw createError({
            statusCode: 400,
            statusMessage: String(errorMessage),
            message: String(errorMessage),
            data: updateError.response.data, // Include full error data for frontend
          })
        }
      }
      
      // Check if error message is directly in the error object
      if (updateError.message && typeof updateError.message === 'string') {
        // This handles cases where Kratos throws an error with message directly
        throw createError({
          statusCode: updateError.response?.status || 400,
          statusMessage: updateError.message,
          message: updateError.message,
          data: updateError.response?.data, // Include full error data for frontend
        })
      }
      
      // Check for other error messages in the response
      if (updateError.response?.data?.error_description) {
        throw createError({
          statusCode: 400,
          statusMessage: String(updateError.response.data.error_description),
          message: String(updateError.response.data.error_description),
        })
      }

      if (updateError.response?.data?.error) {
        const errorObj = updateError.response.data.error
        const errorMessage = typeof errorObj === 'string' ? errorObj : (errorObj.message || errorObj.reason || 'Failed to update password')
        
        throw createError({
          statusCode: updateError.response?.status || 400,
          statusMessage: String(errorMessage),
          message: String(errorMessage),
        })
      }
      
      // If we have a status code, use it
      if (updateError.response?.status) {
        // Check if we have a message from the error
        const errorMessage = updateError.message || updateError.response?.data?.message || 'Failed to update password'
        const statusText = typeof updateError.response.statusText === 'string' 
          ? updateError.response.statusText 
          : errorMessage
        
        throw createError({
          statusCode: updateError.response.status,
          statusMessage: statusText,
          message: String(errorMessage),
          data: updateError.response.data, // Include full error data
        })
      }
      
      // Last resort: use the error message if available
      const finalMessage = updateError.message || 'Failed to update password'
      throw createError({
        statusCode: 500,
        statusMessage: finalMessage,
        message: String(finalMessage),
        data: updateError.response?.data, // Include full error data
      })
    }
  }
  catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/change-password.put.ts] Outer catch error:', error)
      console.error('[auth/change-password.put.ts] Error statusCode:', error.statusCode)
      console.error('[auth/change-password.put.ts] Error message:', error.message)
      if (error.stack) {
        console.error('[auth/change-password.put.ts] Error stack:', error.stack)
      }
    }
    
    // If error already has statusCode, it's already a proper error, re-throw it
    if (error.statusCode) {
      throw error
    }
    
    // Otherwise, create a generic error
    const errorMessage = typeof error.message === 'string' ? error.message : 'Failed to change password'
    throw createError({
      statusCode: 500,
      statusMessage: errorMessage,
      message: errorMessage,
    })
  }
})
