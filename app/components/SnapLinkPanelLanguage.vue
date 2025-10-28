<script setup lang="ts">
import { getLocaleFlag } from '~/utils/locale'
import { useAppLocale } from '~/composables/useLocale'

const emits = defineEmits<{
  close: []
}>()

const currentLocale = useAppLocale()
const locales = [
  { code: 'en', name: 'English' },
  { code: 'fa', name: 'فارسی' },
  { code: 'ar', name: 'العربية' },
]

onKeyStroke('Escape', () => emits('close'))

function selectLocale(locale: string) {
  currentLocale.value = locale
  emits('close')
}
</script>

<template>
  <FocusScope class="border-muted-200 dark:border-muted-700 dark:bg-muted-800 border bg-white" trapped loop>
    <div
      class="border-muted-200 dark:border-muted-800 flex h-20 w-full items-center justify-between border-b px-6"
    >
      <BaseHeading
        as="h3"
        size="xs"
        weight="semibold"
        class="text-muted-500 dark:text-muted-100 uppercase"
      >
        Select Language
      </BaseHeading>

      <!-- Close button -->
      <button
        type="button"
        class="nui-mask nui-mask-blob hover:bg-muted-100 focus:bg-muted-100 dark:hover:bg-muted-800 dark:focus:bg-muted-800 text-muted-700 dark:text-muted-400 flex size-10 cursor-pointer items-center justify-center outline-transparent transition-colors duration-300"
        @click="() => emits('close')"
      >
        <Icon name="lucide:arrow-right" class="size-4" />
      </button>
    </div>

    <div class="relative h-[calc(100dvh_-_80px)] w-full px-10">
      <div class="grid grid-cols-3 py-6">
        <div
          v-for="locale in locales"
          :key="locale.code"
          class="relative my-4 flex items-center justify-center outline-none cursor-pointer"
          @click="selectLocale(locale.code)"
        >
          <BaseTooltip :content="locale.name" :bindings="{ portal: { disabled: true } }">
            <div class="in-focus-visible:nui-focus relative rounded-full">
              <div
                class="border-muted-200 dark:border-muted-600 flex size-20 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-300 hover:border-primary-500"
                :class="currentLocale === locale.code ? 'border-primary-500' : ''"
              >
                <img
                  class="size-14 rounded-full"
                  :src="getLocaleFlag(locale.code)"
                  alt="flag icon"
                >
              </div>
              <div
                v-if="currentLocale === locale.code"
                class="bg-primary-500 dark:border-muted-800 absolute -end-1 -top-1 size-7 flex items-center justify-center rounded-full border-4 border-white text-white"
              >
                <Icon name="feather:check" class="size-3" />
              </div>
            </div>
          </BaseTooltip>
        </div>
      </div>

      <div>
        <img
          src="/img/illustrations/translation.svg"
          class="mx-auto w-full max-w-[280px] dark:hidden"
          alt="illustration"
        >
        <img
          src="/img/illustrations/translation-dark.svg"
          class="mx-auto hidden w-full max-w-[280px] dark:block"
          alt="illustration"
        >
      </div>
    </div>
  </FocusScope>
</template>