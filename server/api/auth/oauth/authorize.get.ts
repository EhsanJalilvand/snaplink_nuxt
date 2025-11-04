/**
 * OAuth2 Authorization Endpoint
 * This initiates the OAuth2 Authorization Code Flow with PKCE
 * 
 * Flow:
 * 1. User calls this endpoint
 * 2. Backend generates PKCE pair and state
 * 3. Redirects to Hydra authorization endpoint
 * 4. Hydra checks Kratos session
 * 5. If no session, redirects to Kratos login
 * 6. After login, Hydra issues tokens
 */

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const query = getQuery(event)
    const returnTo = (query.return_to as string) || '/dashboard'
    
    // Generate PKCE pair
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = generateState()
    
    // Store PKCE data in secure cookie (httpOnly, sameSite: strict)
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
    
    setCookie(event, 'oauth2_return_to', returnTo, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    })
    
    // Build Hydra authorization URL
    const params = new URLSearchParams({
      client_id: config.public.oauth2ClientId,
      redirect_uri: config.public.oauth2RedirectUri,
      response_type: 'code',
      scope: 'openid profile email offline', // 'offline' scope for refresh tokens
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })
    
    const authorizationUrl = `${config.public.hydraPublicUrl}/oauth2/auth?${params.toString()}`
    
    // Redirect to Hydra
    return sendRedirect(event, authorizationUrl)
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/oauth/authorize.get.ts] Error:', error)
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to initiate OAuth2 flow',
      message: error.message || 'Failed to initiate OAuth2 flow',
    })
  }
})

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

