<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()

const onInput = (value: string) => {
  emit('update:modelValue', value)
}

const onSubmit = () => {
  emit('submit')
}
</script>

<template>
  <div class="relative">
    <div class="absolute inset-0 rounded-[34px] bg-gradient-to-br from-primary-500/20 via-primary-500/5 to-transparent blur-3xl" />
    <BaseCard class="relative bg-white/95 dark:bg-muted-900/95 border border-muted-200/70 dark:border-muted-800/70 rounded-[28px] p-8 shadow-xl backdrop-blur">
      <div class="flex items-center justify-between gap-2 mb-4">
        <BaseTag rounded="full" size="sm" class="bg-primary-100 text-primary-600 inline-flex items-center gap-2">
          <Icon name="solar:flash-linear" class="size-4" />
          Quick create
        </BaseTag>
        <BaseChip rounded="full" size="sm" class="bg-primary-100/70 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
          1,000 clicks free
        </BaseChip>
      </div>

      <div class="space-y-3 mb-7">
        <h2 class="text-2xl font-semibold text-muted-900 dark:text-white leading-tight">
          Drop a URL. SnapLink spins up the wizard.
        </h2>
        <p class="text-sm text-muted-500 dark:text-muted-300">
          Signed-in teammates jump straight into the three-step flow with your link prefilled.
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div class="relative">
          <Icon name="solar:link-linear" class="absolute top-1/2 -translate-y-1/2 start-6 size-6 text-muted-400" />
          <input
            :value="modelValue"
            type="url"
            placeholder="https://next-launch.snap"
            class="w-full rounded-3xl border border-muted-200 dark:border-muted-700 bg-white/90 dark:bg-muted-900/80 focus:border-primary-500 focus:ring-4 focus:ring-primary-200/50 dark:focus:ring-primary-500/30 ps-16 pe-5 py-5 text-base sm:text-lg placeholder:text-muted-400 dark:placeholder:text-muted-500 transition"
            @input="onInput(($event.target as HTMLInputElement).value)"
          >
        </div>
        <BaseButton type="submit" size="lg" variant="primary" class="w-full justify-center gap-2 rounded-3xl shadow-lg shadow-primary-500/25 text-base">
          <Icon name="solar:flash-linear" class="size-5" />
          Shorten now
        </BaseButton>
      </form>

      <div class="mt-6 space-y-2 text-xs text-muted-500 dark:text-muted-400">
        <div class="flex items-center gap-2">
          <Icon name="solar:api-linear" class="size-4 text-primary-500" />
          <span>Same payload as the `/v1/links` REST endpoint.</span>
        </div>
        <div class="flex items-center gap-2">
          <Icon name="solar:shield-check-linear" class="size-4 text-primary-500" />
          <span>TOTP sessions keep workspaces private.</span>
        </div>
        <div class="flex items-center gap-2">
          <Icon name="solar:wallet-linear" class="size-4 text-primary-500" />
          <span>Payment Link stays free—only $0.07 per settled payment.</span>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
