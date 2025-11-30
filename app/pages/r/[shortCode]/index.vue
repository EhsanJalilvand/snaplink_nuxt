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

// Server-side: Make request to redirect API
if (import.meta.server) {
  const handleRedirect = async () => {
    try {
      // The API will return a redirect response
      const response = await $fetch.raw(`/api/r/${shortCode}`, {
        method: 'GET',
        redirect: 'manual',
      })
      
      // Handle redirects (3xx status codes)
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (location) {
          // Use navigateTo for proper server-side redirect
          await navigateTo(location, { external: !location.startsWith('/r/') })
          return
        }
      }
      
      // Handle 404
      if (response.status === 404) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Link not found',
        })
      }
    } catch (error: any) {
      // Handle 404
      if (error.statusCode === 404 || error.status === 404) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Link not found',
        })
      }
      // Re-throw other errors
      throw error
    }
  }
  
  handleRedirect()
} else {
  // Client-side: Navigate to API which will handle redirects
  onMounted(async () => {
    await navigateTo(`/api/r/${shortCode}`, { external: false })
  })
}
</script>
