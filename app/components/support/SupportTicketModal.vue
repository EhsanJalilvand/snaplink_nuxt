<script setup lang="ts">
import type { SupportTicketCreatePayload } from '~/types/support'

const props = defineProps<{
  open: boolean
  draft: SupportTicketCreatePayload
  isSaving?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'updateDraft', value: Partial<SupportTicketCreatePayload>): void
  (e: 'submit'): void
}>()

const updateDraft = (patch: Partial<SupportTicketCreatePayload>) => {
  emit('updateDraft', patch)
}

const close = () => emit('update:open', false)

const handleSubmit = () => emit('submit')
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="bg-muted-900/70 fixed inset-0 z-50 backdrop-blur-sm" />
      <DialogContent
        class="fixed top-[5%] start-1/2 z-[100] w-[min(92vw,640px)] -translate-x-1/2 rounded-2xl border border-muted-200 bg-white shadow-xl focus:outline-none dark:border-muted-700 dark:bg-muted-900"
      >
        <div class="flex items-center justify-between border-b border-muted-200 px-6 py-4 dark:border-muted-700">
          <div>
            <DialogTitle class="text-lg font-semibold text-muted-900 dark:text-white">
              Create support ticket
            </DialogTitle>
            <DialogDescription class="text-sm text-muted-500 dark:text-muted-400">
              Describe the issue and choose a priority. We’ll route it instantly.
            </DialogDescription>
          </div>
          <BaseButton size="sm" variant="ghost" icon class="rounded-full" @click="close">
            <Icon name="lucide:x" class="size-4" />
          </BaseButton>
        </div>

        <div class="space-y-5 px-6 py-5">
          <div class="grid gap-4 md:grid-cols-2">
            <TairoFormGroup label="Requester name" required>
              <TairoInput
                :model-value="draft.requesterName"
                placeholder="Jane Merchant"
                rounded="lg"
                :disabled="isSaving"
                @update:model-value="updateDraft({ requesterName: $event })"
              />
            </TairoFormGroup>
            <TairoFormGroup label="Requester email" required>
              <TairoInput
                :model-value="draft.requesterEmail"
                type="email"
                placeholder="jane@snaplink.app"
                rounded="lg"
                :disabled="isSaving"
                @update:model-value="updateDraft({ requesterEmail: $event })"
              />
            </TairoFormGroup>
          </div>

          <TairoFormGroup label="Subject" required>
            <TairoInput
              :model-value="draft.subject"
              placeholder="Give the ticket a clear title"
              rounded="lg"
              :disabled="isSaving"
              @update:model-value="updateDraft({ subject: $event })"
            />
          </TairoFormGroup>

          <TairoFormGroup label="Description" required>
            <textarea
              :value="draft.description"
              rows="6"
              placeholder="Explain the problem, expected behaviour, and any steps you've already tried."
              class="w-full rounded-xl border border-muted-200 bg-white px-4 py-3 text-sm text-muted-800 placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-muted-700 dark:bg-muted-900 dark:text-muted-100 dark:placeholder:text-muted-500"
              :disabled="isSaving"
              @input="updateDraft({ description: ($event.target as HTMLTextAreaElement).value })"
            />
          </TairoFormGroup>

          <div class="grid gap-4 md:grid-cols-2">
            <TairoFormGroup label="Channel">
              <TairoSelect
                :model-value="draft.channel"
                icon="solar:mail-linear"
                rounded="lg"
                :disabled="isSaving"
                @update:model-value="updateDraft({ channel: $event as SupportTicketCreatePayload['channel'] })"
              >
                <BaseSelectItem value="email">Email</BaseSelectItem>
                <BaseSelectItem value="chat">Chat</BaseSelectItem>
                <BaseSelectItem value="api">API</BaseSelectItem>
              </TairoSelect>
            </TairoFormGroup>
            <TairoFormGroup label="Priority">
              <TairoSelect
                :model-value="draft.priority"
                icon="solar:danger-triangle-linear"
                rounded="lg"
                :disabled="isSaving"
                @update:model-value="updateDraft({ priority: $event as SupportTicketCreatePayload['priority'] })"
              >
                <BaseSelectItem value="low">Low</BaseSelectItem>
                <BaseSelectItem value="medium">Medium</BaseSelectItem>
                <BaseSelectItem value="high">High</BaseSelectItem>
                <BaseSelectItem value="critical">Critical</BaseSelectItem>
              </TairoSelect>
            </TairoFormGroup>
          </div>

          <TairoFormGroup label="Tags">
            <TairoInput
              :model-value="draft.tags"
              placeholder="Comma-separated tags (optional)"
              rounded="lg"
              :disabled="isSaving"
              @update:model-value="updateDraft({ tags: $event })"
            />
          </TairoFormGroup>
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-muted-200 px-6 py-4 dark:border-muted-700">
          <BaseButton variant="ghost" @click="close">
            Cancel
          </BaseButton>
          <BaseButton variant="primary" :loading="isSaving" @click="handleSubmit">
            Submit ticket
          </BaseButton>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
