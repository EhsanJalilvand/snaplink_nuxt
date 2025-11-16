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
      totalSales: 125000,
      totalTransactions: 1250,
      averageTransactionValue: 100,
      period: dateRange || { start: '2024-01-01', end: '2024-12-31' },
      data: [
        { date: '2024-01-01', sales: 45000, transactions: 450 },
        { date: '2024-02-01', sales: 52000, transactions: 520 },
        { date: '2024-03-01', sales: 28000, transactions: 280 },
      ],
    },
  }
})



