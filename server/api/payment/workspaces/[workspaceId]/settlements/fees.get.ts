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
  const mockFees = [
    {
      id: 'fee-001',
      transactionId: 'tx-001',
      amount: 2.9,
      currency: 'USD',
      feeType: 'processing',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]

  let filtered = [...mockFees]
  
  if (query.transactionId) {
    filtered = filtered.filter(fee => fee.transactionId === query.transactionId)
  }

  return {
    data: filtered,
  }
})



