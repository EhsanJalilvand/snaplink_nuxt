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
      totalSettled: 120000,
      totalFees: 3480,
      period: dateRange || { start: '2024-01-01', end: '2024-12-31' },
      data: [
        { date: '2024-01-01', settled: 43000, fees: 1247 },
        { date: '2024-02-01', settled: 50000, fees: 1450 },
        { date: '2024-03-01', settled: 27000, fees: 783 },
      ],
    },
  }
})

