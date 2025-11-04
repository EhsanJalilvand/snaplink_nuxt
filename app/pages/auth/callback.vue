<script setup lang="ts">
definePageMeta({
  layout: 'empty',
  title: 'Authentication Callback',
  ssr: false,
})

const route = useRoute()
const router = useRouter()
const { handleOAuth2Callback, isLoading, error } = useAuth()

onMounted(async () => {
  try {
    // Get authorization code and state from query params
    const code = route.query.code as string
    const state = route.query.state as string
    const errorParam = route.query.error as string

    // Check for OAuth2 error
    if (errorParam) {
      const errorDescription = route.query.error_description as string || 'Authentication failed'
      console.error('[callback.vue] OAuth2 error:', errorParam, errorDescription)
      await router.push('/auth/login')
      return
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('[callback.vue] Missing code or state parameter')
      await router.push('/auth/login')
      return
    }

    // Handle OAuth2 callback
    const success = await handleOAuth2Callback(code, state)

    if (success) {
      // Success - redirect will be handled by handleOAuth2Callback
      // It will navigate to dashboard or returnTo
    } else {
      // Failed - redirect to login
      await router.push('/auth/login')
    }
  } catch (err: any) {
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
