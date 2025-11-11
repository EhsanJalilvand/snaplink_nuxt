<script setup lang="ts">
const props = defineProps<{
  summary: string
  period: string
  periods: Array<{ label: string; value: string }>
}>()

const emit = defineEmits<{
  'update:period': [value: string]
  back: []
}>()

const periodModel = computed({
  get: () => props.period,
  set: (value: string) => emit('update:period', value),
})

const handleBack = () => emit('back')
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <BaseHeading as="h1" size="2xl" weight="bold" class="text-muted-800 dark:text-muted-100">
        Advanced Analytics
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
        {{ summary }} • Detailed insights and analytics
      </BaseParagraph>
    </div>
    <div class="flex items-center gap-3">
      <TairoSelect
        v-model="periodModel"
        icon="solar:calendar-linear"
        rounded="lg"
        size="sm"
        class="w-40"
      >
        <BaseSelectItem
          v-for="option in props.periods"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </BaseSelectItem>
      </TairoSelect>
      <BaseButton variant="outline" size="sm" @click="handleBack">
        <Icon name="lucide:arrow-left" class="size-4" />
        <span>Back</span>
      </BaseButton>
    </div>
  </div>
</template>
