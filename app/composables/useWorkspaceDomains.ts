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
  const { authToken } = useAuth()

  const fetchDomains = async () => {
    if (!workspaceId.value) {
      error.value = 'No workspace selected'
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{
        data: { domains: WorkspaceDomain[] }
      }>(`/api/workspaces/${workspaceId.value}/domains/active`, {
        baseURL: useRuntimeConfig().public.gatewayUrl || 'http://localhost:5100',
        headers: {
          Authorization: `Bearer ${authToken.value}`,
        },
      })

      domains.value = response.data.domains || []
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
      value: d.isSubdomain ? 'subdomain' : 'custom',
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

