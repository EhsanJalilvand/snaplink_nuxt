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
    const data = await $fetch<{ success: boolean; redirectUrl?: string; error?: string }>(`/api/s/${shortCode}/password`, {
      method: 'POST',
      body: {
        password: password.value,
      },
    })

    if (data && 'error' in data) {
      error.value = data.error || 'Invalid password. Please try again.'
      return
    }

    if (data && data.success) {
      // Password verified, redirect to the actual link
      if (data.redirectUrl) {
        await navigateTo(data.redirectUrl, { external: false })
      } else {
        await navigateTo(`/s/${shortCode}`, { external: false })
      }
    }
  } catch (err: any) {
    error.value = err.data?.error || err.message || 'An error occurred. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

