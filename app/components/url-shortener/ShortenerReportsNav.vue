<script setup lang="ts">
interface SectionItem {
  id: string
  label: string
  icon: string
}

const props = defineProps<{
  sections: SectionItem[]
  active: string
}>()

const emit = defineEmits<{
  change: [id: string]
}>()

const handleChange = (id: string) => emit('change', id)
</script>

<template>
  <div class="border-b border-muted-200 dark:border-muted-800">
    <div class="flex gap-2 overflow-x-auto">
      <button
        v-for="section in props.sections"
        :key="section.id"
        type="button"
        class="relative px-4 py-3 text-sm font-medium transition-colors duration-200 whitespace-nowrap"
        :class="
          active === section.id
            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
            : 'text-muted-500 dark:text-muted-400 hover:text-muted-700 dark:hover:text-muted-300'
        "
        @click="handleChange(section.id)"
      >
        <div class="flex items-center gap-2">
          <Icon :name="section.icon" class="size-4" />
          <span>{{ section.label }}</span>
        </div>
      </button>
    </div>
  </div>
</template>
