import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'
import { Configuration, FrontendApi, IdentityApi } from '@ory/client'
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

    // Get existing verification flow
    // Try to get flow - it might be browser flow or API flow
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

    // Update verification flow with code
    const sanitizedCode = sanitizeCode(code)
    
    if (import.meta.dev) {
      console.log('[auth/verify-email.post.ts] Verifying code:', sanitizedCode.substring(0, 2) + '****', 'for flow:', flow)
      console.log('[auth/verify-email.post.ts] Flow type:', verificationFlow.type)
    }
    
    // Update verification flow with code
    // Browser flows need CSRF token and cookies, API flows don't
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
    
    // Check verification response state and log for debugging
    if (import.meta.dev) {
      console.log('[auth/verify-email.post.ts] Verification response state:', verificationResponse.data?.state)
      console.log('[auth/verify-email.post.ts] Verification response:', JSON.stringify(verificationResponse.data, null, 2))
    }

    // Check if verification flow state is success
    // Kratos may return different states, check for both 'passed_challenge' and 'success'
    const isVerified = verificationResponse.data?.state === 'passed_challenge' || 
                       verificationResponse.data?.state === 'success' ||
                       verificationResponse.data?.ui?.messages?.some((m: any) => m.type === 'success')

    if (isVerified) {
      // Verification successful - now update identity to mark email as verified
      if (import.meta.dev) {
        console.log('[auth/verify-email.post.ts] Verification code correct, updating identity...')
      }

      // Get identity from verification response or from verification flow
      // Kratos may include identity in response or we need to get it from flow
      let verifiedIdentity = verificationResponse.data?.identity
      
      // If identity not in response, try to get it from the flow
      if (!verifiedIdentity?.id) {
        // Try to get identity from flow's requested email
        // We need to find the identity by email
        const kratosAdminConfig = new Configuration({
          basePath: config.kratosAdminUrl || 'http://localhost:4434',
        })
        const identityApi = new IdentityApi(kratosAdminConfig)

        // Get email from verification flow
        const emailFromFlow = verificationFlow.ui?.nodes?.find(
          (node: any) => node.attributes?.name === 'email'
        )?.attributes?.value || verificationFlow.request_url?.match(/email=([^&]+)/)?.[1]

        if (emailFromFlow) {
          // List all identities and find by email
          try {
            const { data: identities } = await identityApi.listIdentities()
            const foundIdentity = identities?.find((id: any) => 
              id.traits?.email === emailFromFlow || id.traits?.email_address === emailFromFlow
            )
            if (foundIdentity) {
              verifiedIdentity = foundIdentity
            }
          } catch (listError: any) {
            if (import.meta.dev) {
              console.warn('[auth/verify-email.post.ts] Failed to list identities:', listError.message)
            }
          }
        }
      }
      
      if (verifiedIdentity?.id) {
        try {
          // Use Admin API to update identity and mark email as verified
          const kratosAdminConfig = new Configuration({
            basePath: config.kratosAdminUrl || 'http://localhost:4434',
          })
          const identityApi = new IdentityApi(kratosAdminConfig)

          // Get current identity
          const { data: currentIdentity } = await identityApi.getIdentity({
            id: verifiedIdentity.id,
          })

          if (currentIdentity?.traits) {
            // Update identity traits to mark email as verified
            // Preserve all existing traits
            const updatedTraits: any = {
              ...currentIdentity.traits,
              email_verified: true,
            }

            // Ensure email is preserved
            if (currentIdentity.traits.email) {
              updatedTraits.email = currentIdentity.traits.email
            } else if (currentIdentity.traits.email_address) {
              updatedTraits.email_address = currentIdentity.traits.email_address
            }

            // Preserve name if exists
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
              console.log('[auth/verify-email.post.ts] Identity updated, email marked as verified:', verifiedIdentity.id)
              console.log('[auth/verify-email.post.ts] Updated traits:', JSON.stringify(updatedTraits, null, 2))
            }
          } else {
            if (import.meta.dev) {
              console.warn('[auth/verify-email.post.ts] Current identity has no traits:', currentIdentity)
            }
          }
        } catch (updateError: any) {
          // Log error but don't fail - verification was successful
          if (import.meta.dev) {
            console.error('[auth/verify-email.post.ts] Failed to update identity:', updateError.response?.data || updateError.message)
            console.error('[auth/verify-email.post.ts] Update error stack:', updateError.stack)
          }
        }
      } else {
        if (import.meta.dev) {
          console.warn('[auth/verify-email.post.ts] No identity found in verification response or flow')
          console.warn('[auth/verify-email.post.ts] Verification response data:', JSON.stringify(verificationResponse.data, null, 2))
        }
      }
      
      if (import.meta.dev) {
        console.log('[auth/verify-email.post.ts] Email verified successfully')
      }
      
      // Return identity ID so client can create session if needed
      return {
        success: true,
        message: 'Email verified successfully',
        identityId: verifiedIdentity?.id || null,
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
