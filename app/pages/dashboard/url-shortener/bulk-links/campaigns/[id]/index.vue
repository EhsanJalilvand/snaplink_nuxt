<script setup lang="ts">
import { ref, onMounted, watch } from '#imports'
import { useBulkLinkCampaigns } from '~/composables/useBulkLinkCampaigns'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'
import type { BulkLinkCampaignDetail } from '~/types/bulk-link'

definePageMeta({
  title: 'Campaign Details',
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()
const toaster = useNuiToasts()
const { workspaceId } = useWorkspaceContext()
const { getCampaign, updateCampaign } = useBulkLinkCampaigns()

const campaignId = computed(() => route.params.id as string)
const campaign = ref<BulkLinkCampaignDetail | null>(null)
const isLoading = ref(false)

const loadCampaign = async () => {
  if (!campaignId.value || !workspaceId.value) return

  isLoading.value = true
  try {
    campaign.value = await getCampaign(campaignId.value)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadCampaign()
})

watch([workspaceId, campaignId], () => {
  if (workspaceId.value && campaignId.value) {
    loadCampaign()
  }
})

const handleBack = () => {
  router.push('/dashboard/url-shortener/bulk-links')
}

const handleCopyLink = (shortUrl: string) => {
  navigator.clipboard.writeText(shortUrl)
  toaster.add({
    title: 'Copied',
    description: 'Short URL copied to clipboard',
    icon: 'ph:check',
    color: 'success',
    progress: true,
  })
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="space-y-6 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <BaseButton variant="ghost" size="sm" @click="handleBack">
          <Icon name="lucide:arrow-left" class="size-4" />
          <span>Back</span>
        </BaseButton>
        <div>
          <div class="flex-1">
            <BaseHeading
              as="h1"
              size="2xl"
              weight="bold"
              class="text-muted-900 dark:text-white"
            >
              {{ campaign?.name || 'Campaign Details' }}
            </BaseHeading>
            <BaseParagraph
              v-if="campaign?.description"
              size="sm"
              class="text-muted-500 dark:text-muted-400 mt-1"
            >
              {{ campaign.description }}
            </BaseParagraph>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <Icon name="svg-spinners:90-ring-with-bg" class="size-12 text-primary-500" />
    </div>

    <!-- Campaign Details -->
    <div v-else-if="campaign" class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid gap-4 md:grid-cols-4">
        <BaseCard class="p-6">
          <div class="flex items-center gap-4">
            <div class="flex size-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/20">
              <Icon name="solar:document-text-linear" class="size-6 text-primary-500" />
            </div>
            <div>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 uppercase tracking-wider">
                Template
              </BaseParagraph>
              <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-800 dark:text-muted-100">
                {{ campaign.templateName }}
              </BaseHeading>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="p-6">
          <div class="flex items-center gap-4">
            <div class="flex size-12 items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/20">
              <Icon name="solar:link-linear" class="size-6 text-success-500" />
            </div>
            <div>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 uppercase tracking-wider">
                SmartLinks Created
              </BaseParagraph>
              <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-800 dark:text-muted-100">
                {{ campaign.createdLinks }} / {{ campaign.totalLinks }}
              </BaseHeading>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="p-6">
          <div class="flex items-center gap-4">
            <div class="flex size-12 items-center justify-center rounded-xl bg-info-100 dark:bg-info-900/20">
              <Icon name="solar:cursor-linear" class="size-6 text-info-500" />
            </div>
            <div>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 uppercase tracking-wider">
                Total Clicks
              </BaseParagraph>
              <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-800 dark:text-muted-100">
                {{ campaign.totalClicks.toLocaleString() }}
              </BaseHeading>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="p-6">
          <div class="flex items-center gap-4">
            <div class="flex size-12 items-center justify-center rounded-xl bg-muted-100 dark:bg-muted-800">
              <Icon name="solar:calendar-linear" class="size-6 text-muted-500" />
            </div>
            <div>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400 uppercase tracking-wider">
                Created
              </BaseParagraph>
              <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
                {{ formatDate(campaign.createdAt) }}
              </BaseText>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- SmartLinks Table -->
      <BaseCard class="p-0 overflow-hidden">
        <div class="p-6 border-b border-muted-200 dark:border-muted-800">
          <BaseHeading as="h2" size="lg" weight="semibold" class="text-muted-900 dark:text-white">
            SmartLinks ({{ campaign.smartLinks.length }})
          </BaseHeading>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-muted-200 dark:border-muted-800">
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-500 dark:text-muted-400">
                  Name
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-500 dark:text-muted-400">
                  Short URL
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-500 dark:text-muted-400">
                  Destination
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-500 dark:text-muted-400">
                  Clicks
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-500 dark:text-muted-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-muted-200 dark:divide-muted-800">
              <tr
                v-for="smartLink in campaign.smartLinks"
                :key="smartLink.id"
                class="hover:bg-muted-50 dark:hover:bg-muted-900/50 transition-colors"
              >
                <td class="px-6 py-4">
                  <BaseText size="sm" class="text-muted-800 dark:text-muted-100">
                    {{ smartLink.name }}
                  </BaseText>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <BaseText size="sm" class="text-primary-600 dark:text-primary-400 font-mono">
                      {{ smartLink.shortUrl }}
                    </BaseText>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <BaseText size="sm" class="text-muted-600 dark:text-muted-300 truncate max-w-xs">
                    {{ smartLink.fallbackUrl || '-' }}
                  </BaseText>
                </td>
                <td class="px-6 py-4">
                  <BaseText size="sm" class="text-muted-600 dark:text-muted-300">
                    {{ smartLink.currentClicks }}
                  </BaseText>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-2">
                    <BaseButton
                      size="sm"
                      variant="ghost"
                      @click="handleCopyLink(smartLink.shortUrl)"
                    >
                      <Icon name="solar:copy-linear" class="size-4" />
                      <span>Copy</span>
                    </BaseButton>
                    <BaseButton
                      size="sm"
                      variant="outline"
                      @click="router.push(`/dashboard/url-shortener/smart-links/${smartLink.id}/edit`)"
                    >
                      <Icon name="solar:eye-linear" class="size-4" />
                      <span>View</span>
                    </BaseButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div
            v-if="campaign.smartLinks.length === 0"
            class="py-12 text-center"
          >
            <Icon name="solar:link-linear" class="mx-auto size-12 text-muted-400 mb-4" />
            <BaseParagraph class="text-muted-500 dark:text-muted-400">
              No SmartLinks in this campaign
            </BaseParagraph>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Not Found State -->
    <div v-else class="flex flex-col items-center justify-center py-12">
      <Icon name="solar:layers-linear" class="size-16 text-muted-400 mb-4" />
      <BaseHeading as="h2" size="xl" weight="semibold" class="text-muted-900 dark:text-white mb-2">
        Campaign not found
      </BaseHeading>
      <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400 mb-4">
        The campaign you're looking for doesn't exist or you don't have permission to view it.
      </BaseParagraph>
      <BaseButton variant="primary" @click="handleBack">
        Back to Bulk Links
      </BaseButton>
    </div>
  </div>
</template>




