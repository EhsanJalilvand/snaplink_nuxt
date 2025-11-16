export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')
  const query = getQuery(event)
  
  if (!workspaceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Workspace ID is required',
    })
  }

  // Mock data
  const mockLogs = [
    {
      id: 'settlement-001',
      gatewayId: 'gateway-001',
      amount: 50000,
      currency: 'USD',
      status: 'completed',
      settledAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ]

  let filtered = [...mockLogs]
  
  if (query.gatewayId) {
    filtered = filtered.filter(log => log.gatewayId === query.gatewayId)
  }

  return {
    data: filtered,
  }
})



