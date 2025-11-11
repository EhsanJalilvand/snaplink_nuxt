<script setup lang="ts">
import type { SupportStat } from '~/types/support'

const props = defineProps<{
  stats: SupportStat[]
}>()
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    <BaseCard
      v-for="stat in stats"
      :key="stat.label"
      class="border border-muted-200/70 bg-white/80 p-5 dark:border-muted-700/50 dark:bg-muted-900/40"
    >
      <div class="flex items-center justify-between">
        <div class="rounded-xl bg-muted-100 p-3 dark:bg-muted-800/70">
          <Icon :name="stat.icon" class="size-6 text-primary-500 dark:text-primary-300" />
        </div>
        <BaseChip :color="stat.color" size="xs">
          {{ stat.delta }}
        </BaseChip>
      </div>
      <BaseText size="xs" class="mt-4 text-muted-500 dark:text-muted-400">
        {{ stat.label }}
      </BaseText>
      <BaseHeading
        as="h3"
        size="xl"
        weight="bold"
        class="mt-1 text-muted-900 dark:text-white"
      >
        {{ stat.value }}
      </BaseHeading>
    </BaseCard>
  </div>
</template>
