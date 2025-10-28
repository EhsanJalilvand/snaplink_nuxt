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
    // Test data for development
    if (email === 'admin@admin.com' && password === 'admin') {
      // Simulate successful login
      setCookie(event, 'auth_token', 'fake-jwt-token', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: trustDevice ? 60 * 60 * 24 * 30 : 60 * 60 * 24 // 30 days or 1 day
      })
      
      return {
        success: true,
        user: { 
          id: 1, 
          username: 'admin', 
          email: email,
          firstName: 'Admin',
          lastName: 'User',
          emailVerified: true,
          roles: ['admin', 'user']
        },
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        expiresIn: trustDevice ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
        message: 'Login successful',
      }
    } else {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
      })
    }
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