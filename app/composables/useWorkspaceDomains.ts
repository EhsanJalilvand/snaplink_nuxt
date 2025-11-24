import { ref, computed } from '#imports'
import { useWorkspaceContext } from './useWorkspaceContext'
import { useApi } from './useApi'

export interface WorkspaceDomain {
  isSubdomain: boolean
  domainName: string
  isVerified: boolean
}

export const useWorkspaceDomains = () => {
  const domains = ref<WorkspaceDomain[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const { workspaceId } = useWorkspaceContext()
  const api = useApi()

  const fetchDomains = async () => {
    const wsId = workspaceId.value
    if (!wsId) {
      error.value = 'No workspace selected'
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<{
        data: { domains: WorkspaceDomain[] }
      }>(`/api/workspaces/${wsId}/domains/active`, {
        base: 'gateway',
        requiresAuth: true,
        retry: 0,
        timeout: 7000,
        quiet: true,
      })

      domains.value = response?.data?.domains || []
    }
    catch (err: any) {
      console.error('Failed to fetch workspace domains:', err)
      error.value = err.message || 'Failed to fetch domains'
      domains.value = []
    }
    finally {
      isLoading.value = false
    }
  }

  const domainOptions = computed(() => {
    return domains.value.map(d => ({
      value: d.domainName,
      label: d.domainName,
      domainType: d.isSubdomain ? 'subdomain' : 'custom',
      domainValue: d.domainName,
    }))
  })

  return {
    domains,
    domainOptions,
    isLoading,
    error,
    fetchDomains,
  }
}

