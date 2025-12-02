<script setup lang="ts">
import type { CreateSmartLinkRequest, SmartLinkConditionType, SmartLinkRule } from '~/types/url-shortener'
import { useSmartLinks } from '~/composables/useSmartLinks'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'

type ChatMessage = {
  id: string
  role: 'ai' | 'user'
  content: string
  timestamp: Date
  rules?: SmartLinkRule[]
}

type SmartLinkRuleForm = {
  uid: string
  targetUrl: string
  conditionType: SmartLinkConditionType
  condition: Record<string, any>
  priority: number
  isActive: boolean
}

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
  created: [payload: { id: string; shortUrl: string }]
}>()

const toaster = useNuiToasts()
const { workspaceId } = useWorkspaceContext()
const { createSmartLink, chatWithAi } = useSmartLinks()

const isOpen = computed({
  get: () => props.open,
  set: (value) => {
    emit('update:open', value)
    if (!value) {
      emit('close')
      nextTick(() => {
        resetWizard()
      })
    }
  },
})

const messages = ref<ChatMessage[]>([])
const userInput = ref('')
const isAiThinking = ref(false)
const conversationId = ref<string | null>(null)
const rules = ref<SmartLinkRuleForm[]>([])
const formData = ref({
  name: '',
  fallbackUrl: '',
  domainType: 'default',
  domainValue: null as string | null,
  customAlias: '',
  description: '',
  collectionIds: [] as string[],
  visibility: 'public' as 'public' | 'private',
  visibilityRoles: [] as string[],
  visibilityMemberIds: [] as string[],
  isOneTime: false,
  expiresAt: null as string | null,
  clickLimit: null as number | null,
  hasPassword: false,
  password: '',
})

const isSubmitting = ref(false)
const createdResult = ref<{ id: string; shortUrl: string } | null>(null)
const showPreview = ref(false)


const addMessage = (role: 'ai' | 'user', content: string, rulesData?: SmartLinkRule[]) => {
  messages.value.push({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    role,
    content,
    timestamp: new Date(),
    rules: rulesData,
  })
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isAiThinking.value) {
    return
  }

  const userMessage = userInput.value.trim()
  userInput.value = ''
  
  addMessage('user', userMessage)
  isAiThinking.value = true

  try {
    const data = await chatWithAi({
      conversationId: conversationId.value,
      message: userMessage,
      context: {
        rules: rules.value.map(rule => ({
          targetUrl: rule.targetUrl,
          conditionType: rule.conditionType,
          condition: rule.condition,
          priority: rule.priority,
          isActive: rule.isActive,
        })),
        formData: formData.value,
      },
    })
    
    if (data.conversationId) {
      conversationId.value = data.conversationId
    }

    if (data.message) {
      addMessage('ai', data.message, data.rules)
    }

    if (data.rules && Array.isArray(data.rules)) {
      updateRulesFromAi(data.rules)
    }

    if (data.formData) {
      Object.assign(formData.value, data.formData)
    }

    if (data.showPreview) {
      showPreview.value = true
    }
  }
  catch (error: any) {
    console.error('[SmartLinkAiWizard] Chat error', error)
    toaster.add({
      title: 'Error',
      description: error?.message || 'Failed to send message',
      icon: 'lucide:alert-triangle',
      color: 'danger',
    })
    addMessage('ai', 'متأسفم، خطایی رخ داد. لطفاً دوباره تلاش کنید.')
  }
  finally {
    isAiThinking.value = false
  }
}

const updateRulesFromAi = (aiRules: any[]) => {
  rules.value = aiRules.map((rule, index) => ({
    uid: Date.now().toString() + index,
    targetUrl: rule.targetUrl || '',
    conditionType: rule.conditionType || 'GeoCountry',
    condition: rule.condition || {},
    priority: (index + 1) * 10,
    isActive: rule.isActive !== false,
  }))
}

const resetWizard = () => {
  messages.value = []
  userInput.value = ''
  isAiThinking.value = false
  conversationId.value = null
  rules.value = []
  formData.value = {
    name: '',
    fallbackUrl: '',
    domainType: 'default',
    domainValue: null,
    customAlias: '',
    description: '',
    collectionIds: [],
    visibility: 'public',
    visibilityRoles: [],
    visibilityMemberIds: [],
    isOneTime: false,
    expiresAt: null,
    clickLimit: null,
    hasPassword: false,
    password: '',
  }
  isSubmitting.value = false
  createdResult.value = null
  showPreview.value = false
}

