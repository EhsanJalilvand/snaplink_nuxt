<script setup lang="ts">
import type { RiskLevel } from '~/types/payment-compliance'

interface Props {
  level: RiskLevel
  score?: number // 0-100
  showLabel?: boolean
  showScore?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: true,
  showScore: false,
  size: 'md',
})

const riskConfig = {
  low: {
    label: 'Low Risk',
    color: 'success',
    bgColor: 'bg-success-50 dark:bg-success-900/20',
    borderColor: 'border-success-200 dark:border-success-800',
    textColor: 'text-success-700 dark:text-success-300',
    icon: 'solar:shield-check-bold-duotone',
    gradient: 'from-success-400 to-success-600',
  },
  medium: {
    label: 'Medium Risk',
    color: 'warning',
    bgColor: 'bg-warning-50 dark:bg-warning-900/20',
    borderColor: 'border-warning-200 dark:border-warning-800',
    textColor: 'text-warning-700 dark:text-warning-300',
    icon: 'solar:shield-warning-bold-duotone',
    gradient: 'from-warning-400 to-warning-600',
  },
  high: {
    label: 'High Risk',
    color: 'danger',
    bgColor: 'bg-danger-50 dark:bg-danger-900/20',
    borderColor: 'border-danger-200 dark:border-danger-800',
    textColor: 'text-danger-700 dark:text-danger-300',
    icon: 'solar:shield-cross-bold-duotone',
    gradient: 'from-danger-400 to-danger-600',
  },
  critical: {
    label: 'Critical Risk',
    color: 'danger',
    bgColor: 'bg-danger-100 dark:bg-danger-900/40',
    borderColor: 'border-danger-300 dark:border-danger-700',
    textColor: 'text-danger-800 dark:text-danger-200',
    icon: 'solar:danger-triangle-bold-duotone',
    gradient: 'from-red-600 to-red-800',
  },
} as const

const config = computed(() => riskConfig[props.level])

const sizeClasses = {
  sm: 'size-8',
  md: 'size-12',
  lg: 'size-16',
}

const iconSizes = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
}
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- Visual Indicator -->
    <div class="relative flex shrink-0">
      <!-- Circular Progress / Icon -->
      <div
        v-if="score !== undefined"
        class="relative"
        :class="sizeClasses[size]"
      >
        <svg
          class="transform -rotate-90"
          :class="sizeClasses[size]"
          viewBox="0 0 36 36"
        >
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            class="stroke-muted-200 dark:stroke-muted-800"
            stroke-width="3"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            :class="`stroke-${config.color}-500`"
            stroke-width="3"
            stroke-dasharray="100"
            :stroke-dashoffset="100 - score"
            stroke-linecap="round"
            class="transition-all duration-500"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <Icon
            :name="config.icon"
            :class="[iconSizes[size], `text-${config.color}-500`]"
          />
        </div>
      </div>
      <div
        v-else
        class="flex items-center justify-center rounded-full border-2 p-2"
        :class="[
          sizeClasses[size],
          config.bgColor,
          config.borderColor,
        ]"
      >
        <Icon
          :name="config.icon"
          :class="[iconSizes[size], config.textColor]"
        />
      </div>
    </div>

    <!-- Label & Score -->
    <div v-if="showLabel || showScore" class="flex-1">
      <div
        v-if="showLabel"
        class="flex items-center gap-2"
      >
        <BaseText
          :size="size === 'sm' ? 'xs' : 'sm'"
          weight="medium"
          :class="config.textColor"
        >
          {{ config.label }}
        </BaseText>
      </div>
      <div
        v-if="showScore && score !== undefined"
        class="mt-0.5"
      >
        <BaseText
          size="xs"
          class="text-muted-500 dark:text-muted-400"
        >
          Risk Score: {{ score }}/100
        </BaseText>
      </div>
    </div>
  </div>
</template>

