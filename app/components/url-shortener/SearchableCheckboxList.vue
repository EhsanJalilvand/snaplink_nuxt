<script setup lang="ts" generic="T extends string | number">
import { computed } from 'vue'

interface ListItem {
  value: T
  label: string
  subtitle?: string
}

interface Props {
  label?: string
  searchPlaceholder?: string
  items: ListItem[]
  modelValue: T | T[]
  search: string
  disabled?: boolean
  emptyMessage?: string
  singleSelect?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  searchPlaceholder: 'Search...',
  disabled: false,
  emptyMessage: 'No items found',
  singleSelect: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: T | T[]]
  'update:search': [value: string]
}>()

const filteredItems = computed(() => {
  if (!props.search.trim()) {
    return props.items
  }
  const query = props.search.toLowerCase()
  return props.items.filter(item => 
    item.label.toLowerCase().includes(query) ||
    (item.subtitle && item.subtitle.toLowerCase().includes(query))
  )
})

const toggleValue = (value: T) => {
  if (props.singleSelect) {
    // Single select: emit the value directly or null if already selected
    const currentValue = props.modelValue as T | null
    emit('update:modelValue', currentValue === value ? (null as T) : value)
  } else {
    // Multi select: work with array
    const currentValues = [...((props.modelValue as T[]) || [])]
    const index = currentValues.indexOf(value)
    
    if (index > -1) {
      currentValues.splice(index, 1)
    } else {
      currentValues.push(value)
    }
    
    emit('update:modelValue', currentValues)
  }
}

const isSelected = (value: T) => {
  if (props.singleSelect) {
    return (props.modelValue as T | null) === value
  }
  return ((props.modelValue as T[]) || []).includes(value)
}
</script>

<template>
  <div class="space-y-3">
    <TairoFormGroup v-if="label" :label="`Filter ${label.toLowerCase()}`">
      <TairoInput
        :model-value="search"
        :placeholder="searchPlaceholder"
        rounded="lg"
        size="sm"
        :disabled="disabled"
        @update:model-value="(value) => emit('update:search', value)"
      />
    </TairoFormGroup>
    <div class="max-h-48 overflow-y-auto border border-muted-200 dark:border-muted-700 rounded-lg p-3 space-y-2 bg-white dark:bg-muted-800">
      <label
        v-for="item in filteredItems"
        :key="String(item.value)"
        class="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted-50 dark:hover:bg-muted-700/50 p-2 rounded transition-colors"
      >
        <BaseCheckbox
          :model-value="isSelected(item.value)"
          :disabled="disabled"
          @update:model-value="() => toggleValue(item.value)"
          @click.stop
        />
        <span class="flex-1">{{ item.label }}</span>
        <span v-if="item.subtitle" class="text-xs text-muted-400">{{ item.subtitle }}</span>
      </label>
      <div v-if="filteredItems.length === 0" class="text-xs text-muted-400 text-center py-4">
        {{ emptyMessage }}
      </div>
    </div>
  </div>
</template>

