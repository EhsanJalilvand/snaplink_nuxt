import { getCookie, getHeader, getQuery, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  // For redirect endpoints, bypass Gateway and go directly to backend
  // This is more reliable and faster for redirect operations
  const backendBaseUrl = 'http://localhost:5007' // Direct connection to UrlShortener API
  
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
  
  console.log('[API /r] Using direct backend connection')
  console.log('[API /r] Target URL:', fullUrl)
  
  try {
    // Make request to gateway
    const response = await $fetch.raw(fullUrl, {
      method: method as any,
      headers,
      body,
      redirect: 'manual', // Handle redirects manually
    })
    
    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (location) {
        // If it's a relative URL starting with /r/, keep it relative
        if (location.startsWith('/r/')) {
          setResponseStatus(event, response.status)
          setHeader(event, 'Location', location)
          return
        }
        // If it's an absolute URL or external, redirect directly
        setResponseStatus(event, response.status)
        setHeader(event, 'Location', location)
        return
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
      setResponseStatus(event, 404)
      return { error: 'Link not found' }
    }
    
    // Return the response
    setResponseStatus(event, response.status)
    return response._data
  } catch (error: any) {
    // Handle errors
    if (error.response) {
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

