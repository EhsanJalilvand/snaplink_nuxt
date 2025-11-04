/**
 * Get user info from access token
 */

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Get access token from Authorization header
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Missing or invalid authorization header',
        message: 'Bearer token required',
      })
    }

    const accessToken = authHeader.substring(7)

    // Get user info from Hydra
    const userInfoResponse = await $fetch(`${config.hydraPublicUrl}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }) as any

    // Build user object
    const user = {
      id: userInfoResponse.sub || '',
      email: userInfoResponse.email || '',
      emailVerified: userInfoResponse.email_verified || false,
      firstName: userInfoResponse.given_name || userInfoResponse.name?.first || '',
      lastName: userInfoResponse.family_name || userInfoResponse.name?.last || '',
      avatar: userInfoResponse.picture || null,
      roles: [],
    }

    return {
      success: true,
      user,
    }
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/oauth/me.get.ts] Error:', error)
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get user info',
      message: error.message || 'Failed to get user info',
    })
  }
})

