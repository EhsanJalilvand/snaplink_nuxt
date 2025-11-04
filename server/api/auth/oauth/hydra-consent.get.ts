/**
 * Handle Hydra consent_challenge after login
 * 
 * Flow:
 * 1. User logs in and login challenge accepted
 * 2. Hydra redirects to this endpoint with consent_challenge
 * 3. This endpoint accepts consent and redirects back to Hydra
 * 4. Hydra issues tokens
 */

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const query = getQuery(event)
    const consentChallenge = query.consent_challenge as string

    if (!consentChallenge) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing consent_challenge parameter',
      })
    }

    // Get login request info from Hydra
    const consentRequest = await $fetch<{
      subject: string
      requested_scope: string[]
      client?: {
        client_id: string
      }
    }>(`${config.hydraAdminUrl}/admin/oauth2/auth/requests/consent`, {
      query: {
        consent_challenge: consentChallenge,
      },
    })

    if (!consentRequest?.subject) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid consent challenge',
      })
    }

    // Accept consent - grant all requested scopes
    const acceptResponse = await $fetch<{
      redirect_to: string
    }>(`${config.hydraAdminUrl}/admin/oauth2/auth/requests/consent/accept?consent_challenge=${encodeURIComponent(consentChallenge)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        grant_scope: consentRequest.requested_scope || ['openid', 'profile', 'email', 'offline'],
        grant_access_token_audience: consentRequest.client?.client_id ? [consentRequest.client.client_id] : [],
        session: {
          // Add user info to session
          access_token: {
            email: consentRequest.subject,
          },
          id_token: {
            email: consentRequest.subject,
            email_verified: true,
          },
        },
        remember: true,
        remember_for: 3600,
      },
    })

    // Redirect to Hydra callback
    if (acceptResponse?.redirect_to) {
      return sendRedirect(event, acceptResponse.redirect_to)
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to accept consent challenge',
    })
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[oauth/hydra-consent.get.ts] Error:', error)
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to handle consent challenge',
      message: error.message || 'Failed to handle consent challenge',
    })
  }
})

