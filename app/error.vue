<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error?.statusCode ?? 500)

const title = computed(() => {
  if (statusCode.value === 404) {
    return 'Page not found'
  }

  if (statusCode.value === 500) {
    return 'We hit a snag'
  }

  return 'Something went wrong'
})

const description = computed(() => {
  if (statusCode.value === 404) {
    return 'We can’t find the page you’re looking for. It might have been moved or removed.'
  }

  if (statusCode.value === 500) {
    return 'Something broke on our side. The team has been notified — please try again in a moment.'
  }

  return 'An unexpected error occurred. If it keeps happening, please contact support.'
})

const iconName = computed(() => {
  if (statusCode.value === 404) {
    return 'solar:compass-line-duotone'
  }

  if (statusCode.value === 500) {
    return 'solar:bug-minimalistic-line-duotone'
  }

  return 'solar:alarm-line-duotone'
})
</script>

<template>
  <div class="bg-muted-50 dark:bg-muted-900 min-h-screen overflow-hidden px-4 pb-16 md:px-6 lg:px-8">
    <div class="mx-auto flex w-full max-w-7xl flex-col">
      <header class="mx-auto mb-16 flex h-16 w-full max-w-4xl items-center justify-between">
        <NuxtLink
          to="/"
          class="flex items-center gap-3 text-muted-500 transition-colors duration-300 hover:text-primary-500 dark:text-muted-400 dark:hover:text-primary-400"
        >
          <BrandLogoMark size="md" />
          <span class="text-lg font-semibold text-muted-900 dark:text-muted-100">SnapLink</span>
        </NuxtLink>
        <BaseThemeToggle aria-label="Toggle theme" />
      </header>

      <TairoError
        :error="props.error"
        :title="title"
        :description="description"
      >
        <div class="mx-auto flex size-36 items-center justify-center rounded-full bg-primary-500/10 p-6 dark:bg-primary-500/15">
          <Icon :name="iconName" class="size-16 text-primary-500 dark:text-primary-300" />
        </div>
      </TairoError>
    </div>
  </div>
</template>

