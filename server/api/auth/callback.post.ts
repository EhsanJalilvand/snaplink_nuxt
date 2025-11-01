export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // از Keycloak token هایی که برگشته
    const { access_token, refresh_token } = body

    if (!access_token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Access token is required',
      })
    }

    const config = useRuntimeConfig()
    const isDev = process.env.NODE_ENV === 'development'
    const isSecure = !isDev && process.env.NODE_ENV === 'production'

    // کوکی access token ست کن
    setCookie(event, 'kc_access', access_token, {
      httpOnly: true,
      secure: isSecure, // در production true، در development false
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    })

    // کوکی refresh token ست کن
    if (refresh_token) {
      setCookie(event, 'kc_refresh', refresh_token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 14, // 14 days
      })
    }

    console.log('[auth/callback.post.ts] Tokens saved to cookies')

    return { 
      success: true,
      ok: true 
    }
  } catch (error: any) {
    console.error('[auth/callback.post.ts] Error:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to save tokens',
    })
  }
})

