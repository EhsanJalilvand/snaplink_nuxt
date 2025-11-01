import { z } from 'zod'

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export default defineEventHandler(async (event) => {
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
    // Custom registration should integrate with Keycloak Admin API
    // For now, this endpoint should redirect to Keycloak registration
    const config = useRuntimeConfig()
    
    // Return Keycloak registration URL
    const keycloakUrl = config.public.keycloakUrl || config.keycloakUrl || 'http://localhost:8080'
    const keycloakRealm = config.public.keycloakRealm || config.keycloakRealm || 'master'
    
    return {
      success: false,
      redirectToKeycloak: true,
      registrationUrl: `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/registrations`,
      message: 'Please use Keycloak registration',
    }
  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Registration failed',
    })
  }
})