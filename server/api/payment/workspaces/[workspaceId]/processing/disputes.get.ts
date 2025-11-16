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
  const mockDisputes = [
    {
      id: 'dispute-001',
      paymentId: 'payment-001',
      amount: 1299,
      currency: 'USD',
      status: 'open',
      reason: 'fraudulent',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ]

  let filtered = [...mockDisputes]
  
  if (query.status && query.status !== 'all') {
    filtered = filtered.filter(dispute => dispute.status === query.status)
  }

  return {
    data: filtered,
  }
})

