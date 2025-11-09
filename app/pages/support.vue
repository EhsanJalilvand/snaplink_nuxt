<script setup lang="ts">
definePageMeta({
  title: 'Support',
  layout: 'dashboard',
})

const toaster = useNuiToasts()

interface Ticket {
  id: string
  subject: string
  requester: string
  email: string
  status: 'open' | 'waiting' | 'resolved' | 'escalated'
  priority: 'low' | 'medium' | 'high' | 'critical'
  updatedAt: string
  summary: string
}

const stats = ref([
  {
    label: 'Active tickets',
    value: 128,
    delta: '+12.5%',
    icon: 'solar:lifebuoy-bold-duotone',
    color: 'primary',
  },
  {
    label: 'Waiting on customer',
    value: 36,
    delta: '-4.1%',
    icon: 'solar:user-speak-bold-duotone',
    color: 'warning',
  },
  {
    label: 'Avg first response',
    value: '7m 42s',
    delta: '-18%',
    icon: 'solar:clock-circle-bold-duotone',
    color: 'success',
  },
  {
    label: 'SLA breach risk',
    value: '6%',
    delta: '-2%',
    icon: 'solar:shield-warning-bold-duotone',
    color: 'danger',
  },
])

const tickets = ref<Ticket[]>([
  {
    id: 'TCK-4821',
    subject: 'Escrow payout stuck since yesterday',
    requester: 'Ava Stone',
    email: 'ava@novalabs.io',
    status: 'open',
    priority: 'high',
    updatedAt: '18 minutes ago',
    summary: 'Merchant reported an escrow payout that still shows as processing. Treasury review required before launch.',
  },
  {
    id: 'TCK-4819',
    subject: 'Webhook retries exhausted',
    requester: 'Leo Martins',
    email: 'leo@orbit.studio',
    status: 'waiting',
    priority: 'medium',
    updatedAt: '1 hour ago',
    summary: 'payment.success webhook is failing. Events are parked in the dead-letter queue until signature rotates.',
  },
  {
    id: 'TCK-4785',
    subject: 'Need branded checkout localization',
    requester: 'Sara Bloom',
    email: 'sara@pixelcraft.co',
    status: 'resolved',
    priority: 'low',
    updatedAt: 'Yesterday',
    summary: 'Customer requested localized checkout template for LATAM launch. Solutions team provided assets.',
  },
])

const searchQuery = ref('')
const statusFilter = ref<'all' | Ticket['status']>('all')
const priorityFilter = ref<'all' | Ticket['priority']>('all')

const filteredTickets = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return tickets.value.filter((ticket) => {
    const matchesQuery =
      !query ||
      ticket.subject.toLowerCase().includes(query) ||
      ticket.requester.toLowerCase().includes(query) ||
      ticket.id.toLowerCase().includes(query)

    const matchesStatus = statusFilter.value === 'all' || ticket.status === statusFilter.value
    const matchesPriority = priorityFilter.value === 'all' || ticket.priority === priorityFilter.value

    return matchesQuery && matchesStatus && matchesPriority
  })
})

const statusColor: Record<Ticket['status'], string> = {
  open: 'primary',
  waiting: 'warning',
  resolved: 'success',
  escalated: 'danger',
}

