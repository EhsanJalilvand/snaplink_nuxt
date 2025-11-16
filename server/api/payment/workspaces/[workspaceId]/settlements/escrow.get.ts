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
  const mockEscrows = [
    {
      id: 'escrow-001',
      gatewayId: 'gateway-001',
      amount: 8400,
      currency: 'USDC',
      status: 'held',
      releaseDate: new Date(Date.now() + 2592000000).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]

  let filtered = [...mockEscrows]
  
  if (query.gatewayId) {
    filtered = filtered.filter(escrow => escrow.gatewayId === query.gatewayId)
  }

  return {
    data: filtered,
  }
})

