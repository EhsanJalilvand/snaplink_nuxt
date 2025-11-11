<template>
  <BaseProviders class="bg-muted-100 dark:bg-muted-900">
    <NuxtLoadingIndicator color="#6366f1" :height="3" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <TairoPanels />
    <GlobalLoadingOverlay />
  </BaseProviders>
</template>
