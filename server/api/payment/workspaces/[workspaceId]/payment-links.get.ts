export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')
  const query = getQuery(event)
  
  if (!workspaceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Workspace ID is required',
    })
  }

  // Mock data - replace with actual database query later
  const mockLinks = [
    {
      id: 'pay-001',
      name: 'Launch Bundle',
      reference: 'snap.link/pay/launch',
      amount: 420,
      currency: 'USD',
      payments: 186,
      conversion: 64.2,
      status: 'active',
      createdAt: '2024-02-11T10:20:00Z',
    },
    {
      id: 'pay-002',
      name: 'Pro Lifetime Access',
      reference: 'snap.link/pay/pro',
      amount: 1299,
      currency: 'USD',
      payments: 72,
      conversion: 51.8,
      status: 'completed',
      createdAt: '2024-02-01T14:35:00Z',
    },
    {
      id: 'pay-003',
      name: 'Escrow • Vendor Onboarding',
      reference: 'snap.link/pay/escrow',
      amount: 8400,
      currency: 'USDC',
      payments: 12,
      conversion: 88.4,
      status: 'active',
      createdAt: '2024-01-21T09:05:00Z',
    },
    {
      id: 'pay-004',
      name: 'Private Beta Access',
      reference: 'snap.link/pay/beta',
      amount: 89,
      currency: 'EUR',
      payments: 360,
      conversion: 71.5,
      status: 'paused',
      createdAt: '2024-02-14T16:15:00Z',
    },
  ]

  // Apply filters
  let filtered = [...mockLinks]
  
  if (query.status && query.status !== 'all') {
    filtered = filtered.filter(link => link.status === query.status)
  }
  
  if (query.currency && query.currency !== 'all') {
    filtered = filtered.filter(link => link.currency === query.currency)
  }
  
  if (query.search) {
    const search = (query.search as string).toLowerCase()
    filtered = filtered.filter(link => 
      link.name.toLowerCase().includes(search) ||
      link.reference.toLowerCase().includes(search)
    )
  }

  return {
    data: filtered,
  }
})



