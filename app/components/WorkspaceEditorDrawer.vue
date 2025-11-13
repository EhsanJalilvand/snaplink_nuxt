<script setup lang="ts">
import { reactive, watch, computed } from '#imports'
import { useWorkspace } from '~/composables/useWorkspace'
import { useApi } from '~/composables/useApi'
import { slugify } from '~/utils/slug'
import type { Workspace } from '~/types/workspace'

interface Props {
  workspace?: Workspace | null
}

const props = withDefaults(defineProps<Props>(), {
  workspace: null,
})

const emit = defineEmits<{
  close: []
  saved: [workspace: Workspace | null]
}>()

const api = useApi()
const { fetchWorkspaces } = useWorkspace()

const state = reactive({
  name: '',
  slug: '',
  description: '',
  isSaving: false,
  error: '',
})

watch(
  () => props.workspace,
  (workspace) => {
    state.name = workspace?.name ?? ''
    state.slug = workspace?.slug ?? ''
    state.description = workspace?.description ?? ''
    state.error = ''
  },
  { immediate: true },
)

watch(
  () => state.name,
  (value) => {
    if (!props.workspace) {
      state.slug = slugify(value)
    }
  },
)

const isCreateMode = computed(() => !props.workspace)
const isValid = computed(() => state.name.trim().length > 0 && state.slug.trim().length > 0)

const handleSave = async () => {
  if (!isValid.value || state.isSaving) return

  state.isSaving = true
  state.error = ''

  try {
    if (props.workspace) {
      await api.put(
        `/workspaces/${props.workspace.id}`,
        {
          name: state.name.trim(),
          slug: state.slug.trim(),
          description: state.description.trim() || null,
        },
        {
          base: 'gateway',
        },
      )
    } else {
      await api.post(
        '/workspaces',
        {
          name: state.name.trim(),
          slug: state.slug.trim(),
          description: state.description.trim() || null,
        },
        {
          base: 'gateway',
        },
      )
    }

    await fetchWorkspaces({ force: true })

    const refreshed = props.workspace
      ? (await api.get(`/workspaces/${props.workspace.id}`, { base: 'gateway' })).data
      : null

    emit('saved', refreshed)
    emit('close')
  } catch (error: any) {
    state.error = error?.data?.message ?? 'Unable to save workspace. Please try again.'
  } finally {
    state.isSaving = false
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div class="flex h-full flex-col bg-white dark:bg-muted-800">
    <div class="flex items-center justify-between border-b border-muted-200 dark:border-muted-700 p-6">
      <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-muted-100">
        {{ isCreateMode ? 'Create Workspace' : 'Edit Workspace' }}
      </BaseHeading>
      <BaseButton size="sm" variant="ghost" @click="handleClose">
        <Icon name="lucide:x" class="size-4" />
      </BaseButton>
    </div>

    <div class="flex-1 space-y-6 overflow-y-auto p-6">
      <div class="space-y-2">
        <BaseLabel>
          Workspace name
        </BaseLabel>
        <BaseInput
          v-model="state.name"
          type="text"
          placeholder="Marketing Operations"
          :disabled="state.isSaving"
        />
      </div>

      <div class="space-y-2">
        <BaseLabel>
          Slug
        </BaseLabel>
        <BaseInput
          v-model="state.slug"
          type="text"
          placeholder="marketing-operations"
          :disabled="state.isSaving"
        />
        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
          Used in URLs. Lowercase letters, numbers, and hyphens only.
        </BaseText>
      </div>

      <div class="space-y-2">
        <BaseLabel>
          Description
        </BaseLabel>
        <BaseTextarea
          v-model="state.description"
          rows="4"
          placeholder="Describe how this workspace is used."
          :disabled="state.isSaving"
        />
      </div>

      <BaseAlert
        v-if="state.error"
        color="danger"
        variant="pastel"
        class="rounded-xl"
      >
        <template #title>
          Unable to save workspace
        </template>
        <p class="text-xs text-danger-600 dark:text-danger-300">
          {{ state.error }}
        </p>
      </BaseAlert>
    </div>

    <div class="flex items-center justify-between border-t border-muted-200 p-6 dark:border-muted-700">
      <BaseButton variant="ghost" @click="handleClose">
        Cancel
      </BaseButton>
      <BaseButton
        variant="primary"
        :disabled="!isValid || state.isSaving"
        :loading="state.isSaving"
        @click="handleSave"
      >
        {{ isCreateMode ? 'Create workspace' : 'Save changes' }}
      </BaseButton>
    </div>
  </div>
</template>


