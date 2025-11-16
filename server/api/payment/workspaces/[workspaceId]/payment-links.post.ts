export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')
  const body = await readBody(event)
  
  if (!workspaceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Workspace ID is required',
    })
  }

  // Mock creation - replace with actual database insert later
  const newLink = {
    id: `pay-${Date.now()}`,
    name: body.name || 'New Payment Link',
    reference: body.reference || `snap.link/pay/${Date.now()}`,
    amount: body.amount || 0,
    currency: body.currency || 'USD',
    payments: 0,
    conversion: 0,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  }

  return {
    data: newLink,
  }
})

