import { getCookie, getHeader, getQuery, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  // For redirect endpoints, bypass Gateway and go directly to backend
  // This is more reliable and faster for redirect operations
  const backendBaseUrl = 'http://localhost:5007' // Direct connection to UrlShortener API
  
  // Get the path from the request
  const path = getRouterParam(event, 'path') || ''
  const targetPath = Array.isArray(path) ? path.join('/') : path
  
  console.log('[API /s] Request path:', path)
  console.log('[API /s] Target path:', targetPath)
  console.log('[API /s] Full request URL:', event.node.req.url)
  
  // Get query string
  const query = getQuery(event)
  const queryString = new URLSearchParams(query as Record<string, string>).toString()
  const fullPath = queryString ? `${targetPath}?${queryString}` : targetPath
  
  // Get method
  const method = getMethod(event)
  
  // Get headers from request
  const headers: Record<string, string> = {}
  
  // Forward important headers
  const headersToForward = [
    'content-type',
    'accept',
    'accept-language',
    'user-agent',
    'referer',
    'x-forwarded-for',
    'x-real-ip',
  ]
  
  for (const headerName of headersToForward) {
    const value = getHeader(event, headerName)
    if (value) {
      headers[headerName] = value
    }
  }
  
  // Forward Host header
  const host = getHeader(event, 'host')
  if (host) {
    headers['Host'] = host
  }
  
  // Forward all cookies to Gateway (they will be used for authentication and session)
  const cookieHeader = getHeader(event, 'cookie')
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader
  }
  
  // Get request body if exists
  let body: any = undefined
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await readBody(event)
    } catch {
      // No body or already read
    }
  }
  
  // Build full URL - proxy directly to backend /api/r/ endpoint
  // Bypassing Gateway for redirect endpoints for better reliability
  const fullUrl = `${backendBaseUrl}/api/r/${fullPath}`
  
  console.log('[API /s] Using direct backend connection')
  console.log('[API /s] Target URL:', fullUrl)
  
  console.log('[API /s] Gateway URL:', fullUrl)
  console.log('[API /s] Method:', method)
  console.log('[API /s] Headers:', headers)
  
  try {
    // Make request to gateway
    console.log('[API /s] Making request to gateway...')
    const response = await $fetch.raw(fullUrl, {
      method: method as any,
      headers,
      body,
      redirect: 'manual', // Handle redirects manually
    })
    
    console.log('[API /s] Gateway response status:', response.status)
    console.log('[API /s] Gateway response headers:', Object.fromEntries(response.headers.entries()))
    
    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      console.log('[API /s] Redirect location:', location)
      
      if (location) {
        // Use sendRedirect for proper HTTP redirect
        console.log('[API /s] Sending redirect to:', location)
        return sendRedirect(event, location, response.status)
      }
    }
    
    // Forward response headers (especially Set-Cookie for session)
    response.headers.forEach((value, key) => {
      // Forward all important headers
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        setHeader(event, key, value)
      }
    })
    
    // Handle 404
    if (response.status === 404) {
      console.error('[API /s] 404 - Link not found from gateway')
      setResponseStatus(event, 404)
      return { error: 'Link not found' }
    }
    
    console.log('[API /s] Returning response with status:', response.status)
    // Return the response
    setResponseStatus(event, response.status)
    return response._data
  } catch (error: any) {
    console.error('[API /s] Error:', error)
    console.error('[API /s] Error message:', error.message)
    console.error('[API /s] Error stack:', error.stack)
    
    // Handle errors
    if (error.response) {
      console.error('[API /s] Error response status:', error.response.status)
      console.error('[API /s] Error response data:', error.response._data)
      setResponseStatus(event, error.response.status)
      return error.response._data
    }
    
    // Handle fetch errors
    if (error.status) {
      setResponseStatus(event, error.status)
      return { error: error.message || 'An error occurred' }
    }
    
    throw error
  }
})

