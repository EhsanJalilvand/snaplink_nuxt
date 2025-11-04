/**
 * Set Kratos session cookie in browser
 * 
 * This endpoint redirects to Kratos API to set the session cookie.
 * After successful login, session is created in Kratos but cookie is not set in browser.
 * Redirecting to Kratos API will make a browser request that sets the cookie.
 */

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const query = getQuery(event)
    const returnTo = (query.return_to as string) || '/dashboard'

    // Redirect to Kratos API to set the session cookie
    // This will make a browser request to Kratos which will set the cookie
    // Kratos will then redirect to the return URL
    const kratosUrl = `${config.kratosPublicUrl}/self-service/login/browser?return_to=${encodeURIComponent(returnTo)}`
    
    if (import.meta.dev) {
      console.log('[auth/set-session-cookie.get.ts] Redirecting to Kratos:', kratosUrl)
    }
    
    return sendRedirect(event, kratosUrl)
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/set-session-cookie.get.ts] Error:', error)
    }

    // On error, redirect to login
    const config = useRuntimeConfig()
    const loginUrl = `${config.kratosPublicUrl}/self-service/login/browser`
    return sendRedirect(event, loginUrl)
  }
})

