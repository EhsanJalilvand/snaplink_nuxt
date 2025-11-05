import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'
import { Configuration, FrontendApi, IdentityApi } from '@ory/client'
import { getHeader } from 'h3'

// Sanitize code input (XSS prevention)
function sanitizeCode(code: string): string {
  return code.trim().replace(/[^0-9]/g, '') // Only digits
}

const verifyEmailChangeSchema = z.object({
  code: z.string()
    .min(6, 'Code must be 6 digits')
    .max(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
  flow: z.string()
    .min(1, 'Verification flow ID is required'),
  newEmail: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
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
    identifier: `verify_email_change:${clientIP}`,
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
  const validation = verifyEmailChangeSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { code, flow, newEmail } = validation.data

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
    // Use Kratos Verification Flow to verify email change
    // Verification flow can verify any email, even if not in identity
    const kratosConfig = new Configuration({
      basePath: config.kratosPublicUrl,
    })
    const frontendApi = new FrontendApi(kratosConfig)

    // Get all cookies from request to forward to Kratos
    const requestCookies = getHeader(event, 'cookie') || ''

    // Get existing verification flow
    let verificationFlow: any
    try {
      // Try browser flow first (with cookies for CSRF)
      const browserFlow = await frontendApi.getVerificationFlow({
        id: flow,
      }, {
        headers: requestCookies ? { Cookie: requestCookies } : undefined,
      })
      verificationFlow = browserFlow.data
    } catch (browserError: any) {
      // If browser flow fails, try API flow (no cookies needed)
      try {
        const apiFlow = await frontendApi.getVerificationFlow({
          id: flow,
        })
        verificationFlow = apiFlow.data
      } catch (apiError: any) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid verification flow',
        })
      }
    }

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

    // Find CSRF token in flow (only for browser flows)
    const csrfToken = verificationFlow.ui?.nodes?.find(
      (node: any) => node.attributes?.name === 'csrf_token'
    )?.attributes?.value as string

    // Check if flow is browser or API flow
    const isBrowserFlow = verificationFlow.type === 'browser'
    
    // CSRF token is only required for browser flows
    if (isBrowserFlow && !csrfToken) {
      throw createError({
        statusCode: 500,
        statusMessage: 'CSRF token not found in verification flow',
      })
    }

    // Update verification flow with verification code
    const sanitizedCode = sanitizeCode(code)
    
    if (import.meta.dev) {
      console.log('[auth/verify-email-change.post.ts] Verifying code for verification flow:', flow)
      console.log('[auth/verify-email-change.post.ts] New email:', newEmail)
    }
    
    // Update verification flow with verification code
    const updateBody: any = {
      method: 'code',
      code: sanitizedCode, // Verification code (6 digits)
    }
    
    if (isBrowserFlow && csrfToken) {
      updateBody.csrf_token = csrfToken
    }
    
    const verificationResponse = await frontendApi.updateVerificationFlow({
      flow: verificationFlow.id,
      updateVerificationFlowBody: updateBody,
    }, {
      headers: (isBrowserFlow && requestCookies) ? { Cookie: requestCookies } : undefined,
    })
    
    // Check if verification was successful
    if (!verificationResponse.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification failed. Please try again.',
      })
    }
    
    // Check verification response state
    const isVerified = verificationResponse.data?.state === 'passed_challenge' || 
                       verificationResponse.data?.state === 'success' ||
                       verificationResponse.data?.ui?.messages?.some((m: any) => m.type === 'success')
    
    if (isVerified) {
      // Verification successful - NOW change the email in identity
      // This ensures email only changes after successful verification
      if (import.meta.dev) {
        console.log('[auth/verify-email-change.post.ts] Verification successful, now changing email to:', newEmail)
      }

      // Get identity from verification response or from session
      let verifiedIdentity = verificationResponse.data?.identity
      
      if (!verifiedIdentity?.id) {
        // Try to get identity from session
        try {
          const sessionResponse = await frontendApi.toSession(undefined, {
            headers: requestCookies ? { Cookie: requestCookies } : undefined,
          })
          verifiedIdentity = sessionResponse.data?.identity
        } catch (sessionError: any) {
          if (import.meta.dev) {
            console.error('[auth/verify-email-change.post.ts] Failed to get session:', sessionError)
          }
          throw createError({
            statusCode: 401,
            statusMessage: 'Failed to get user session',
          })
        }
      }
      
      if (!verifiedIdentity?.id) {
        throw createError({
          statusCode: 401,
          statusMessage: 'User not found',
        })
      }

      // Email was temporarily added as unverified in send-email-verification
      // Now we just need to mark it as verified
      // Check if email matches (should be the same since we added it temporarily)
      if (verifiedIdentity.traits?.email === newEmail) {
        // Email matches - just mark as verified
        try {
          const kratosAdminConfig = new Configuration({
            basePath: config.kratosAdminUrl || 'http://localhost:4434',
          })
          const identityApi = new IdentityApi(kratosAdminConfig)

          // Get current identity
          const { data: currentIdentity } = await identityApi.getIdentity({
            id: verifiedIdentity.id,
          })

          if (!currentIdentity?.traits) {
            throw createError({
              statusCode: 500,
              statusMessage: 'Failed to get identity data',
            })
          }

          // Update identity to mark email as verified
          const updatedTraits: any = {
            ...currentIdentity.traits,
            email: newEmail, // Ensure it's set
            email_verified: true, // Mark as verified
          }

          // Preserve other traits
          if (currentIdentity.traits.name) {
            updatedTraits.name = currentIdentity.traits.name
          }

          // Update identity
          await identityApi.updateIdentity({
            id: verifiedIdentity.id,
            updateIdentityBody: {
              schema_id: currentIdentity.schema_id,
              traits: updatedTraits,
            },
          })

          if (import.meta.dev) {
            console.log('[auth/verify-email-change.post.ts] Email marked as verified:', newEmail)
          }
        } catch (updateError: any) {
          if (import.meta.dev) {
            console.error('[auth/verify-email-change.post.ts] Failed to mark email as verified:', updateError.response?.data || updateError.message)
          }
          
          // Re-throw if it's already a createError
          if (updateError.statusCode) {
            throw updateError
          }
          
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to mark email as verified',
            message: updateError.message || 'Failed to mark email as verified',
          })
        }
      } else {
        // Email doesn't match - update it
        if (import.meta.dev) {
          console.log('[auth/verify-email-change.post.ts] Email mismatch, updating:', verifiedIdentity.traits?.email, 'to', newEmail)
        }

        try {
          const kratosAdminConfig = new Configuration({
            basePath: config.kratosAdminUrl || 'http://localhost:4434',
          })
          const identityApi = new IdentityApi(kratosAdminConfig)

          // Get current identity
          const { data: currentIdentity } = await identityApi.getIdentity({
            id: verifiedIdentity.id,
          })

          if (!currentIdentity?.traits) {
            throw createError({
              statusCode: 500,
              statusMessage: 'Failed to get identity data',
            })
          }

          // Update identity with new email (verified)
          const updatedTraits: any = {
            ...currentIdentity.traits,
            email: newEmail,
            email_verified: true, // Mark as verified
          }

          // Preserve other traits
          if (currentIdentity.traits.name) {
            updatedTraits.name = currentIdentity.traits.name
          }

          // Update identity
          await identityApi.updateIdentity({
            id: verifiedIdentity.id,
            updateIdentityBody: {
              schema_id: currentIdentity.schema_id,
              traits: updatedTraits,
            },
          })

          if (import.meta.dev) {
            console.log('[auth/verify-email-change.post.ts] Identity email updated to:', newEmail)
            console.log('[auth/verify-email-change.post.ts] Email marked as verified')
          }
        } catch (updateError: any) {
          if (import.meta.dev) {
            console.error('[auth/verify-email-change.post.ts] Failed to update identity:', updateError.response?.data || updateError.message)
          }
          
          // Re-throw if it's already a createError
          if (updateError.statusCode) {
            throw updateError
          }
          
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to update email after verification',
            message: updateError.message || 'Failed to update email',
          })
        }
      }
      
      if (import.meta.dev) {
        console.log('[auth/verify-email-change.post.ts] Email verified and changed successfully')
      }
      
      return {
        success: true,
        message: 'Email verified and changed successfully',
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
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid verification code. Please check the code and try again.',
    })
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/verify-email-change.post.ts] Error:', error.statusCode || error.status)
      console.error('[auth/verify-email-change.post.ts] Error details:', error.response?.data || error.data || error.message)
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

