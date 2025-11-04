import { Configuration, FrontendApi, IdentityApi } from '@ory/client'

export interface KratosUser {
  id: string
  email: string
  emailVerified: boolean
  firstName?: string
  lastName?: string
  traits?: Record<string, any>
}

export interface KratosSession {
  id: string
  identity: {
    id: string
    traits: {
      email?: string
      email_verified?: boolean
      name?: {
        first?: string
        last?: string
      }
      [key: string]: any
    }
  }
  authenticated_at?: string
  expires_at?: string
}

export const useKratos = () => {
  const config = useRuntimeConfig()
  
  // Kratos Public API (for frontend operations)
  const getFrontendApi = (): FrontendApi => {
    const kratosConfig = new Configuration({
      basePath: config.public.kratosPublicUrl,
      baseOptions: {
        withCredentials: true,
      },
    })
    return new FrontendApi(kratosConfig)
  }

  // Kratos Admin API (for server-side operations only)
  const getAdminApi = (): IdentityApi => {
    const kratosConfig = new Configuration({
      basePath: config.kratosAdminUrl,
    })
    return new IdentityApi(kratosConfig)
  }

  // Get current session
  const getSession = async (): Promise<KratosSession | null> => {
    try {
      const frontend = getFrontendApi()
      const { data } = await frontend.toSession()
      return data as KratosSession
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return null
      }
      throw error
    }
  }

  // Check if user is authenticated
  const isAuthenticated = async (): Promise<boolean> => {
    const session = await getSession()
    return !!session
  }

  // Create browser login flow
  const createLoginFlow = async (returnTo?: string) => {
    const frontend = getFrontendApi()
    const { data } = await frontend.createBrowserLoginFlow({
      returnTo: returnTo || config.public.siteUrl,
    })
    return data
  }

  // Update login flow (submit credentials)
  const updateLoginFlow = async (flowId: string, body: {
    method: 'password' | 'code'
    password?: string
    identifier?: string
    code?: string
  }) => {
    const frontend = getFrontendApi()
    const { data } = await frontend.updateLoginFlow({
      flow: flowId,
      updateLoginFlowBody: {
        method: body.method,
        password: body.password,
        identifier: body.identifier,
        code: body.code,
      },
    })
    return data
  }

  // Create browser registration flow
  const createRegistrationFlow = async (returnTo?: string) => {
    const frontend = getFrontendApi()
    const { data } = await frontend.createBrowserRegistrationFlow({
      returnTo: returnTo || config.public.siteUrl,
    })
    return data
  }

  // Update registration flow (submit registration data)
  const updateRegistrationFlow = async (flowId: string, body: {
    method: 'password'
    password: string
    traits: {
      email: string
      name?: {
        first?: string
        last?: string
      }
      [key: string]: any
    }
  }) => {
    const frontend = getFrontendApi()
    const { data } = await frontend.updateRegistrationFlow({
      flow: flowId,
      updateRegistrationFlowBody: {
        method: body.method,
        password: body.password,
        traits: body.traits,
      },
    })
    return data
  }

  // Create browser logout flow
  const createLogoutFlow = async () => {
    const frontend = getFrontendApi()
    const { data } = await frontend.createBrowserLogoutFlow()
    return data
  }

  // Update logout flow (perform logout)
  const updateLogoutFlow = async (token: string) => {
    const frontend = getFrontendApi()
    await frontend.updateLogoutFlow({ token })
  }

  return {
    getSession,
    isAuthenticated,
    createLoginFlow,
    updateLoginFlow,
    createRegistrationFlow,
    updateRegistrationFlow,
    createLogoutFlow,
    updateLogoutFlow,
    getFrontendApi,
    getAdminApi,
  }
}

