export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { identityId } = body

  if (!identityId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identity ID is required',
    })
  }

  try {
    // Use Admin API directly to create a session for the identity
    const kratosAdminUrl = config.kratosAdminUrl || 'http://localhost:4434'
    
    // Create a session using Kratos Admin API
    const sessionResponse = await $fetch(`${kratosAdminUrl}/admin/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        identity_id: identityId,
        expires_in: '3600s', // 1 hour
        authenticated_at: new Date().toISOString(),
        authentication_methods: [
          {
            method: 'password',
            aal: 'aal1',
          },
        ],
      },
    })

    if (import.meta.dev) {
      console.log('[auth/create-session.post.ts] Session created:', sessionResponse.id)
    }

    // Set session cookie in response
    // Kratos returns session token in the response
    if (sessionResponse.token) {
      setCookie(event, 'ory_kratos_session', sessionResponse.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600,
        path: '/',
      })
    }

    return {
      success: true,
      sessionId: sessionResponse.id,
    }
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/create-session.post.ts] Failed to create session:', error.response?.data || error.data || error.message)
      console.error('[auth/create-session.post.ts] Error status:', error.statusCode || error.status)
    }

    throw createError({
      statusCode: error.statusCode || error.status || 500,
      statusMessage: 'Failed to create session',
      message: error.message || 'Failed to create session',
    })
  }
})

