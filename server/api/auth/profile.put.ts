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
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .transform((val) => sanitizeString(val).toLowerCase()),
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

  const { firstName, lastName, email } = validation.data

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

    // Check if email is already taken by another user
    if (email) {
      try {
        // List all identities to check for email conflicts
        const { data: allIdentities } = await kratosAdmin.listIdentities()
        
        // Check if email exists for another user
        const emailExists = allIdentities?.some((identity: any) => {
          return identity.id !== userId && 
                 identity.traits?.email?.toLowerCase() === email.toLowerCase()
        })

        if (emailExists) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Email is already registered',
          })
        }
      } catch (error: any) {
        if (error.statusCode === 409) {
          throw error
        }
        // Log but continue if listing fails
        if (import.meta.dev) {
          console.error('[auth/profile.put.ts] Failed to check email uniqueness:', error)
        }
      }
    }

    // Check if email is changing
    const isEmailChanging = email && email !== currentIdentity.traits?.email

    // Prepare updated traits
    const updatedTraits = {
      ...currentIdentity.traits,
      email: email || currentIdentity.traits?.email,
      name: {
        first: firstName || currentIdentity.traits?.name?.first || '',
        last: lastName !== undefined ? (lastName || '') : (currentIdentity.traits?.name?.last || ''),
      },
    }

    // If email changed, mark as unverified
    if (isEmailChanging) {
      updatedTraits.email_verified = false
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

    // If email changed, trigger verification flow
    // Note: Kratos will handle email verification automatically if configured
    if (isEmailChanging && import.meta.dev) {
      console.log('[auth/profile.put.ts] Email changed, verification should be triggered by Kratos')
    }

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
