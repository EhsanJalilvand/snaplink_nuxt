/**
 * Logout Endpoint
 * 
 * This endpoint:
 * 1. Logs out from Kratos (clears Kratos session cookie)
 * 2. Logs out from Hydra (revokes tokens)
 * 3. Clears all auth cookies
 */

import { Configuration, FrontendApi } from '@ory/client'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Get Kratos session cookie
    const kratosSession = getCookie(event, 'ory_kratos_session')
    
    // Logout from Kratos if session exists
    if (kratosSession) {
      try {
        const kratosConfig = new Configuration({
          basePath: config.kratosPublicUrl,
          baseOptions: {
            withCredentials: true,
          },
        })
        const frontendApi = new FrontendApi(kratosConfig)
        
        // Create logout flow - this will get the logout token
        // We need to pass the session cookie to get the logout token
        const logoutFlow = await frontendApi.createBrowserLogoutFlow(undefined, {
          headers: {
            Cookie: `ory_kratos_session=${kratosSession}`,
          },
        })
        
        // Perform logout using logout token
        // Note: updateLogoutFlow doesn't require CSRF token, only logout token
        if (logoutFlow.data?.logout_token) {
          await frontendApi.updateLogoutFlow({
            token: logoutFlow.data.logout_token,
          }, {
            headers: {
              Cookie: `ory_kratos_session=${kratosSession}`,
            },
          })
        }
      } catch (kratosError: any) {
        // If Kratos logout fails, continue with clearing cookies
        if (import.meta.dev) {
          console.error('[auth/logout.post.ts] Kratos logout error:', kratosError)
        }
      }
    }

    // Get Hydra tokens
    const accessToken = getCookie(event, 'hydra_access_token')
    const refreshToken = getCookie(event, 'hydra_refresh_token')
    
    // Revoke tokens in Hydra if they exist
    if (accessToken || refreshToken) {
      try {
        const hydraAdminUrl = config.hydraAdminUrl
        
        // Revoke access token
        if (accessToken) {
          await $fetch(`${hydraAdminUrl}/admin/oauth2/auth/sessions/login/revoke`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              token: accessToken,
            }),
          }).catch(() => {
            // Ignore errors - token might already be revoked
          })
        }
        
        // Revoke refresh token
        if (refreshToken) {
          await $fetch(`${hydraAdminUrl}/admin/oauth2/auth/sessions/consent/revoke`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              token: refreshToken,
            }),
          }).catch(() => {
            // Ignore errors - token might already be revoked
          })
        }
      } catch (hydraError: any) {
        // If Hydra revocation fails, continue with clearing cookies
        if (import.meta.dev) {
          console.error('[auth/logout.post.ts] Hydra revocation error:', hydraError)
        }
      }
    }

    // Clear all auth cookies
    const isDev = import.meta.dev
    
    // Kratos session cookie
    deleteCookie(event, 'ory_kratos_session', {
      path: '/',
      domain: isDev ? 'localhost' : undefined,
    })
    
    // Hydra tokens
    deleteCookie(event, 'hydra_access_token', {
      path: '/',
      domain: isDev ? 'localhost' : undefined,
    })
    
    deleteCookie(event, 'hydra_refresh_token', {
      path: '/',
      domain: isDev ? 'localhost' : undefined,
    })
    
    // OAuth2 PKCE cookies
    deleteCookie(event, 'oauth2_code_verifier', {
      path: '/',
      domain: isDev ? 'localhost' : undefined,
    })
    
    deleteCookie(event, 'oauth2_state', {
      path: '/',
      domain: isDev ? 'localhost' : undefined,
    })
    
    deleteCookie(event, 'oauth2_return_to', {
      path: '/',
      domain: isDev ? 'localhost' : undefined,
    })

    return {
      success: true,
      message: 'Logged out successfully',
    }
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/logout.post.ts] Error:', error)
    }

    // Even if logout fails, clear cookies (fail-secure)
    deleteCookie(event, 'ory_kratos_session', { path: '/' })
    deleteCookie(event, 'hydra_access_token', { path: '/' })
    deleteCookie(event, 'hydra_refresh_token', { path: '/' })
    deleteCookie(event, 'oauth2_code_verifier', { path: '/' })
    deleteCookie(event, 'oauth2_state', { path: '/' })
    deleteCookie(event, 'oauth2_return_to', { path: '/' })

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to logout',
      message: error.message || 'Failed to logout',
    })
  }
})
