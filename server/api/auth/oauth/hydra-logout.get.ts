/**
 * Handle Hydra logout_challenge
 * 
 * Flow:
 * 1. User logs out
 * 2. Hydra redirects to this endpoint with logout_challenge
 * 3. This endpoint invalidates Kratos session and accepts logout challenge
 * 4. Redirects back to Hydra
 */

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const query = getQuery(event)
    const logoutChallenge = query.logout_challenge as string

    if (!logoutChallenge) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing logout_challenge parameter',
      })
    }

    // Get logout request info from Hydra
    const logoutRequest = await $fetch<{
      rp_initiated: boolean
      sid?: string
    }>(`${config.hydraAdminUrl}/admin/oauth2/auth/requests/logout`, {
      query: {
        logout_challenge: logoutChallenge,
      },
    })

    // Invalidate Kratos session if exists
    const kratosSession = getCookie(event, 'ory_kratos_session')
    if (kratosSession) {
      try {
        // Create logout flow
        await $fetch(`${config.kratosPublicUrl}/self-service/logout/browser`, {
          method: 'GET',
          headers: {
            Cookie: `ory_kratos_session=${kratosSession}`,
          },
        })
      } catch (kratosError) {
        // Ignore errors - session might already be invalid
        if (import.meta.dev) {
          console.warn('[oauth/hydra-logout.get.ts] Kratos logout error:', kratosError)
        }
      }

      // Clear Kratos session cookie
      deleteCookie(event, 'ory_kratos_session', {
        path: '/',
        domain: import.meta.dev ? 'localhost' : undefined,
      })
    }

    // Accept logout challenge
    const acceptResponse = await $fetch<{
      redirect_to: string
    }>(`${config.hydraAdminUrl}/admin/oauth2/auth/requests/logout/accept?logout_challenge=${encodeURIComponent(logoutChallenge)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Clear Hydra tokens
    deleteCookie(event, 'hydra_access_token', {
      path: '/',
      domain: import.meta.dev ? 'localhost' : undefined,
    })
    deleteCookie(event, 'hydra_refresh_token', {
      path: '/',
      domain: import.meta.dev ? 'localhost' : undefined,
    })

    // Redirect to post-logout URL
    if (acceptResponse?.redirect_to) {
      return sendRedirect(event, acceptResponse.redirect_to)
    }

    // Fallback to home
    return sendRedirect(event, '/')
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[oauth/hydra-logout.get.ts] Error:', error)
    }

    // Even on error, redirect to home
    return sendRedirect(event, '/')
  }
})

