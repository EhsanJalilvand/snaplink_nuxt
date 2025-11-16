export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')
  const query = getQuery(event)
  
  if (!workspaceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Workspace ID is required',
    })
  }

  // Mock data - replace with actual database query later
  const mockGateways = [
    {
      id: 'gateway-001',
      name: 'Stripe Gateway',
      type: 'stripe',
      status: 'active',
      mode: 'live',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'gateway-002',
      name: 'PayPal Gateway',
      type: 'paypal',
      status: 'active',
      mode: 'sandbox',
      createdAt: '2024-02-01T14:00:00Z',
    },
  ]

  // Apply filters
  let filtered = [...mockGateways]
  
  if (query.status && query.status !== 'all') {
    filtered = filtered.filter(gateway => gateway.status === query.status)
  }
  
  if (query.mode && query.mode !== 'all') {
    filtered = filtered.filter(gateway => gateway.mode === query.mode)
  }
  
  if (query.search) {
    const search = (query.search as string).toLowerCase()
    filtered = filtered.filter(gateway => 
      gateway.name.toLowerCase().includes(search) ||
      gateway.type.toLowerCase().includes(search)
    )
  }

  return {
    data: filtered,
  }
})



