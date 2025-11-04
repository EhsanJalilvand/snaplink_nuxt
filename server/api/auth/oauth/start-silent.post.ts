/**
 * Silent OAuth2 Flow Starter
 * This endpoint starts OAuth2 flow silently after Kratos login
 * Uses Hydra Admin API to create authorization request and handle challenges
 */

import { getHeader } from 'h3'
import { Configuration, FrontendApi } from '@ory/client'

/**
 * Generate PKCE code verifier
 */
function generateCodeVerifier(): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const length = Math.floor(Math.random() * (128 - 43 + 1)) + 43
  let text = ''
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

/**
 * Generate PKCE code challenge (SHA256)
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  
  const base64 = btoa(String.fromCharCode(...hashArray))
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Generate random state
 */
function generateState(): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let text = ''
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Check if Kratos session exists
    const requestCookies = getHeader(event, 'cookie') || ''
    const kratosSessionMatch = requestCookies.match(/ory_kratos_session=([^;]+)/)
    const kratosSession = kratosSessionMatch ? kratosSessionMatch[1] : null

    if (!kratosSession) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No Kratos session found. Please login first.',
      })
    }

    // Verify Kratos session is valid and get identity
    const kratosConfig = new Configuration({
      basePath: config.kratosPublicUrl,
    })
    const frontendApi = new FrontendApi(kratosConfig)

    let sessionResponse: any
    try {
      sessionResponse = await frontendApi.toSession(undefined, {
        headers: {
          Cookie: requestCookies,
        },
      })
    } catch (error: any) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid Kratos session',
      })
    }

    if (!sessionResponse.data?.identity) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No identity found in session',
      })
    }

    const identity = sessionResponse.data.identity
    const identityId = identity.id

    // Generate PKCE pair
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = generateState()

    // Store PKCE data in cookies
    const isDev = import.meta.dev
    const isSecure = !isDev
    
    setCookie(event, 'oauth2_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    })
    
    setCookie(event, 'oauth2_state', state, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    })

    // Create OAuth2 authorization request using Hydra Public API
    // This will create a login challenge and redirect to our login endpoint
    const params = new URLSearchParams({
      client_id: config.public.oauth2ClientId,
      redirect_uri: config.public.oauth2RedirectUri,
      response_type: 'code',
      scope: 'openid profile email offline', // Use 'offline' instead of 'offline_access' per Hydra docs
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })
    
    const authorizationUrl = `${config.hydraPublicUrl}/oauth2/auth?${params.toString()}`

    // Make authorization request to Hydra (will redirect to login endpoint)
    const authResponse = await fetch(authorizationUrl, {
      method: 'GET',
      headers: {
        Cookie: requestCookies,
      },
      redirect: 'manual', // Don't follow redirects automatically
    })

    if (authResponse.status !== 302 && authResponse.status !== 303 && authResponse.status !== 307 && authResponse.status !== 308) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Unexpected response from Hydra authorization endpoint',
      })
    }

    // Follow redirect - Hydra may redirect to login, consent, or directly to callback
    let redirectUrl = authResponse.headers.get('Location')
    if (!redirectUrl) {
      throw createError({
        statusCode: 500,
        statusMessage: 'No redirect URL from Hydra',
      })
    }

    if (import.meta.dev) {
      console.log('[auth/oauth/start-silent.post.ts] Initial Hydra redirect URL:', redirectUrl)
    }

    // Follow redirects until we get authorization code or hit an error
    let maxRedirects = 10
    let authCode: string | null = null

    while (maxRedirects-- > 0 && !authCode) {
      if (import.meta.dev) {
        console.log(`[auth/oauth/start-silent.post.ts] Loop iteration ${10 - maxRedirects}, redirect URL:`, redirectUrl)
      }

      // Check if redirect is directly to callback with authorization code
      if (redirectUrl.includes('code=')) {
        const codeMatch = redirectUrl.match(/code=([^&]+)/)
        if (codeMatch) {
          authCode = codeMatch[1]
          if (import.meta.dev) {
            console.log('[auth/oauth/start-silent.post.ts] Found authorization code in redirect URL')
          }
          break
        }
      }

      // Check if redirect is to login endpoint
      if (redirectUrl.includes('/api/auth/oauth/hydra-login')) {
        const loginChallengeMatch = redirectUrl.match(/login_challenge=([^&]+)/)
        if (loginChallengeMatch) {
          // Decode login challenge from URL (it might be double-encoded)
          // Try decoding multiple times until no more % characters
          let loginChallenge = loginChallengeMatch[1]
          let previousChallenge = ''
          let decodeCount = 0
          
          // Keep decoding until no more % characters or until it stops changing (max 5 times)
          while (loginChallenge !== previousChallenge && loginChallenge.includes('%') && decodeCount < 5) {
            previousChallenge = loginChallenge
            try {
              loginChallenge = decodeURIComponent(loginChallenge)
              decodeCount++
            } catch (e) {
              // If decoding fails, use the previous value
              if (import.meta.dev) {
                console.warn('[auth/oauth/start-silent.post.ts] Failed to decode login challenge:', e)
              }
              break
            }
          }

          if (import.meta.dev) {
            console.log('[auth/oauth/start-silent.post.ts] Accepting login challenge')
            console.log('[auth/oauth/start-silent.post.ts] Original (from URL):', loginChallengeMatch[1].substring(0, 100) + '...')
            console.log('[auth/oauth/start-silent.post.ts] Decoded (after', decodeCount, 'decodes):', loginChallenge.substring(0, 100) + '...')
          }

          // Accept login challenge (session already exists)
          // Re-encode the decoded challenge for the API call
          const loginAcceptResponse = await $fetch(`${config.hydraAdminUrl}/admin/oauth2/auth/requests/login/accept?login_challenge=${encodeURIComponent(loginChallenge)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              subject: identityId,
              remember: true,
              remember_for: 3600,
              acr: 'urn:mace:incommon:iap:silver',
              context: {
                email: identity.traits?.email || identity.traits?.email_address,
                email_verified: identity.traits?.email_verified || false,
              },
            },
          }) as any

          if (loginAcceptResponse?.redirect_to) {
            redirectUrl = loginAcceptResponse.redirect_to
            if (import.meta.dev) {
              console.log('[auth/oauth/start-silent.post.ts] Login accepted, redirecting to:', redirectUrl)
            }
            continue
          }
        }
      }

      // Check if redirect is to consent endpoint
      if (redirectUrl.includes('/api/auth/oauth/hydra-consent')) {
        const consentChallengeMatch = redirectUrl.match(/consent_challenge=([^&]+)/)
        if (consentChallengeMatch) {
          // Decode consent challenge from URL (it might be double-encoded)
          // Try decoding multiple times until no more % characters
          let consentChallenge = consentChallengeMatch[1]
          let previousChallenge = ''
          
          // Keep decoding until no more % characters or until it stops changing
          while (consentChallenge !== previousChallenge && consentChallenge.includes('%')) {
            previousChallenge = consentChallenge
            try {
              consentChallenge = decodeURIComponent(consentChallenge)
            } catch (e) {
              // If decoding fails, use the original
              consentChallenge = consentChallengeMatch[1]
              break
            }
          }

          if (import.meta.dev) {
            console.log('[auth/oauth/start-silent.post.ts] Accepting consent challenge (decoded):', consentChallenge.substring(0, 50) + '...')
            console.log('[auth/oauth/start-silent.post.ts] Original challenge:', consentChallengeMatch[1].substring(0, 50) + '...')
          }

          // Get consent request
          // Don't encode again - use the decoded challenge directly
          const consentRequest = await $fetch(`${config.hydraAdminUrl}/admin/oauth2/auth/requests/consent`, {
            query: {
              consent_challenge: consentChallenge,
            },
          }) as any

          if (!consentRequest?.subject) {
            throw createError({
              statusCode: 500,
              statusMessage: 'Failed to get consent request',
            })
          }

          // Accept consent - grant all requested scopes
          const consentAcceptResponse = await $fetch(`${config.hydraAdminUrl}/admin/oauth2/auth/requests/consent/accept?consent_challenge=${encodeURIComponent(consentChallenge)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              grant_scope: consentRequest.requested_scope || ['openid', 'profile', 'email', 'offline'],
              grant_access_token_audience: consentRequest.client?.client_id ? [consentRequest.client.client_id] : [],
              session: {
                access_token: {
                  email: identity.traits?.email || identity.traits?.email_address,
                  email_verified: identity.traits?.email_verified || false,
                },
                id_token: {
                  email: identity.traits?.email || identity.traits?.email_address,
                  email_verified: identity.traits?.email_verified || false,
                },
              },
              remember: true,
              remember_for: 3600,
            },
          }) as any

          if (consentAcceptResponse?.redirect_to) {
            redirectUrl = consentAcceptResponse.redirect_to
            if (import.meta.dev) {
              console.log('[auth/oauth/start-silent.post.ts] Consent accepted, redirecting to:', redirectUrl)
            }
            continue
          }
        }
      }

      // If redirect is to our callback endpoint, extract code
      if (redirectUrl.includes(config.public.oauth2RedirectUri) || redirectUrl.includes('/auth/callback')) {
        const codeMatch = redirectUrl.match(/code=([^&]+)/)
        if (codeMatch) {
          authCode = codeMatch[1]
          break
        }
      }

      // Follow redirect if it's not to our endpoints
      if (!redirectUrl.startsWith('http://localhost:3000') && !redirectUrl.startsWith('/')) {
        const nextResponse = await fetch(redirectUrl, {
          method: 'GET',
          headers: {
            Cookie: requestCookies,
          },
          redirect: 'manual',
        })

        if (nextResponse.status === 302 || nextResponse.status === 303 || nextResponse.status === 307 || nextResponse.status === 308) {
          redirectUrl = nextResponse.headers.get('Location') || ''
          if (import.meta.dev) {
            console.log('[auth/oauth/start-silent.post.ts] Following redirect to:', redirectUrl)
          }
          continue
        }
      }

      // If we get here, we can't continue
      break
    }

    if (!authCode) {
      // Log final redirect URL for debugging
      if (import.meta.dev) {
        console.error('[auth/oauth/start-silent.post.ts] Failed to get authorization code')
        console.error('[auth/oauth/start-silent.post.ts] Final redirect URL:', redirectUrl)
        console.error('[auth/oauth/start-silent.post.ts] Max redirects reached:', maxRedirects === -1)
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to get authorization code from Hydra',
        data: {
          finalRedirectUrl: redirectUrl,
          message: 'OAuth2 flow did not complete. Check Hydra configuration and redirect URLs.',
        },
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
        code: authCode,
        redirect_uri: config.public.oauth2RedirectUri,
        client_id: config.public.oauth2ClientId,
        code_verifier: codeVerifier,
      }),
    }) as any

    if (!tokenResponse?.access_token) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to exchange code for tokens',
      })
    }

    // Store tokens in HttpOnly cookies
    setCookie(event, 'hydra_access_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: tokenResponse.expires_in || 60 * 60, // 1 hour
    })

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

    if (import.meta.dev) {
      console.log('[auth/oauth/start-silent.post.ts] OAuth2 tokens created successfully')
    }

    return {
      success: true,
      message: 'OAuth2 tokens created successfully',
    }
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/oauth/start-silent.post.ts] Error:', error)
    }

    // Clear OAuth2 cookies on error
    deleteCookie(event, 'oauth2_code_verifier', { path: '/' })
    deleteCookie(event, 'oauth2_state', { path: '/' })

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: 'Failed to start OAuth2 flow',
      message: error.message || 'Failed to start OAuth2 flow',
    })
  }
})

