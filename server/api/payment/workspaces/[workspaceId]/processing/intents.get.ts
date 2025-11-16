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
  const mockIntents = [
    {
      id: 'intent-001',
      amount: 420,
      currency: 'USD',
      status: 'pending',
      gatewayId: 'gateway-001',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'intent-002',
      amount: 1299,
      currency: 'USD',
      status: 'succeeded',
      gatewayId: 'gateway-001',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ]

  // Apply filters
  let filtered = [...mockIntents]
  
  if (query.status && query.status !== 'all') {
    filtered = filtered.filter(intent => intent.status === query.status)
  }
  
  if (query.search) {
    const search = (query.search as string).toLowerCase()
    filtered = filtered.filter(intent => 
      intent.id.toLowerCase().includes(search)
    )
  }

  return {
    data: filtered,
  }
})