const submitSmartLink = async () => {
  if (!formData.value.name.trim() || !rules.value.length) {
    toaster.add({
      title: 'Validation Error',
      description: 'Please provide a name and at least one rule',
      icon: 'lucide:alert-triangle',
      color: 'danger',
    })
    return
  }

  isSubmitting.value = true
  try {
    const request: CreateSmartLinkRequest = {
      name: formData.value.name.trim(),
      description: formData.value.description?.trim() || null,
      domainType: formData.value.domainType,
      domainValue: formData.value.domainValue,
      customAlias: formData.value.customAlias?.trim() || null,
      fallbackUrl: formData.value.fallbackUrl.trim() || null,
      isOneTime: formData.value.isOneTime,
      expiresAt: formData.value.expiresAt ? new Date(formData.value.expiresAt).toISOString() : null,
      clickLimit: formData.value.clickLimit,
      password: formData.value.hasPassword ? formData.value.password : null,
      collectionIds: formData.value.collectionIds.length ? formData.value.collectionIds : null,
      rules: rules.value
        .filter(rule => rule.targetUrl.trim())
        .map(rule => ({
          targetUrl: rule.targetUrl.trim(),
          conditionType: rule.conditionType,
          condition: rule.condition,
          priority: rule.priority,
          isActive: rule.isActive,
        })),
    }

    const result = await createSmartLink(request)
    if (result) {
      createdResult.value = result
      emit('created', result)
    }
  }
  catch (error: any) {
    console.error('[SmartLinkAiWizard] Create error', error)
    toaster.add({
      title: 'Error',
      description: error?.message || 'Failed to create SmartLink',
      icon: 'lucide:alert-triangle',
      color: 'danger',
    })
  }
  finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  isOpen.value = false
}

watch(isOpen, (value) => {
  if (value) {
    fetchLinks({ force: true })
    // Start conversation with AI
    nextTick(() => {
      addMessage('ai', 'سلام! من به شما کمک می‌کنم یک SmartLink بسازید. هدف کمپین شما چیست؟')
    })
  }
}, { immediate: false })

const chatContainer = ref<HTMLElement>()

