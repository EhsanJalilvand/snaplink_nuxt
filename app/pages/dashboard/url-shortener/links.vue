<script setup lang="ts">
definePageMeta({
  title: 'Links',
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()
const toaster = useNuiToasts()

const page = computed({
  get: () => Number.parseInt((route.query.page as string) ?? '1', 10),
  set: (value) => {
    router.push({
      query: {
        ...route.query,
        page: value,
      },
    })
  },
})

const searchQuery = ref('')
const perPage = ref(10)

watch([searchQuery, perPage], () => {
  router.push({
    query: {
      page: undefined,
    },
  })
})

// Links data - TODO: Replace with API call
const links = ref([
  {
    id: '1',
    shortUrl: 'snap.ly/abc123',
    originalUrl: 'https://example.com/very/long/url/path/that/needs/to/be/shortened',
    clicks: 12500,
    createdAt: '2024-01-15',
    status: 'active',
    collection: 'Marketing Campaigns',
  },
  {
    id: '2',
    shortUrl: 'snap.ly/xyz789',
    originalUrl: 'https://example.com/another/very/long/url',
    clicks: 8900,
    createdAt: '2024-01-20',
    status: 'active',
    collection: null,
  },
  {
    id: '3',
    shortUrl: 'snap.ly/def456',
    originalUrl: 'https://example.com/yet/another/long/url/path',
    clicks: 6750,
    createdAt: '2024-02-01',
    status: 'active',
    collection: 'Product Launch',
  },
  {
    id: '4',
    shortUrl: 'snap.ly/ghi321',
    originalUrl: 'https://example.com/more/urls/to/shorten',
    clicks: 5420,
    createdAt: '2024-02-10',
    status: 'paused',
    collection: null,
  },
  {
    id: '5',
    shortUrl: 'snap.ly/jkl654',
    originalUrl: 'https://example.com/final/url/example',
    clicks: 4200,
    createdAt: '2024-02-15',
    status: 'active',
    collection: 'Marketing Campaigns',
  },
  {
    id: '6',
    shortUrl: 'snap.ly/mno987',
    originalUrl: 'https://example.com/short/url',
    clicks: 3200,
    createdAt: '2024-02-20',
    status: 'active',
    collection: null,
  },
  {
    id: '7',
    shortUrl: 'snap.ly/pqr654',
    originalUrl: 'https://example.com/another/example/url',
    clicks: 2100,
    createdAt: '2024-03-01',
    status: 'active',
    collection: 'Product Launch',
  },
  {
    id: '8',
    shortUrl: 'snap.ly/stu321',
    originalUrl: 'https://example.com/long/url/path/example',
    clicks: 1800,
    createdAt: '2024-03-05',
    status: 'expired',
    collection: null,
  },
])

const filteredLinks = computed(() => {
  if (!searchQuery.value.trim()) {
    return links.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return links.value.filter(link =>
    link.shortUrl.toLowerCase().includes(query) ||
    link.originalUrl.toLowerCase().includes(query) ||
    link.collection?.toLowerCase().includes(query)
  )
})

const paginatedLinks = computed(() => {
  const start = (page.value - 1) * perPage.value
  const end = start + perPage.value
  return filteredLinks.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredLinks.value.length / perPage.value)
})

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        color: 'success',
        icon: 'ph:check-circle',
      }
    case 'paused':
      return {
        label: 'Paused',
        color: 'warning',
        icon: 'ph:pause-circle',
      }
    case 'expired':
      return {
        label: 'Expired',
        color: 'muted',
        icon: 'ph:clock',
      }
    default:
      return {
        label: 'Unknown',
        color: 'muted',
        icon: 'ph:question',
      }
  }
}

const handleCreateLink = () => {
  // TODO: Open create link modal/page
  toaster.add({
    title: 'Create Link',
    description: 'Link creation feature will be available soon',
    icon: 'ph:info',
    color: 'info',
    progress: true,
  })
}

const handleCopyLink = (shortUrl: string) => {
  navigator.clipboard.writeText(`https://${shortUrl}`)
  toaster.add({
    title: 'Copied!',
    description: 'Link copied to clipboard',
    icon: 'ph:check',
    progress: true,
  })
}

const handleDeleteLink = (linkId: string) => {
  // TODO: API call to delete link
  links.value = links.value.filter(link => link.id !== linkId)
  toaster.add({
    title: 'Link Deleted',
    description: 'Link has been deleted successfully',
    icon: 'ph:check',
    progress: true,
  })
}
</script>

