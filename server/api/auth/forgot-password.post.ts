import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Validate input
  const validation = forgotPasswordSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { email } = validation.data

  try {
    // Get admin token for user operations
    const adminTokenUrl = `${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/token`
    
    const adminTokenResponse = await $fetch(adminTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.keycloakClientId,
        client_secret: config.keycloakClientSecret,
      }),
    })

    // Find user by email
    const searchUsersUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users`
    
    const users = await $fetch(searchUsersUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      query: {
        email,
        exact: true,
      },
    })

    if (!users || users.length === 0) {
      // Don't reveal if user exists or not for security
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      }
    }

    const user = users[0]

    // Send password reset email
    const sendResetUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${user.id}/execute-actions-email`
    
    await $fetch(sendResetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      body: ['UPDATE_PASSWORD'],
    })

    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    }
  } catch (error: any) {
    console.error('Forgot password error:', error)
    
    // Don't reveal internal errors for security
    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    }
  }
})

