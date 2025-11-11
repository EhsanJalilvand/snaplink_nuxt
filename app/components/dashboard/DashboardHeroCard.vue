<script setup lang="ts">
import { computed } from '#imports'

const props = withDefaults(defineProps<{
  userName?: string
  subtitle?: string
  primaryLabel?: string
  secondaryLabel?: string
}>(), {
  userName: '',
  subtitle: 'Here\'s what\'s happening with your links today',
  primaryLabel: 'Create Link',
  secondaryLabel: 'View Analytics',
})

const emit = defineEmits<{
  (e: 'create-link'): void
  (e: 'view-analytics'): void
}>()

const welcomeMessage = computed(() => {
  return props.userName ? `Welcome back, ${props.userName}! 👋` : 'Welcome back! 👋'
})
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-8 text-white shadow-xl">
    <div class="relative z-10">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-xl space-y-4">
          <BaseHeading
            as="h1"
            size="2xl"
            weight="bold"
            class="text-white"
          >
            {{ welcomeMessage }}
          </BaseHeading>
          <BaseParagraph size="lg" class="text-white/85">
            {{ subtitle }}
          </BaseParagraph>
          <div class="flex flex-wrap items-center gap-3">
            <BaseButton
              variant="white"
              size="lg"
              @click="emit('create-link')"
            >
              <Icon name="solar:add-circle-linear" class="size-5" />
              <span>{{ primaryLabel }}</span>
            </BaseButton>
            <BaseButton
              variant="outline"
              size="lg"
              class="border-white/20 text-white hover:bg-white/10"
              @click="emit('view-analytics')"
            >
              <Icon name="solar:chart-2-linear" class="size-5" />
              <span>{{ secondaryLabel }}</span>
            </BaseButton>
          </div>
        </div>

        <div class="hidden shrink-0 lg:flex">
          <div class="flex size-32 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
            <Icon name="solar:infinity-linear" class="size-16 text-white/80" />
          </div>
        </div>
      </div>
    </div>

    <div class="pointer-events-none absolute top-[-40px] end-[-20px] h-64 w-64 rounded-full bg-white/5 blur-3xl" />
    <div class="pointer-events-none absolute bottom-[-60px] start-[-20px] h-48 w-48 rounded-full bg-white/5 blur-3xl" />
  </div>
</template>

