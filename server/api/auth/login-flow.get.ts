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
    const fullReturnTo = returnTo.startsWith('http') ? returnTo : `http://localhost:3000${returnTo}`

    if (import.meta.dev) {
      console.log('[auth/login-flow.get.ts] Getting login flow with return_to:', fullReturnTo)
    }

    // Get login flow from Kratos
    // Use Accept: application/json header to get JSON response, not redirect
    const flowResponse = await $fetch(`${config.kratosPublicUrl}/self-service/login/browser?return_to=${encodeURIComponent(fullReturnTo)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
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

    throw createError({
      statusCode: error.statusCode || error.status || 500,
      statusMessage: error.statusMessage || 'Failed to get login flow',
      message: error.message,
    })
  }
})

