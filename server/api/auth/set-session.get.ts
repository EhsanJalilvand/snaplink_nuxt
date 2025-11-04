/**
 * Set Kratos Session Cookie Endpoint
 * 
 * This endpoint is called after successful login to set the Kratos session cookie
 * in the browser. It redirects to Kratos API which will set the cookie.
 * 
 * Flow:
 * 1. User logs in successfully (session created in Kratos via server-side)
 * 2. Redirect to this endpoint
 * 3. This endpoint redirects to Kratos login browser flow with return_to
 * 4. Kratos checks if user is already logged in (via server-side login)
 * 5. If logged in, Kratos sets cookie and redirects to return_to
 * 6. If not logged in, Kratos shows login form
 */

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const query = getQuery(event)
    const returnTo = (query.return_to as string) || '/dashboard'

    // Redirect to Kratos login browser flow with return_to
    // Kratos will check if user is already logged in (via server-side login)
    // and set the cookie, then redirect to return_to
    // If not logged in, Kratos will show login form
    const kratosUrl = `${config.kratosPublicUrl}/self-service/login/browser?return_to=${encodeURIComponent(returnTo)}`
    
    if (import.meta.dev) {
      console.log('[auth/set-session.get.ts] Redirecting to Kratos:', kratosUrl)
    }
    
    return sendRedirect(event, kratosUrl)
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[auth/set-session.get.ts] Error:', error)
    }

    // On error, redirect to return URL
    const query = getQuery(event)
    const returnTo = (query.return_to as string) || '/dashboard'
    return sendRedirect(event, returnTo)
  }
})