watch(messages, () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}, { deep: true })
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogPortal>
      <DialogOverlay
        class="bg-muted-800/70 dark:bg-muted-900/80 fixed inset-0 z-50"
      />
      <DialogContent
        class="fixed top-[2%] start-1/2 max-h-[96vh] w-[95vw] max-w-6xl -translate-x-1/2 rounded-2xl border border-muted-200 dark:border-muted-700 bg-white dark:bg-muted-900 focus:outline-none z-[100] flex flex-col"
        @escape-key-down="handleClose"
        @interact-outside.prevent
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-muted-200 dark:border-muted-800 px-6 py-4">
          <div>
            <DialogTitle class="font-heading text-xl font-semibold text-muted-900 dark:text-white">
              Create SmartLink With AI
            </DialogTitle>
            <DialogDescription class="text-sm text-muted-500 dark:text-muted-400">
              Chat with AI to build your SmartLink
            </DialogDescription>
          </div>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="handleClose"
          >
            <Icon name="lucide:x" class="size-4" />
          </BaseButton>
        </div>

        <!-- Main Content: Chat + Preview -->
        <div class="flex-1 flex overflow-hidden">
          <!-- Chat Section (Left) -->
          <div class="flex-1 flex flex-col border-r border-muted-200 dark:border-muted-800">
            <!-- Chat Messages -->
            <div
              ref="chatContainer"
              class="flex-1 overflow-y-auto p-6 space-y-4"
            >
              <div
                v-for="message in messages"
                :key="message.id"
                class="flex gap-3"
                :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
              >
                <div
                  v-if="message.role === 'ai'"
                  class="flex items-start gap-3 max-w-[80%]"
                >
                  <div class="flex-shrink-0 size-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icon name="ph:sparkle" class="size-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div class="flex-1 rounded-lg bg-muted-100 dark:bg-muted-800 p-4">
                    <BaseParagraph size="sm" class="text-muted-800 dark:text-muted-100 whitespace-pre-wrap">
                      {{ message.content }}
                    </BaseParagraph>
                  </div>
                </div>
                <div
                  v-else
                  class="flex items-start gap-3 max-w-[80%]"
                >
                  <div class="flex-1 rounded-lg bg-primary-500 text-white p-4">
                    <BaseParagraph size="sm" class="whitespace-pre-wrap">
                      {{ message.content }}
                    </BaseParagraph>
                  </div>
                  <div class="flex-shrink-0 size-8 rounded-full bg-muted-200 dark:bg-muted-700 flex items-center justify-center">
                    <Icon name="ph:user" class="size-4 text-muted-600 dark:text-muted-400" />
                  </div>
                </div>
              </div>

              <!-- Loading Indicator -->
              <div
                v-if="isAiThinking"
                class="flex gap-3 justify-start"
              >
                <div class="flex-shrink-0 size-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Icon name="ph:sparkle" class="size-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div class="flex-1 rounded-lg bg-muted-100 dark:bg-muted-800 p-4">
                  <div class="flex items-center gap-2">
                    <Icon name="ph:spinner" class="size-4 animate-spin text-primary-500" />
                    <BaseParagraph size="sm" class="text-muted-500">
                      در حال فکر کردن...
                    </BaseParagraph>
                  </div>
                </div>
              </div>
            </div>

            <!-- Chat Input -->
            <div class="border-t border-muted-200 dark:border-muted-800 p-4">
              <div class="flex gap-2">
                <TairoInput
                  v-model="userInput"
                  placeholder="پاسخ خود را بنویسید..."
                  rounded="lg"
                  class="flex-1"
                  @keyup.enter="sendMessage"
                />
                <BaseButton
                  variant="primary"
                  :disabled="!userInput.trim() || isAiThinking"
                  @click="sendMessage"
                >
                  <Icon name="ph:paper-plane-tilt" class="size-4" />
                </BaseButton>
              </div>
            </div>
          </div>

          <!-- Preview Section (Right) -->
          <div class="w-96 flex flex-col border-l border-muted-200 dark:border-muted-800 bg-muted-50 dark:bg-muted-950">
            <div class="p-4 border-b border-muted-200 dark:border-muted-800">
              <BaseHeading as="h4" size="sm" weight="semibold">
                Preview
              </BaseHeading>
            </div>
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
              <!-- SmartLink Name -->
              <TairoFormGroup label="SmartLink Name">
                <TairoInput
                  v-model="formData.name"
                  placeholder="Enter name"
                  size="sm"
                />
              </TairoFormGroup>

              <!-- Rules Preview -->
              <div>
                <BaseHeading as="h5" size="xs" weight="semibold" class="mb-2">
                  Rules ({{ rules.length }})
                </BaseHeading>
                <div v-if="rules.length === 0" class="text-sm text-muted-500 text-center py-4">
                  No rules yet
                </div>
                <div v-else class="space-y-2">
                  <BaseCard
                    v-for="(rule, index) in rules"
                    :key="rule.uid"
                    class="p-3 text-xs"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-semibold">Rule {{ index + 1 }}</span>
                      <BaseTag
                        :color="rule.isActive ? 'success' : 'muted'"
                        size="xs"
                      >
                        {{ rule.isActive ? 'Active' : 'Inactive' }}
                      </BaseTag>
                    </div>
                    <BaseParagraph size="xs" class="text-muted-600 dark:text-muted-400">
                      {{ rule.conditionType }}
                    </BaseParagraph>
                    <BaseParagraph
                      v-if="rule.targetUrl"
                      size="xs"
                      class="text-primary-600 dark:text-primary-400 mt-1 truncate"
                    >
                      → {{ rule.targetUrl }}
                    </BaseParagraph>
                  </BaseCard>
                </div>
              </div>

              <!-- Fallback -->
              <TairoFormGroup label="Fallback Destination">
                <TairoInput
                  v-model="formData.fallbackUrl"
                  size="sm"
                  placeholder="Enter fallback URL (e.g., https://example.com)"
                  rounded="lg"
                />
              </TairoFormGroup>
            </div>

            <!-- Submit Button -->
            <div class="p-4 border-t border-muted-200 dark:border-muted-800">
              <BaseButton
                variant="primary"
                class="w-full"
                :disabled="!formData.name.trim() || !rules.length || isSubmitting"
                :loading="isSubmitting"
                @click="submitSmartLink"
              >
                <Icon v-if="!isSubmitting" name="ph:check" class="size-4" />
                <span>{{ isSubmitting ? 'Creating...' : 'Create SmartLink' }}</span>
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Success State -->
        <div
          v-if="createdResult"
          class="p-6 border-t border-muted-200 dark:border-muted-800 text-center space-y-4"
        >
          <Icon name="ph:check-circle" class="size-12 text-success-500 mx-auto" />
          <BaseHeading as="h3" size="lg" weight="semibold">
            SmartLink Created!
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500">
            {{ createdResult.shortUrl }}
          </BaseParagraph>
          <BaseButton
            variant="primary"
            @click="handleClose"
          >
            Done
          </BaseButton>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

