<script setup lang="ts">
import { callOnce } from '#imports'
import { usePreferencesWebhooks } from '~/composables/usePreferencesWebhooks'

const {
  items,
  isLoading,
  isSaving,
  error,
  createModalOpen,
  draft,
  eventOptions,
  fetchWebhooks,
  openCreateModal,
  closeCreateModal,
  updateDraft,
  toggleDraftEvent,
  createWebhook,
  removeWebhook,
  toggleWebhookStatus,
} = usePreferencesWebhooks()

await callOnce(() => fetchWebhooks())

const handleCreate = async () => {
  await createWebhook()
}

const handleToggle = async (id: string) => {
  await toggleWebhookStatus(id)
}

const handleRemove = async (id: string) => {
  await removeWebhook(id)
}

const handleToggleEvent = (value: string) => {
  toggleDraftEvent(value)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Create Webhook Button -->
    <div class="flex justify-end">
      <BaseButton
        variant="primary"
        @click="openCreateModal"
      >
        <Icon name="ph:plus" class="size-4" />
        <span>Create Webhook</span>
      </BaseButton>
    </div>

    <!-- Webhooks List -->
    <div class="bg-white dark:bg-muted-800 rounded-lg border border-muted-200 dark:border-muted-700 p-6">
      <div class="mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Webhooks
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Configure webhooks to receive real-time notifications
        </BaseParagraph>
      </div>

      <div class="space-y-4">
        <div
          v-if="isLoading"
          class="space-y-3"
        >
          <BaseCard
            v-for="index in 3"
            :key="index"
            class="h-24 animate-pulse rounded-xl bg-muted-200/80 dark:bg-muted-800/60"
          />
        </div>

        <div
          v-else
          v-for="webhook in items"
          :key="webhook.id"
          class="p-4 border border-muted-200 dark:border-muted-700 rounded-lg hover:bg-muted-50 dark:hover:bg-muted-700/50 transition-colors"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <BaseHeading
                  as="h4"
                  size="sm"
                  weight="semibold"
                  class="text-muted-800 dark:text-muted-100"
                >
                  {{ webhook.name }}
                </BaseHeading>
                <BaseChip
                  :color="webhook.status === 'active' ? 'success' : 'muted'"
                  size="sm"
                >
                  {{ webhook.status === 'active' ? 'Active' : 'Inactive' }}
                </BaseChip>
              </div>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 mb-2">
                {{ webhook.url }}
              </BaseParagraph>
              <div class="flex flex-wrap gap-2">
                <BaseChip
                  v-for="event in webhook.events"
                  :key="event"
                  size="xs"
                  color="muted"
                >
                  {{ event }}
                </BaseChip>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <BaseButton
                size="sm"
                variant="ghost"
                @click="handleToggle(webhook.id)"
              >
                <Icon
                  :name="webhook.status === 'active' ? 'ph:toggle-right' : 'ph:toggle-left'"
                  class="size-4"
                />
              </BaseButton>
              <BaseButton
                size="sm"
                variant="ghost"
                color="danger"
                @click="handleRemove(webhook.id)"
              >
                <Icon name="lucide:trash-2" class="size-4" />
              </BaseButton>
            </div>
          </div>
        </div>

        <div
          v-if="!isLoading && items.length === 0"
          class="text-center py-12"
        >
          <Icon name="solar:api-linear" class="size-12 text-muted-400 mx-auto mb-4" />
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-4">
            No webhooks configured yet. Create one to get started!
          </BaseParagraph>
          <BaseButton
            variant="primary"
            @click="openCreateModal"
          >
            <Icon name="ph:plus" class="size-4" />
            <span>Create Webhook</span>
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Create Webhook Modal -->
    <DialogRoot v-model:open="createModalOpen">
      <DialogPortal>
        <DialogOverlay class="bg-muted-800/70 dark:bg-muted-900/80 fixed inset-0 z-50" />
        <DialogContent
          class="fixed top-[10%] start-[50%] max-h-[85vh] w-[90vw] max-w-[32rem] translate-x-[-50%] text-sm rounded-lg overflow-hidden border border-muted-200 dark:border-muted-700 bg-white dark:bg-muted-800 focus:outline-none z-[100] transition-all duration-200 ease-out flex flex-col"
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-muted-200 dark:border-muted-700">
            <div class="flex items-center gap-2">
              <Icon name="ph:plus" class="size-5" />
              <BaseHeading
                as="h3"
                size="lg"
                weight="semibold"
              >
                Create Webhook
              </BaseHeading>
            </div>
            <BaseButton
              size="sm"
              variant="ghost"
              @click="closeCreateModal"
            >
              <Icon name="lucide:x" class="size-4" />
            </BaseButton>
          </div>

          <!-- Content -->
          <div class="p-6 space-y-6 overflow-y-auto flex-1">
            <TairoFormGroup
              label="Webhook Name"
              sublabel="Give your webhook a descriptive name"
              required
            >
              <TairoInput
                :model-value="draft.name"
                placeholder="e.g., Link Created Webhook"
                icon="solar:tag-linear"
                rounded="lg"
                :disabled="isSaving"
                @update:model-value="updateDraft({ name: $event })"
              />
            </TairoFormGroup>

            <TairoFormGroup
              label="Webhook URL"
              sublabel="The URL where webhook events will be sent"
              required
            >
              <TairoInput
                :model-value="draft.url"
                type="url"
                placeholder="https://api.example.com/webhooks"
                icon="solar:link-linear"
                rounded="lg"
                :disabled="isSaving"
                @update:model-value="updateDraft({ url: $event })"
              />
            </TairoFormGroup>

            <TairoFormGroup
              label="Events"
              sublabel="Select which events to subscribe to"
              required
            >
              <div class="space-y-2">
                <label
                  v-for="event in eventOptions"
                  :key="event.value"
                  class="flex items-center gap-3 p-3 border border-muted-200 dark:border-muted-700 rounded-lg cursor-pointer hover:bg-muted-50 dark:hover:bg-muted-700/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    :checked="draft.events.includes(event.value)"
                    class="rounded border-muted-300 dark:border-muted-600 text-primary-600 focus:ring-primary-500"
                    :disabled="isSaving"
                    @change="handleToggleEvent(event.value)"
                  >
                  <BaseText size="sm" class="text-muted-700 dark:text-muted-300">
                    {{ event.label }}
                  </BaseText>
                </label>
              </div>
            </TairoFormGroup>
          </div>

          <!-- Footer -->
          <div class="flex justify-end gap-2 p-6 border-t border-muted-200 dark:border-muted-700">
            <BaseButton
              variant="ghost"
              @click="closeCreateModal"
            >
              Cancel
            </BaseButton>
            <BaseButton
              variant="primary"
              :loading="isSaving"
              :disabled="isSaving || !draft.name || !draft.url || draft.events.length === 0"
              @click="handleCreate"
            >
              <Icon name="ph:check" class="size-4" />
              <span>Create Webhook</span>
            </BaseButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>

