<script setup lang="ts">
import { ref } from '#imports'
import type { ShortenerLink, ShortenerLinkStatus } from '~/types/url-shortener'
import { useWorkspaceMembers } from '~/composables/useWorkspaceMembers'
import QRCodeModal from './QRCodeModal.vue'

interface StatusConfig {
  label: string
  color: string
  icon: string
  bgColor: string
  textColor: string
}

interface Props {
  links: ShortenerLink[]
  selectedIds: string[]
  isLoading?: boolean
  allSelected?: boolean
  indeterminate?: boolean
  statusConfig?: (status: ShortenerLinkStatus) => StatusConfig
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  allSelected: false,
  indeterminate: false,
  statusConfig: (status: ShortenerLinkStatus): StatusConfig => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          color: 'success',
          icon: 'ph:check-circle-fill',
          bgColor: 'bg-success-50 dark:bg-success-900/20',
          textColor: '!text-success-600 dark:!text-success-400',
        }
      case 'paused':
        return {
          label: 'Paused',
          color: 'warning',
          icon: 'ph:pause-circle-fill',
          bgColor: 'bg-warning-50 dark:bg-warning-900/20',
          textColor: '!text-warning-700 dark:!text-warning-300',
        }
      case 'expired':
        return {
          label: 'Expired',
          color: 'danger',
          icon: 'ph:clock-fill',
          bgColor: 'bg-danger-50 dark:bg-danger-900/20',
          textColor: '!text-danger-600 dark:!text-danger-400',
        }
      case 'disabled':
        return {
          label: 'Disabled',
          color: 'danger',
          icon: 'ph:x-circle-fill',
          bgColor: 'bg-danger-50 dark:bg-danger-900/20',
          textColor: '!text-danger-600 dark:!text-danger-400',
        }
      default:
        return {
          label: 'Unknown',
          color: 'muted',
          icon: 'ph:question',
          bgColor: 'bg-muted-100 dark:bg-muted-800',
          textColor: 'text-muted-600 dark:text-muted-400',
        }
    }
  },
})

const emit = defineEmits<{
  toggleSelect: [id: string]
  toggleAll: [selected: boolean]
  copy: [link: ShortenerLink]
  delete: [id: string]
}>()

const { members } = useWorkspaceMembers()

const handleToggleSelect = (id: string) => emit('toggleSelect', id)
const handleToggleAll = (checked: boolean) => emit('toggleAll', checked)
const handleCopy = (link: ShortenerLink) => emit('copy', link)
const handleDelete = (id: string) => emit('delete', id)

// QR Code Modal
const showQRModal = ref(false)
const selectedLinkForQR = ref<ShortenerLink | null>(null)

function openQRModal(link: ShortenerLink) {
  selectedLinkForQR.value = link
  showQRModal.value = true
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) {
    return null
  }
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getDomainDisplay(domainType: string | null | undefined, domainValue: string | null | undefined) {
  if (!domainType || domainType === 'default') {
    return 'snap.ly'
  }
  if (domainType === 'subdomain' && domainValue) {
    return domainValue
  }
  if (domainType === 'custom' && domainValue) {
    return domainValue
  }
  return 'snap.ly'
}

function getCollectionCount(link: ShortenerLink) {
  if (link.collectionNames && link.collectionNames.length > 0) {
    return link.collectionNames.length
  }
  if (link.collectionIds && link.collectionIds.length > 0) {
    return link.collectionIds.length
  }
  if (link.collection) {
    return 1
  }
  return 0
}

function getCollectionTooltip(link: ShortenerLink) {
  if (link.collectionNames && link.collectionNames.length > 0) {
    return link.collectionNames.join(', ')
  }
  if (link.collection) {
    return link.collection
  }
  return 'No collections'
}

function getClicksTooltip(link: ShortenerLink) {
  const clicks = (link.currentClicks || link.clicks || 0).toLocaleString()
  return `${clicks} total clicks`
}

