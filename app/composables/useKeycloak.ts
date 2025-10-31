import Keycloak from 'keycloak-js'

export interface KeycloakUser {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  emailVerified: boolean
  roles: string[]
  token?: string
  refreshToken?: string
}

export interface KeycloakState {
  keycloak: Keycloak | null
  user: KeycloakUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isInitialized: boolean
}

let keycloakInstance: Keycloak | null = null
let keycloakState: KeycloakState | null = null

export const useKeycloak = () => {
  const config = useRuntimeConfig()
  const toaster = useNuiToasts()
  
  // Get config inside functions that need it
  const getConfig = () => useRuntimeConfig()

  // Initialize state if it doesn't exist
  if (!keycloakState) {
    keycloakState = reactive<KeycloakState>({
      keycloak: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,
    })
  }

  const state = keycloakState

  // Initialize Keycloak instance
  const initKeycloak = async () => {
    if (process.server) {
      return
    }

    if (keycloakInstance) {
      state.keycloak = keycloakInstance
      return keycloakInstance
    }

    state.isLoading = true
    state.error = null

    try {
      const runtimeConfig = getConfig()
      console.log('[useKeycloak.ts] Runtime config keycloakClientId:', runtimeConfig.public.keycloakClientId)
      console.log('[useKeycloak.ts] Runtime config keycloakRealm:', runtimeConfig.public.keycloakRealm)
      console.log('[useKeycloak.ts] Runtime config keycloakUrl:', runtimeConfig.public.keycloakUrl)
      const keycloakConfig = {
        url: runtimeConfig.public.keycloakUrl,
        realm: runtimeConfig.public.keycloakRealm,
        clientId: 'my-client', // Direct value - not reading from config
        checkLoginIframe: false,
        enableLogging: process.env.NODE_ENV === 'development',
      }

      console.log('[useKeycloak.ts] Creating Keycloak instance with config:', keycloakConfig)
      keycloakInstance = new Keycloak(keycloakConfig)
      state.keycloak = keycloakInstance
      console.log('[useKeycloak.ts] Keycloak instance created, clientId:', keycloakInstance.clientId)

      // Get redirect URI - use direct value to avoid config issues
      const redirectUri = 'http://localhost:3000/auth/callback' // Direct value - not reading from config
      console.log('[useKeycloak.ts] init() - redirectUri:', redirectUri)

      // Initialize Keycloak with PKCE
      const authenticated = await keycloakInstance.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        enableLogging: process.env.NODE_ENV === 'development',
        redirectUri: redirectUri, // Explicitly set redirectUri to avoid using current page
      })

      if (authenticated) {
        await updateUserFromKeycloak()
      }

      state.isInitialized = true
      state.isLoading = false

      // Listen for successful authentication (after redirect from Keycloak)
      keycloakInstance.onAuthSuccess = () => {
        console.log('[useKeycloak.ts] onAuthSuccess - Authentication successful')
        updateUserFromKeycloak()
      }

      // Listen for token refresh
      keycloakInstance.onTokenExpired = () => {
        keycloakInstance?.updateToken(30)
          .then(() => {
            updateUserFromKeycloak()
          })
          .catch(() => {
            logout()
          })
      }

      // Listen for auth errors
      keycloakInstance.onAuthError = (errorData) => {
        console.error('[useKeycloak.ts] onAuthError:', errorData)
        state.isAuthenticated = false
        state.user = null
        state.error = errorData?.error || 'Authentication error occurred'
      }

      return keycloakInstance
    } catch (error: any) {
      console.error('Keycloak initialization error:', error)
      state.error = error.message || 'Failed to initialize Keycloak'
      state.isLoading = false
      state.isInitialized = true
      throw error
    }
  }

  // Update user info from Keycloak token
  const updateUserFromKeycloak = async () => {
    if (!keycloakInstance || !keycloakInstance.authenticated) {
      state.user = null
      state.isAuthenticated = false
      return
    }

    try {
      const tokenParsed = keycloakInstance.tokenParsed as any
      const realmAccess = tokenParsed?.realm_access?.roles || []
      const resourceAccess = tokenParsed?.resource_access?.['my-client']?.roles || [] // Direct value - not reading from config
      const allRoles = [...realmAccess, ...resourceAccess]

      state.user = {
        id: tokenParsed?.sub || '',
        username: tokenParsed?.preferred_username || tokenParsed?.username || '',
        email: tokenParsed?.email || '',
        firstName: tokenParsed?.given_name || tokenParsed?.firstName,
        lastName: tokenParsed?.family_name || tokenParsed?.lastName,
        emailVerified: tokenParsed?.email_verified || false,
        roles: allRoles,
        token: keycloakInstance.token || undefined,
        refreshToken: keycloakInstance.refreshToken || undefined,
      }

      state.isAuthenticated = true
    } catch (error: any) {
      console.error('Error updating user from Keycloak:', error)
      state.user = null
      state.isAuthenticated = false
    }
  }

  // Login with redirect to Keycloak
  const login = async (redirectUri?: string) => {
    if (!keycloakInstance && process.client) {
      await initKeycloak()
    }

    if (!keycloakInstance) {
      throw new Error('Keycloak not initialized')
    }

    try {
      // Use direct value to avoid config issues
      const callbackUri = redirectUri || 'http://localhost:3000/auth/callback' // Direct value - not reading from config
      console.log('[useKeycloak.ts] login() - keycloakInstance.clientId:', keycloakInstance.clientId)
      console.log('[useKeycloak.ts] login() - redirectUri:', callbackUri)
      console.log('[useKeycloak.ts] login() - realm:', keycloakInstance.realm)
      keycloakInstance.login({
        redirectUri: callbackUri,
        pkceMethod: 'S256',
      })
    } catch (error: any) {
      console.error('Keycloak login error:', error)
      state.error = error.message || 'Login failed'
      throw error
    }
  }

  // Login with username and password (Direct Access Grant - requires Direct Access Grant to be enabled in Keycloak)
  const loginWithCredentials = async (username: string, password: string) => {
    if (!keycloakInstance && process.client) {
      await initKeycloak()
    }

    if (!keycloakInstance) {
      throw new Error('Keycloak not initialized')
    }

    state.isLoading = true
    state.error = null

    try {
      // Try Direct Access Grant (if enabled in Keycloak client settings)
      const authenticated = await keycloakInstance.login({
        username,
        password,
        grantType: 'password',
        pkceMethod: 'S256',
      })

      if (authenticated) {
        await updateUserFromKeycloak()
        toaster.add({
          title: 'Success',
          description: 'Welcome back!',
          icon: 'ph:user-circle-fill',
          progress: true,
        })
        state.isLoading = false
        return { success: true }
      }

      state.isLoading = false
      return { success: false, error: 'Authentication failed' }
    } catch (error: any) {
      console.error('Keycloak login error:', error)
      // If Direct Access Grant is not enabled, fall back to redirect login
      state.error = error.errorDescription || error.message || 'Direct Access Grant not enabled. Using redirect...'
      state.isLoading = false
      // Fallback to redirect login
      try {
        await login()
        return { success: true, redirect: true }
      } catch (redirectError) {
        return { success: false, error: state.error }
      }
    }
  }

  // Register (redirect to Keycloak registration)
  const register = async (redirectUri?: string) => {
    if (!keycloakInstance && process.client) {
      await initKeycloak()
    }

    if (!keycloakInstance) {
      throw new Error('Keycloak not initialized')
    }

    try {
      // Use direct value to avoid config issues
      const currentUri = redirectUri || 'http://localhost:3000/auth/callback' // Direct value - not reading from config
      keycloakInstance.register({
        redirectUri: currentUri,
        pkceMethod: 'S256',
      })
    } catch (error: any) {
      console.error('Keycloak register error:', error)
      state.error = error.message || 'Registration failed'
      throw error
    }
  }

  // Logout
  const logout = async () => {
    if (!keycloakInstance) {
      state.user = null
      state.isAuthenticated = false
      return
    }

    try {
      // Use direct value to avoid config issues
      const redirectUri = 'http://localhost:3000/auth/login' // Direct value - not reading from config
      await keycloakInstance.logout({ redirectUri })

      state.user = null
      state.isAuthenticated = false

      toaster.add({
        title: 'Success',
        description: 'Logged out successfully',
        icon: 'ph:sign-out',
        progress: true,
      })
    } catch (error: any) {
      console.error('Keycloak logout error:', error)
      // Even if logout fails, clear local state
      state.user = null
      state.isAuthenticated = false
    }
  }

  // Check if user is authenticated
  const checkAuth = async () => {
    if (process.server) {
      return
    }

    try {
      if (!keycloakInstance) {
        await initKeycloak()
      }

      // Always check authentication status, even if not authenticated
      if (keycloakInstance) {
        if (keycloakInstance.authenticated) {
          console.log('[useKeycloak.ts] checkAuth - User is authenticated, updating user info')
          await updateUserFromKeycloak()
        } else {
          console.log('[useKeycloak.ts] checkAuth - User is not authenticated')
          // Make sure state reflects not authenticated
          state.user = null
          state.isAuthenticated = false
        }
      }
    } catch (error: any) {
      console.error('[useKeycloak.ts] checkAuth error:', error)
      state.user = null
      state.isAuthenticated = false
    }
  }

  // Get access token
  const getToken = async () => {
    if (!keycloakInstance || !keycloakInstance.authenticated) {
      return null
    }

    try {
      // Update token if it's about to expire
      await keycloakInstance.updateToken(30)
      return keycloakInstance.token
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  }

  // Handle callback from Keycloak
  const handleCallback = async () => {
    if (process.server) {
      return false
    }

    try {
      if (!keycloakInstance) {
        await initKeycloak()
      }

      // Wait a bit for Keycloak to process the callback
      await new Promise(resolve => setTimeout(resolve, 100))

      // Check if authenticated
      if (keycloakInstance?.authenticated) {
        console.log('[useKeycloak.ts] handleCallback - User is authenticated')
        await updateUserFromKeycloak()
        
        // Make sure token is valid
        if (keycloakInstance.token) {
          await keycloakInstance.updateToken(30).catch(() => {
            console.warn('[useKeycloak.ts] Failed to update token')
          })
        }
        
        return true
      } else {
        console.log('[useKeycloak.ts] handleCallback - User is not authenticated, trying to check SSO')
        // Try to check SSO status
        const authenticated = await keycloakInstance?.init({
          onLoad: 'check-sso',
          pkceMethod: 'S256',
          checkLoginIframe: false,
          redirectUri: 'http://localhost:3000/auth/callback',
        })
        
        if (authenticated) {
          await updateUserFromKeycloak()
          return true
        }
      }

      return false
    } catch (error: any) {
      console.error('[useKeycloak.ts] handleCallback error:', error)
      state.error = error.message || 'Failed to handle callback'
      return false
    }
  }

  return {
    // State
    keycloak: readonly(toRef(state, 'keycloak')),
    user: readonly(toRef(state, 'user')),
    isAuthenticated: readonly(toRef(state, 'isAuthenticated')),
    isLoading: readonly(toRef(state, 'isLoading')),
    error: readonly(toRef(state, 'error')),
    isInitialized: readonly(toRef(state, 'isInitialized')),

    // Methods
    initKeycloak,
    login,
    loginWithCredentials,
    register,
    logout,
    checkAuth,
    getToken,
    handleCallback,
    updateUserFromKeycloak,
  }
}