const priorityLabel: Record<Ticket['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

const priorityColor: Record<Ticket['priority'], string> = {
  low: 'muted',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
}

const showNewTicket = ref(false)
const activeTicketForDetails = ref<Ticket | null>(null)
const activeTicketForReply = ref<Ticket | null>(null)

const detailsOpen = ref(false)
const replyOpen = ref(false)

watch(detailsOpen, (value) => {
  if (!value) {
    activeTicketForDetails.value = null
  }
})

watch(replyOpen, (value) => {
  if (!value) {
    activeTicketForReply.value = null
    replyDraft.value = ''
  }
})

const newTicketForm = reactive({
  requesterName: '',
  requesterEmail: '',
  subject: '',
  description: '',
  channel: 'email',
  priority: 'medium',
  tags: '',
})

const resetNewTicket = () => {
  newTicketForm.requesterName = ''
  newTicketForm.requesterEmail = ''
  newTicketForm.subject = ''
  newTicketForm.description = ''
  newTicketForm.channel = 'email'
  newTicketForm.priority = 'medium'
  newTicketForm.tags = ''
}

const handleCreateTicket = () => {
  if (!newTicketForm.subject.trim() || !newTicketForm.description.trim()) {
    toaster.add({
      title: 'Missing details',
      description: 'Please add a subject and description.',
      icon: 'ph:warning',
      color: 'warning',
      progress: true,
    })
    return
  }

  toaster.add({
    title: 'Ticket created',
    description: 'We logged your request and assigned it to Support.',
    icon: 'ph:check',
    color: 'success',
    progress: true,
  })

  resetNewTicket()
  showNewTicket.value = false
}

const openDetails = (ticket: Ticket) => {
  activeTicketForDetails.value = ticket
  detailsOpen.value = true
}

const openReply = (ticket: Ticket) => {
  activeTicketForReply.value = ticket
  replyDraft.value = `Hi ${ticket.requester},\n\n`
  replyOpen.value = true
}

const replyDraft = ref('')

const handleSendReply = () => {
  if (!replyDraft.value.trim()) {
    toaster.add({
      title: 'Reply is empty',
      description: 'Please include a short message before sending.',
      icon: 'ph:warning',
      color: 'warning',
      progress: true,
    })
    return
  }

  toaster.add({
    title: 'Reply sent',
    description: 'Customer notified via preferred channel.',
    icon: 'ph:check',
    color: 'success',
    progress: true,
  })

  replyOpen.value = false
  replyDraft.value = ''
}
</script>

<template>
  <div class="space-y-6 py-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-900 dark:text-white"
        >
          Support Mission Control
        </BaseHeading>
        <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
          Track conversations, hit SLAs, and keep merchants confident.
        </BaseParagraph>
      </div>
      <BaseButton variant="primary" type="button" @click="showNewTicket = true">
        <Icon name="ph:plus" class="size-4" />
        New ticket
      </BaseButton>
    </div>

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

    <BaseCard class="space-y-4 p-6">
      <div class="flex flex-wrap items-center gap-3">
        <TairoInput
          v-model="searchQuery"
          icon="lucide:search"
          placeholder="Search tickets or people"
          rounded="lg"
          class="min-w-[220px] flex-1"
        />
        <TairoSelect
          v-model="statusFilter"
          icon="solar:filter-linear"
          rounded="lg"
          class="w-40"
        >
          <BaseSelectItem value="all">All statuses</BaseSelectItem>
          <BaseSelectItem value="open">Open</BaseSelectItem>
          <BaseSelectItem value="waiting">Waiting</BaseSelectItem>
          <BaseSelectItem value="resolved">Resolved</BaseSelectItem>
          <BaseSelectItem value="escalated">Escalated</BaseSelectItem>
        </TairoSelect>
        <TairoSelect
          v-model="priorityFilter"
          icon="solar:danger-triangle-linear"
          rounded="lg"
          class="w-40"
        >
          <BaseSelectItem value="all">All priorities</BaseSelectItem>
          <BaseSelectItem value="low">Low</BaseSelectItem>
          <BaseSelectItem value="medium">Medium</BaseSelectItem>
          <BaseSelectItem value="high">High</BaseSelectItem>
          <BaseSelectItem value="critical">Critical</BaseSelectItem>
        </TairoSelect>
      </div>

      <div class="divide-y divide-muted-200 rounded-2xl border border-muted-200 bg-white dark:divide-muted-800 dark:border-muted-700 dark:bg-muted-900/40">
        <div
          v-for="ticket in filteredTickets"
          :key="ticket.id"
          class="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
        >
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-900 dark:text-white">
                {{ ticket.subject }}
              </BaseHeading>
              <BaseChip :color="priorityColor[ticket.priority]" size="xs">
                {{ priorityLabel[ticket.priority] }}
              </BaseChip>
              <BaseChip :color="statusColor[ticket.status]" size="xs">
                {{ ticket.status }}
              </BaseChip>
            </div>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              {{ ticket.summary }}
            </BaseParagraph>
            <div class="flex flex-wrap items-center gap-2 text-xs text-muted-400 dark:text-muted-500">
              <span>#{{ ticket.id }}</span>
              <span>•</span>
              <span>{{ ticket.requester }}</span>
              <span>•</span>
              <span>{{ ticket.updatedAt }}</span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs text-muted-500 dark:text-muted-400">
            <BaseButton size="sm" variant="ghost" type="button" @click="openDetails(ticket)">
              View details
            </BaseButton>
            <BaseButton size="sm" variant="ghost" type="button" @click="openReply(ticket)">
              Reply
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseCard>

    <DialogRoot v-model:open="showNewTicket">
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
            <BaseButton size="sm" variant="ghost" icon class="rounded-full" @click="showNewTicket = false">
              <Icon name="lucide:x" class="size-4" />
            </BaseButton>
          </div>

          <div class="space-y-5 px-6 py-5">
            <div class="grid gap-4 md:grid-cols-2">
              <TairoFormGroup label="Requester name" required>
                <TairoInput v-model="newTicketForm.requesterName" placeholder="Jane Merchant" rounded="lg" />
              </TairoFormGroup>
              <TairoFormGroup label="Requester email" required>
                <TairoInput
                  v-model="newTicketForm.requesterEmail"
                  type="email"
                  placeholder="jane@snaplink.app"
                  rounded="lg"
                />
              </TairoFormGroup>
            </div>

            <TairoFormGroup label="Subject" required>
              <TairoInput
                v-model="newTicketForm.subject"
                placeholder="Give the ticket a clear title"
                rounded="lg"
              />
            </TairoFormGroup>

            <TairoFormGroup label="Description" required>
              <textarea
                v-model="newTicketForm.description"
                rows="6"
                placeholder="Explain the problem, expected behaviour, and any steps you've already tried."
                class="w-full rounded-xl border border-muted-200 bg-white px-4 py-3 text-sm text-muted-800 placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-muted-700 dark:bg-muted-900 dark:text-muted-100 dark:placeholder:text-muted-500"
              />
            </TairoFormGroup>

            <div class="grid gap-4 md:grid-cols-2">
              <TairoFormGroup label="Channel">
                <TairoSelect v-model="newTicketForm.channel" icon="solar:mail-linear" rounded="lg">
                  <BaseSelectItem value="email">Email</BaseSelectItem>
                  <BaseSelectItem value="chat">Chat</BaseSelectItem>
                  <BaseSelectItem value="api">API</BaseSelectItem>
                </TairoSelect>
              </TairoFormGroup>
              <TairoFormGroup label="Priority">
                <TairoSelect v-model="newTicketForm.priority" icon="solar:danger-triangle-linear" rounded="lg">
                  <BaseSelectItem value="low">Low</BaseSelectItem>
                  <BaseSelectItem value="medium">Medium</BaseSelectItem>
                  <BaseSelectItem value="high">High</BaseSelectItem>
                  <BaseSelectItem value="critical">Critical</BaseSelectItem>
                </TairoSelect>
              </TairoFormGroup>
            </div>

            <TairoFormGroup label="Tags">
              <TairoInput
                v-model="newTicketForm.tags"
                placeholder="Comma-separated tags (optional)"
                rounded="lg"
              />
            </TairoFormGroup>
          </div>

          <div class="flex items-center justify-end gap-2 border-t border-muted-200 px-6 py-4 dark:border-muted-700">
            <BaseButton variant="ghost" @click="showNewTicket = false">
              Cancel
            </BaseButton>
            <BaseButton variant="primary" @click="handleCreateTicket">
              Submit ticket
            </BaseButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <DialogRoot v-model:open="detailsOpen">
      <DialogPortal>
        <DialogOverlay class="bg-muted-900/70 fixed inset-0 z-50 backdrop-blur-sm" />
        <DialogContent
          class="fixed top-[6%] start-1/2 z-[100] w-[min(92vw,680px)] -translate-x-1/2 rounded-2xl border border-muted-200 bg-white shadow-xl focus:outline-none dark:border-muted-700 dark:bg-muted-900"
        >
          <div class="flex items-center justify-between border-b border-muted-200 px-6 py-4 dark:border-muted-700">
            <div>
              <DialogTitle class="text-lg font-semibold text-muted-900 dark:text-white">
                Ticket details
              </DialogTitle>
              <DialogDescription v-if="activeTicketForDetails" class="text-sm text-muted-500 dark:text-muted-400">
                {{ activeTicketForDetails.subject }} • {{ activeTicketForDetails.requester }}
              </DialogDescription>
            </div>
            <BaseButton size="sm" variant="ghost" icon class="rounded-full" @click="detailsOpen = false">
              <Icon name="lucide:x" class="size-4" />
            </BaseButton>
          </div>

          <div v-if="activeTicketForDetails" class="space-y-4 px-6 py-5 text-sm text-muted-600 dark:text-muted-300">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Summary
            </BaseText>
            <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
              {{ activeTicketForDetails.summary }}
            </BaseParagraph>
            <div class="flex flex-wrap items-center gap-2 text-xs text-muted-500 dark:text-muted-400">
              <BaseChip :color="statusColor[activeTicketForDetails.status]" size="xs">
                {{ activeTicketForDetails.status }}
              </BaseChip>
              <BaseChip :color="priorityColor[activeTicketForDetails.priority]" size="xs">
                {{ priorityLabel[activeTicketForDetails.priority] }} priority
              </BaseChip>
              <span>#{{ activeTicketForDetails.id }}</span>
              <span>•</span>
              <span>{{ activeTicketForDetails.updatedAt }}</span>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <DialogRoot v-model:open="replyOpen">
      <DialogPortal>
        <DialogOverlay class="bg-muted-900/70 fixed inset-0 z-50 backdrop-blur-sm" />
        <DialogContent
          class="fixed top-[8%] start-1/2 z-[100] w-[min(92vw,620px)] -translate-x-1/2 rounded-2xl border border-muted-200 bg-white shadow-xl focus:outline-none dark:border-muted-700 dark:bg-muted-900"
        >
          <div class="flex items-center justify-between border-b border-muted-200 px-6 py-4 dark:border-muted-700">
            <div>
              <DialogTitle class="text-lg font-semibold text-muted-900 dark:text-white">
                Reply to ticket
              </DialogTitle>
              <DialogDescription v-if="activeTicketForReply" class="text-sm text-muted-500 dark:text-muted-400">
                {{ activeTicketForReply.subject }}
              </DialogDescription>
            </div>
            <BaseButton size="sm" variant="ghost" icon class="rounded-full" @click="replyOpen = false">
              <Icon name="lucide:x" class="size-4" />
            </BaseButton>
          </div>

          <div v-if="activeTicketForReply" class="space-y-4 px-6 py-5">
            <TairoInput
              :model-value="activeTicketForReply.email"
              icon="solar:mail-linear"
              disabled
              rounded="lg"
            />
            <textarea
              v-model="replyDraft"
              rows="7"
              placeholder="Write your reply"
              class="w-full rounded-xl border border-muted-200 bg-white px-4 py-3 text-sm text-muted-800 placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-muted-700 dark:bg-muted-900 dark:text-muted-100 dark:placeholder:text-muted-500"
            />
          </div>

          <div class="flex items-center justify-end gap-2 border-t border-muted-200 px-6 py-4 dark:border-muted-700">
            <BaseButton variant="ghost" @click="replyOpen = false">
              Cancel
            </BaseButton>
            <BaseButton variant="primary" @click="handleSendReply">
              Send reply
            </BaseButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
