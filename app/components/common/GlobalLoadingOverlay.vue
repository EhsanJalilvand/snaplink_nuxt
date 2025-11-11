<script setup lang="ts">
import { computed } from '#imports'
import { useApiPendingRequests } from '~/composables/useApi'

const pendingRequests = useApiPendingRequests()

const isVisible = computed(() => pendingRequests.value > 0)
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-opacity duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="isVisible"
      class="pointer-events-none fixed bottom-6 right-6 z-[95]"
    >
      <div class="pointer-events-auto flex items-center gap-3 rounded-full border border-muted-200 bg-white/95 px-4 py-2 shadow-lg backdrop-blur-sm dark:border-muted-800 dark:bg-muted-900/95">
        <span class="relative flex size-3">
          <span class="absolute inline-flex size-full animate-ping rounded-full bg-primary-400 opacity-50"></span>
          <span class="relative inline-flex size-3 rounded-full bg-primary-500 dark:bg-primary-300" />
        </span>
        <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
          Syncing data…
        </BaseText>
      </div>
    </div>
  </Transition>
</template>

