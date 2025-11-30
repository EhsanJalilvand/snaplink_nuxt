<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <div class="mb-4">
        <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-primary-500" />
      </div>
      <p class="text-muted-foreground">Redirecting...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false, // No layout for redirect pages
})

const route = useRoute()
const shortCode = route.params.shortCode as string

// Both server and client: Redirect to API route which will handle the redirect
// The API route uses sendRedirect which works properly in both contexts
await navigateTo(`/api/s/${shortCode}`, { external: false })
</script>
