<template>
  <div class="flex min-h-screen items-center justify-center bg-muted-50 dark:bg-muted-900">
    <div class="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 text-center shadow-lg dark:bg-muted-800">
      <Icon name="lucide:clock" class="mx-auto h-16 w-16 text-muted-400" />
      <div>
        <h1 class="text-2xl font-bold">Link Expired</h1>
        <p class="mt-2 text-muted-foreground">
          This link has expired and is no longer available.
          <span v-if="expireDate" class="block mt-2 text-sm">
            Expired on: {{ formatDate(expireDate) }}
          </span>
        </p>
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

const route = useRoute()
const shortCode = route.params.shortCode as string

const expireDate = ref<string | null>(null)

// Fetch link info to get expiration date
onMounted(async () => {
  try {
      const { data } = await useFetch(`/api/s/${shortCode}/expired`)
    if (data.value && typeof data.value === 'object' && 'expireDate' in data.value) {
      expireDate.value = (data.value as { expireDate: string }).expireDate
    }
  } catch {
    // Ignore errors
  }
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>

