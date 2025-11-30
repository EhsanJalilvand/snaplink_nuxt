<template>
  <div class="flex min-h-screen items-center justify-center bg-muted-50 dark:bg-muted-900">
    <div class="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 text-center shadow-lg dark:bg-muted-800">
      <Icon name="lucide:shield-alert" class="mx-auto h-16 w-16 text-warning-500" />
      <div>
        <h1 class="text-2xl font-bold">Access Denied</h1>
        <p class="mt-2 text-muted-foreground">
          <span v-if="!isAuthenticated">You need to log in to access this link.</span>
          <span v-else>You don't have permission to access this link.</span>
        </p>
      </div>
      <div class="space-y-2">
        <NuxtLink
          v-if="!isAuthenticated"
          :to="loginUrl"
          class="block rounded-md bg-primary-500 px-4 py-2 font-medium text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Log In
        </NuxtLink>
        <NuxtLink
          to="/"
          class="block rounded-md border border-muted-300 px-4 py-2 font-medium text-muted-700 hover:bg-muted-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-muted-600 dark:text-muted-300 dark:hover:bg-muted-700"
        >
          Go to Homepage
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false, // No layout for redirect pages
})

const route = useRoute()
const shortCode = route.params.shortCode as string

const isAuthenticated = ref(false)
const loginUrl = computed(() => {
  const returnUrl = `/s/${shortCode}`
  return `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
})

// Check if user is authenticated
onMounted(async () => {
  try {
    // You can check authentication status here
    // For now, we'll assume not authenticated
    isAuthenticated.value = false
  } catch {
    isAuthenticated.value = false
  }
})
</script>

