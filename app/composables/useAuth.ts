import type { Ref } from 'vue'

export interface User {
  id: string
  email: string
  emailVerified: boolean
  firstName?: string
  lastName?: string
  avatar?: string
  roles?: string[]
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export const useAuth = () => {
  const config = useRuntimeConfig()
  const toaster = useNuiToasts()
  const { getSession, isAuthenticated: checkKratosAuth } = useKratos()
  const { getStoredPKCE, clearPKCE } = useHydra()
  
  const state = reactive<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  })

  /**
   * Check authentication status from server
   * This calls /api/auth/me which checks both Kratos session and Hydra tokens
   */
  const checkAuth = async (): Promise<boolean> => {
    if (process.server) {
      return false
    }

    state.isLoading = true
    state.error = null

    try {
      const response = await $fetch<{
        success: boolean
        user: User | null
        isAuthenticated: boolean
      }>('/api/auth/me', {
        credentials: 'include',
      })

      if (response.success && response.user && response.isAuthenticated) {
        state.user = response.user
        state.isAuthenticated = true
        return true
      } else {
        state.user = null
        state.isAuthenticated = false
        return false
      }
    } catch (error: any) {
      // 401 means not authenticated, which is fine
      if (error.statusCode === 401 || error.status === 401) {
        state.user = null
        state.isAuthenticated = false
        return false
      }
      
      // Other errors are unexpected
      state.error = error.message || 'Failed to check authentication'
      console.error('[useAuth] checkAuth error:', error)
      return false
    } finally {
      state.isLoading = false
    }
  }

  /**
   * Initialize auth state on app start
   */
  const initAuth = async () => {
    await checkAuth()
  }

  /**
   * Start OAuth2 Authorization Flow
   * This redirects to Hydra, which will check Kratos session
   */
  const startOAuth2Flow = async (returnTo?: string) => {
    if (process.server) {
      return
    }

    state.isLoading = true
    state.error = null

    try {
      const { buildAuthorizationUrl } = useHydra()
      const redirectUri = config.public.oauth2RedirectUri
      
      // Build authorization URL with PKCE
      const { url } = await buildAuthorizationUrl(redirectUri)
      
      // Store returnTo in sessionStorage if provided
      if (returnTo) {
        sessionStorage.setItem('oauth2_return_to', returnTo)
      }
      
      // Redirect to Hydra authorization endpoint
      window.location.href = url
    } catch (error: any) {
      state.error = error.message || 'Failed to start OAuth2 flow'
      state.isLoading = false
      throw error
    }
  }

  /**
   * Handle OAuth2 callback
   * This is called after redirect from Hydra
   */
  const handleOAuth2Callback = async (code: string, state: string): Promise<boolean> => {
    if (process.server) {
      return false
    }

    state.isLoading = true
    state.error = null

    try {
      // Verify state (CSRF protection)
      const storedPKCE = getStoredPKCE()
      if (!storedPKCE.state || storedPKCE.state !== state) {
        throw new Error('Invalid state parameter')
      }

      if (!storedPKCE.codeVerifier) {
        throw new Error('Code verifier not found')
      }

      // Exchange code for tokens (server-side)
      const redirectUri = config.public.oauth2RedirectUri
      const response = await $fetch<{
        success: boolean
        access_token?: string
        refresh_token?: string
        expires_in?: number
        user?: User
      }>('/api/auth/oauth/callback', {
        method: 'POST',
        body: {
          code,
          code_verifier: storedPKCE.codeVerifier,
          redirect_uri: redirectUri,
          state,
        },
        credentials: 'include',
      })

      if (response.success && response.user) {
        // Clear PKCE data
        clearPKCE()
        
        // Update state
        state.user = response.user
        state.isAuthenticated = true
        
        // Get returnTo from sessionStorage
        const returnTo = sessionStorage.getItem('oauth2_return_to') || '/dashboard'
        sessionStorage.removeItem('oauth2_return_to')
        
        toaster.add({
          title: 'Success',
          description: 'Welcome back!',
          icon: 'ph:user-circle-fill',
          progress: true,
        })

        // Navigate to returnTo or dashboard
        await navigateTo(returnTo)
        
        return true
      } else {
        throw new Error('Failed to exchange code for tokens')
      }
    } catch (error: any) {
      state.error = error.message || 'Failed to handle OAuth2 callback'
      state.isLoading = false
      
      // Clear PKCE data on error
      clearPKCE()
      
      // Redirect to login
      await navigateTo('/auth/login')
      
      return false
    } finally {
      state.isLoading = false
    }
  }

  /**
   * Login with email/username and password
   */
  const login = async (emailOrUsername: string, password: string) => {
    if (process.server) {
      return { success: false, error: 'Login must be called from client-side' }
    }

    state.isLoading = true
    state.error = null

    try {
      const response = await $fetch<{
        success: boolean
        message?: string
        session?: boolean
      }>('/api/auth/login', {
        method: 'POST',
        body: {
          emailOrUsername,
          password,
        },
        credentials: 'include',
      })

      if (response.success && response.session) {
        // Login successful - session created in Kratos
        // The login page will handle setting the cookie via client-side request
        return { success: true, redirecting: false }
      } else {
        return { success: false, error: 'Login failed' }
      }
    } catch (error: any) {
      state.error = error.message || 'Login failed'
      
      if (error.statusCode === 401) {
        // Check if error.data is an array
        let errorMessage = 'Invalid email or password'
        if (Array.isArray(error.data)) {
          const passwordError = error.data.find((e: any) => e.path?.includes('password'))
          if (passwordError?.message) {
            errorMessage = passwordError.message
          }
        } else if (error.statusMessage) {
          errorMessage = error.statusMessage
        }
        return { success: false, error: errorMessage }
      }
      
      if (error.statusCode === 403) {
        // CSRF error
        let errorMessage = 'Security validation failed. Please refresh the page and try again.'
        if (Array.isArray(error.data)) {
          const csrfError = error.data.find((e: any) => e.path?.includes('password'))
          if (csrfError?.message) {
            errorMessage = csrfError.message
          }
        } else if (error.statusMessage) {
          errorMessage = error.statusMessage
        }
        return { success: false, error: errorMessage }
      }
      
      return { success: false, error: error.message || 'Login failed' }
    } finally {
      state.isLoading = false
    }
  }

  /**
   * Logout
   */
  const logout = async () => {
    state.isLoading = true

    try {
      // Call server logout endpoint (handles CSRF token automatically)
      await $fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      // Clear local state
      state.user = null
      state.isAuthenticated = false
      
      // Clear PKCE data
      clearPKCE()
      
      // Clear any stored data
      if (process.client) {
        sessionStorage.removeItem('snaplink:access_token')
        sessionStorage.removeItem('oauth2_return_to')
      }

      toaster.add({
        title: 'Success',
        description: 'Logged out successfully',
        icon: 'ph:sign-out',
        progress: true,
      })

      // Navigate to login
      await navigateTo('/auth/login')
    } catch (error: any) {
      console.error('[useAuth] logout error:', error)
      // Even if logout fails, clear local state and navigate
      state.user = null
      state.isAuthenticated = false
      clearPKCE()
      await navigateTo('/auth/login')
    } finally {
      state.isLoading = false
    }
  }

  /**
   * Refresh access token
   */
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const response = await $fetch<{
        success: boolean
        access_token?: string
        expires_in?: number
      }>('/api/auth/oauth/refresh', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.success && response.access_token && import.meta.client) {
        // Update access token in sessionStorage
        sessionStorage.setItem('snaplink:access_token', response.access_token)
        return true
      }
      return false
    } catch (error: any) {
      // If refresh fails, user needs to re-authenticate
      if (error.statusCode === 401 || error.status === 401) {
        await logout()
      }
      return false
    }
  }

  return {
    // State
    user: readonly(toRef(state, 'user')),
    isAuthenticated: readonly(toRef(state, 'isAuthenticated')),
    isLoading: readonly(toRef(state, 'isLoading')),
    error: readonly(toRef(state, 'error')),
    
          // Methods
          checkAuth,
          initAuth,
          login,
          startOAuth2Flow,
          handleOAuth2Callback,
          logout,
          refreshAccessToken,
  }
}
