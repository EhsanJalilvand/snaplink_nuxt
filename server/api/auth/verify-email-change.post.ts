import { z } from 'zod'

const verifyEmailChangeSchema = z.object({
  code: z.string()
    .min(6, 'Code must be 6 digits')
    .max(6, 'Code must be 6 digits'),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Validate input
  const validation = verifyEmailChangeSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { code } = validation.data

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

    // Get admin token for user operations
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
        console.error('[auth/verify-email-change.post.ts] Failed to get admin token:', error)
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
        console.error('[auth/verify-email-change.post.ts] Failed to get user:', error)
      }
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }) as any

    // Get stored verification code from cookie
    const storedCode = getCookie(event, 'email_change_code')
    const storedNewEmail = getCookie(event, 'email_change_new_email')

    if (!storedCode || !storedNewEmail) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Verification session expired. Please request a new code.',
      })
    }

    if (storedCode !== code) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid verification code',
      })
    }

    // Check if new email is already taken
    const searchUsersUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users`

    const existingUsers = await $fetch(searchUsersUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      query: {
        email: storedNewEmail.toLowerCase().trim(),
        exact: true,
      },
    }).catch(() => []) as any[]

    if (existingUsers && existingUsers.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email is already registered',
      })
    }

    // Update user email
    const updateUserUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}`

    await $fetch(updateUserUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      body: {
        ...currentUser,
        email: storedNewEmail,
        emailVerified: true, // Mark as verified after successful verification
      },
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/verify-email-change.post.ts] Failed to update user:', error)
      }

      if (error.statusCode === 409 || error.status === 409) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Email is already registered',
        })
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to verify email',
      })
    })

    // Clear verification cookies after successful verification
    deleteCookie(event, 'email_change_code')
    deleteCookie(event, 'email_change_new_email')

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/verify-email-change.post.ts] Email verified successfully')
    }

    return {
      success: true,
      message: 'Email verified successfully',
    }
  }
  catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/verify-email-change.post.ts] Error:', error.statusCode || error.status)
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to verify email',
    })
  }
})
