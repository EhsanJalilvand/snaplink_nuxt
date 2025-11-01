import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'

// Password strength validation
function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' }
  }
  return { valid: true }
}

const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Reset token is required')
    .max(500, 'Invalid token'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(500, 'Password is too long'),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  // Password match validation
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })
  }
  
  // Password strength validation
  const strengthCheck = validatePasswordStrength(data.newPassword)
  if (!strengthCheck.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: strengthCheck.error || 'Password does not meet requirements',
      path: ['newPassword'],
    })
  }
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Get client IP for rate limiting
  const clientIP = getClientIP(event)
  
  // Rate limiting: max 3 password reset attempts per hour per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    identifier: `reset_password:${clientIP}`,
  })
  
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many password reset attempts. Please try again later.',
      data: {
        resetTime: rateLimit.resetTime,
      },
    })
  }

  // Validate input
  const validation = resetPasswordSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validation.error.errors,
    })
  }

  const { token, newPassword } = validation.data

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
        client_id: config.keycloakClientId || 'my-client',
        client_secret: config.keycloakClientSecret || '0fA6K2dgvnr2ZZlt6mW0GcPad7ThGqvp',
      }),
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/reset-password.post.ts] Failed to get admin token:', error)
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Service temporarily unavailable',
      })
    }) as any

    // In Keycloak, password reset tokens are typically handled via email links
    // The token should contain user ID or be validated via Keycloak's password reset flow
    // For now, we'll extract user info from the token if it's a Keycloak action token
    // In production, implement proper token validation and user lookup
    
    // TODO: Implement proper token validation
    // Keycloak sends action tokens via email that can be validated
    // For now, if token format suggests it's invalid, reject it
    if (!token || token.length < 20) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or expired reset token',
      })
    }

    // Try to validate token and extract user ID
    // This is a simplified version - in production, use Keycloak's token introspection
    // or validate the action token properly
    
    // For now, we'll need the user to provide email along with token for security
    // OR implement proper Keycloak action token validation
    
    // NOTE: Keycloak's password reset flow typically uses email links that redirect
    // to a Keycloak page. For API-based reset, we need to:
    // 1. Validate the token (if it's a Keycloak action token)
    // 2. Extract user ID from token
    // 3. Update password
    
    // For now, return error indicating token validation is needed
    // In production, implement proper token validation
    throw createError({
      statusCode: 400,
      statusMessage: 'Token validation not yet implemented. Please use Keycloak password reset email link.',
    })

    // This would be the actual implementation once token validation is in place:
    /*
    const userId = extractUserIdFromToken(token) // Implement this
    
    // Update user password
    const updatePasswordUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}/reset-password`
    
    await $fetch(updatePasswordUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      body: {
        type: 'password',
        value: newPassword,
        temporary: false,
      },
    })

    return {
      success: true,
      message: 'Password reset successfully',
    }
    */
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/reset-password.post.ts] Error:', error.statusCode || error.status)
    }
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or expired reset token',
    })
  }
})

