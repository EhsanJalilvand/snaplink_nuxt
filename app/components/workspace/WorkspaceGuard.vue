<script setup lang="ts">
import { ref, watch, onMounted } from '#imports'
import { useWorkspaceGuard } from '~/composables/useWorkspaceGuard'

const { isGuardActive, openWorkspaceSelector } = useWorkspaceGuard()

// Track if component is mounted to prevent hydration mismatch
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

// Debug: Log guard state
watch(isGuardActive, (active) => {
  if (import.meta.dev) {
    console.log('[WorkspaceGuard] isGuardActive changed:', active)
  }
}, { immediate: true })

const handleSelectWorkspace = async () => {
  if (import.meta.dev) {
    console.log('[WorkspaceGuard] Opening workspace selector...')
  }
  await openWorkspaceSelector()
  if (import.meta.dev) {
    console.log('[WorkspaceGuard] Workspace selector closed')
  }
}
</script>

<template>
  <div v-if="isMounted && isGuardActive" class="flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
    <div class="w-full max-w-md">
      <div class="rounded-xl border border-muted-200 bg-white p-8 dark:border-muted-700 dark:bg-muted-800">
        <div class="flex flex-col items-center justify-center text-center">
          <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-muted-100 dark:bg-muted-700">
            <Icon name="solar:layers-linear" class="size-8 text-muted-400" />
          </div>
          <BaseHeading
            as="h3"
            size="lg"
            weight="semibold"
            class="mb-2 text-muted-800 dark:text-muted-100"
          >
            No Workspace Selected
          </BaseHeading>
          <BaseParagraph size="sm" class="mb-6 text-muted-500 dark:text-muted-400">
            Please select a workspace to continue. You need to choose a workspace before accessing this section.
          </BaseParagraph>
          <BaseButton
            variant="primary"
            size="sm"
            @click="handleSelectWorkspace"
          >
            <Icon name="solar:layers-linear" class="size-4" />
            <span>Select Workspace</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

