import { Configuration, FrontendApi, IdentityApi } from '@ory/client'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const { identityId, email, password } = body

  if (!identityId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identity ID is required',
    })
  }

  try {
    // Instead of using Admin API (which doesn't support session creation),
    // we'll use browser login flow to create a session
    // This requires the user's email and password
    
    if (!email || !password) {
      // If password is not provided, we can't create a session
      // Return error so user can login manually
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required to create a session. Please login manually.',
      })
    }

    const kratosPublicUrl = config.kratosPublicUrl || 'http://localhost:4433'
    const kratosConfig = new Configuration({
      basePath: kratosPublicUrl,
    })
    const frontendApi = new FrontendApi(kratosConfig)

    // Get all cookies from request to forward to Kratos
    const requestCookies = getHeader(event, 'cookie') || ''

    // Create a browser login flow
    const { data: loginFlow } = await frontendApi.createBrowserLoginFlow({
      returnTo: `${config.public.siteUrl}/dashboard`,
    }, {
      headers: requestCookies ? { Cookie: requestCookies } : undefined,
    })

    if (!loginFlow?.id) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create login flow',
      })
    }

    // Get CSRF token from flow
    const csrfToken = loginFlow.ui?.nodes?.find(
      (node: any) => node.attributes?.name === 'csrf_token'
    )?.attributes?.value as string

    if (!csrfToken) {
      throw createError({
        statusCode: 500,
        statusMessage: 'CSRF token not found in login flow',
      })
    }

    // Update login flow with credentials
    // This will create a session and set the cookie
    // We need to use $fetch to get the Set-Cookie header from Kratos
    const loginResponse = await $fetch(`${kratosPublicUrl}/self-service/login?flow=${loginFlow.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        Cookie: requestCookies || '',
      },
      body: {
        method: 'password',
        password: password,
        identifier: email,
        csrf_token: csrfToken,
      },
    })

    // Kratos sets the session cookie in Set-Cookie header
    // We need to forward this cookie to the client
    // But $fetch doesn't expose response headers, so we need to use a different approach
    
    // Instead, let's make a direct request to Kratos and capture the Set-Cookie header
    const kratosResponse = await fetch(`${kratosPublicUrl}/self-service/login?flow=${loginFlow.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        Cookie: requestCookies || '',
      },
      body: JSON.stringify({
        method: 'password',
        password: password,
        identifier: email,
        csrf_token: csrfToken,
      }),
    })

    const loginData = await kratosResponse.json()

    if (!loginData?.session) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Failed to create session',
      })
    }

    // Get Set-Cookie header from Kratos response
    const setCookieHeader = kratosResponse.headers.get('Set-Cookie')
    
    if (setCookieHeader) {
      // Extract session token from Set-Cookie header
      const sessionTokenMatch = setCookieHeader.match(/ory_kratos_session=([^;]+)/)
      if (sessionTokenMatch) {
        const sessionToken = sessionTokenMatch[1]
        
        // Set the session cookie in our response
        setCookie(event, 'ory_kratos_session', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 3600,
          path: '/',
        })
        
        if (import.meta.dev) {
          console.log('[auth/create-session.post.ts] Session cookie set from Kratos response')
        }
      }
    }
    
    if (import.meta.dev) {
      console.log('[auth/create-session.post.ts] Login successful, session created')
      console.log('[auth/create-session.post.ts] Session:', loginData.session.id)
    }

    return {
      success: true,
      sessionId: loginData.session.id,
      session: true,
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

