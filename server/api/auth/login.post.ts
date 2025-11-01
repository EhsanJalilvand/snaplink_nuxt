import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
  trustDevice: z.boolean().optional().default(false),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate input
  const validation = loginSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { email, password, trustDevice } = validation.data

  try {
    // Custom auth login endpoint - delegates to Keycloak via frontend
    // This endpoint should not be used directly in production with Keycloak
    // Frontend uses Keycloak login instead
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    })
  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication failed',
    })
  }
})