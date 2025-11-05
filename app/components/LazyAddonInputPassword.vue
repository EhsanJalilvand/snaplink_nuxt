<script setup lang="ts">
import type { AddonInputPassword } from '#components'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  modelValue?: string
  userInputs?: string[]
  locale?: () => Promise<typeof import('@zxcvbn-ts/language-en')> | typeof import('@zxcvbn-ts/language-en')
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  show?: boolean
  icon?: string
  touched?: boolean
  disabled?: boolean
  error?: string
  icons?: {
    hint?: string
    reveal?: string
    hide?: string
  }
}>()

const emits = defineEmits<{
  'update:modelValue': [value?: string]
  'validation': [state: { validation: any | null, touched: boolean }]
  'visibility': [state: boolean]
}>()

const AddonInputPasswordComponent = defineAsyncComponent(() => import('./AddonInputPassword.vue'))
</script>

<template>
  <AddonInputPasswordComponent
    v-bind="props"
    @update:model-value="emits('update:modelValue', $event)"
    @validation="emits('validation', $event)"
    @visibility="emits('visibility', $event)"
  />
</template>







