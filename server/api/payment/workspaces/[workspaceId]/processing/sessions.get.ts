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
  const mockSessions = [
    {
      id: 'session-001',
      intentId: 'intent-001',
      status: 'active',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ]

  let filtered = [...mockSessions]
  
  if (query.status && query.status !== 'all') {
    filtered = filtered.filter(session => session.status === query.status)
  }

  return {
    data: filtered,
  }
})



