<script setup lang="ts">
import type { Workspace } from '~/types/workspace'
import { computed, onMounted, onUnmounted, ref, useNuiToasts } from '#imports'
import WorkspaceEditorDrawer from '~/components/WorkspaceEditorDrawer.vue'
import WorkspaceListItem from '~/components/WorkspaceListItem.vue'
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
const isEditorOpen = ref(false)
const editorWorkspace = ref<Workspace | null>(null)

const selectedWorkspaceId = computed(() => currentWorkspace.value?.id ?? props.currentWorkspaceId)

const filteredWorkspaces = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return workspaces.value
  }

  return workspaces.value.filter((workspace) => {
    return (
      workspace.name.toLowerCase().includes(query)
      || (workspace.description ?? '').toLowerCase().includes(query)
    )
  })
})

function handleSelect(workspace: Workspace) {
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

function openCreateWorkspace() {
  editorWorkspace.value = null
  isEditorOpen.value = true
}

function openEditWorkspace(workspace: Workspace) {
  editorWorkspace.value = workspace
  isEditorOpen.value = true
}

async function handleSaved(savedWorkspace?: Workspace | null) {
  await fetchWorkspaces({ force: true })
  closeEditor()

  if (savedWorkspace) {
    selectWorkspace(savedWorkspace)
  }
}

function handleClose() {
  emits('close')
}

function closeEditor() {
  isEditorOpen.value = false
  editorWorkspace.value = null
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
          <WorkspaceListItem
            v-for="workspace in filteredWorkspaces"
            :key="workspace.id"
            :workspace="workspace"
            :selected="selectedWorkspaceId === workspace.id"
            @select="handleSelect"
            @edit="openEditWorkspace"
          />

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
    <div class="border-t border-muted-200 dark:border-muted-700">
      <BaseButton
        variant="primary"
        class="flex w-full items-center justify-center gap-2 rounded-none py-5 text-base font-semibold"
        @click="openCreateWorkspace"
      >
        <Icon name="ph:plus" class="size-4" />
        <span>Create New Workspace</span>
      </BaseButton>
    </div>

    <WorkspaceEditorDrawer
      v-if="isEditorOpen"
      :workspace="editorWorkspace"
      @close="closeEditor"
      @saved="handleSaved"
    />
  </div>
</template>
