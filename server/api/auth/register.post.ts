import { z } from 'zod'

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Validate input
  const validation = registerSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { username, email, password, firstName, lastName } = validation.data

  try {
    // Get admin token for user creation
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

    // Create user in Keycloak
    const createUserUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users`
    
    const userData = {
      username,
      email,
      emailVerified: false,
      enabled: true,
      firstName: firstName || '',
      lastName: lastName || '',
      credentials: [
        {
          type: 'password',
          value: password,
          temporary: false,
        },
      ],
    }

    const createUserResponse = await $fetch(createUserUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      body: userData,
    })

    // Get the created user ID from the Location header
    const locationHeader = createUserResponse.headers?.location
    const userId = locationHeader?.split('/').pop()

    // Send verification email
    if (userId) {
      const sendVerificationUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}/send-verify-email`
      
      await $fetch(sendVerificationUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminTokenResponse.access_token}`,
        },
      })
    }

    return {
      success: true,
      userId,
      message: 'User created successfully. Please check your email for verification.',
    }
  } catch (error: any) {
    console.error('Keycloak registration error:', error)
    
    // Handle specific Keycloak errors
    if (error.status === 409) {
      throw createError({
        statusCode: 409,
        statusMessage: 'User already exists',
      })
    }
    
    if (error.status === 400) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid user data',
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Registration failed',
    })
  }
})
