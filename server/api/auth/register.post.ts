import { z } from 'zod'
import { checkRateLimit, getClientIP } from '../../utils/rateLimit.js'
import { randomBytes, createHash } from 'crypto'

// Sanitize input (XSS prevention)
function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '')
}

// Generate random string for PKCE
function generateRandomString(length: number): string {
  return randomBytes(length).toString('base64url').slice(0, length)
}

// Generate SHA256 hash for PKCE
function sha256(plain: string): string {
  return createHash('sha256').update(plain).digest('base64url')
}

// Password strength validation - simplified: 6 chars with letters and numbers
function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' }
  }
  // Must contain at least one letter and one number
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' }
  }
  return { valid: true }
}

const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username is too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .transform((val) => sanitizeString(val)),
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .transform((val) => sanitizeString(val).toLowerCase()),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(500, 'Password is too long'),
  confirmPassword: z.string(),
  firstName: z.string()
    .max(100, 'First name is too long')
    .optional()
    .transform((val) => val ? sanitizeString(val) : undefined),
  lastName: z.string()
    .max(100, 'Last name is too long')
    .optional()
    .transform((val) => val ? sanitizeString(val) : undefined),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).superRefine((data, ctx) => {
  // Password match validation
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })
  }
  
  // Password strength validation
  const strengthCheck = validatePasswordStrength(data.password)
  if (!strengthCheck.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: strengthCheck.error || 'Password does not meet requirements',
      path: ['password'],
    })
  }
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  // Get client IP for rate limiting
  const clientIP = getClientIP(event)
  
  // Rate limiting: max 3 registrations per hour per IP
  const rateLimit = checkRateLimit({
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    identifier: `register:${clientIP}`,
  })
  
  if (!rateLimit.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many registration attempts. Please try again later.',
      data: {
        resetTime: rateLimit.resetTime,
      },
    })
  }

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
        // Hardcoded client secret (can be overridden by env)
        client_secret: config.keycloakClientSecret || '0fA6K2dgvnr2ZZlt6mW0GcPad7ThGqvp',
      }),
    }).catch((error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/register.post.ts] Failed to get admin token:', {
          statusCode: error.statusCode || error.status,
          error: error.data?.error,
          errorDescription: error.data?.error_description,
        })
      }
      
      // Check if it's a client credentials error
      if (error.statusCode === 401 || error.status === 401) {
        const errorType = error.data?.error
        const errorDesc = error.data?.error_description || ''
        
        // If service account is not enabled, return redirect to Keycloak registration
        if (errorType === 'unauthorized_client' && (errorDesc.includes('service account') || errorDesc.includes('not enabled'))) {
          // Service Accounts not enabled - redirect to Keycloak registration page
          const keycloakUrl = config.public.keycloakUrl || config.keycloakUrl || 'http://localhost:8080'
          const keycloakRealm = config.public.keycloakRealm || config.keycloakRealm || 'master'
          const clientId = config.public.keycloakClientId || config.keycloakClientId || 'my-client'
          
          // Generate PKCE parameters for registration
          const codeVerifier = generateRandomString(43)
          const codeChallenge = sha256(codeVerifier)
          
          const registrationUrl = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/registrations?client_id=${clientId}&redirect_uri=${encodeURIComponent(config.public.keycloakRedirectUri || 'http://localhost:3000/auth/callback')}&response_type=code&scope=openid profile email&code_challenge=${codeChallenge}&code_challenge_method=S256`
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[auth/register.post.ts] Service Account not enabled, redirecting to:', registrationUrl)
          }
          
          throw createError({
            statusCode: 400,
            statusMessage: 'Service Account not enabled',
            message: 'Service Accounts must be enabled for API registration. Redirecting to Keycloak registration...',
            data: {
              error: 'service_account_required',
              redirectToKeycloak: true,
              registrationUrl,
              help: 'To enable Service Accounts: Keycloak Admin Console → Clients → my-client → Settings → Enable "Service accounts enabled" (or "Client authentication" ON)',
            },
          })
        }
        
        throw createError({
          statusCode: 500,
          statusMessage: 'Authentication service configuration error',
          message: 'Keycloak Admin API authentication failed. Please check KEYCLOAK_CLIENT_SECRET and enable Service Accounts.',
          data: {
            help: 'To fix: 1. Keycloak Admin Console → Clients → your-client → Settings → Enable "Service accounts enabled", 2. Credentials tab → Copy Client Secret, 3. Set KEYCLOAK_CLIENT_SECRET in .env file',
          },
        })
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Registration service temporarily unavailable',
      })
    }) as any

    // Check if user already exists (by email)
    const searchUsersUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users`
    
    const existingUsers = await $fetch(searchUsersUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      query: {
        email,
        exact: true,
      },
    }).catch(() => []) as any[]

    if (existingUsers && existingUsers.length > 0) {
      // Don't reveal that email exists (security best practice)
      return {
        success: true,
        message: 'If this email is not registered, you will receive a verification email.',
      }
    }

    // Check if username already exists
    const usernameUsers = await $fetch(searchUsersUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      query: {
        username,
        exact: true,
      },
    }).catch(() => []) as any[]

    if (usernameUsers && usernameUsers.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username is already taken',
      })
    }

    // Create user in Keycloak
    const createUserUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users`
    
    const userData: any = {
      username,
      email,
      emailVerified: false, // User must verify email
      enabled: true,
      firstName: firstName || username,
      lastName: lastName || '',
      credentials: [{
        type: 'password',
        value: password,
        temporary: false,
      }],
    }

    const createResponse = await $fetch(createUserUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      body: userData,
    }).catch((error: any) => {
      console.error('[auth/register.post.ts] Failed to create user:', error.statusCode || error.status)
      
      // Handle specific Keycloak errors
      if (error.statusCode === 409 || error.status === 409) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Username or email is already registered',
        })
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Registration failed. Please try again later.',
      })
    })

    // Get the created user to send verification email
    const createdUsers = await $fetch(searchUsersUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminTokenResponse.access_token}`,
      },
      query: {
        email,
        exact: true,
      },
    }) as any[]

    if (createdUsers && createdUsers.length > 0) {
      const userId = createdUsers[0].id
      
      // Send verification email via Keycloak
      const sendVerificationUrl = `${config.keycloakUrl}/admin/realms/${config.keycloakRealm}/users/${userId}/execute-actions-email`
      
      await $fetch(sendVerificationUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenResponse.access_token}`,
        },
        body: ['VERIFY_EMAIL'],
      }).catch((error: any) => {
        // Log but don't fail registration if email sending fails
        if (process.env.NODE_ENV === 'development') {
          console.error('[auth/register.post.ts] Failed to send verification email:', error.statusCode || error.status)
        }
      })
    }

    // Don't log sensitive information
    if (process.env.NODE_ENV === 'development') {
      console.log('[auth/register.post.ts] User registered successfully')
    }

    return {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/register.post.ts] Registration error:', error.statusCode || error.status)
    }
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Registration failed. Please try again later.',
    })
  }
})