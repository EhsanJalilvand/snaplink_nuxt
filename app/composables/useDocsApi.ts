import { computed } from '#imports'

interface ApiEndpointDescriptor {
  method: string
  path: string
  description: string
}

const RAW_ENDPOINTS: ApiEndpointDescriptor[] = [
  {
    method: 'POST',
    path: '/v1/links',
    description: 'Create a new short link with optional visibility, expiry, and notifications.',
  },
  {
    method: 'GET',
    path: '/v1/links/:id',
    description: 'Retrieve link metadata, analytics summary, and current status.',
  },
  {
    method: 'POST',
    path: '/v1/payment-links',
    description: 'Generate a smart-contract backed payment request in three guided steps.',
  },
  {
    method: 'POST',
    path: '/v1/webhooks/test',
    description: 'Send a test payload to validate your webhook receiver.',
  },
]

export const useDocsApi = () => {
  const endpoints = computed(() => RAW_ENDPOINTS)

  return {
    endpoints,
  }
}

