import { Configuration, FrontendApi } from '@ory/client'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Get Kratos session cookie
  const kratosSession = getCookie(event, 'ory_kratos_session')
  
  // Get Hydra access token cookie
  const accessToken = getCookie(event, 'hydra_access_token')

  if (!kratosSession && !accessToken) {
    return {
      success: false,
      enabled: false,
      configured: false,
    }
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
          
          // Check if user has TOTP configured in Kratos traits
          const traits = sessionResponse.data.identity.traits || {}
          const hasTotp = traits.totp_enabled === true || traits.two_factor_enabled === true

          return {
            success: true,
            enabled: hasTotp,
            configured: hasTotp,
          }
        }
      } catch (kratosError: any) {
        if (import.meta.dev) {
          console.error('[auth/two-factor/status.get.ts] Kratos session check failed:', kratosError)
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
          
          // Check if user has TOTP configured in userinfo
          const hasTotp = userinfoResponse.totp_enabled === true || userinfoResponse.two_factor_enabled === true

          return {
            success: true,
            enabled: hasTotp,
            configured: hasTotp,
          }
        }
      } catch (hydraError: any) {
        if (import.meta.dev) {
          console.error('[auth/two-factor/status.get.ts] Hydra token check failed:', hydraError)
        }
      }
    }

    // Default: 2FA not configured
    return {
      success: true,
      enabled: false,
      configured: false,
    }
  }
  catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/two-factor/status.get.ts] Error:', error.statusCode || error.status || error.message)
    }

    return {
      success: false,
      enabled: false,
      configured: false,
    }
  }
})

