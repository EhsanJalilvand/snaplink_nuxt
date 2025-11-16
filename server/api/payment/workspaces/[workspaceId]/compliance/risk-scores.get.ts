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
  const mockRiskScores = [
    {
      id: 'risk-001',
      entityId: 'entity-001',
      entityType: 'customer',
      score: 3.2,
      riskLevel: 'low',
      factors: ['low_transaction_volume', 'verified_identity'],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]

  let filtered = [...mockRiskScores]
  
  if (query.riskLevel && query.riskLevel !== 'all') {
    filtered = filtered.filter(risk => risk.riskLevel === query.riskLevel)
  }

  return {
    data: filtered,
  }
})



