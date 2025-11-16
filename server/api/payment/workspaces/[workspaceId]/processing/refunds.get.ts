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
  const mockRefunds = [
    {
      id: 'refund-001',
      paymentId: 'payment-001',
      amount: 420,
      currency: 'USD',
      status: 'completed',
      reason: 'customer_request',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]

  let filtered = [...mockRefunds]
  
  if (query.status && query.status !== 'all') {
    filtered = filtered.filter(refund => refund.status === query.status)
  }

  return {
    data: filtered,
  }
})



