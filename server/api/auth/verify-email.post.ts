import { z } from 'zod'

const verifyEmailSchema = z.object({
  code: z.string().min(1, 'Verification code is required'),
})

export default defineEventHandler(async (event) => {
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
    // Test data for development
    if (code === '123456') {
      return {
        success: true,
        message: 'Email verified successfully',
      }
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid verification code',
      })
    }
  } catch (error: any) {
    console.error('Email verification error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Email verification failed',
    })
  }
})