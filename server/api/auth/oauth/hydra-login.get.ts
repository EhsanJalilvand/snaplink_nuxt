/**
 * Handle Hydra login_challenge after Kratos login
 * 
 * Flow:
 * 1. User logs in with Kratos (session created)
 * 2. User redirected to Hydra OAuth2 flow
 * 3. Hydra redirects to this endpoint with login_challenge
 * 4. This endpoint checks Kratos session
 * 5. If session exists, accepts the challenge and redirects back to Hydra
 * 6. Hydra issues tokens
 */

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const query = getQuery(event)
    const loginChallenge = query.login_challenge as string

    if (!loginChallenge) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing login_challenge parameter',
      })
    }

    // Get Kratos session cookie from request
    // Important: cookies must be forwarded from browser
    const requestCookies = getHeader(event, 'cookie') || ''
    
    if (import.meta.dev) {
      console.log('[oauth/hydra-login.get.ts] Request cookies:', requestCookies.substring(0, 100))
    }

    // Extract Kratos session cookie from request cookies
    const kratosSessionMatch = requestCookies.match(/ory_kratos_session=([^;]+)/)
    const kratosSession = kratosSessionMatch ? kratosSessionMatch[1] : null

    if (!kratosSession) {
      if (import.meta.dev) {
        console.log('[oauth/hydra-login.get.ts] No Kratos session found, redirecting to login')
      }
      // No session - redirect to Kratos login with challenge
      const loginUrl = `${config.kratosPublicUrl}/self-service/login/browser?return_to=${encodeURIComponent(event.node.req.url || '')}`
      return sendRedirect(event, loginUrl)
    }

    // Session exists - check if it's valid
    try {
      if (import.meta.dev) {
        console.log('[oauth/hydra-login.get.ts] Checking Kratos session validity')
      }
      
      const sessionResponse = await $fetch<{
        id?: string
        identity?: any
      }>(`${config.kratosPublicUrl}/sessions/whoami`, {
        headers: {
          Cookie: requestCookies, // Forward all cookies
        },
      })

      if (!sessionResponse?.id || !sessionResponse?.identity) {
        if (import.meta.dev) {
          console.log('[oauth/hydra-login.get.ts] Invalid session, redirecting to Kratos UI login with challenge')
          console.log('[oauth/hydra-login.get.ts] Session response:', JSON.stringify(sessionResponse, null, 2))
        }
        // Invalid session - redirect to Kratos UI login with challenge
        // Kratos UI will handle the login_challenge from return_to
        const loginUrl = `${config.kratosPublicUrl}/self-service/login/browser?return_to=${encodeURIComponent(event.node.req.url || '')}`
        return sendRedirect(event, loginUrl)
      }

      if (import.meta.dev) {
        console.log('[oauth/hydra-login.get.ts] Valid session found, accepting login challenge:', sessionResponse.identity.id)
      }

      // Valid session - accept the login challenge via Hydra Admin API
      const acceptResponse = await $fetch<{
        redirect_to: string
      }>(`${config.hydraAdminUrl}/admin/oauth2/auth/requests/login/accept?login_challenge=${encodeURIComponent(loginChallenge)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          subject: sessionResponse.identity.id,
          remember: true,
          remember_for: 3600,
          acr: 'urn:mace:incommon:iap:silver',
          context: {
            email: sessionResponse.identity.traits?.email || sessionResponse.identity.traits?.email_address,
            email_verified: sessionResponse.identity.traits?.email_verified || sessionResponse.identity.traits?.email_address_verified || false,
          },
        },
      })

      if (import.meta.dev) {
        console.log('[oauth/hydra-login.get.ts] Login challenge accepted, redirecting to:', acceptResponse?.redirect_to)
      }

      // Redirect to Hydra consent/authorization endpoint
      if (acceptResponse?.redirect_to) {
        return sendRedirect(event, acceptResponse.redirect_to)
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to accept login challenge',
      })
    } catch (sessionError: any) {
      if (import.meta.dev) {
        console.error('[oauth/hydra-login.get.ts] Error checking session:', sessionError)
      }

      // Session check failed - redirect to login
      const loginUrl = `${config.kratosPublicUrl}/self-service/login/browser?return_to=${encodeURIComponent(event.node.req.url || '')}`
      return sendRedirect(event, loginUrl)
    }
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[oauth/hydra-login.get.ts] Error:', error)
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to handle login challenge',
      message: error.message || 'Failed to handle login challenge',
    })
  }
})

