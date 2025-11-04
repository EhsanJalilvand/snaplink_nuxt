/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth2
 * Follows RFC 7636 standard
 */

export interface PKCEPair {
  codeVerifier: string
  codeChallenge: string
  codeChallengeMethod: 'S256'
}

/**
 * Generate a random string for PKCE code verifier
 * RFC 7636: 43-128 characters, using unreserved characters
 */
export const generateCodeVerifier = (): string => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const length = Math.floor(Math.random() * (128 - 43 + 1)) + 43 // Random length between 43-128
  let text = ''
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

/**
 * Generate SHA256 hash of code verifier for PKCE code challenge
 * RFC 7636: Must use base64url encoding (not base64)
 */
export const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  
  // Convert to base64url (RFC 7636)
  const base64 = btoa(String.fromCharCode(...hashArray))
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Generate PKCE pair (code verifier + code challenge)
 */
export const generatePKCEPair = async (): Promise<PKCEPair> => {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  }
}

/**
 * Store PKCE data in sessionStorage (client-side only)
 */
export const storePKCE = (pkce: PKCEPair, state?: string) => {
  if (process.client) {
    sessionStorage.setItem('pkce_code_verifier', pkce.codeVerifier)
    if (state) {
      sessionStorage.setItem('oauth2_state', state)
    }
  }
}

/**
 * Retrieve PKCE code verifier from sessionStorage
 */
export const getStoredPKCE = (): { codeVerifier: string | null; state: string | null } => {
  if (process.client) {
    return {
      codeVerifier: sessionStorage.getItem('pkce_code_verifier'),
      state: sessionStorage.getItem('oauth2_state'),
    }
  }
  return { codeVerifier: null, state: null }
}

/**
 * Clear PKCE data from sessionStorage
 */
export const clearPKCE = () => {
  if (process.client) {
    sessionStorage.removeItem('pkce_code_verifier')
    sessionStorage.removeItem('oauth2_state')
  }
}

/**
 * Generate random state for OAuth2 (CSRF protection)
 */
export const generateState = (): string => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let text = ''
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

export const useHydra = () => {
  const config = useRuntimeConfig()

  /**
   * Build OAuth2 Authorization URL
   * Follows OAuth2 Authorization Code Flow with PKCE
   */
  const buildAuthorizationUrl = async (
    redirectUri: string,
    scopes: string[] = ['openid', 'profile', 'email', 'offline'],
  ): Promise<{ url: string; codeVerifier: string; state: string }> => {
    // Generate PKCE pair
    const pkce = await generatePKCEPair()
    
    // Generate state for CSRF protection
    const state = generateState()
    
    // Store PKCE data
    storePKCE(pkce, state)
    
    // Build authorization URL
    const params = new URLSearchParams({
      client_id: config.public.oauth2ClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: pkce.codeChallengeMethod,
    })
    
    const url = `${config.public.hydraPublicUrl}/oauth2/auth?${params.toString()}`
    
    return {
      url,
      codeVerifier: pkce.codeVerifier,
      state,
    }
  }

  /**
   * Exchange authorization code for tokens
   * This should be done server-side for security
   */
  const exchangeCodeForTokens = async (
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ) => {
    // This should be called from server-side endpoint
    // We'll implement this in the server endpoint
    return await $fetch('/api/auth/oauth/token', {
      method: 'POST',
      body: {
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
      },
    })
  }

  /**
   * Refresh access token
   */
  const refreshToken = async (refreshToken: string) => {
    return await $fetch('/api/auth/oauth/refresh', {
      method: 'POST',
      body: {
        refresh_token: refreshToken,
      },
    })
  }

  /**
   * Get user info from access token
   */
  const getUserInfo = async (accessToken: string) => {
    return await $fetch('/api/auth/oauth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  }

  return {
    buildAuthorizationUrl,
    exchangeCodeForTokens,
    refreshToken,
    getUserInfo,
    generatePKCEPair,
    storePKCE,
    getStoredPKCE,
    clearPKCE,
    generateState,
  }
}

