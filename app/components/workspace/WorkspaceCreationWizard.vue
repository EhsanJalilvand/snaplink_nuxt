<script setup lang="ts">
import { ref, computed, onMounted } from '#imports'
import WorkspacePreferences from '~/components/workspace/WorkspacePreferences.vue'
import { usePreferencesTabs } from '~/composables/usePreferencesTabs'
import { useApi } from '~/composables/useApi'
import { useNuiToasts } from '#imports'
import { useSecurity } from '~/composables/useSecurity'
import type { PreferencesTabId } from '~/types/preferences'

const props = defineProps<{
  workspaceName?: string
}>()

const emit = defineEmits<{
  close: []
  saved: [workspaceId: string]
}>()

const api = useApi()
const toasts = useNuiToasts()
const security = useSecurity()
const { tabs, activeTab, setActiveTab } = usePreferencesTabs()

const workspaceName = ref(props.workspaceName || '')
const isCreating = ref(false)
const createdWorkspaceId = ref<string | null>(null)
const error = ref<string | null>(null)
const isNameStep = ref(true)

// Initialize to name step
onMounted(() => {
  setActiveTab('appearance')
  isNameStep.value = true
})

const currentStepIndex = computed(() => {
  // -1 means workspace name step
  if (isNameStep.value) {
    return -1
  }
  return tabs.value.findIndex((tab) => tab.id === activeTab.value)
})

const canGoNext = computed(() => {
  // Only workspace name is required
  if (currentStepIndex.value === -1 && !workspaceName.value.trim()) {
    return false
  }
  return true
})

const canGoPrevious = computed(() => {
  if (currentStepIndex.value === -1) {
    return false
  }
  return currentStepIndex.value >= 0
})

const isLastStep = computed(() => {
  return currentStepIndex.value === tabs.value.length - 1
})

const handleNext = () => {
  if (isNameStep.value) {
    // Move from name step to first preference tab
    isNameStep.value = false
    setActiveTab('appearance')
  } else if (isLastStep.value) {
    handleFinish()
  } else {
    const nextIndex = currentStepIndex.value + 1
    if (nextIndex < tabs.value.length) {
      setActiveTab(tabs.value[nextIndex].id)
    }
  }
}

const handlePrevious = () => {
  if (currentStepIndex.value === 0) {
    // Move from first preference tab back to name step
    isNameStep.value = true
  } else if (currentStepIndex.value > 0) {
    const prevIndex = currentStepIndex.value - 1
    if (prevIndex >= 0) {
      setActiveTab(tabs.value[prevIndex].id)
    }
  }
}