function truncateText(text: string | null | undefined, maxLength: number) {
  if (!text) {
    return null
  }
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength)}...`
}

function getStatusTextColor(status: string | undefined) {
  const s = status || 'active'
  if (s === 'active') {
    return 'rgb(22, 163, 74)' // green-600
  }
  if (s === 'expired' || s === 'disabled') {
    return 'rgb(220, 38, 38)' // red-600
  }
  return 'inherit'
}

function getLinkTypeLabel(linkType: string | undefined) {
  switch (linkType) {
    case 'urlShortener':
      return 'URL Shortener'
    case 'payment':
      return 'Payment'
    case 'poll':
      return 'Poll'
    case 'bio':
      return 'Bio'
    case 'other':
      return 'Other'
    default:
      return 'URL Shortener'
  }
}

function getVisibilityRolesTooltip(link: ShortenerLink) {
  if (link.visibilityRoles && link.visibilityRoles.length > 0) {
    return `Roles: ${link.visibilityRoles.join(', ')}`
  }
  return 'No role restrictions'
}

function getTeammatesTooltip(link: ShortenerLink) {
  if (link.visibilityMemberIds && link.visibilityMemberIds.length > 0) {
    const teammateEmails = link.visibilityMemberIds
      .map((memberId) => {
        const member = members.value.find(m => m.id === memberId || m.userId === memberId)
        return member ? member.email : null
      })
      .filter((email): email is string => email !== null)

    if (teammateEmails.length > 0) {
      return `${link.visibilityMemberIds.length} teammate(s) invited:\n${teammateEmails.map((email, index) => `${index + 1}. ${email}`).join('\n')}`
    }
    // Fallback to IDs if emails not found
    return `${link.visibilityMemberIds.length} teammate(s) invited:\n${link.visibilityMemberIds.map((id, index) => `${index + 1}. ${id}`).join('\n')}`
  }
  return 'No teammates invited'
}
</script>

<template>
  <div>
    <ClientOnly>
      <div>
      <div v-if="isLoading" class="space-y-4">
        <div
          v-for="index in 6"
          :key="`links-skeleton-${index}`"
          class="h-40 rounded-xl border border-muted-200/70 bg-muted-100/60 animate-pulse dark:border-muted-700/60 dark:bg-muted-900/30"
        />
      </div>
      <div v-else class="space-y-3">
        <!-- Header with checkbox -->
        <div class="flex items-center gap-4 px-4 py-3 bg-muted-50 dark:bg-muted-800/50 rounded-lg border border-muted-200 dark:border-muted-700">
          <BaseCheckbox
            :checked="allSelected"
            :indeterminate="indeterminate"
            rounded="sm"
            color="primary"
            @update:checked="handleToggleAll"
          />
          <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-500 dark:text-muted-400">
            Select All
          </BaseText>
        </div>

        <!-- Link Cards -->
        <div
          v-for="link in links"
          :key="link.id"
          class="group relative rounded-xl border border-muted-200 dark:border-muted-700 bg-white dark:bg-muted-900 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg transition-all duration-200"
        >
          <div class="p-6">
            <div class="flex items-start gap-4">
              <!-- Selection Checkbox -->
              <div class="pt-1">
                <BaseCheckbox
                  :checked="selectedIds.includes(link.id)"
                  rounded="sm"
                  color="primary"
                  @update:checked="() => handleToggleSelect(link.id)"
                />
              </div>

              <!-- Main Content -->
              <div class="flex-1 min-w-0 space-y-5">
                <!-- Link & Actions Row -->
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0 space-y-2">
                    <div class="flex items-center gap-2">
                      <NuxtLink
                        :to="`/dashboard/url-shortener/links/${link.id}/edit`"
                        class="group/link flex items-center gap-2 min-w-0"
                      >
                        <BaseText size="base" weight="semibold" class="text-primary-600 dark:text-primary-400 group-hover/link:underline truncate">
                          {{ link.shortUrl }}
                        </BaseText>
                      </NuxtLink>
                      <Icon
                        v-if="link.hasPassword"
                        name="ph:lock-fill"
                        class="size-4 text-warning-500 shrink-0"
                        title="Password protected"
                      />
                      <Icon
                        v-if="link.isOneTime"
                        name="ph:clock-countdown-fill"
                        class="size-4 text-info-500 shrink-0"
                        title="One-time use"
                      />
                      <BaseButton
                        size="sm"
                        variant="ghost"
                        icon
                        class="shrink-0"
                        @click.stop="handleCopy(link)"
                      >
                        <Icon name="ph:copy" class="size-4" />
                      </BaseButton>
                      <BaseButton
                        size="sm"
                        variant="ghost"
                        icon
                        class="shrink-0"
                        @click.stop="openQRModal(link)"
                      >
                        <Icon name="ph:qr-code" class="size-4" />
                      </BaseButton>
                    </div>
                    <BaseText size="xs" class="text-muted-500 dark:text-muted-400 line-clamp-1">
                      {{ link.destinationUrl || link.originalUrl }}
                    </BaseText>
                  </div>

                  <!-- Status Badge (Center Top) -->
                  <div class="flex items-center justify-center">
                    <div
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      :class="statusConfig(link.linkStatus || link.status || 'active').bgColor"
                      :style="{ color: getStatusTextColor(link.linkStatus || link.status) }"
                    >
                      <Icon
                        :name="statusConfig(link.linkStatus || link.status || 'active').icon"
                        class="size-4"
                      />
                      <span>{{ statusConfig(link.linkStatus || link.status || 'active').label }}</span>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-1 shrink-0">
                    <BaseButton
                      size="sm"
                      variant="ghost"
                      icon
                      class="rounded-full"
                      @click="() => navigateTo(`/dashboard/url-shortener/links/${link.id}/edit`)"
                    >
                      <Icon name="ph:pencil" class="size-4" />
                    </BaseButton>
                    <BaseButton
                      size="sm"
                      variant="ghost"
                      icon
                      color="danger"
                      class="rounded-full"
                      @click="handleDelete(link.id)"
                    >
                      <Icon name="ph:trash" class="size-4" />
                    </BaseButton>
                  </div>
                </div>

                <!-- Info Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <!-- Basic Info -->
                  <div class="space-y-2.5">
                    <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                      Basic
                    </BaseText>
                    <div class="space-y-2">
                      <div v-if="link.title" class="flex items-start gap-2">
                        <Icon name="ph:text-t" class="size-4 text-muted-400 shrink-0 mt-0.5" />
                        <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-muted-100 line-clamp-2" :title="link.title">
                          {{ truncateText(link.title, 40) }}
                        </BaseText>
                      </div>
                      <div class="flex items-center gap-2">
                        <Icon name="ph:hash" class="size-4 text-muted-400 shrink-0" />
                        <BaseText size="xs" class="text-muted-600 dark:text-muted-400 font-mono truncate" :title="link.customAlias || 'No custom alias'">
                          {{ link.customAlias ? truncateText(link.customAlias, 25) : 'No alias' }}
                        </BaseText>
                      </div>
                    </div>
                  </div>

                  <!-- Visibility -->
                  <div class="space-y-2.5">
                    <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                      Visibility
                    </BaseText>
                    <div class="space-y-2">
                      <div class="flex items-center gap-2">
                        <Icon
                          :name="link.isPublic !== false ? 'ph:globe' : 'ph:lock'"
                          class="size-4 shrink-0 text-muted-900 dark:text-muted-100"
                        />
                        <BaseText size="sm" class="text-muted-900 dark:text-muted-100">
                          {{ link.isPublic !== false ? 'Public' : 'Private' }}
                        </BaseText>
                      </div>
                      <!-- Access Control: Roles & Teammates -->
                      <div
                        v-if="(link.visibilityRoles && link.visibilityRoles.length > 0) || (link.visibilityMemberIds && link.visibilityMemberIds.length > 0)"
                        class="flex items-center gap-2"
                      >
                        <Icon name="ph:shield-check" class="size-4 text-primary-500 shrink-0" />
                        <div class="flex items-center gap-2 flex-wrap">
                          <span
                            v-if="link.visibilityRoles && link.visibilityRoles.length > 0"
                            :title="getVisibilityRolesTooltip(link)"
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium cursor-help"
                          >
                            <Icon name="ph:users" class="size-3" />
                            {{ link.visibilityRoles.length }} role{{ link.visibilityRoles.length > 1 ? 's' : '' }}
                          </span>
                          <span
                            v-if="link.visibilityMemberIds && link.visibilityMemberIds.length > 0"
                            :title="getTeammatesTooltip(link)"
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-300 text-xs font-medium cursor-help"
                          >
                            <Icon name="ph:user-plus" class="size-3" />
                            {{ link.visibilityMemberIds.length }} teammate{{ link.visibilityMemberIds.length > 1 ? 's' : '' }}
                          </span>
                        </div>
                      </div>
                      <div
                        v-else-if="link.isPublic === false"
                        class="text-xs text-muted-400 dark:text-muted-500 italic"
                      >
                        No access restrictions
                      </div>
                    </div>
                  </div>

                  <!-- Limits -->
                  <div class="space-y-2.5">
                    <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                      Limits
                    </BaseText>
                    <div class="space-y-2">
                      <div v-if="link.clickLimit !== null && link.clickLimit !== undefined" class="flex items-center gap-2">
                        <Icon name="ph:target" class="size-4 text-muted-400 shrink-0" />
                        <BaseText size="sm" class="text-muted-900 dark:text-muted-100">
                          Limit: {{ link.clickLimit.toLocaleString() }}
                        </BaseText>
                      </div>
                      <div v-else class="text-xs text-muted-400 dark:text-muted-500">
                        No click limit
                      </div>
                      <div v-if="link.expiresAt" class="flex items-center gap-2">
                        <Icon name="ph:calendar-check" class="size-4 text-muted-400 shrink-0" />
                        <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                          {{ formatDateTime(link.expiresAt) }}
                        </BaseText>
                      </div>
                      <div v-else class="text-xs text-muted-400 dark:text-muted-500">
                        No expiration
                      </div>
                    </div>
                  </div>

                  <!-- Collection & Created -->
                  <div class="space-y-2.5">
                    <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                      Collection
                    </BaseText>
                    <div class="space-y-2">
                      <div
                        v-if="getCollectionCount(link) > 0"
                        :title="getCollectionTooltip(link)"
                        class="inline-flex items-center justify-center min-w-[32px] h-7 px-2.5 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-semibold cursor-help transition-colors hover:bg-primary-200 dark:hover:bg-primary-900/50"
                      >
                        {{ getCollectionCount(link) }}
                      </div>
                      <div v-else class="text-xs text-muted-400 dark:text-muted-500">
                        None
                      </div>
                      <div class="flex items-center gap-2 pt-1">
                        <Icon name="ph:calendar" class="size-4 text-muted-400 shrink-0" />
                        <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                          {{ formatDate(link.createdAt) }}
                        </BaseText>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #fallback>
      <div class="space-y-4">
        <div
          v-for="index in 6"
          :key="`links-skeleton-${index}`"
          class="h-40 rounded-xl border border-muted-200/70 bg-muted-100/60 animate-pulse dark:border-muted-700/60 dark:bg-muted-900/30"
        />
      </div>
      </template>
    </ClientOnly>

    <!-- QR Code Modal -->
    <QRCodeModal
      v-if="selectedLinkForQR"
      :open="showQRModal"
      :url="selectedLinkForQR.shortUrl"
      :download-file-name="`qrcode-${selectedLinkForQR.shortCode}`"
      description="Scan to open the link"
      @update:open="showQRModal = $event"
    />
  </div>
</template>
