<script setup lang="ts">
interface PeriodOption {
  label: string
  value: string
}

const periodModel = defineModel<string>('period', { required: true })

const props = defineProps<{
  options: PeriodOption[]
}>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <BaseHeading
        as="h1"
        size="2xl"
        weight="bold"
        class="text-muted-800 dark:text-muted-100"
      >
        URL Shortener Overview
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
        Monitor your link performance and analytics.
      </BaseParagraph>
    </div>
    <TairoSelect
      v-model="periodModel"
      icon="solar:calendar-linear"
      rounded="lg"
      size="sm"
      class="w-40"
    >
      <BaseSelectItem
        v-for="option in props.options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </BaseSelectItem>
    </TairoSelect>
  </div>
</template>
