<script setup lang="ts">
import GlobalLoadingOverlay from '@/components/common/GlobalLoadingOverlay.vue'
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
