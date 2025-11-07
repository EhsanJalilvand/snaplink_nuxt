<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  shadow?: boolean
}>(), {
  size: 'md',
  shadow: true,
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'lg':
      return 'w-12 h-12'
    case 'sm':
      return 'w-8 h-8'
    case 'md':
    default:
      return 'w-10 h-10'
  }
})

const iconSizeClass = computed(() => {
  switch (props.size) {
    case 'lg':
      return 'w-7 h-7'
    case 'sm':
      return 'w-5 h-5'
    case 'md':
    default:
      return 'w-6 h-6'
  }
})
</script>

<template>
  <div
    :class="[
      'bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center',
      sizeClass,
      props.shadow ? 'shadow-lg shadow-primary-500/40' : '',
    ]"
  >
    <Icon
      name="solar:infinity-linear"
      :class="[iconSizeClass, 'text-white']"
    />
  </div>
</template>

