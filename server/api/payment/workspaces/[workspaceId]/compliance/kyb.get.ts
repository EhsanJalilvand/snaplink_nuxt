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
  const mockKYB = [
    {
      id: 'kyb-001',
      businessId: 'business-001',
      status: 'verified',
      riskLevel: 'low',
      verifiedAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ]

  let filtered = [...mockKYB]
  
  if (query.status && query.status !== 'all') {
    filtered = filtered.filter(kyb => kyb.status === query.status)
  }
  
  if (query.riskLevel && query.riskLevel !== 'all') {
    filtered = filtered.filter(kyb => kyb.riskLevel === query.riskLevel)
  }

  return {
    data: filtered,
  }
})

