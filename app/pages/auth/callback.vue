<script setup lang="ts">
definePageMeta({
  layout: 'empty',
  title: 'Authentication Callback',
  ssr: false,
})

const { handleCallback, isAuthenticated, isLoading, error } = useKeycloak()
const router = useRouter()

onMounted(async () => {
  try {
    console.log('[callback.vue] onMounted - Starting callback handling...')
    const success = await handleCallback()
    
    // Wait a bit for state to update
    await new Promise(resolve => setTimeout(resolve, 300))
    
    console.log('[callback.vue] Callback result:', success, 'isAuthenticated:', isAuthenticated.value)
    
    if (success && isAuthenticated.value) {
      // Redirect to dashboard after successful authentication
      console.log('[callback.vue] Redirecting to dashboard...')
      await router.push('/dashboard')
    } else {
      // If authentication failed, redirect to login
      console.log('[callback.vue] Authentication failed, redirecting to login...')
      await router.push('/auth/login')
    }
  } catch (err) {
    console.error('[callback.vue] Callback error:', err)
    await router.push('/auth/login')
  }
})
</script>

<template>
  <div class="dark:bg-muted-800 flex min-h-screen items-center justify-center bg-white">
    <div class="text-center">
      <div v-if="isLoading" class="space-y-4">
        <BaseHeading
          as="h2"
          size="2xl"
          weight="medium"
          class="text-muted-600 dark:text-muted-300"
        >
          Authenticating...
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-400">
          Please wait while we verify your credentials
        </BaseParagraph>
        <div class="flex justify-center">
          <BaseIconBox size="lg" color="primary" rounded="full">
            <Icon name="svg-spinners:ring-resize" class="size-8" />
          </BaseIconBox>
        </div>
      </div>
      
      <div v-else-if="error" class="space-y-4">
        <BaseHeading
          as="h2"
          size="2xl"
          weight="medium"
          class="text-danger-600"
        >
          Authentication Error
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-400">
          {{ error }}
        </BaseParagraph>
        <BaseButton
          to="/auth/login"
          variant="primary"
          rounded="lg"
        >
          Back to Login
        </BaseButton>
      </div>
      
      <div v-else class="space-y-4">
        <BaseHeading
          as="h2"
          size="2xl"
          weight="medium"
          class="text-muted-600 dark:text-muted-300"
        >
          Redirecting...
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-400">
          Taking you to your dashboard
        </BaseParagraph>
      </div>
    </div>
  </div>
</template>

