<script setup lang="ts">
import { computed } from 'vue'
import { useNuiToasts } from '#imports'

const props = withDefaults(
  defineProps<{
    currentWorkspaceId?: string
  }>(),
  {
    currentWorkspaceId: undefined,
  },
)

const emits = defineEmits<{
  close: [selectedWorkspace?: Workspace]
}>()

const toaster = useNuiToasts()

// Test workspaces - TODO: Replace with API call
const workspaces = ref<Workspace[]>([
  {
    id: '1',
    name: 'Personal Workspace',
    description: 'My personal links and projects',
    logo: null,
    members: 1,
    links: 0,
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Business Team',
    description: 'Marketing and sales team workspace',
    logo: null,
    members: 5,
    links: 12,
    createdAt: '2024-01-15',
  },
  {
    id: '3',
    name: 'Development Hub',
    description: 'Development and engineering workspace',
    logo: null,
    members: 8,
    links: 25,
    createdAt: '2024-02-01',
  },
  {
    id: '4',
    name: 'Client Projects',
    description: 'Client-facing projects and links',
    logo: null,
    members: 3,
    links: 8,
    createdAt: '2024-02-10',
  },
  {
    id: '5',
    name: 'Marketing Campaigns',
    description: 'Marketing campaigns and promotional links',
    logo: null,
    members: 4,
    links: 15,
    createdAt: '2024-02-20',
  },
])

const searchQuery = ref('')
const selectedWorkspace = ref<Workspace | null>(
  props.currentWorkspaceId
    ? workspaces.value.find(w => w.id === props.currentWorkspaceId) || null
    : workspaces.value[0] || null,
)

const filteredWorkspaces = computed(() => {
  if (!searchQuery.value.trim()) {
    return workspaces.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return workspaces.value.filter(workspace =>
    workspace.name.toLowerCase().includes(query) ||
    workspace.description?.toLowerCase().includes(query)
  )
})

function selectWorkspace(workspace: Workspace) {
  selectedWorkspace.value = workspace
  
  // TODO: API call to switch workspace
  toaster.add({
    title: 'Workspace Switched',
    description: `Switched to ${workspace.name}`,
    icon: 'ph:check',
    progress: true,
  })
  
  emits('close', workspace)
}

function createNewWorkspace() {
  // TODO: Navigate to workspace creation page or open modal
  toaster.add({
    title: 'Create Workspace',
    description: 'Workspace creation will be implemented soon',
    icon: 'ph:info',
    color: 'info',
    progress: true,
  })
}

function handleClose() {
  emits('close')
}

// Handle keyboard shortcuts
onMounted(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }
  
  document.addEventListener('keydown', handleKeyDown)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
})

interface Workspace {
  id: string
  name: string
  description?: string
  logo?: string | null
  members: number
  links: number
  createdAt: string
}
</script>

<template>
  <div class="flex h-full flex-col bg-white dark:bg-muted-800">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-muted-200 dark:border-muted-700 p-6">
      <div class="flex items-center gap-3">
        <Icon name="solar:layers-linear" class="size-5 text-primary-500" />
        <BaseHeading
          as="h3"
          size="lg"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100"
        >
          Select Workspace
        </BaseHeading>
      </div>
      <BaseButton
        size="sm"
        variant="ghost"
        @click="handleClose"
      >
        <Icon name="lucide:x" class="size-4" />
      </BaseButton>
    </div>

    <!-- Search -->
    <div class="border-b border-muted-200 dark:border-muted-700 p-4">
      <div class="relative">
        <Icon
          name="lucide:search"
          class="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search workspaces..."
          class="w-full rounded-lg border border-muted-200 dark:border-muted-700 bg-muted-50 dark:bg-muted-900 ps-10 pe-4 py-2 text-sm text-muted-800 dark:text-muted-100 placeholder:text-muted-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
      </div>
    </div>

    <!-- Workspaces List -->
    <div class="flex-1 overflow-y-auto p-4">
      <div class="space-y-2">
        <button
          v-for="workspace in filteredWorkspaces"
          :key="workspace.id"
          type="button"
          class="w-full rounded-lg border border-muted-200 dark:border-muted-700 p-4 text-start transition-all duration-200 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20"
          :class="
            selectedWorkspace?.id === workspace.id
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'hover:shadow-sm'
          "
          @click="selectWorkspace(workspace)"
        >
          <div class="flex items-start gap-4">
            <!-- Workspace Logo/Avatar -->
            <div class="shrink-0">
              <BaseAvatar
                v-if="workspace.logo"
                :src="workspace.logo"
                size="md"
              />
              <div
                v-else
                class="flex size-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30"
              >
                <Icon
                  name="solar:layers-linear"
                  class="size-6 text-primary-600 dark:text-primary-400"
                />
              </div>
            </div>

            <!-- Workspace Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <BaseHeading
                    as="h4"
                    size="sm"
                    weight="semibold"
                    class="text-muted-800 dark:text-muted-100 mb-1"
                  >
                    {{ workspace.name }}
                  </BaseHeading>
                  <BaseParagraph
                    v-if="workspace.description"
                    size="xs"
                    class="text-muted-500 dark:text-muted-400 mb-2 line-clamp-1"
                  >
                    {{ workspace.description }}
                  </BaseParagraph>
                </div>
                <Icon
                  v-if="selectedWorkspace?.id === workspace.id"
                  name="lucide:check-circle"
                  class="size-5 shrink-0 text-primary-600 dark:text-primary-400"
                />
              </div>

              <!-- Workspace Stats -->
              <div class="flex items-center gap-4 mt-2">
                <div class="flex items-center gap-1.5">
                  <Icon
                    name="solar:users-group-linear"
                    class="size-3.5 text-muted-400"
                  />
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    {{ workspace.members }} {{ workspace.members === 1 ? 'member' : 'members' }}
                  </BaseText>
                </div>
                <div class="flex items-center gap-1.5">
                  <Icon
                    name="solar:link-linear"
                    class="size-3.5 text-muted-400"
                  />
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    {{ workspace.links }} {{ workspace.links === 1 ? 'link' : 'links' }}
                  </BaseText>
                </div>
              </div>
            </div>
          </div>
        </button>

        <!-- Empty State -->
        <div
          v-if="filteredWorkspaces.length === 0"
          class="flex flex-col items-center justify-center py-12"
        >
          <Icon
            name="solar:search-linear"
            class="size-12 text-muted-400 mb-4"
          />
          <BaseHeading
            as="h4"
            size="sm"
            weight="medium"
            class="text-muted-600 dark:text-muted-400 mb-2"
          >
            No workspaces found
          </BaseHeading>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            Try adjusting your search query
          </BaseParagraph>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="border-t border-muted-200 dark:border-muted-700 p-4">
      <BaseButton
        variant="primary"
        class="w-full"
        @click="createNewWorkspace"
      >
        <Icon name="ph:plus" class="size-4" />
        <span>Create New Workspace</span>
      </BaseButton>
    </div>
  </div>
</template>

