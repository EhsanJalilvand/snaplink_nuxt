import { getCookie } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const gatewayBaseUrl = config.apiGatewayBaseUrl || 'http://localhost:5100'
  
  // Get the path from the request
  const path = getRouterParam(event, 'path') || ''
  const targetPath = Array.isArray(path) ? path.join('/') : path
  
  // Get query string
  const query = getQuery(event)
  const queryString = new URLSearchParams(query as Record<string, string>).toString()
  const fullPath = queryString ? `${targetPath}?${queryString}` : targetPath
  
  // Get method
  const method = getMethod(event)
  
  // Get headers from request
  const headers: Record<string, string> = {}
  
  // Forward important headers
  const headersToForward = ['content-type', 'accept', 'accept-language']
  for (const headerName of headersToForward) {
    const value = getHeader(event, headerName)
    if (value) {
      headers[headerName] = value
    }
  }
  
  // Forward all cookies to Gateway (they will be used for authentication)
  const cookieHeader = getHeader(event, 'cookie')
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader
  }
  
  // Try to get access token from common cookie names
  // Check multiple possible cookie names for access token
  const possibleTokenCookies = [
    'hydra_access_token',
    'access_token',
    'snaplink_access_token',
    'oauth_access_token',
  ]
  
  for (const cookieName of possibleTokenCookies) {
    const token = getCookie(event, cookieName)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      break
    }
  }
  
  // Also check Authorization header from client (if forwarded)
  const authHeader = getHeader(event, 'authorization')
  if (authHeader && !headers['Authorization']) {
    headers['Authorization'] = authHeader
  }
  
  // Get request body if exists
  let body: any = undefined
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await readBody(event).catch(() => undefined)
    } catch {
      // Body might not exist
    }
  }
  
  // Build target URL
  const targetUrl = `${gatewayBaseUrl}/${fullPath}`
  
  try {
    // Forward request to Gateway
    const response = await $fetch.raw(targetUrl, {
      method: method as any,
      headers,
      body,
      // Forward cookies
      credentials: 'include',
    })
    
    // Forward response headers
    const responseHeaders = response.headers
    for (const [key, value] of responseHeaders.entries()) {
      // Don't forward some headers
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        setHeader(event, key, value)
      }
    }
    
    // Set status code
    setResponseStatus(event, response.status)
    
    // Return response body
    return response._data
  } catch (error: any) {
    // Handle errors
    const status = error?.status || error?.statusCode || 500
    const statusText = error?.statusText || error?.message || 'Internal Server Error'
    
    setResponseStatus(event, status, statusText)
    
    return {
      error: statusText,
      message: error?.data?.message || error?.message,
    }
  }
})

