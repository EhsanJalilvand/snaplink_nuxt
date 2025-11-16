export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')
  
  if (!workspaceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Workspace ID is required',
    })
  }

  // Mock data - replace with actual database query later
  return {
    data: {
      id: 'gateway-001',
      name: 'Stripe Gateway',
      type: 'stripe',
      status: 'active',
      mode: 'live',
      apiKey: 'sk_live_***',
      webhookSecret: 'whsec_***',
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: new Date().toISOString(),
    },
  }
})



