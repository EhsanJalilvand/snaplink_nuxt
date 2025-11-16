export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')
  
  if (!workspaceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Workspace ID is required',
    })
  }

  // Mock data
  return {
    data: {
      channels: {
        email: true,
        push: true,
        sms: false,
        webhook: true,
      },
      events: {
        success: true,
        failed: true,
        refund: true,
        dispute: true,
      },
      templates: {
        success: 'Payment successful: {{payment.id}} for {{payment.amount}} {{payment.currency}}',
        failed: 'Payment failed: {{payment.id}} - {{payment.reason}}',
      },
    },
  }
})



