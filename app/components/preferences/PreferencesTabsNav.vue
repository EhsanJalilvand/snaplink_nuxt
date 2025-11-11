<script setup lang="ts">
import type { PreferencesTab, PreferencesTabId } from '~/types/preferences'

const props = defineProps<{
  tabs: PreferencesTab[]
  modelValue: PreferencesTabId
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: PreferencesTabId): void
}>()

const handleSelect = (value: PreferencesTabId) => {
  if (props.modelValue !== value) {
    emit('update:modelValue', value)
  }
}
</script>

<template>
  <div class="border-b border-muted-200 dark:border-muted-800">
    <div class="flex gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="relative px-4 py-3 text-sm font-medium transition-colors duration-200"
        :class="modelValue === tab.id
          ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
          : 'text-muted-500 dark:text-muted-400 hover:text-muted-700 dark:hover:text-muted-300'"
        @click="handleSelect(tab.id)"
      >
        <div class="flex items-center gap-2">
          <Icon :name="tab.icon" class="size-4" />
          <span>{{ tab.label }}</span>
        </div>
      </button>
    </div>
  </div>
</template>
