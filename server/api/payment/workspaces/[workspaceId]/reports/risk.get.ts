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
  const dateRange = query.dateRange ? JSON.parse(query.dateRange as string) : null
  
  return {
    data: {
      averageRiskScore: 3.2,
      highRiskTransactions: 12,
      mediumRiskTransactions: 45,
      lowRiskTransactions: 1193,
      period: dateRange || { start: '2024-01-01', end: '2024-12-31' },
      data: [
        { date: '2024-01-01', riskScore: 3.1, highRisk: 4, mediumRisk: 15, lowRisk: 431 },
        { date: '2024-02-01', riskScore: 3.3, highRisk: 5, mediumRisk: 18, lowRisk: 497 },
        { date: '2024-03-01', riskScore: 3.2, highRisk: 3, mediumRisk: 12, lowRisk: 265 },
      ],
    },
  }
})