const handleFinish = async () => {
  if (!workspaceName.value.trim()) {
    error.value = 'Workspace name is required'
    toasts.add({
      title: 'Validation failed',
      description: 'Please enter a workspace name.',
      icon: 'ph:warning',
      progress: true,
    })
    return
  }

  if (isCreating.value) {
    return
  }

  isCreating.value = true
  error.value = null

  try {
    // Create workspace first
    const createResponse = await api.post<{ data: { id: string } }>(
      '/workspaces',
      {
        name: security.sanitizeInput(workspaceName.value, { trim: true, replaceNewLines: true }),
      },
      {
        base: 'gateway',
        requiresAuth: true,
      }
    )

    if (!createResponse?.data?.id) {
      throw new Error('Failed to create workspace')
    }

    createdWorkspaceId.value = createResponse.data.id

    toasts.add({
      title: 'Workspace created',
      description: 'Your workspace has been created successfully.',
      icon: 'ph:check',
      progress: true,
    })

    emit('saved', createdWorkspaceId.value)
  } catch (err) {
    error.value = (err as Error)?.message || 'Failed to create workspace'
    toasts.add({
      title: 'Creation failed',
      description: security.escapeHtml(error.value),
      icon: 'ph:warning',
      progress: true,
    })
  } finally {
    isCreating.value = false
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
    <div class="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-muted-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-muted-200 dark:border-muted-700 p-6">
        <div>
          <BaseHeading
            as="h2"
            size="xl"
            weight="bold"
            class="text-muted-800 dark:text-muted-100 mb-1"
          >
            Create New Workspace
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            Step {{ currentStepIndex + 2 }} of {{ tabs.length + 1 }}
          </BaseParagraph>
        </div>
        <BaseButton
          size="sm"
          variant="ghost"
          @click="handleClose"
        >
          <Icon name="lucide:x" class="size-4" />
        </BaseButton>
      </div>

      <!-- Progress Steps -->
      <div class="border-b border-muted-200 dark:border-muted-700 px-6 py-4">
        <div class="flex items-center gap-2 overflow-x-auto">
          <!-- Workspace Name Step -->
          <div class="flex items-center gap-2 shrink-0">
            <div
              class="flex size-8 items-center justify-center rounded-full border-2 transition-colors"
              :class="
                currentStepIndex === -1
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-primary-500 bg-white dark:bg-muted-800 text-primary-500'
              "
            >
              <Icon name="ph:check" class="size-4" />
            </div>
            <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
              Name
            </BaseText>
          </div>

          <div class="h-0.5 w-8 bg-muted-200 dark:bg-muted-700" />

          <!-- Preference Steps -->
          <template v-for="(tab, index) in tabs" :key="tab.id">
            <div class="flex items-center gap-2 shrink-0">
              <div
                class="flex size-8 items-center justify-center rounded-full border-2 transition-colors"
                :class="
                  currentStepIndex === index
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : currentStepIndex > index
                      ? 'border-primary-500 bg-white dark:bg-muted-800 text-primary-500'
                      : 'border-muted-300 dark:border-muted-600 bg-white dark:bg-muted-800 text-muted-400'
                "
              >
                <Icon
                  v-if="currentStepIndex > index"
                  name="ph:check"
                  class="size-4"
                />
                <span v-else class="text-xs font-semibold">{{ index + 1 }}</span>
              </div>
              <BaseText
                size="xs"
                class="text-muted-600 dark:text-muted-400"
              >
                {{ tab.label }}
              </BaseText>
            </div>
            <div
              v-if="index < tabs.length - 1"
              class="h-0.5 w-8 bg-muted-200 dark:bg-muted-700"
            />
          </template>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Workspace Name Step -->
        <div v-if="isNameStep" class="space-y-6">
          <div class="bg-white dark:bg-muted-800 rounded-lg border border-muted-200 dark:border-muted-700 p-6">
            <div class="mb-6">
              <BaseHeading
                as="h3"
                size="md"
                weight="semibold"
                class="text-muted-800 dark:text-muted-100 mb-2"
              >
                Workspace Name
              </BaseHeading>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                Choose a name for your workspace. This is the only required field.
              </BaseParagraph>
            </div>

            <TairoFormGroup
              label="Name"
              sublabel="Enter your workspace name"
              required
            >
              <TairoInput
                v-model="workspaceName"
                type="text"
                placeholder="My Workspace"
                icon="solar:layers-linear"
                rounded="lg"
                :disabled="isCreating"
              />
            </TairoFormGroup>
          </div>
        </div>

        <!-- Preferences Steps -->
        <WorkspacePreferences
          v-else
          :workspace-id="createdWorkspaceId"
        />
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between border-t border-muted-200 dark:border-muted-700 p-6">
        <BaseButton
          variant="ghost"
          :disabled="!canGoPrevious || isCreating"
          @click="handlePrevious"
        >
          <Icon name="ph:arrow-left" class="size-4" />
          <span>Previous</span>
        </BaseButton>

        <div class="flex items-center gap-2">
          <BaseButton
            variant="ghost"
            @click="handleClose"
          >
            Cancel
          </BaseButton>
          <BaseButton
            variant="primary"
            :loading="isCreating"
            :disabled="!canGoNext || isCreating"
            @click="handleNext"
          >
            <span>{{ isLastStep ? 'Create Workspace' : 'Next' }}</span>
            <Icon
              v-if="!isLastStep"
              name="ph:arrow-right"
              class="size-4"
            />
            <Icon
              v-else
              name="ph:check"
              class="size-4"
            />
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

