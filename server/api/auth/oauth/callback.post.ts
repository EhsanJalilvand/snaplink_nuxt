/**
 * OAuth2 Callback Endpoint
 * This handles the redirect from Hydra after authorization
 * 
 * Flow:
 * 1. Hydra redirects here with authorization code
 * 2. Backend exchanges code for tokens
 * 3. Stores tokens in HttpOnly cookies
 * 4. Returns user info
 */

import { z } from 'zod'

const callbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  code_verifier: z.string().min(43, 'Code verifier must be at least 43 characters'),
  redirect_uri: z.string().url('Invalid redirect URI'),
  state: z.string().min(1, 'State parameter is required'),
})

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const body = await readBody(event)
    
    // Validate request body
    const validation = callbackSchema.safeParse(body)
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request',
        message: validation.error.errors[0]?.message || 'Invalid request',
        data: validation.error.errors,
      })
    }

    const { code, code_verifier, redirect_uri, state } = validation.data

    // Verify state (CSRF protection)
    const storedState = getCookie(event, 'oauth2_state')
    if (!storedState || storedState !== state) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid state parameter',
        message: 'State parameter mismatch. Possible CSRF attack.',
      })
    }

    // Get code verifier from cookie (should match provided one)
    const storedCodeVerifier = getCookie(event, 'oauth2_code_verifier')
    if (!storedCodeVerifier || storedCodeVerifier !== code_verifier) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid code verifier',
        message: 'Code verifier mismatch.',
      })
    }

    // Exchange authorization code for tokens
    const tokenResponse = await $fetch(`${config.hydraPublicUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id: config.public.oauth2ClientId,
        code_verifier: code_verifier,
      }),
    }) as any

    if (!tokenResponse?.access_token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to exchange code for tokens',
        message: 'No access token received from Hydra',
      })
    }

    // Get user info from Hydra
    const userInfoResponse = await $fetch(`${config.hydraPublicUrl}/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    }) as any

    // Store tokens in HttpOnly cookies
    const isDev = import.meta.dev
    const isSecure = !isDev
    
    // Access token (1 hour)
    setCookie(event, 'hydra_access_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: tokenResponse.expires_in || 60 * 60, // 1 hour
    })

    // Refresh token (30 days)
    if (tokenResponse.refresh_token) {
      setCookie(event, 'hydra_refresh_token', tokenResponse.refresh_token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
    }

    // Clear OAuth2 cookies
    deleteCookie(event, 'oauth2_code_verifier', { path: '/' })
    deleteCookie(event, 'oauth2_state', { path: '/' })
    
    // Get returnTo
    const returnTo = getCookie(event, 'oauth2_return_to') || '/dashboard'
    deleteCookie(event, 'oauth2_return_to', { path: '/' })

    // Build user object
    const user = {
      id: userInfoResponse.sub || '',
      email: userInfoResponse.email || '',
      emailVerified: userInfoResponse.email_verified || false,
      firstName: userInfoResponse.given_name || userInfoResponse.name?.first || '',
      lastName: userInfoResponse.family_name || userInfoResponse.name?.last || '',
      avatar: userInfoResponse.picture || null,
      roles: [],
    }

    return {
      success: true,
      user,
      returnTo,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_in: tokenResponse.expires_in,
    }
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/oauth/callback.post.ts] Error:', error)
    }

    // Clear OAuth2 cookies on error
    deleteCookie(event, 'oauth2_code_verifier', { path: '/' })
    deleteCookie(event, 'oauth2_state', { path: '/' })
    deleteCookie(event, 'oauth2_return_to', { path: '/' })

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to handle OAuth2 callback',
      message: error.message || 'Failed to handle OAuth2 callback',
    })
  }
})

