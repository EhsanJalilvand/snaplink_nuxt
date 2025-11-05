import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'
import { Configuration, IdentityApi } from '@ory/client'

// Sanitize input (XSS prevention)
function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '')
}

const profileSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name is too long')
    .transform((val) => sanitizeString(val)),
  lastName: z.string()
    .max(100, 'Last name is too long')
    .optional()
    .transform((val) => val ? sanitizeString(val) : undefined),
  // Email is not allowed to be changed through this endpoint
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Get client IP for rate limiting
  const clientIP = getClientIP(event)
  
  // Rate limiting: max 10 profile updates per 15 minutes per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    identifier: `profile_update:${clientIP}`,
  })
  
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many update attempts. Please try again later.',
      data: {
        resetTime: rateLimit.resetTime,
      },
    })
  }

  // Validate input
  const validation = profileSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { firstName, lastName } = validation.data

  // Get access token from cookie (Hydra token)
  const accessToken = getCookie(event, 'hydra_access_token')
  
  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  try {
    // Get user info from Hydra's /userinfo endpoint
    const hydraUserInfo = await $fetch(`${config.hydraPublicUrl}/userinfo`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).catch((error: any) => {
      if (import.meta.dev) {
        console.error('[auth/profile.put.ts] Failed to get user info from Hydra:', error)
      }
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid access token',
      })
    })

    if (!hydraUserInfo || !hydraUserInfo.sub) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid access token or user info not found',
      })
    }

    const userId = hydraUserInfo.sub as string

    // Get Kratos Identity using Kratos Admin API
    const kratosAdmin = new IdentityApi(new Configuration({
      basePath: config.kratosAdminUrl,
    }))

    // Get current identity
    const { data: currentIdentity } = await kratosAdmin.getIdentity({ id: userId }).catch((error: any) => {
      if (import.meta.dev) {
        console.error('[auth/profile.put.ts] Failed to get identity from Kratos:', error)
      }
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    })

    // Prepare updated traits (only firstName and lastName, email cannot be changed)
    const updatedTraits = {
      ...currentIdentity.traits,
      name: {
        first: firstName || currentIdentity.traits?.name?.first || '',
        last: lastName !== undefined ? (lastName || '') : (currentIdentity.traits?.name?.last || ''),
      },
      // Email is not changed - keep current email
    }

    // Update identity in Kratos
    await kratosAdmin.updateIdentity({
      id: userId,
      updateIdentityBody: {
        schema_id: currentIdentity.schema_id,
        traits: updatedTraits,
      },
    }).catch((error: any) => {
      if (import.meta.dev) {
        console.error('[auth/profile.put.ts] Failed to update identity:', error)
      }
      
      if (error.statusCode === 409 || error.status === 409) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Email is already registered',
        })
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile',
      })
    })

    if (import.meta.dev) {
      console.log('[auth/profile.put.ts] Profile updated successfully')
    }

    return {
      success: true,
      message: 'Profile updated successfully',
    }
  }
  catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/profile.put.ts] Error:', error.statusCode || error.status)
    }
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update profile',
    })
  }
})
