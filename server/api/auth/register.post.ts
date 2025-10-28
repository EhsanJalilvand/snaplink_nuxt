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
    // Test data for development
    if (username === 'admin' && email === 'admin@admin.com') {
      // Simulate successful registration
      return {
        success: true,
        userId: 'test-user-id',
        message: 'User created successfully. Please check your email for verification.',
      }
    } else {
      // Check if user already exists (simulate)
      if (username === 'admin' || email === 'admin@admin.com') {
        throw createError({
          statusCode: 409,
          statusMessage: 'User already exists',
        })
      }
      
      // For other users, simulate successful registration
      return {
        success: true,
        userId: 'new-user-id',
        message: 'User created successfully. Please check your email for verification.',
      }
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