import { z } from 'zod'

const verifyEmailSchema = z.object({
  code: z.string().min(6, 'Verification code must be 6 digits').max(6, 'Verification code must be 6 digits'),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Validate input
  const validation = verifyEmailSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { code } = validation.data

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
    // 1. Verify the code against what was sent to the user
    // 2. Find the user by the code or session
    // 3. Update the user's email verification status

    // For demo purposes, we'll simulate verification
    // In production, you should implement proper code verification logic
    
    // Simulate finding user by verification code
    // This would typically involve checking a database or cache
    const mockUserId = 'user-123' // This would come from your verification code lookup

    // Update user email verification status
    const updateUserUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${mockUserId}`
    
    await $fetch(updateUserUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      body: {
        emailVerified: true,
      },
    })

    return {
      success: true,
      message: 'Email verified successfully',
    }
  } catch (error: any) {
    console.error('Email verification error:', error)
    
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid verification code',
    })
  }
})
