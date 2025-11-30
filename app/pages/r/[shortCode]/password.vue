<template>
  <div class="flex min-h-screen items-center justify-center bg-muted-50 dark:bg-muted-900">
    <div class="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 shadow-lg dark:bg-muted-800">
      <div class="text-center">
        <Icon name="lucide:lock" class="mx-auto h-12 w-12 text-primary-500" />
        <h1 class="mt-4 text-2xl font-bold">Password Required</h1>
        <p class="mt-2 text-muted-foreground">This link is protected. Please enter the password to continue.</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="password" class="block text-sm font-medium">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="mt-1 block w-full rounded-md border border-muted-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-muted-600 dark:bg-muted-700"
            placeholder="Enter password"
          />
        </div>

        <div v-if="error" class="rounded-md bg-danger-50 p-3 text-sm text-danger-600 dark:bg-danger-900/20 dark:text-danger-400">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full rounded-md bg-primary-500 px-4 py-2 font-medium text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <span v-if="isLoading">Verifying...</span>
          <span v-else>Continue</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false, // No layout for redirect pages
})

const route = useRoute()
const shortCode = route.params.shortCode as string

const password = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)

const handleSubmit = async () => {
  error.value = null
  isLoading.value = true

  try {
    console.log('[Password Page] Submitting password for:', shortCode)
    const response = await $fetch<{ success: boolean; redirectUrl?: string; error?: string }>(`/api/r/${shortCode}/password`, {
      method: 'POST',
      body: {
        password: password.value,
      },
      credentials: 'include', // Important: include cookies for session
    })

    console.log('[Password Page] Response:', response)

    if (response && 'error' in response) {
      error.value = response.error || 'Invalid password. Please try again.'
      return
    }

    if (response && response.success) {
      // Password verified, redirect to the actual link
      const redirectUrl = response.redirectUrl || `/r/${shortCode}`
      console.log('[Password Page] Redirecting to:', redirectUrl)
      // Use window.location for full page reload to ensure session cookie is sent
      window.location.href = redirectUrl
    } else {
      error.value = 'Invalid response from server. Please try again.'
    }
  } catch (err: any) {
    console.error('[Password Page] Error:', err)
    // Handle HTTP error responses
    if (err.status === 401 || err.statusCode === 401) {
      error.value = err.data?.error || 'Invalid password. Please try again.'
    } else if (err.status === 400 || err.statusCode === 400) {
      error.value = err.data?.error || 'Invalid request. Please try again.'
    } else {
      error.value = err.data?.error || err.message || 'An error occurred. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

