<script setup lang="ts">
definePageMeta({
  title: 'Survey Link - Coming Soon',
  layout: 'dashboard',
})
</script>

<template>
  <div class="flex items-center justify-center min-h-[60vh] py-12">
    <div class="text-center max-w-md mx-auto px-6">
      <div class="mb-6 flex justify-center">
        <div class="flex size-20 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
          <Icon name="solar:clipboard-list-linear" class="size-10 text-primary-600 dark:text-primary-400" />
        </div>
      </div>
      <BaseHeading
        as="h1"
        size="2xl"
        weight="bold"
        class="text-muted-900 dark:text-muted-100 mb-3"
      >
        Survey Link
      </BaseHeading>
      <BaseParagraph size="lg" class="text-muted-600 dark:text-muted-400 mb-6">
        This feature is coming soon. We're working hard to bring you an amazing survey link experience.
      </BaseParagraph>
      <BaseText size="sm" class="text-muted-500 dark:text-muted-500">
        Stay tuned for updates!
      </BaseText>
    </div>
  </div>
</template>

