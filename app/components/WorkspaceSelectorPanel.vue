<script setup lang="ts">
import { computed, onMounted, onUnmounted } from '#imports'
import { useNuiToasts } from '#imports'
import WorkspaceEditorDrawer from '~/components/workspace/WorkspaceEditorDrawer.vue'
import type { Workspace } from '~/types/workspace'
import { useWorkspace } from '~/composables/useWorkspace'

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
const { workspaces, isLoading, error, currentWorkspace, fetchWorkspaces, selectWorkspace } = useWorkspace()

const searchQuery = ref('')

const selectedWorkspaceId = computed(() => currentWorkspace.value?.id ?? props.currentWorkspaceId)

const filteredWorkspaces = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return workspaces.value
  }

  return workspaces.value.filter((workspace) => {
    return (
      workspace.name.toLowerCase().includes(query) ||
      (workspace.description ?? '').toLowerCase().includes(query)
    )
  })
})

const handleSelect = (workspace: Workspace) => {
  const selected = selectWorkspace(workspace)

  if (selected) {
    toaster.add({
      title: 'Workspace switched',
      description: `You are now working in ${selected.name}`,
      icon: 'ph:check',
      progress: true,
    })
    emits('close', selected)
  }
}

const isEditorOpen = ref(false)
const editorWorkspace = ref<Workspace | null>(null)

const openCreateWorkspace = () => {
  editorWorkspace.value = null
  isEditorOpen.value = true
}

const openEditWorkspace = (workspace: Workspace) => {
  editorWorkspace.value = workspace
  isEditorOpen.value = true
}

const handleSaved = async () => {
  await fetchWorkspaces({ force: true })
  isEditorOpen.value = false
}

const handleClose = () => {
  emits('close')
}

onMounted(async () => {
  await fetchWorkspaces()

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose()
    }
  }

  document.addEventListener('keydown', handleKeyDown)

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
})
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
        <div
          v-if="isLoading && workspaces.length === 0"
          class="space-y-2"
        >
          <div
            v-for="index in 4"
            :key="`skeleton-${index}`"
            class="h-20 rounded-lg border border-muted-200/80 bg-muted-100/60 animate-pulse dark:border-muted-700/60 dark:bg-muted-900/40"
          />
        </div>

        <template v-else>
          <button
            v-for="workspace in filteredWorkspaces"
            :key="workspace.id"
            type="button"
            class="w-full rounded-lg border border-muted-200 dark:border-muted-700 p-4 text-start transition-all duration-200 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20"
            :class="
              selectedWorkspaceId === workspace.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'hover:shadow-sm'
            "
            @click="handleSelect(workspace)"
          >
            <div class="flex items-start gap-4">
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

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <BaseHeading
                      as="h4"
                      size="sm"
                      weight="semibold"
                      class="mb-1 text-muted-800 dark:text-muted-100"
                    >
                      {{ workspace.name }}
                    </BaseHeading>
                    <BaseParagraph
                      v-if="workspace.description"
                      size="xs"
                      class="mb-2 line-clamp-1 text-muted-500 dark:text-muted-400"
                    >
                      {{ workspace.description }}
                    </BaseParagraph>
                  </div>
                  <Icon
                    v-if="selectedWorkspaceId === workspace.id"
                    name="lucide:check-circle"
                    class="size-5 shrink-0 text-primary-600 dark:text-primary-400"
                  />
                </div>

                <div class="mt-2 flex items-center gap-4">
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

          <div
            v-if="!isLoading && filteredWorkspaces.length === 0"
            class="flex flex-col items-center justify-center py-12"
          >
            <Icon
              name="solar:search-linear"
              class="mb-4 size-12 text-muted-400"
            />
            <BaseHeading
              as="h4"
              size="sm"
              weight="medium"
              class="mb-2 text-muted-600 dark:text-muted-400"
            >
              No workspaces found
            </BaseHeading>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              Try adjusting your search query
            </BaseParagraph>
          </div>

          <BaseAlert
            v-if="error"
            color="warning"
            variant="pastel"
            class="rounded-xl"
          >
            <template #title>
              Unable to load workspaces
            </template>
            <p class="text-xs text-muted-600 dark:text-muted-300">
              {{ error }}
            </p>
          </BaseAlert>
        </template>
      </div>
    </div>

    <!-- Footer -->
    <div class="border-t border-muted-200 dark:border-muted-700 p-4">
      <div class="flex gap-3">
        <BaseButton
          variant="outline"
          class="flex-1"
          :disabled="!selectedWorkspaceId"
          @click="openEditWorkspace(workspaces.find((item) => item.id === selectedWorkspaceId)!)"
        >
          <Icon name="ph:pencil-simple" class="size-4" />
          <span>Edit Workspace</span>
        </BaseButton>
        <BaseButton
          variant="primary"
          class="flex-1"
          @click="openCreateWorkspace"
        >
          <Icon name="ph:plus" class="size-4" />
          <span>Create New Workspace</span>
        </BaseButton>
      </div>
    </div>

    <WorkspaceEditorDrawer
      v-if="isEditorOpen"
      :workspace="editorWorkspace || workspaces.find((item) => item.id === selectedWorkspaceId) || null"
      @close="isEditorOpen = false"
      @saved="handleSaved"
    />
  </div>
</template>