<template>
  <div class="space-y-6 py-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Links
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Manage and track your shortened links
        </BaseParagraph>
      </div>
      <BaseButton
        variant="primary"
        @click="handleCreateLink"
      >
        <Icon name="ph:plus" class="size-4" />
        <span>Create Link</span>
      </BaseButton>
    </div>

    <!-- Search and Filters -->
    <TairoContentWrapper>
      <template #left>
        <TairoInput
          v-model="searchQuery"
          icon="lucide:search"
          placeholder="Search links..."
          rounded="lg"
        />
      </template>
      <template #right>
        <TairoSelect
          v-model="perPage"
          icon="solar:list-linear"
          rounded="lg"
          size="sm"
          class="w-32"
        >
          <BaseSelectItem :value="10">10 per page</BaseSelectItem>
          <BaseSelectItem :value="25">25 per page</BaseSelectItem>
          <BaseSelectItem :value="50">50 per page</BaseSelectItem>
        </TairoSelect>
      </template>

      <!-- Links Table -->
      <div>
        <div v-if="filteredLinks.length === 0" class="py-12">
          <BasePlaceholderPage
            title="No links found"
            subtitle="Create your first shortened link to get started"
          >
            <template #image>
              <Icon name="solar:link-linear" class="size-16 text-muted-400" />
            </template>
            <BaseButton
              variant="primary"
              @click="handleCreateLink"
            >
              <Icon name="ph:plus" class="size-4" />
              <span>Create Your First Link</span>
            </BaseButton>
          </BasePlaceholderPage>
        </div>

        <div v-else class="space-y-2">
          <TairoFlexTable>
            <template #header>
              <TairoFlexTableHeading type="grow">
                Link
              </TairoFlexTableHeading>
              <TairoFlexTableHeading type="stable">
                Clicks
              </TairoFlexTableHeading>
              <TairoFlexTableHeading type="stable">
                Collection
              </TairoFlexTableHeading>
              <TairoFlexTableHeading type="stable">
                Status
              </TairoFlexTableHeading>
              <TairoFlexTableHeading type="stable">
                Created
              </TairoFlexTableHeading>
              <TairoFlexTableHeading type="shrink">
                Actions
              </TairoFlexTableHeading>
            </template>

            <TairoFlexTableRow
              v-for="link in paginatedLinks"
              :key="link.id"
              rounded="md"
            >
              <TairoFlexTableCell type="grow" data-content="Link">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <BaseHeading
                      as="h4"
                      size="sm"
                      weight="semibold"
                      class="text-muted-900 dark:text-muted-100"
                    >
                      {{ link.shortUrl }}
                    </BaseHeading>
                    <BaseButton
                      size="sm"
                      variant="ghost"
                      @click="handleCopyLink(link.shortUrl)"
                    >
                      <Icon name="ph:copy" class="size-3" />
                    </BaseButton>
                  </div>
                  <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 line-clamp-1">
                    {{ link.originalUrl }}
                  </BaseParagraph>
                </div>
              </TairoFlexTableCell>

              <TairoFlexTableCell type="stable" data-content="Clicks">
                <div class="flex items-center gap-2">
                  <Icon name="solar:mouse-linear" class="size-4 text-muted-400" />
                  <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                    {{ link.clicks.toLocaleString() }}
                  </BaseText>
                </div>
              </TairoFlexTableCell>

              <TairoFlexTableCell type="stable" data-content="Collection">
                <BaseChip
                  v-if="link.collection"
                  size="sm"
                  color="muted"
                >
                  {{ link.collection }}
                </BaseChip>
                <BaseText v-else size="xs" class="text-muted-400">
                  —
                </BaseText>
              </TairoFlexTableCell>

              <TairoFlexTableCell type="stable" data-content="Status">
                <BaseChip
                  :color="getStatusConfig(link.status).color"
                  size="sm"
                >
                  <Icon :name="getStatusConfig(link.status).icon" class="size-3" />
                  <span>{{ getStatusConfig(link.status).label }}</span>
                </BaseChip>
              </TairoFlexTableCell>

              <TairoFlexTableCell type="stable" data-content="Created">
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  {{ new Date(link.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}
                </BaseText>
              </TairoFlexTableCell>

              <TairoFlexTableCell type="shrink" data-content="Actions">
                <div class="flex items-center gap-1">
                  <BaseButton
                    size="sm"
                    variant="ghost"
                    to="/dashboard/url-shortener/overview"
                  >
                    <Icon name="ph:eye" class="size-4" />
                  </BaseButton>
                  <BaseButton
                    size="sm"
                    variant="ghost"
                    color="danger"
                    @click="handleDeleteLink(link.id)"
                  >
                    <Icon name="lucide:trash-2" class="size-4" />
                  </BaseButton>
                </div>
              </TairoFlexTableCell>
            </TairoFlexTableRow>
          </TairoFlexTable>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Showing {{ (page - 1) * perPage + 1 }} to {{ Math.min(page * perPage, filteredLinks.length) }} of {{ filteredLinks.length }} links
            </BaseText>
            <div class="flex items-center gap-2">
              <BaseButton
                size="sm"
                variant="outline"
                :disabled="page === 1"
                @click="page = page - 1"
              >
                <Icon name="lucide:chevron-left" class="size-4" />
              </BaseButton>
              <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                Page {{ page }} of {{ totalPages }}
              </BaseText>
              <BaseButton
                size="sm"
                variant="outline"
                :disabled="page === totalPages"
                @click="page = page + 1"
              >
                <Icon name="lucide:chevron-right" class="size-4" />
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </TairoContentWrapper>
  </div>
</template>

