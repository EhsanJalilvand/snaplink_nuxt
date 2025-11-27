<script setup lang="ts">
import { ref } from '#imports'
import type { SmartLink } from '~/types/url-shortener'
import QRCodeModal from './QRCodeModal.vue'

interface Props {
  smartLinks: SmartLink[]
  selectedIds: string[]
  isLoading?: boolean
  allSelected?: boolean
  indeterminate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  allSelected: false,
  indeterminate: false,
})

const emit = defineEmits<{
  toggleSelect: [id: string]
  toggleAll: [selected: boolean]
  copy: [link: SmartLink]
}>()

const handleToggleSelect = (id: string) => emit('toggleSelect', id)
const handleToggleAll = (checked: boolean) => emit('toggleAll', checked)
const handleCopy = (link: SmartLink) => emit('copy', link)

// QR Code Modal
const showQRModal = ref(false)
const selectedLinkForQR = ref<SmartLink | null>(null)

function openQRModal(link: SmartLink) {
  selectedLinkForQR.value = link
  showQRModal.value = true
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getStatus(link: SmartLink) {
  const now = new Date()

  if (link.expiresAt) {
    const expiresAt = new Date(link.expiresAt)
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt < now) {
      return {
        label: 'Expired',
        color: 'rgb(220, 38, 38)',
        bgColor: 'bg-danger-50 dark:bg-danger-900/20',
        icon: 'ph:clock-fill',
      }
    }
  }

  if (link.isOneTime && link.currentClicks > 0) {
    return {
      label: 'Consumed',
      color: 'rgb(245, 158, 11)',
      bgColor: 'bg-warning-50 dark:bg-warning-900/20',
      icon: 'ph:check-circle-fill',
    }
  }

  if (link.clickLimit && link.currentClicks >= link.clickLimit) {
    return {
      label: 'Limit Reached',
      color: 'rgb(245, 158, 11)',
      bgColor: 'bg-warning-50 dark:bg-warning-900/20',
      icon: 'ph:warning-fill',
    }
  }

  return {
    label: 'Active',
    color: 'rgb(22, 163, 74)',
    bgColor: 'bg-success-50 dark:bg-success-900/20',
    icon: 'ph:check-circle-fill',
  }
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

function getPixelEventsCount(link: SmartLink) {
  if (link.pixelEvents && Array.isArray(link.pixelEvents)) {
    return link.pixelEvents.length
  }
  return 0
}

function getPixelEventsTooltip(link: SmartLink) {
  if (link.pixelEvents && Array.isArray(link.pixelEvents) && link.pixelEvents.length > 0) {
    return link.pixelEvents.map(p => `${p.pixelType} (${p.eventType})`).join(', ')
  }
  return 'No pixels configured'
}

function getRulesSummary(link: SmartLink) {
  if (!link.rules || link.rules.length === 0) {
    return 'No rules'
  }
  if (link.rules.length === 1) {
    return link.rules[0].summary || '1 rule'
  }
  return `${link.rules.length} rules`
}
</script>

<template>
  <div>
    <ClientOnly>
      <div>
        <div v-if="isLoading" class="space-y-4">
          <div
            v-for="index in 6"
            :key="`smartlinks-skeleton-${index}`"
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

          <!-- SmartLink Cards -->
          <div
            v-for="link in smartLinks"
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
                          :to="`/dashboard/url-shortener/smart-links/${link.id}`"
                          class="group/link flex items-center gap-2 min-w-0"
                        >
                          <BaseText size="base" weight="semibold" class="text-primary-600 dark:text-primary-400 group-hover/link:underline truncate">
                            {{ link.shortUrl || `${getDomainDisplay(link.domainType, link.domainValue)}/${link.customAlias || link.shortCode}` }}
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
                      <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-muted-100">
                        {{ link.name }}
                      </BaseText>
                      <BaseText size="xs" class="text-muted-500 dark:text-muted-400 line-clamp-1" v-if="link.description">
                        {{ truncateText(link.description, 60) }}
                      </BaseText>
                    </div>

                    <!-- Status Badge (Center Top) -->
                    <div class="flex items-center justify-center">
                      <div
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        :class="getStatus(link).bgColor"
                        :style="{ color: getStatus(link).color }"
                      >
                        <Icon
                          :name="getStatus(link).icon"
                          class="size-4"
                        />
                        <span>{{ getStatus(link).label }}</span>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-1 shrink-0">
                      <BaseButton
                        size="sm"
                        variant="ghost"
                        icon
                        class="rounded-full"
                        @click="() => navigateTo(`/dashboard/url-shortener/smart-links/${link.id}`)"
                      >
                        <Icon name="ph:pencil" class="size-4" />
                      </BaseButton>
                    </div>
                  </div>

                  <!-- Info Grid -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                    <!-- Basic Info -->
                    <div class="space-y-2.5">
                      <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                        Basic
                      </BaseText>
                      <div class="space-y-2">
                        <div class="flex items-center gap-2">
                          <Icon name="ph:hash" class="size-4 text-muted-400 shrink-0" />
                          <BaseText size="xs" class="text-muted-600 dark:text-muted-400 font-mono truncate" :title="link.customAlias || 'No custom alias'">
                            {{ link.customAlias ? truncateText(link.customAlias, 25) : 'No alias' }}
                          </BaseText>
                        </div>
                        <div class="flex items-center gap-2">
                          <Icon name="ph:globe" class="size-4 text-muted-400 shrink-0" />
                          <BaseText size="xs" class="text-muted-600 dark:text-muted-400 truncate">
                            {{ getDomainDisplay(link.domainType, link.domainValue) }}
                          </BaseText>
                        </div>
                      </div>
                    </div>

                    <!-- Rules -->
                    <div class="space-y-2.5">
                      <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                        Rules
                      </BaseText>
                      <div class="space-y-2">
                        <div class="flex items-center gap-2">
                          <Icon name="ph:git-branch" class="size-4 text-primary-500 shrink-0" />
                          <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                            {{ getRulesSummary(link) }}
                          </BaseText>
                        </div>
                        <div v-if="link.fallbackUrl" class="flex items-center gap-2">
                          <Icon name="ph:arrow-bend-down-right" class="size-4 text-muted-400 shrink-0" />
                          <BaseText size="xs" class="text-muted-600 dark:text-muted-400 truncate">
                            Fallback: {{ link.fallbackUrl }}
                          </BaseText>
                        </div>
                      </div>
                    </div>

                    <!-- Limits -->
                    <div class="space-y-2.5">
                      <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                        Limits
                      </BaseText>
                      <div class="space-y-2">
                        <div v-if="link.expiresAt" class="flex items-center gap-2">
                          <Icon name="ph:calendar" class="size-4 text-muted-400 shrink-0" />
                          <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                            {{ formatDate(link.expiresAt) }}
                          </BaseText>
                        </div>
                        <div v-if="link.clickLimit" class="flex items-center gap-2">
                          <Icon name="ph:click" class="size-4 text-muted-400 shrink-0" />
                          <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                            {{ link.currentClicks }} / {{ link.clickLimit }}
                          </BaseText>
                        </div>
                        <div v-else class="flex items-center gap-2">
                          <Icon name="ph:click" class="size-4 text-muted-400 shrink-0" />
                          <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                            {{ link.currentClicks }} clicks
                          </BaseText>
                        </div>
                      </div>
                    </div>

                    <!-- Domain -->
                    <div class="space-y-2.5">
                      <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                        Domain
                      </BaseText>
                      <div class="space-y-2">
                        <div class="flex items-center gap-2">
                          <Icon name="ph:link" class="size-4 text-muted-400 shrink-0" />
                          <BaseText size="xs" class="text-muted-600 dark:text-muted-400 truncate">
                            {{ link.domainType === 'default' ? 'Default' : link.domainType }}
                          </BaseText>
                        </div>
                      </div>
                    </div>

                    <!-- Collections & Tracking -->
                    <div class="space-y-2.5">
                      <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                        Collections & Tracking
                      </BaseText>
                      <div class="space-y-2">
                        <div v-if="link.collectionIds && link.collectionIds.length > 0" class="flex items-center gap-2">
                          <Icon name="ph:folders" class="size-4 text-primary-500 shrink-0" />
                          <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                            {{ link.collectionIds.length }} collection{{ link.collectionIds.length > 1 ? 's' : '' }}
                          </BaseText>
                        </div>
                        <div v-else class="flex items-center gap-2">
                          <Icon name="ph:folders" class="size-4 text-muted-400 shrink-0" />
                          <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                            No collections
                          </BaseText>
                        </div>
                        <div
                          v-if="getPixelEventsCount(link) > 0"
                          class="flex items-center gap-2"
                          :title="getPixelEventsTooltip(link)"
                        >
                          <Icon name="ph:chart-line" class="size-4 text-success-500 shrink-0" />
                          <BaseText size="xs" class="text-muted-600 dark:text-muted-400 cursor-help">
                            {{ getPixelEventsCount(link) }} pixel{{ getPixelEventsCount(link) > 1 ? 's' : '' }}
                          </BaseText>
                        </div>
                        <div
                          v-if="link.webhookUrl"
                          class="flex items-center gap-2"
                        >
                          <Icon name="ph:webhook" class="size-4 text-info-500 shrink-0" />
                          <BaseText size="xs" class="text-muted-600 dark:text-muted-400 truncate" :title="link.webhookUrl">
                            Webhook active
                          </BaseText>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!smartLinks.length && !isLoading" class="py-12 text-center">
            <Icon name="solar:shuffle-linear" class="mx-auto size-12 text-muted-400" />
            <BaseText size="sm" class="text-muted-500 dark:text-muted-400 mt-2">
              No SmartLinks yet. Create your first dynamic routing link.
            </BaseText>
          </div>
        </div>
      </div>
    </ClientOnly>

    <!-- QR Code Modal -->
    <QRCodeModal
      v-model:open="showQRModal"
      :url="selectedLinkForQR?.shortUrl || ''"
      title="SmartLink QR Code"
      description="Scan this QR code to access the SmartLink"
      :download-file-name="selectedLinkForQR?.name || 'smartlink-qrcode'"
    />
  </div>
</template>
