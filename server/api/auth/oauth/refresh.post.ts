/**
 * OAuth2 Token Refresh Endpoint
 * This exchanges a refresh token for a new access token
 */

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Get refresh token from cookie
    const refreshToken = getCookie(event, 'hydra_refresh_token')
    
    if (!refreshToken) {
      // No refresh token available - this is expected for Kratos-only sessions
      // Return success: false instead of throwing 401 error
      // This allows Kratos sessions to work without OAuth2 tokens
      if (import.meta.dev) {
        console.log('[auth/oauth/refresh.post.ts] Refresh token check: Not found')
        console.log('[auth/oauth/refresh.post.ts] No refresh token found - this is expected for Kratos-only sessions')
      }
      return {
        success: false,
        message: 'No refresh token available - this is expected for Kratos-only sessions',
      }
    }

    // Exchange refresh token for new access token
    const tokenResponse = await $fetch(`${config.hydraPublicUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.public.oauth2ClientId,
      }),
    }) as any

    if (!tokenResponse?.access_token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to refresh token',
        message: 'No access token received from Hydra',
      })
    }

    // Store new access token in HttpOnly cookie
    const isDev = import.meta.dev
    const isSecure = !isDev
    
    setCookie(event, 'hydra_access_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: tokenResponse.expires_in || 60 * 60, // 1 hour
    })

    // Update refresh token if provided
    if (tokenResponse.refresh_token) {
      setCookie(event, 'hydra_refresh_token', tokenResponse.refresh_token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
    }

    return {
      success: true,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_in: tokenResponse.expires_in,
    }
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/oauth/refresh.post.ts] Error:', error)
    }

    // If refresh fails, clear tokens
    deleteCookie(event, 'hydra_access_token', { path: '/' })
    deleteCookie(event, 'hydra_refresh_token', { path: '/' })

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to refresh token',
      message: error.message || 'Failed to refresh token',
    })
  }
})

