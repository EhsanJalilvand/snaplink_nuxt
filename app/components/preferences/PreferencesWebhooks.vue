<script setup lang="ts">
import { ref } from 'vue'
import { useNuiToasts } from '#imports'

const toaster = useNuiToasts()

// Webhooks state
const webhooks = ref([
  {
    id: '1',
    name: 'Link Created',
    url: 'https://api.example.com/webhooks/link-created',
    events: ['link.created'],
    status: 'active',
    secret: 'whsec_***',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Link Clicked',
    url: 'https://api.example.com/webhooks/link-clicked',
    events: ['link.clicked'],
    status: 'active',
    secret: 'whsec_***',
    createdAt: '2024-01-10',
  },
])

const isCreating = ref(false)
const showCreateModal = ref(false)
const newWebhook = ref({
  name: '',
  url: '',
  events: [] as string[],
})

const eventOptions = [
  { label: 'Link Created', value: 'link.created' },
  { label: 'Link Updated', value: 'link.updated' },
  { label: 'Link Deleted', value: 'link.deleted' },
  { label: 'Link Clicked', value: 'link.clicked' },
  { label: 'Link Expired', value: 'link.expired' },
]

const handleCreateWebhook = async () => {
  if (!newWebhook.value.name || !newWebhook.value.url || newWebhook.value.events.length === 0) {
    toaster.add({
      title: 'Error',
      description: 'Please fill in all required fields',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
    return
  }

  isCreating.value = true
  try {
    // TODO: API call to create webhook
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    webhooks.value.push({
      id: Date.now().toString(),
      name: newWebhook.value.name,
      url: newWebhook.value.url,
      events: newWebhook.value.events,
      status: 'active',
      secret: 'whsec_***',
      createdAt: new Date().toISOString().split('T')[0],
    })

    newWebhook.value = { name: '', url: '', events: [] }
    showCreateModal.value = false

    toaster.add({
      title: 'Success',
      description: 'Webhook created successfully!',
      icon: 'ph:check',
      progress: true,
    })
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to create webhook',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  } finally {
    isCreating.value = false
  }
}

const handleDeleteWebhook = async (webhookId: string) => {
  try {
    // TODO: API call to delete webhook
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    webhooks.value = webhooks.value.filter(w => w.id !== webhookId)
    
    toaster.add({
      title: 'Success',
      description: 'Webhook deleted successfully!',
      icon: 'ph:check',
      progress: true,
    })
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to delete webhook',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  }
}

const handleToggleWebhook = async (webhookId: string) => {
  const webhook = webhooks.value.find(w => w.id === webhookId)
  if (!webhook) return

  try {
    // TODO: API call to toggle webhook status
    await new Promise(resolve => setTimeout(resolve, 500))
    
    webhook.status = webhook.status === 'active' ? 'inactive' : 'active'
    
    toaster.add({
      title: 'Success',
      description: `Webhook ${webhook.status === 'active' ? 'activated' : 'deactivated'}`,
      icon: 'ph:check',
      progress: true,
    })
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to update webhook',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  }
}

const toggleEvent = (eventValue: string) => {
  const index = newWebhook.value.events.indexOf(eventValue)
  if (index > -1) {
    newWebhook.value.events.splice(index, 1)
  } else {
    newWebhook.value.events.push(eventValue)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Create Webhook Button -->
    <div class="flex justify-end">
      <BaseButton
        variant="primary"
        @click="showCreateModal = true"
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
          v-for="webhook in webhooks"
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
                @click="handleToggleWebhook(webhook.id)"
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
                @click="handleDeleteWebhook(webhook.id)"
              >
                <Icon name="lucide:trash-2" class="size-4" />
              </BaseButton>
            </div>
          </div>
        </div>

        <div
          v-if="webhooks.length === 0"
          class="text-center py-12"
        >
          <Icon name="solar:api-linear" class="size-12 text-muted-400 mx-auto mb-4" />
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-4">
            No webhooks configured yet. Create one to get started!
          </BaseParagraph>
          <BaseButton
            variant="primary"
            @click="showCreateModal = true"
          >
            <Icon name="ph:plus" class="size-4" />
            <span>Create Webhook</span>
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Create Webhook Modal -->
    <DialogRoot v-model:open="showCreateModal">
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
              @click="showCreateModal = false"
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
                v-model="newWebhook.name"
                placeholder="e.g., Link Created Webhook"
                icon="solar:tag-linear"
                rounded="lg"
              />
            </TairoFormGroup>

            <TairoFormGroup
              label="Webhook URL"
              sublabel="The URL where webhook events will be sent"
              required
            >
              <TairoInput
                v-model="newWebhook.url"
                type="url"
                placeholder="https://api.example.com/webhooks"
                icon="solar:link-linear"
                rounded="lg"
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
                    :checked="newWebhook.events.includes(event.value)"
                    class="rounded border-muted-300 dark:border-muted-600 text-primary-600 focus:ring-primary-500"
                    @change="toggleEvent(event.value)"
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
              @click="showCreateModal = false"
            >
              Cancel
            </BaseButton>
            <BaseButton
              variant="primary"
              :loading="isCreating"
              :disabled="isCreating || !newWebhook.name || !newWebhook.url || newWebhook.events.length === 0"
              @click="handleCreateWebhook"
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

