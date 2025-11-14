<script setup lang="ts">
import type { Workspace } from '~/types/workspace'

const props = defineProps<{
  workspace: Workspace
  selected: boolean
}>()

const emit = defineEmits<{
  select: [workspace: Workspace]
  edit: [workspace: Workspace]
}>()

function handleSelect() {
  emit('select', props.workspace)
}

function handleEdit() {
  emit('edit', props.workspace)
}
</script>

<template>
  <button
    type="button"
    class="relative w-full rounded-lg border border-muted-200 bg-white p-4 pr-20 text-start transition-all duration-200 hover:border-primary-500 hover:bg-primary-50 dark:border-muted-700 dark:bg-muted-800 dark:hover:bg-primary-900/20"
    :class="selected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'hover:shadow-sm'"
    @click="handleSelect"
  >
    <div class="flex items-start gap-4">
      <div class="shrink-0">
        <BaseAvatar
          v-if="workspace.logo"
          :src="workspace.logo"
          size="md"
        />
        <div
          v-else
          class="flex size-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30"
        >
          <Icon
            name="solar:layers-linear"
            class="size-6 text-primary-600 dark:text-primary-400"
          />
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <BaseHeading
              as="h4"
              size="sm"
              weight="semibold"
              class="mb-1 text-muted-800 dark:text-muted-100"
            >
              {{ workspace.name }}
            </BaseHeading>
            <BaseParagraph
              v-if="workspace.description"
              size="xs"
              class="mb-2 line-clamp-1 text-muted-500 dark:text-muted-400"
            >
              {{ workspace.description }}
            </BaseParagraph>
          </div>
          <div class="flex h-7 items-center gap-2" />
        </div>

        <div class="mt-2 flex items-center gap-4">
          <div class="flex items-center gap-1.5">
            <Icon
              name="ph:users"
              class="size-3.5 text-muted-400"
            />
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              {{ workspace.members }} {{ workspace.members === 1 ? 'member' : 'members' }}
            </BaseText>
          </div>
          <div class="flex items-center gap-1.5">
            <Icon
              name="solar:link-linear"
              class="size-3.5 text-muted-400"
            />
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              {{ workspace.links }} {{ workspace.links === 1 ? 'link' : 'links' }}
            </BaseText>
          </div>
        </div>

      </div>
    </div>

    <div class="pointer-events-none absolute bottom-3 right-3 flex items-end gap-2">
      <Icon
        v-if="selected"
        name="lucide:check-circle-2"
        class="size-5 text-success-500 dark:text-success-400"
      />
      <BaseButton
        variant="outline"
        size="xs"
        class="pointer-events-auto rounded-full border-primary-200 bg-primary-50/70 text-primary-600 shadow-sm hover:bg-primary-100 dark:border-primary-500/40 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/40"
        @click.stop="handleEdit"
      >
        <Icon name="ph:pencil-simple" class="size-3.5" />
        Edit
      </BaseButton>
    </div>
  </button>
</template>


