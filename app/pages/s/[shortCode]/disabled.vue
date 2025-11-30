<template>
  <div class="flex min-h-screen items-center justify-center bg-muted-50 dark:bg-muted-900">
    <div class="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 text-center shadow-lg dark:bg-muted-800">
      <Icon name="lucide:ban" class="mx-auto h-16 w-16 text-muted-400" />
      <div>
        <h1 class="text-2xl font-bold">Link Disabled</h1>
        <p class="mt-2 text-muted-foreground">This link has been disabled and is no longer available.</p>
      </div>
      <NuxtLink
        to="/"
        class="inline-block rounded-md bg-primary-500 px-4 py-2 font-medium text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Go to Homepage
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false, // No layout for redirect pages
})
</script>

