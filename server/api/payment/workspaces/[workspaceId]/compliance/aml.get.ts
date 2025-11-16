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
  const mockAML = [
    {
      id: 'aml-001',
      transactionId: 'tx-001',
      status: 'cleared',
      checkedAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ]

  let filtered = [...mockAML]
  
  if (query.status && query.status !== 'all') {
    filtered = filtered.filter(aml => aml.status === query.status)
  }

  return {
    data: filtered,
  }
})



