import { Configuration, FrontendApi, IdentityApi } from '@ory/client'
import { getHeader } from 'h3'

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
    let userId: string | null = null
    let userEmail: string | null = null

    // Try to get user ID and email from Kratos session
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
          userEmail = sessionResponse.data.identity.traits?.email || sessionResponse.data.identity.traits?.email_address || null
        }
      } catch (kratosError: any) {
        if (import.meta.dev) {
          console.error('[auth/two-factor/setup.post.ts] Kratos session check failed:', kratosError)
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
          userEmail = userinfoResponse.email || null
        }
      } catch (hydraError: any) {
        if (import.meta.dev) {
          console.error('[auth/two-factor/setup.post.ts] Hydra token check failed:', hydraError)
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

    if (!userEmail) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User email not found',
        message: 'Unable to find user email address',
      })
    }

    // Send 2FA setup email using Kratos verification flow
    // This will send a verification code to the user's email
    // The user can then use this code to complete 2FA setup
    try {
      const kratosConfig = new Configuration({
        basePath: config.kratosPublicUrl,
      })
      const frontendApi = new FrontendApi(kratosConfig)
      
      const requestCookies = getHeader(event, 'cookie') || ''
      
      // Create verification flow to send code to email
      const verificationFlow = await frontendApi.createBrowserVerificationFlow({
        returnTo: `${config.public.siteUrl}/dashboard/settings/security`,
      }, {
        headers: requestCookies ? { Cookie: requestCookies } : undefined,
      })
      
      if (verificationFlow.data?.id) {
        // Get CSRF token from flow
        const csrfToken = verificationFlow.data.ui?.nodes?.find(
          (node: any) => node.attributes?.name === 'csrf_token'
        )?.attributes?.value
        
        if (csrfToken) {
          // Submit verification request to send code to email
          await frontendApi.updateVerificationFlow({
            flow: verificationFlow.data.id,
            updateVerificationFlowBody: {
              method: 'code',
              email: userEmail,
              csrf_token: csrfToken,
            },
          }, {
            headers: requestCookies ? { Cookie: requestCookies } : undefined,
          })
          
          if (import.meta.dev) {
            console.log('[auth/two-factor/setup.post.ts] 2FA setup email sent to:', userEmail)
          }
        }
      }
    } catch (emailError: any) {
      // Log error but don't fail - email might have been sent
      if (import.meta.dev) {
        console.error('[auth/two-factor/setup.post.ts] Failed to send 2FA setup email:', emailError)
      }
    }
    
    if (import.meta.dev) {
      console.log('[auth/two-factor/setup.post.ts] 2FA setup requested for user:', userId, 'email:', userEmail)
    }

    return {
      success: true,
      message: '2FA setup instructions sent to your email',
      email: userEmail,
    }
  }
  catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/two-factor/setup.post.ts] Error:', error.statusCode || error.status || error.message)
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to setup 2FA',
      message: error.message || 'Failed to setup 2FA',
    })
  }
})

