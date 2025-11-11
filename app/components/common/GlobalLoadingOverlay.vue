<script setup lang="ts">
import { computed } from '#imports'
import { useApiPendingRequests } from '~/composables/useApi'

const pendingRequests = useApiPendingRequests()

const isVisible = computed(() => pendingRequests.value > 0)
</script>

<template>
  <div class="pointer-events-none">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="isVisible"
        class="pointer-events-auto fixed bottom-6 right-6 z-[95]"
      >
        <div class="flex items-center gap-2 rounded-full border border-muted-200 bg-white/95 px-4 py-2 shadow-md ring-1 ring-muted-200/50 backdrop-blur-sm dark:border-muted-700 dark:bg-muted-900/95 dark:ring-muted-800/60">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400/60 dark:bg-primary-400/40" />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-primary-500 dark:bg-primary-300" />
          </span>
          <BaseText size="xs" class="text-muted-600 dark:text-muted-200">
            Syncing latest data…
          </BaseText>
        </div>
      </div>
    </Transition>
  </div>
</template>

