export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Get access token from cookie
  const accessToken = getCookie(event, 'kc_access')

  if (!accessToken) {
    return {
      success: false,
      enabled: false,
      configured: false,
    }
  }

  try {
    // Parse token to get user ID
    const tokenParts = accessToken.split('.')
    if (tokenParts.length !== 3) {
      return {
        success: false,
        enabled: false,
        configured: false,
      }
    }

    const payload = Buffer.from(tokenParts[1], 'base64').toString('utf-8')
    const tokenParsed = JSON.parse(payload)
    const userId = tokenParsed.sub

    if (!userId) {
      return {
        success: false,
        enabled: false,
        configured: false,
      }
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
    }).catch(() => null) as any

    if (!adminTokenResponse) {
      return {
        success: false,
        enabled: false,
        configured: false,
      }
    }

    // Get user credentials to check if TOTP is configured
    const getCredentialsUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}/credentials`

    const credentials = await $fetch(getCredentialsUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
    }).catch(() => []) as any[]

    // Check if user has TOTP credentials configured
    const hasTotp = credentials.some((cred: any) => cred.type === 'otp' || cred.type === 'otp-hmac-sha1')

    return {
      success: true,
      enabled: hasTotp,
      configured: hasTotp,
    }
  }
  catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/two-factor/status.get.ts] Error:', error.statusCode || error.status)
    }

    return {
      success: false,
      enabled: false,
      configured: false,
    }
  }
})

