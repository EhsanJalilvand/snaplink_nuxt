import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Validate input
  const validation = resetPasswordSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { token, newPassword } = validation.data

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

    // In a real implementation, you would:
    // 1. Verify the reset token (check if it's valid and not expired)
    // 2. Find the user associated with the token
    // 3. Update the user's password
    // 4. Invalidate the reset token

    // Validate and decode reset token to get user ID
    // TODO: Implement proper token validation and user lookup
    if (!token || token.length < 20) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or expired reset token',
      })
    }

    // Extract user ID from token (in production, use proper JWT decoding)
    // This is a placeholder - implement proper token verification
    const userId = token // Replace with actual token validation logic

    // Update user password
    const updatePasswordUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}/reset-password`
    
    await $fetch(updatePasswordUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      body: {
        type: 'password',
        value: newPassword,
        temporary: false,
      },
    })

    return {
      success: true,
      message: 'Password reset successfully',
    }
  } catch (error: any) {
    console.error('Password reset error:', error)
    
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or expired reset token',
    })
  }
})

