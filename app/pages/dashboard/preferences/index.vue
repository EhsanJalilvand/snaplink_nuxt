<script setup lang="ts">
import PreferencesPageHeader from '~/components/preferences/PreferencesPageHeader.vue'
import WorkspacePreferences from '~/components/workspace/WorkspacePreferences.vue'
import { useWorkspace } from '~/composables/useWorkspace'

definePageMeta({
  title: 'Preferences',
  layout: 'dashboard',
})

const route = useRoute()
const { currentWorkspaceId } = useWorkspace()

// Get workspaceId from query param or current workspace
const workspaceId = computed(() => {
  const queryWorkspaceId = route.query.workspaceId as string | undefined
  return queryWorkspaceId || currentWorkspaceId.value
})
</script>

<template>
  <div class="space-y-6 py-6">
    <PreferencesPageHeader />

    <WorkspacePreferences :workspace-id="workspaceId" />
  </div>
</template>

