import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'
import { Configuration, FrontendApi } from '@ory/client'
import { getHeader } from 'h3'

const sendEmailVerificationSchema = z.object({
  newEmail: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long'),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Get client IP for rate limiting
  const clientIP = getClientIP(event)
  
  // Rate limiting: max 3 email verification requests per 15 minutes per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
    identifier: `send_email_verification:${clientIP}`,
  })
  
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Please try again later.',
      data: {
        resetTime: rateLimit.resetTime,
      },
    })
  }

  // Validate input
  const validation = sendEmailVerificationSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { newEmail } = validation.data

  // Get Kratos session cookie
  const kratosSession = getCookie(event, 'ory_kratos_session')
  
  // Get Hydra access token cookie
  const accessToken = getCookie(event, 'hydra_access_token')

  if (!kratosSession && !accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'No active session found',
    })
  }

  try {
    const kratosConfig = new Configuration({
      basePath: config.kratosPublicUrl,
    })
    const frontendApi = new FrontendApi(kratosConfig)
    
    const requestCookies = getHeader(event, 'cookie') || ''
    
    // Get current user session
    let currentIdentity: any = null
    try {
      const sessionResponse = await frontendApi.toSession(undefined, {
        headers: requestCookies ? { Cookie: requestCookies } : undefined,
      })
      
      if (sessionResponse.data?.identity) {
        currentIdentity = sessionResponse.data.identity
      }
    } catch (sessionError: any) {
      if (import.meta.dev) {
        console.error('[auth/send-email-verification.post.ts] Failed to get session:', sessionError)
      }
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid session',
      })
    }

    if (!currentIdentity) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User not found',
      })
    }

    const currentEmail = currentIdentity.traits?.email || currentIdentity.traits?.email_address

    // Check if new email is different from current email
    if (newEmail.toLowerCase().trim() === currentEmail?.toLowerCase().trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'New email must be different from current email',
      })
    }

    // Check if new email is already taken
    const kratosAdminConfig = new Configuration({
      basePath: config.kratosAdminUrl,
    })
    const { IdentityApi } = await import('@ory/client')
    const identityApi = new IdentityApi(kratosAdminConfig)
    
    try {
      const { data: allIdentities } = await identityApi.listIdentities()
      
      const emailExists = allIdentities?.some((identity: any) => {
        return identity.id !== currentIdentity.id && 
               (identity.traits?.email?.toLowerCase() === newEmail.toLowerCase().trim() ||
                identity.traits?.email_address?.toLowerCase() === newEmail.toLowerCase().trim())
      })

      if (emailExists) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Email is already registered',
        })
      }
    } catch (error: any) {
      if (error.statusCode === 409) {
        throw error
      }
      // Log but continue if listing fails
      if (import.meta.dev) {
        console.error('[auth/send-email-verification.post.ts] Failed to check email uniqueness:', error)
      }
    }

    // Check if user has 2FA enabled by checking session credentials
    let has2FA = false
    try {
      // Get session to check for TOTP credentials
      const sessionResponse = await frontendApi.toSession(undefined, {
        headers: requestCookies ? { Cookie: requestCookies } : undefined,
      })
      
      if (sessionResponse.data?.identity?.id) {
        // Check if identity has TOTP credentials
        const credentials = sessionResponse.data.identity.credentials || {}
        has2FA = credentials.totp !== undefined
        
        if (import.meta.dev) {
          console.log('[auth/send-email-verification.post.ts] Checking 2FA status from session')
          console.log('[auth/send-email-verification.post.ts] Identity ID:', sessionResponse.data.identity.id)
          console.log('[auth/send-email-verification.post.ts] Credentials keys:', Object.keys(credentials))
          console.log('[auth/send-email-verification.post.ts] TOTP configured:', has2FA)
        }
      }
    } catch (error: any) {
      if (import.meta.dev) {
        console.warn('[auth/send-email-verification.post.ts] Failed to check 2FA status from session:', error)
      }
    }

    // If 2FA is enabled, return indication that 2FA is required
    // Frontend will create the AAL2 login flow itself
    if (has2FA) {
      return {
        success: true,
        requires2FA: true,
        message: 'Please verify your 2FA code first',
      }
    }

    // If 2FA is not enabled, change email using Admin API
    // Frontend will create verification flow and send code
    try {
      // Step 1: Update identity email to new email (unverified) using Admin API
      // This is necessary before we can send verification code to the new address
      const kratosAdminConfig = new Configuration({
        basePath: config.kratosAdminUrl,
      })
      const { IdentityApi } = await import('@ory/client')
      const identityApi = new IdentityApi(kratosAdminConfig)

      // Get current identity data
      const { data: currentIdentityData } = await identityApi.getIdentity({
        id: currentIdentity.id,
      })

      // Update identity with new email (unverified)
      await identityApi.updateIdentity({
        id: currentIdentity.id,
        updateIdentityBody: {
          schema_id: currentIdentityData.schema_id,
          traits: {
            ...currentIdentityData.traits,
            email: newEmail,
            email_verified: false, // Mark as unverified
          },
        },
      })

      if (import.meta.dev) {
        console.log('[auth/send-email-verification.post.ts] Identity email updated to:', newEmail)
      }

      // Return success - frontend will create verification flow and send code
      return {
        success: true,
        message: 'Email updated. Please create verification flow in frontend.',
        email: newEmail,
        requiresVerificationFlow: true,
      }
    } catch (updateError: any) {
      if (import.meta.dev) {
        console.error('[auth/send-email-verification.post.ts] Failed to change email:', updateError)
        console.error('[auth/send-email-verification.post.ts] Error details:', updateError.response?.data || updateError.data)
      }

      // Check if it's a validation error (email already taken, etc.)
      if (updateError.response?.data?.ui?.messages) {
        const messages = updateError.response.data.ui.messages
        const errorMessage = messages.find((m: any) => m.type === 'error')?.text
        if (errorMessage) {
          throw createError({
            statusCode: 400,
            statusMessage: errorMessage,
          })
        }
      }

      // Re-throw if it's already a createError
      if (updateError.statusCode) {
        throw updateError
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to send verification code',
        message: updateError.message || 'Failed to send verification code',
      })
    }
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/send-email-verification.post.ts] Error:', error.statusCode || error.status)
      console.error('[auth/send-email-verification.post.ts] Error details:', error.response?.data || error.data || error.message)
    }
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send verification code',
      message: error.message || 'Failed to send verification code',
    })
  }
})

