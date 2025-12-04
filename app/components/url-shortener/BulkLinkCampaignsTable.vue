<script setup lang="ts">
import type { BulkLinkCampaign } from '~/types/bulk-link'

const props = defineProps<{
  campaigns: BulkLinkCampaign[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  view: [id: string]
  edit: [id: string]
  delete: [id: string, deleteSmartLinks: boolean]
}>()

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const handleDelete = (campaign: BulkLinkCampaign, event: Event) => {
  event.stopPropagation()
  const deleteSmartLinks = confirm(
    `Delete campaign "${campaign.name}"?\n\n` +
    `- Click OK to delete campaign AND all ${campaign.createdLinks} SmartLinks\n` +
    `- Click Cancel to delete only campaign (SmartLinks will be preserved)`
  )
  
  emit('delete', campaign.id, deleteSmartLinks)
}

const getCampaignStatus = (campaign: BulkLinkCampaign) => {
  // Check active status first
  if (!campaign.isActive) {
    return {
      label: 'Disabled',
      textColor: 'text-red-600 dark:text-red-400',
      icon: 'ph:x-circle-fill',
    }
  }

  // Then check progress
  if (campaign.createdLinks === campaign.totalLinks) {
    return {
      label: 'Active',
      textColor: 'text-green-600 dark:text-green-400',
      icon: 'ph:check-circle-fill',
    }
  } else if (campaign.createdLinks > 0) {
    return {
      label: 'In Progress',
      textColor: 'text-orange-600 dark:text-orange-400',
      icon: 'ph:clock-fill',
    }
  } else {
    return {
      label: 'Failed',
      textColor: 'text-red-600 dark:text-red-400',
      icon: 'ph:warning-fill',
    }
  }
}

const getProgressPercentage = (campaign: BulkLinkCampaign) => {
  if (campaign.totalLinks === 0) return 0
  return Math.round((campaign.createdLinks / campaign.totalLinks) * 100)
}

const getProgressColor = (campaign: BulkLinkCampaign) => {
  if (campaign.createdLinks === campaign.totalLinks) return 'bg-primary-500'
  if (campaign.createdLinks > 0) return 'bg-secondary-500'
  return 'bg-muted-500'
}

const getAvgClicksPerLink = (campaign: BulkLinkCampaign) => {
  if (campaign.createdLinks === 0) return 0
  return Math.round(campaign.totalClicks / campaign.createdLinks)
}

const truncateText = (text: string | null | undefined, maxLength: number) => {
  if (!text) return null
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div
        v-for="index in 3"
        :key="`campaign-skeleton-${index}`"
        class="h-48 rounded-xl border-l-4 border-primary-300/50 dark:border-primary-700/50 border border-primary-200/50 dark:border-primary-800/50 bg-gradient-to-br from-white to-primary-50/30 dark:from-muted-900 dark:to-primary-950/30 animate-pulse"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="campaigns.length === 0"
      class="py-12 text-center"
    >
      <Icon name="solar:layers-linear" class="mx-auto size-12 text-muted-400 mb-4" />
      <BaseParagraph class="text-muted-500 dark:text-muted-400">
        No campaigns found
      </BaseParagraph>
    </div>

    <!-- Campaign Cards -->
    <div v-else class="space-y-3">
      <div
        v-for="campaign in campaigns"
        :key="campaign.id"
        class="group relative rounded-xl border-l-4 border-primary-400 dark:border-primary-500 border border-primary-200/50 dark:border-primary-800/50 bg-gradient-to-br from-white to-primary-50/30 dark:from-muted-900 dark:to-primary-950/30 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-xl hover:shadow-primary-500/10 dark:hover:shadow-primary-500/20 transition-all duration-300"
      >
        <div class="p-6">
          <div class="space-y-5">
            <!-- Campaign Name & Actions Row -->
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0 space-y-2">
                <BaseText size="base" weight="semibold" class="text-primary-600 dark:text-primary-400">
                  {{ campaign.name }}
                </BaseText>
                <BaseText v-if="campaign.description" size="xs" class="text-muted-500 dark:text-muted-400 line-clamp-1">
                  {{ campaign.description }}
                </BaseText>
                <!-- Template Reference -->
                <div class="flex items-center gap-2">
                  <Icon name="solar:document-text-linear" class="size-3.5 text-primary-500" />
                  <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                    Template: <span class="font-medium text-primary-600 dark:text-primary-400">{{ campaign.templateName }}</span>
                  </BaseText>
                </div>
              </div>

              <!-- Status Badge (Center) -->
              <div class="flex items-center justify-center">
                <div
                  class="inline-flex items-center gap-1.5 text-sm font-semibold"
                  :class="getCampaignStatus(campaign).textColor"
                >
                  <Icon
                    :name="getCampaignStatus(campaign).icon"
                    class="size-4"
                  />
                  <span>{{ getCampaignStatus(campaign).label }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1 shrink-0">
                <BaseButton
                  size="sm"
                  variant="ghost"
                  icon
                  class="rounded-full"
                  @click.stop="emit('view', campaign.id)"
                >
                  <Icon name="ph:eye" class="size-4" />
                </BaseButton>
                <BaseButton
                  size="sm"
                  variant="ghost"
                  icon
                  class="rounded-full"
                  @click.stop="emit('edit', campaign.id)"
                >
                  <Icon name="ph:pencil" class="size-4" />
                </BaseButton>
                <BaseButton
                  size="sm"
                  variant="ghost"
                  icon
                  color="danger"
                  class="rounded-full"
                  @click.stop="(event) => handleDelete(campaign, event)"
                >
                  <Icon name="ph:trash" class="size-4" />
                </BaseButton>
              </div>
            </div>

            <!-- Info Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <!-- SmartLinks Progress -->
              <div class="space-y-2.5">
                <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                  SmartLinks
                </BaseText>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <Icon name="ph:link" class="size-4 text-primary-500 shrink-0" />
                    <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                      {{ campaign.createdLinks }} / {{ campaign.totalLinks }} created
                    </BaseText>
                  </div>
                  <div v-if="campaign.createdLinks < campaign.totalLinks" class="flex items-center gap-2">
                    <Icon name="ph:warning" class="size-4 text-secondary-500 shrink-0" />
                    <BaseText size="xs" class="text-secondary-600 dark:text-secondary-400">
                      {{ campaign.totalLinks - campaign.createdLinks }} failed
                    </BaseText>
                  </div>
                </div>
              </div>

              <!-- Performance -->
              <div class="space-y-2.5">
                <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                  Performance
                </BaseText>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <Icon name="ph:cursor-click" class="size-4 text-primary-500 shrink-0" />
                    <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                      {{ campaign.totalClicks.toLocaleString() }} clicks
                    </BaseText>
                  </div>
                  <div class="flex items-center gap-2">
                    <Icon name="ph:chart-line" class="size-4 text-secondary-500 shrink-0" />
                    <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                      Avg {{ getAvgClicksPerLink(campaign) }} per link
                    </BaseText>
                  </div>
                </div>
              </div>

              <!-- Progress Status -->
              <div class="space-y-2.5">
                <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                  Progress
                </BaseText>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <div class="flex-1">
                      <div class="h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
                        <div
                          class="h-full transition-all duration-500"
                          :class="getProgressColor(campaign)"
                          :style="{ width: `${getProgressPercentage(campaign)}%` }"
                        />
                      </div>
                    </div>
                    <BaseText size="xs" class="text-muted-600 dark:text-muted-400 shrink-0">
                      {{ getProgressPercentage(campaign) }}%
                    </BaseText>
                  </div>
                </div>
              </div>

              <!-- Metadata -->
              <div class="space-y-2.5">
                <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                  Metadata
                </BaseText>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <Icon name="ph:calendar" class="size-4 text-muted-400 shrink-0" />
                    <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                      {{ formatDate(campaign.createdAt) }}
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
</template>




