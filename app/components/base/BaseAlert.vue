<script setup lang="ts">
import { computed } from '#imports'

const props = withDefaults(defineProps<{
  color?: 'info' | 'success' | 'warning' | 'danger' | 'primary'
  variant?: 'soft' | 'pastel' | 'solid' | 'outline'
  icon?: string | false
  closable?: boolean
}>(), {
  color: 'info',
  variant: 'soft',
  icon: false,
  closable: false,
})

const emit = defineEmits<{
  close: []
}>()

const colorMap: Record<string, Record<string, string>> = {
  info: {
    soft: 'bg-info-50 text-info-700 border border-info-200 dark:bg-info-500/10 dark:text-info-200 dark:border-info-500/40',
    pastel: 'bg-info-100/70 text-info-800 border border-info-200 dark:bg-info-500/20 dark:text-info-100 dark:border-info-500/40',
    solid: 'bg-info-600 text-white border border-info-600',
    outline: 'bg-white text-info-700 border border-info-300 dark:bg-transparent dark:text-info-200 dark:border-info-500/60',
  },
  success: {
    soft: 'bg-success-50 text-success-700 border border-success-200 dark:bg-success-500/10 dark:text-success-200 dark:border-success-500/40',
    pastel: 'bg-success-100/70 text-success-800 border border-success-200 dark:bg-success-500/20 dark:text-success-100 dark:border-success-500/40',
    solid: 'bg-success-600 text-white border border-success-600',
    outline: 'bg-white text-success-700 border border-success-300 dark:bg-transparent dark:text-success-200 dark:border-success-500/60',
  },
  warning: {
    soft: 'bg-warning-50 text-warning-700 border border-warning-200 dark:bg-warning-500/10 dark:text-warning-200 dark:border-warning-500/40',
    pastel: 'bg-warning-100/70 text-warning-800 border border-warning-200 dark:bg-warning-500/20 dark:text-warning-100 dark:border-warning-500/40',
    solid: 'bg-warning-500 text-white border border-warning-500',
    outline: 'bg-white text-warning-700 border border-warning-300 dark:bg-transparent dark:text-warning-200 dark:border-warning-500/60',
  },
  danger: {
    soft: 'bg-danger-50 text-danger-700 border border-danger-200 dark:bg-danger-500/10 dark:text-danger-200 dark:border-danger-500/40',
    pastel: 'bg-danger-100/70 text-danger-800 border border-danger-200 dark:bg-danger-500/20 dark:text-danger-100 dark:border-danger-500/40',
    solid: 'bg-danger-600 text-white border border-danger-600',
    outline: 'bg-white text-danger-700 border border-danger-300 dark:bg-transparent dark:text-danger-200 dark:border-danger-500/60',
  },
  primary: {
    soft: 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-500/10 dark:text-primary-200 dark:border-primary-500/40',
    pastel: 'bg-primary-100/70 text-primary-800 border border-primary-200 dark:bg-primary-500/20 dark:text-primary-100 dark:border-primary-500/40',
    solid: 'bg-primary-600 text-white border border-primary-600',
    outline: 'bg-white text-primary-700 border border-primary-300 dark:bg-transparent dark:text-primary-200 dark:border-primary-500/60',
  },
}

const colorClass = computed(() => {
  const variantMap = colorMap[props.color] || colorMap.info
  return variantMap[props.variant] || variantMap.soft
})

const iconName = computed(() => {
  if (props.icon === false) return null
  if (typeof props.icon === 'string') return props.icon

  switch (props.color) {
    case 'success':
      return 'ph:check-circle'
    case 'warning':
      return 'ph:warning-circle'
    case 'danger':
      return 'ph:x-circle'
    case 'primary':
      return 'ph:info'
    default:
      return 'ph:info'
  }
})

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div class="base-alert w-full rounded-xl px-4 py-3 flex items-start gap-3" :class="colorClass">
    <div v-if="iconName" class="mt-0.5 flex-shrink-0">
      <Icon :name="iconName" class="size-5" />
    </div>

    <div class="flex-1 space-y-1">
      <slot name="title">
        <p class="font-semibold text-sm">
          <slot />
        </p>
      </slot>

      <div class="text-xs leading-relaxed">
        <slot name="description"></slot>
      </div>
    </div>

    <BaseButton
      v-if="closable"
      size="xs"
      variant="ghost"
      class="-mr-1"
      @click="handleClose"
    >
      <Icon name="ph:x" class="size-4" />
    </BaseButton>
  </div>
</template>

<style scoped>
.base-alert :deep(a) {
  text-decoration: underline;
}
</style>
