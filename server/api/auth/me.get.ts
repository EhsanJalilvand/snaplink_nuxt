import { Configuration, FrontendApi } from '@ory/client'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Check for Kratos session cookie
    const kratosSession = getCookie(event, 'ory_kratos_session')
    
    // Check for Hydra access token cookie
    const accessToken = getCookie(event, 'hydra_access_token')
    
    // If no tokens, user is not authenticated
    if (!kratosSession && !accessToken) {
      return {
        success: false,
        user: null,
        isAuthenticated: false,
      }
    }

    // Try to get user info from Kratos session
    let user: any = null
    
    // Get all cookies from request to forward to Kratos
    const requestCookies = getHeader(event, 'cookie') || ''
    
    if (import.meta.dev) {
      console.log('[auth/me.get.ts] Request cookies:', requestCookies.substring(0, 200))
      console.log('[auth/me.get.ts] Kratos session cookie:', kratosSession ? 'Found' : 'Not found')
    }
    
    if (kratosSession || requestCookies.includes('ory_kratos_session')) {
      try {
        if (import.meta.dev) {
          console.log('[auth/me.get.ts] Checking Kratos session...')
        }
        
        const kratosConfig = new Configuration({
          basePath: config.kratosPublicUrl,
        })
        const frontendApi = new FrontendApi(kratosConfig)
        
        // Get session from Kratos using all cookies from request
        const sessionResponse = await frontendApi.toSession(undefined, {
          headers: {
            Cookie: requestCookies || `ory_kratos_session=${kratosSession}`,
          },
        })
        
        if (sessionResponse.data?.identity) {
          const identity = sessionResponse.data.identity
          const traits = identity.traits || {}
          
          user = {
            id: identity.id,
            email: traits.email || traits.email_address || '',
            emailVerified: traits.email_verified || traits.email_address_verified || false,
            firstName: traits.name?.first || traits.given_name || '',
            lastName: traits.name?.last || traits.family_name || '',
            avatar: traits.avatar || null,
            roles: [],
          }
          
          if (import.meta.dev) {
            console.log('[auth/me.get.ts] Kratos session valid, user:', user.id, user.email)
          }
        } else {
          if (import.meta.dev) {
            console.log('[auth/me.get.ts] Session response has no identity')
          }
        }
      } catch (kratosError: any) {
        // If Kratos session is invalid, try Hydra token
        if (import.meta.dev) {
          console.log('[auth/me.get.ts] Kratos session check failed:', kratosError.response?.status || kratosError.statusCode || kratosError.message)
          console.log('[auth/me.get.ts] Kratos error details:', kratosError.response?.data || kratosError.data)
        }
      }
    } else {
      if (import.meta.dev) {
        console.log('[auth/me.get.ts] No Kratos session cookie found')
      }
    }

    // If Kratos session failed, try Hydra token
    if (!user && accessToken) {
      try {
        // Validate token with Hydra
        const hydraAdminUrl = config.hydraAdminUrl
        const introspectResponse = await $fetch(`${hydraAdminUrl}/admin/oauth2/introspect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            token: accessToken,
            token_type_hint: 'access_token',
          }),
        }) as any

        if (introspectResponse.active && introspectResponse.sub) {
          // Get user info from Hydra userinfo endpoint
          const userinfoResponse = await $fetch(`${config.hydraPublicUrl}/userinfo`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }) as any

          user = {
            id: introspectResponse.sub || userinfoResponse.sub,
            email: userinfoResponse.email || '',
            emailVerified: userinfoResponse.email_verified || false,
            firstName: userinfoResponse.given_name || userinfoResponse.name?.first || '',
            lastName: userinfoResponse.family_name || userinfoResponse.name?.last || '',
            avatar: userinfoResponse.picture || null,
            roles: [],
          }
        }
      } catch (hydraError: any) {
        // If Hydra token is invalid, user is not authenticated
        if (import.meta.dev) {
          console.error('[auth/me.get.ts] Hydra error:', hydraError)
        }
      }
    }

    // If we have user info, return it
    if (user) {
      return {
        success: true,
        user,
        isAuthenticated: true,
      }
    }

    // No valid authentication found
    return {
      success: false,
      user: null,
      isAuthenticated: false,
    }
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/me.get.ts] Error:', error)
    }
    
    return {
      success: false,
      user: null,
      isAuthenticated: false,
    }
  }
})
