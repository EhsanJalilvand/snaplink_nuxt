export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Get access token from cookie
  const accessToken = getCookie(event, 'kc_access')

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  try {
    // Parse token to get user ID
    const tokenParts = accessToken.split('.')
    if (tokenParts.length !== 3) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token',
      })
    }

    const payload = Buffer.from(tokenParts[1], 'base64').toString('utf-8')
    const tokenParsed = JSON.parse(payload)
    const userId = tokenParsed.sub

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token',
      })
    }

    // Get admin token
    const adminTokenUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/token`

    const adminTokenResponse = await $fetch(adminTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.keycloakClientId || 'my-client',
        client_secret: config.keycloakClientSecret || '0fA6K2dgvnr2ZZlt6mW0GcPad7ThGqvp',
      }),
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/two-factor/setup.post.ts] Failed to get admin token:', error)
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Service temporarily unavailable',
      })
    }) as any

    // Get current user data
    const getUserUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}`

    const currentUser = await $fetch(getUserUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/two-factor/setup.post.ts] Failed to get user:', error)
      }
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }) as any

    // Send email to configure TOTP using Keycloak's built-in action
    const sendActionEmailUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}/execute-actions-email`

    try {
      await $fetch(sendActionEmailUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenResponse.access_token}`,
        },
        body: ['CONFIGURE_TOTP'],
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('[auth/two-factor/setup.post.ts] TOTP setup email sent successfully')
      }

      return {
        success: true,
        message: '2FA setup instructions sent to your email',
      }
    }
    catch (actionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/two-factor/setup.post.ts] Failed to send action email:', actionError.statusCode || actionError.status)
      }

      // If email sending fails, return error
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to send setup email. Please try again later.',
      })
    }
  }
  catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/two-factor/setup.post.ts] Error:', error.statusCode || error.status)
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to setup 2FA',
    })
  }
})

