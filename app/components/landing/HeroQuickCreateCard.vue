<script setup lang="ts">
const props = defineProps<{
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
    <div class="absolute inset-0 rounded-[32px] bg-gradient-to-br from-primary-500/20 via-primary-500/10 to-transparent blur-2xl" />
    <BaseCard class="relative bg-white/95 dark:bg-muted-900/95 border border-muted-200 dark:border-muted-800 rounded-[28px] p-8 shadow-2xl backdrop-blur-sm">
      <div class="space-y-3 mb-6">
        <BaseTag rounded="full" size="sm" class="bg-primary-100 text-primary-600 w-fit">
          Quick create
        </BaseTag>
        <h2 class="text-2xl font-semibold text-muted-900 dark:text-white leading-tight">
          Paste a URL. SnapLink handles the rest.
        </h2>
      </div>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <div class="relative">
          <Icon name="solar:link-linear" class="absolute top-1/2 -translate-y-1/2 start-5 size-6 text-muted-400" />
          <input
            :value="modelValue"
            type="url"
            placeholder="https://your-next-launch.com"
            class="w-full rounded-2xl border border-muted-200 dark:border-muted-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-200/50 dark:focus:ring-primary-500/30 ps-14 pe-4 py-4 text-base placeholder:text-muted-400 dark:placeholder:text-muted-500 transition"
            @input="onInput(($event.target as HTMLInputElement).value)"
          >
        </div>
        <BaseButton type="submit" size="lg" variant="primary" class="w-full justify-center shadow-lg shadow-primary-500/25">
          <Icon name="solar:flash-linear" class="size-5 me-2" />
          Shorten now
        </BaseButton>
      </form>
      <div class="mt-6 space-y-3 text-sm text-muted-500">
        <div class="flex items-start gap-2">
          <Icon name="solar:api-linear" class="size-5 text-primary-500" />
          <span>Same payload we use in the REST API and CLI.</span>
        </div>
        <div class="flex items-start gap-2">
          <Icon name="solar:shield-check-linear" class="size-5 text-primary-500" />
          <span>TOTP-secured sessions keep workspace data private.</span>
        </div>
        <div class="flex items-start gap-2">
          <Icon name="solar:card-linear" class="size-5 text-primary-500" />
          <span>Pay as you go with card or crypto auto top-up.</span>
        </div>
      </div>
      <p class="mt-6 text-xs font-medium text-primary-500">
        Free tier covers 1,000 tracked clicks per link.
      </p>
    </BaseCard>
  </div>
</template>
