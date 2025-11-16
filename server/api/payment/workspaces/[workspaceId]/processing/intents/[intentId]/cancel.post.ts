export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')
  const intentId = getRouterParam(event, 'intentId')
  
  if (!workspaceId || !intentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Workspace ID and Intent ID are required',
    })
  }

  // Mock cancellation - replace with actual database update later
  return {
    success: true,
    data: {
      id: intentId,
      status: 'canceled',
      canceledAt: new Date().toISOString(),
    },
  }
})

