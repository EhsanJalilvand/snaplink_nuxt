import { Configuration, FrontendApi } from '@ory/client'
import { getHeader } from 'h3'

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
    // Try to get TOTP status from Kratos session and settings flow
    if (kratosSession) {
      const kratosConfig = new Configuration({
        basePath: config.kratosPublicUrl,
      })
      const frontendApi = new FrontendApi(kratosConfig)
      
      const requestCookies = getHeader(event, 'cookie') || ''
      
      // First, try to get session to check identity
      try {
        const sessionResponse = await frontendApi.toSession(undefined, {
          headers: {
            Cookie: requestCookies || `ory_kratos_session=${kratosSession}`,
          },
        })

        if (sessionResponse.data?.identity?.id) {
          // Check if identity has TOTP credentials
          const credentials = sessionResponse.data.identity.credentials || {}
          const hasTotpFromCredentials = credentials.totp !== undefined
          
          if (import.meta.dev) {
            console.log('[auth/two-factor/status.get.ts] Identity ID:', sessionResponse.data.identity.id)
            console.log('[auth/two-factor/status.get.ts] Credentials keys:', Object.keys(credentials))
            console.log('[auth/two-factor/status.get.ts] TOTP from credentials:', hasTotpFromCredentials)
          }
          
          // If we found TOTP in credentials, return it
          if (hasTotpFromCredentials) {
            return {
              success: true,
              enabled: true,
              configured: true,
            }
          }
          
          // If not found in credentials, check settings flow
          // This is more reliable as it checks the actual UI state
          try {
            const settingsFlow = await frontendApi.createBrowserSettingsFlow({
              returnTo: config.public.siteUrl,
            }, {
              headers: requestCookies ? { Cookie: requestCookies } : undefined,
            })
            
            // Check if TOTP is configured by looking for totp_unlink node
            const totpNode = settingsFlow.data?.ui?.nodes?.find(
              (node: any) => node.group === 'totp' && node.attributes?.name === 'totp_unlink'
            )
            
            const hasTotp = totpNode !== undefined
            
            if (import.meta.dev) {
              console.log('[auth/two-factor/status.get.ts] Settings flow ID:', settingsFlow.data?.id)
              console.log('[auth/two-factor/status.get.ts] TOTP node found:', hasTotp)
              console.log('[auth/two-factor/status.get.ts] All nodes:', settingsFlow.data?.ui?.nodes?.map((n: any) => ({
                group: n.group,
                name: n.attributes?.name,
                type: n.type
              })))
            }
            
            return {
              success: true,
              enabled: hasTotp,
              configured: hasTotp,
            }
          } catch (settingsError: any) {
            if (import.meta.dev) {
              console.error('[auth/two-factor/status.get.ts] Settings flow check failed:', settingsError)
            }
            
            // Fallback to credentials check result
            return {
              success: true,
              enabled: hasTotpFromCredentials,
              configured: hasTotpFromCredentials,
            }
          }
        }
      } catch (sessionError: any) {
        if (import.meta.dev) {
          console.error('[auth/two-factor/status.get.ts] Session check failed:', sessionError)
        }
        
        // If session check failed, try settings flow anyway
        try {
          const settingsFlow = await frontendApi.createBrowserSettingsFlow({
            returnTo: config.public.siteUrl,
          }, {
            headers: requestCookies ? { Cookie: requestCookies } : undefined,
          })
          
          const totpNode = settingsFlow.data?.ui?.nodes?.find(
            (node: any) => node.group === 'totp' && node.attributes?.name === 'totp_unlink'
          )
          
          const hasTotp = totpNode !== undefined
          
          if (import.meta.dev) {
            console.log('[auth/two-factor/status.get.ts] TOTP from settings flow (fallback):', hasTotp)
          }
          
          return {
            success: true,
            enabled: hasTotp,
            configured: hasTotp,
          }
        } catch (settingsError: any) {
          if (import.meta.dev) {
            console.error('[auth/two-factor/status.get.ts] Settings flow fallback failed:', settingsError)
          }
        }
      }
    }

    // If Kratos session failed, try Hydra token
    if (accessToken) {
      try {
        const userinfoResponse = await $fetch(`${config.hydraPublicUrl}/userinfo`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }) as any

        if (userinfoResponse?.sub) {
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

