import { z } from 'zod'

const verify2FASchema = z.object({
  code: z.string().min(1, 'Authentication code is required'),
  method: z.enum(['email', 'sms', 'app']),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate input
  const validation = verify2FASchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { code, method } = validation.data

  try {
    // Test data for development
    if (code === '1234') {
      return {
        success: true,
        message: 'Two-factor authentication successful',
      }
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid authentication code',
      })
    }
  } catch (error: any) {
    console.error('2FA verification error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Two-factor authentication failed',
    })
  }
})