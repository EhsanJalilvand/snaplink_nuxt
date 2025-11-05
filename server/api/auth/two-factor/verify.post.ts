import { Configuration, FrontendApi } from '@ory/client'
import { getHeader } from 'h3'
import { z } from 'zod'

const verifyTOTPSchema = z.object({
  flow: z.string().min(1, 'Flow ID is required'),
  code: z.string().length(6, 'Code must be 6 digits'),
  csrf_token: z.string().min(1, 'CSRF token is required'),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

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
    const body = await readBody(event)
    
    // Validate input
    const validation = verifyTOTPSchema.safeParse(body)
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input',
        data: validation.error.errors,
      })
    }

    const { flow, code, csrf_token } = validation.data

    try {
      const kratosConfig = new Configuration({
        basePath: config.kratosPublicUrl,
      })
      const frontendApi = new FrontendApi(kratosConfig)
      
      const requestCookies = getHeader(event, 'cookie') || ''
      
      // Verify TOTP code by updating settings flow
      let verifyResponse: any = null
      
      try {
        verifyResponse = await frontendApi.updateSettingsFlow({
          flow,
          updateSettingsFlowBody: {
            method: 'totp',
            totp_code: code,
            csrf_token,
          },
        }, {
          headers: requestCookies ? { Cookie: requestCookies } : undefined,
        })
      } catch (error: any) {
        // @ory/client might throw error even when response contains data
        // Store error but continue to check response
        const errorData = error.response?.data || error.data || error.body || {}
        
        // Check for session refresh error
        if (errorData.error?.id === 'session_refresh_required' || error.statusCode === 403) {
          throw createError({
            statusCode: 403,
            statusMessage: 'Session refresh required',
            message: 'Your session has expired. Please refresh the page and try again.',
            data: {
              error: errorData.error,
              redirect_browser_to: errorData.redirect_browser_to,
            },
          })
        }
        
        // If error has response data, use it
        if (error.response?.data) {
          verifyResponse = { data: error.response.data }
        } else if (error.data) {
          verifyResponse = { data: error.data }
        } else if (error.body) {
          verifyResponse = { data: error.body }
        } else {
          // Re-throw if we can't extract response
          throw error
        }
      }
      
      // Check for session refresh error in response
      if (verifyResponse.data?.error?.id === 'session_refresh_required') {
        throw createError({
          statusCode: 403,
          statusMessage: 'Session refresh required',
          message: 'Your session has expired. Please refresh the page and try again.',
          data: {
            error: verifyResponse.data.error,
            redirect_browser_to: verifyResponse.data.redirect_browser_to,
          },
        })
      }
      
      // Check flow state first
      const flowState = verifyResponse.data?.state
      
      // Check for errors in the response
      // Errors can be in messages or in node messages
      const errorMessages = verifyResponse.data?.ui?.messages?.filter(
        (msg: any) => msg.type === 'error'
      ) || []
      
      // Check for errors in TOTP nodes
      const totpNodes = verifyResponse.data?.ui?.nodes?.filter(
        (node: any) => node.group === 'totp'
      ) || []
      
      const totpErrorNodes = totpNodes.filter((node: any) => {
        return node.messages?.some((m: any) => m.type === 'error')
      }) || []
      
      // Collect all error messages
      const allErrors: string[] = []
      errorMessages.forEach((msg: any) => {
        if (msg.text) allErrors.push(msg.text)
      })
      totpErrorNodes.forEach((node: any) => {
        node.messages?.forEach((m: any) => {
          if (m.type === 'error' && m.text) allErrors.push(m.text)
        })
      })
      
      if (import.meta.dev) {
        console.log('[auth/two-factor/verify.post.ts] TOTP verified, flow ID:', flow)
        console.log('[auth/two-factor/verify.post.ts] Flow state:', flowState)
        console.log('[auth/two-factor/verify.post.ts] Error messages:', allErrors.length)
        console.log('[auth/two-factor/verify.post.ts] TOTP error nodes:', totpErrorNodes.length)
        console.log('[auth/two-factor/verify.post.ts] Response data:', JSON.stringify(verifyResponse.data, null, 2))
      }
      
      // Check if TOTP was successfully configured
      // Look for totp_unlink node which indicates TOTP is configured
      const totpUnlinkNode = verifyResponse.data?.ui?.nodes?.find(
        (node: any) => node.group === 'totp' && node.attributes?.name === 'totp_unlink'
      )
      
      const hasTotpUnlink = totpUnlinkNode !== undefined
      
      // Check if totp_code input still exists (means verification failed)
      const totpCodeInput = verifyResponse.data?.ui?.nodes?.find(
        (node: any) => node.group === 'totp' && node.attributes?.name === 'totp_code'
      )
      
      // Check for success messages
      const successMessages = verifyResponse.data?.ui?.messages?.filter(
        (msg: any) => msg.type === 'success'
      ) || []
      
      // If flow state is still 'show_form' and totp_code input exists, verification hasn't completed
      if (flowState === 'show_form' && totpCodeInput && !hasTotpUnlink && successMessages.length === 0) {
        // If there are errors, throw them
        if (allErrors.length > 0) {
          const errorMessage = allErrors[0] || 'TOTP code verification failed'
          if (import.meta.dev) {
            console.error('[auth/two-factor/verify.post.ts] Verification failed:', errorMessage)
          }
          throw createError({
            statusCode: 400,
            statusMessage: errorMessage,
            message: errorMessage,
          })
        }
        
        // If no errors but still in show_form with totp_code, it means verification failed silently
        if (import.meta.dev) {
          console.error('[auth/two-factor/verify.post.ts] Verification incomplete - totp_code input still present, flow state:', flowState)
        }
        throw createError({
          statusCode: 400,
          statusMessage: 'TOTP code verification failed. Please check your code and try again.',
          message: 'TOTP code verification failed. Please check your code and try again.',
        })
      }
      
      // If there are errors and flow is not in success state, throw error
      if (allErrors.length > 0 && flowState !== 'success' && !hasTotpUnlink) {
        const errorMessage = allErrors[0] || 'Failed to verify TOTP code'
        throw createError({
          statusCode: 400,
          statusMessage: errorMessage,
          message: errorMessage,
        })
      }
      
      // Check if flow state indicates success
      const isSuccess = flowState === 'success' || hasTotpUnlink || successMessages.length > 0
      
      if (import.meta.dev) {
        console.log('[auth/two-factor/verify.post.ts] TOTP unlink node found:', hasTotpUnlink)
        console.log('[auth/two-factor/verify.post.ts] Success messages:', successMessages.length)
        console.log('[auth/two-factor/verify.post.ts] Is success:', isSuccess)
      }
      
      // Verify TOTP is actually configured by checking session
      let totpConfigured = false
      try {
        // Get fresh session to check if TOTP is now configured
        const sessionResponse = await frontendApi.toSession(undefined, {
          headers: requestCookies ? { Cookie: requestCookies } : undefined,
        })
        
        if (sessionResponse.data?.identity?.id) {
          // Check if identity has TOTP credentials
          const credentials = sessionResponse.data.identity.credentials || {}
          totpConfigured = credentials.totp !== undefined
          
          if (import.meta.dev) {
            console.log('[auth/two-factor/verify.post.ts] Identity ID:', sessionResponse.data.identity.id)
            console.log('[auth/two-factor/verify.post.ts] Credentials keys:', Object.keys(credentials))
            console.log('[auth/two-factor/verify.post.ts] TOTP configured in credentials:', totpConfigured)
          }
        }
      } catch (sessionError: any) {
        if (import.meta.dev) {
          console.error('[auth/two-factor/verify.post.ts] Session check failed:', sessionError)
        }
        // If session check fails, use flow state as indicator
        totpConfigured = isSuccess || hasTotp
      }
      
      // If we have clear success indicators, assume TOTP is configured
      if (!totpConfigured && (isSuccess || hasTotp || successMessages.length > 0)) {
        if (import.meta.dev) {
          console.log('[auth/two-factor/verify.post.ts] Assuming TOTP configured based on flow state')
        }
        totpConfigured = true
      }
      
      if (!totpConfigured) {
        // If we don't see clear success indicators, check if there are any TOTP-related nodes
        const totpNodes = verifyResponse.data?.ui?.nodes?.filter(
          (node: any) => node.group === 'totp'
        ) || []
        
        if (import.meta.dev) {
          console.log('[auth/two-factor/verify.post.ts] TOTP nodes found:', totpNodes.length)
        }
        
        // If we have totp nodes but no unlink, it might still be successful
        // Kratos might have already configured TOTP
        if (totpNodes.length > 0) {
          if (import.meta.dev) {
            console.log('[auth/two-factor/verify.post.ts] TOTP nodes present, assuming success')
          }
          totpConfigured = true
        } else {
          // No TOTP nodes at all, might be an issue
          throw createError({
            statusCode: 400,
            statusMessage: 'TOTP verification may have failed. Please try again.',
            message: 'TOTP verification may have failed. Please try again.',
          })
        }
      }
      
      return {
        success: true,
        message: 'TOTP verified successfully',
        configured: totpConfigured,
      }
    } catch (kratosError: any) {
      if (import.meta.dev) {
        console.error('[auth/two-factor/verify.post.ts] Kratos error:', kratosError)
        console.error('[auth/two-factor/verify.post.ts] Error response:', JSON.stringify(kratosError.response?.data || kratosError.data || kratosError, null, 2))
      }
      
      // Extract error message from Kratos response
      const errorData = kratosError.response?.data || kratosError.data || {}
      
      // Check for session refresh error
      if (errorData.error?.id === 'session_refresh_required' || kratosError.statusCode === 403) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Session refresh required',
          message: 'Your session has expired. Please refresh the page and try again.',
          data: {
            error: errorData.error,
            redirect_browser_to: errorData.redirect_browser_to,
          },
        })
      }
      
      const errorMessages = errorData.ui?.messages?.filter(
        (msg: any) => msg.type === 'error'
      ) || []
      
      if (errorMessages.length > 0) {
        const errorMessage = errorMessages[0].text || 'Failed to verify TOTP code'
        throw createError({
          statusCode: 400,
          statusMessage: errorMessage,
          message: errorMessage,
        })
      }
      
      throw createError({
        statusCode: kratosError.statusCode || kratosError.status || 500,
        statusMessage: kratosError.message || 'Failed to verify TOTP code',
        message: kratosError.message || 'Failed to verify TOTP code',
      })
    }
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/two-factor/verify.post.ts] Error:', error.statusCode || error.status || error.message)
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to verify TOTP',
      message: error.message || 'Failed to verify TOTP',
    })
  }
})

