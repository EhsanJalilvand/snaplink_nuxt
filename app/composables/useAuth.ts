import type { Ref } from 'vue'

export interface User {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  emailVerified: boolean
  roles: string[]
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
  
  const state = reactive<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  })

  // Keycloak configuration
  const keycloakConfig = {
    url: config.public.keycloakUrl,
    realm: config.public.keycloakRealm,
    clientId: config.public.keycloakClientId,
  }

  // Login with email/password
  const login = async (email: string, password: string, trustDevice = false) => {
    state.isLoading = true
    state.error = null

    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          email,
          password,
          trustDevice,
        },
      })

      if (response.success) {
        state.user = response.user
        state.isAuthenticated = true
        
        // Store tokens securely
        if (process.client) {
          localStorage.setItem('access_token', response.accessToken)
          if (response.refreshToken) {
            localStorage.setItem('refresh_token', response.refreshToken)
          }
        }

        toaster.add({
          title: 'Success',
          description: 'Welcome back!',
          icon: 'ph:user-circle-fill',
          progress: true,
        })

        return { success: true }
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (error: any) {
      state.error = error.message || 'Login failed'
      return { success: false, error: state.error }
    } finally {
      state.isLoading = false
    }
  }

  // Register new user
  const register = async (userData: {
    username: string
    email: string
    password: string
    firstName?: string
    lastName?: string
  }) => {
    state.isLoading = true
    state.error = null

    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: userData,
      })

      if (response.success) {
        toaster.add({
          title: 'Success',
          description: 'Account created successfully!',
          icon: 'ph:check',
          progress: true,
        })

        return { success: true, userId: response.userId }
      } else {
        throw new Error(response.error || 'Registration failed')
      }
    } catch (error: any) {
      state.error = error.message || 'Registration failed'
      return { success: false, error: state.error }
    } finally {
      state.isLoading = false
    }
  }

  // Logout
  const logout = async () => {
    state.isLoading = true

    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
      })

      // Clear local state
      state.user = null
      state.isAuthenticated = false

      // Clear tokens
      if (process.client) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }

      toaster.add({
        title: 'Success',
        description: 'Logged out successfully',
        icon: 'ph:sign-out',
        progress: true,
      })

      await navigateTo('/auth/login')
    } catch (error: any) {
      console.error('Logout error:', error)
    } finally {
      state.isLoading = false
    }
  }

  // Forgot password
  const forgotPassword = async (email: string) => {
    state.isLoading = true
    state.error = null

    try {
      const response = await $fetch('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
      })

      if (response.success) {
        toaster.add({
          title: 'Success',
          description: 'Password reset email sent',
          icon: 'ph:envelope',
          progress: true,
        })

        return { success: true }
      } else {
        throw new Error(response.error || 'Failed to send reset email')
      }
    } catch (error: any) {
      state.error = error.message || 'Failed to send reset email'
      return { success: false, error: state.error }
    } finally {
      state.isLoading = false
    }
  }

  // Verify email
  const verifyEmail = async (code: string) => {
    state.isLoading = true
    state.error = null

    try {
      const response = await $fetch('/api/auth/verify-email', {
        method: 'POST',
        body: { code },
      })

      if (response.success) {
        toaster.add({
          title: 'Success',
          description: 'Email verified successfully!',
          icon: 'ph:check',
          progress: true,
        })

        return { success: true }
      } else {
        throw new Error(response.error || 'Email verification failed')
      }
    } catch (error: any) {
      state.error = error.message || 'Email verification failed'
      return { success: false, error: state.error }
    } finally {
      state.isLoading = false
    }
  }

  // Two-factor authentication
  const verify2FA = async (code: string, method: 'email' | 'sms' | 'app') => {
    state.isLoading = true
    state.error = null

    try {
      const response = await $fetch('/api/auth/verify-2fa', {
        method: 'POST',
        body: { code, method },
      })

      if (response.success) {
        state.user = response.user
        state.isAuthenticated = true

        toaster.add({
          title: 'Success',
          description: 'Two-factor authentication successful!',
          icon: 'ph:shield-check',
          progress: true,
        })

        return { success: true }
      } else {
        throw new Error(response.error || '2FA verification failed')
      }
    } catch (error: any) {
      state.error = error.message || '2FA verification failed'
      return { success: false, error: state.error }
    } finally {
      state.isLoading = false
    }
  }

  // Reset password
  const resetPassword = async (token: string, newPassword: string) => {
    state.isLoading = true
    state.error = null

    try {
      const response = await $fetch('/api/auth/reset-password', {
        method: 'POST',
        body: { token, newPassword },
      })

      if (response.success) {
        toaster.add({
          title: 'Success',
          description: 'Password reset successfully!',
          icon: 'ph:check',
          progress: true,
        })

        return { success: true }
      } else {
        throw new Error(response.error || 'Password reset failed')
      }
    } catch (error: any) {
      state.error = error.message || 'Password reset failed'
      return { success: false, error: state.error }
    } finally {
      state.isLoading = false
    }
  }

  // Check authentication status
  const checkAuth = async () => {
    if (process.client) {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const response = await $fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.success) {
            state.user = response.user
            state.isAuthenticated = true
          }
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
    }
  }

  // Initialize auth state
  const initAuth = async () => {
    await checkAuth()
  }

  return {
    // State
    user: readonly(toRef(state, 'user')),
    isAuthenticated: readonly(toRef(state, 'isAuthenticated')),
    isLoading: readonly(toRef(state, 'isLoading')),
    error: readonly(toRef(state, 'error')),
    
    // Methods
    login,
    register,
    logout,
    forgotPassword,
    verifyEmail,
    verify2FA,
    resetPassword,
    checkAuth,
    initAuth,
  }
}
