import { z } from 'zod'
import { Configuration, FrontendApi, AdminApi } from '@ory/client'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'

const twoFactorSchema = z.object({
  enabled: z.boolean(),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Get client IP for rate limiting
  const clientIP = getClientIP(event)
  
  // Rate limiting: max 5 2FA update attempts per 15 minutes per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    identifier: `two_factor:${clientIP}`,
  })
  
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many update attempts. Please try again later.',
      data: {
        resetTime: rateLimit.resetTime,
      },
    })
  }

  // Validate input
  const validation = twoFactorSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { enabled } = validation.data

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
    let userId: string | null = null

    // Try to get user ID from Kratos session
    if (kratosSession) {
      try {
        const kratosConfig = new Configuration({
          basePath: config.kratosPublicUrl,
        })
        const frontendApi = new FrontendApi(kratosConfig)
        
        const requestCookies = getHeader(event, 'cookie') || ''
        const sessionResponse = await frontendApi.toSession(undefined, {
          headers: {
            Cookie: requestCookies || `ory_kratos_session=${kratosSession}`,
          },
        })

        if (sessionResponse.data?.identity?.id) {
          userId = sessionResponse.data.identity.id
        }
      } catch (kratosError: any) {
        if (import.meta.dev) {
          console.error('[auth/two-factor.put.ts] Kratos session check failed:', kratosError)
        }
      }
    }

    // If Kratos session failed, try Hydra token
    if (!userId && accessToken) {
      try {
        const userinfoResponse = await $fetch(`${config.hydraPublicUrl}/userinfo`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }) as any

        if (userinfoResponse?.sub) {
          userId = userinfoResponse.sub
        }
      } catch (hydraError: any) {
        if (import.meta.dev) {
          console.error('[auth/two-factor.put.ts] Hydra token check failed:', hydraError)
        }
      }
    }

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Unable to identify user',
      })
    }

    // If disabling 2FA, we need to unlink TOTP from Kratos
    if (!enabled && kratosSession) {
      try {
        const kratosConfig = new Configuration({
          basePath: config.kratosPublicUrl,
        })
        const frontendApi = new FrontendApi(kratosConfig)
        
        const requestCookies = getHeader(event, 'cookie') || ''
        
        // Create settings flow to unlink TOTP
        const settingsFlow = await frontendApi.createBrowserSettingsFlow({
          returnTo: config.public.siteUrl,
        }, {
          headers: requestCookies ? { Cookie: requestCookies } : undefined,
        })
        
        if (!settingsFlow.data?.id) {
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create settings flow',
            message: 'Settings flow was created but no flow ID was returned',
          })
        }
        
        // Get CSRF token from flow
        const csrfToken = settingsFlow.data.ui?.nodes?.find(
          (node: any) => node.attributes?.name === 'csrf_token'
        )?.attributes?.value
        
        if (!csrfToken) {
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to get CSRF token',
            message: 'CSRF token not found in settings flow',
          })
        }
        
        // Check if TOTP is configured by looking for totp_unlink node
        const totpUnlinkNode = settingsFlow.data.ui?.nodes?.find(
          (node: any) => node.group === 'totp' && node.attributes?.name === 'totp_unlink'
        )
        
        if (!totpUnlinkNode) {
          // TOTP is not configured, nothing to disable
          if (import.meta.dev) {
            console.log('[auth/two-factor.put.ts] TOTP is not configured for user:', userId)
          }
          return {
            success: true,
            message: '2FA is already disabled',
          }
        }
        
        // Submit settings flow with totp_unlink to remove TOTP
        const flowUrl = `${config.kratosPublicUrl}/self-service/settings?flow=${settingsFlow.data.id}`
        
        if (import.meta.dev) {
          console.log('[auth/two-factor.put.ts] Unlinking TOTP for user:', userId)
        }
        
        // Attempt to unlink TOTP via Frontend API
        try {
          await $fetch(flowUrl, {
            method: 'POST',
            headers: requestCookies ? { Cookie: requestCookies } : undefined,
            body: {
              method: 'totp',
              totp_unlink: 'true',
              csrf_token: csrfToken,
            },
          })
          
          if (import.meta.dev) {
            console.log('[auth/two-factor.put.ts] TOTP unlink request sent successfully for user:', userId)
          }
        } catch (unlinkError: any) {
          // Even if Kratos returns an error, the unlink might have succeeded
          // Check the error response to see if TOTP was actually removed
          const errorData = unlinkError.response?._data || unlinkError.data || {}
          const responseNodes = errorData.ui?.nodes || []
          const stillHasTotp = responseNodes.some(
            (node: any) => node.group === 'totp' && node.attributes?.name === 'totp_unlink'
          )
          
          if (stillHasTotp) {
            // TOTP still exists in the response, unlink likely failed
            if (import.meta.dev) {
              console.error('[auth/two-factor.put.ts] TOTP unlink failed - TOTP still exists in response')
              console.error('[auth/two-factor.put.ts] Error details:', {
                status: unlinkError.status,
                statusText: unlinkError.statusText,
                message: unlinkError.message,
              })
            }
            
            // Throw error - unlink failed
            throw createError({
              statusCode: 500,
              statusMessage: 'Failed to disable 2FA',
              message: 'Unable to remove TOTP from your account. The unlink request was rejected. Please try again.',
            })
          } else {
            // TOTP was removed (even though Kratos returned an error)
            if (import.meta.dev) {
              console.log('[auth/two-factor.put.ts] TOTP unlinked successfully (error response but TOTP removed)')
            }
          }
        }
        
        if (import.meta.dev) {
          console.log('[auth/two-factor.put.ts] TOTP unlink process completed for user:', userId)
        }
      } catch (kratosError: any) {
        if (import.meta.dev) {
          console.error('[auth/two-factor.put.ts] Error unlinking TOTP:', kratosError)
        }
        
        // If it's already our error, re-throw it
        if (kratosError.statusCode) {
          throw kratosError
        }
        
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to disable 2FA',
          message: kratosError.message || 'Unable to remove TOTP from your account.',
        })
      }
    }
    
    if (import.meta.dev) {
      console.log('[auth/two-factor.put.ts] 2FA settings updated for user:', userId, 'enabled:', enabled)
    }

    return {
      success: true,
      message: enabled ? '2FA has been enabled' : '2FA has been disabled',
    }
  }
  catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/two-factor.put.ts] Error:', error.statusCode || error.status)
    }
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update 2FA settings',
    })
  }
})


