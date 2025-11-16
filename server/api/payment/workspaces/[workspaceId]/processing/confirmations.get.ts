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
  const mockConfirmations = [
    {
      id: 'conf-001',
      intentId: 'intent-002',
      status: 'confirmed',
      confirmedAt: new Date(Date.now() - 1800000).toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]

  let filtered = [...mockConfirmations]
  
  if (query.status && query.status !== 'all') {
    filtered = filtered.filter(conf => conf.status === query.status)
  }

  return {
    data: filtered,
  }
})

