<script setup lang="ts">
import GlobalLoadingOverlay from '@/components/common/GlobalLoadingOverlay.vue'
import { useAppDirection } from '~/composables/useAppDirection'
import { useWorkspaceBranding } from '~/composables/useWorkspaceBranding'

// Initialize app direction (RTL/LTR) based on locale
useAppDirection()

// Initialize workspace branding globally (applies to all pages including landing)
useWorkspaceBranding()
</script>

<template>
  <BaseProviders class="bg-muted-100 dark:bg-muted-900">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <TairoPanels />
    <GlobalLoadingOverlay />
  </BaseProviders>
</template>
