import { Configuration, FrontendApi } from '@ory/client'

/**
 * Get Login Flow Endpoint
 * 
 * This endpoint gets a login flow from Kratos and returns it to the client.
 * This prevents CORS issues and fallback URL redirects.
 */

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const query = getQuery(event)
    const returnTo = (query.return_to as string) || '/dashboard'
    
    // Make sure return_to is a full URL
    const siteUrl = (config.public.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
    const fullReturnTo = returnTo.startsWith('http') ? returnTo : `${siteUrl}${returnTo}`

    if (import.meta.dev) {
      console.log('[auth/login-flow.get.ts] Getting login flow with return_to:', fullReturnTo)
    }

    // Use Kratos Frontend API to get login flow
    const kratosConfig = new Configuration({
      basePath: config.kratosPublicUrl,
    })
    const frontendApi = new FrontendApi(kratosConfig)
    
    // Forward cookies from the request
    const requestCookies = getHeader(event, 'cookie') || ''
    
    // Get login flow from Kratos
    const { data: flowResponse } = await frontendApi.createBrowserLoginFlow({
      returnTo: fullReturnTo,
    }, {
      headers: {
        Cookie: requestCookies,
      },
    })

    if (import.meta.dev) {
      console.log('[auth/login-flow.get.ts] Flow response:', JSON.stringify(flowResponse, null, 2))
    }

    return flowResponse
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/login-flow.get.ts] Error:', error)
      console.error('[auth/login-flow.get.ts] Error response:', error.response?.data || error.data)
    }

    // Check if it's a redirect response (Kratos wants to redirect)
    if (error.response?.data?.redirect_browser_to) {
      return {
        redirect_browser_to: error.response.data.redirect_browser_to,
      }
    }

    throw createError({
      statusCode: error.statusCode || error.status || 500,
      statusMessage: String(error.statusMessage || 'Failed to get login flow'),
      message: String(error.message || 'Failed to get login flow'),
    })
  }
})

