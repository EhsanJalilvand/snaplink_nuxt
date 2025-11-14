<script setup lang="ts">
import PreferencesPageHeader from '~/components/preferences/PreferencesPageHeader.vue'
import WorkspacePreferences from '~/components/workspace/WorkspacePreferences.vue'
import { useWorkspace } from '~/composables/useWorkspace'

definePageMeta({
  title: 'Preferences',
  layout: 'dashboard',
})

const { currentWorkspaceId } = useWorkspace()

// Get workspaceId from current workspace state (not from URL)
const workspaceId = computed(() => currentWorkspaceId.value)
</script>

<template>
  <div class="space-y-6 py-6">
    <PreferencesPageHeader />

    <WorkspacePreferences :workspace-id="workspaceId" />
  </div>
</template>

