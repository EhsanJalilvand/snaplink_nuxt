export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')
  const linkId = getRouterParam(event, 'linkId')
  const body = await readBody(event)
  
  if (!workspaceId || !linkId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Workspace ID and Link ID are required',
    })
  }

  // Mock update - replace with actual database update later
  const updatedLink = {
    id: linkId,
    name: body.name || 'Updated Payment Link',
    reference: body.reference || `snap.link/pay/${linkId}`,
    amount: body.amount || 0,
    currency: body.currency || 'USD',
    payments: body.payments || 0,
    conversion: body.conversion || 0,
    status: body.status || 'active',
    createdAt: body.createdAt || new Date().toISOString(),
  }

  return {
    data: updatedLink,
  }
})



