<script setup lang="ts">
defineProps<{
  selectedIds: string[]
  reportType: 'links' | 'collections'
  period: string
}>()

// Top referring domains
const topReferrers = ref([
  { domain: 'google.com', clicks: 45200, percentage: 36, icon: 'logos:google-icon' },
  { domain: 'facebook.com', clicks: 28900, percentage: 23, icon: 'logos:facebook' },
  { domain: 'twitter.com', clicks: 18900, percentage: 15, icon: 'logos:twitter' },
  { domain: 'linkedin.com', clicks: 12800, percentage: 10, icon: 'logos:linkedin-icon' },
  { domain: 'reddit.com', clicks: 9800, percentage: 8, icon: 'logos:reddit-icon' },
  { domain: 'Direct', clicks: 11047, percentage: 8, icon: 'solar:link-linear' },
])

// Campaign tracking
const campaigns = ref([
  { name: 'Summer Sale 2024', clicks: 45200, conversions: 1250, ctr: 2.77 },
  { name: 'Product Launch', clicks: 28900, conversions: 890, ctr: 3.08 },
  { name: 'Email Campaign', clicks: 18900, conversions: 650, ctr: 3.44 },
  { name: 'Social Media', clicks: 12800, conversions: 420, ctr: 3.28 },
  { name: 'Blog Post', clicks: 9800, conversions: 320, ctr: 3.27 },
])

// Social media performance
const socialMedia = ref([
  { platform: 'Facebook', clicks: 28900, engagement: 8.5, icon: 'logos:facebook' },
  { platform: 'Twitter', clicks: 18900, engagement: 6.2, icon: 'logos:twitter' },
  { platform: 'LinkedIn', clicks: 12800, engagement: 9.1, icon: 'logos:linkedin-icon' },
  { platform: 'Instagram', clicks: 9800, engagement: 7.8, icon: 'logos:instagram-icon' },
  { platform: 'Reddit', clicks: 8500, engagement: 5.5, icon: 'logos:reddit-icon' },
])

const maxReferrerClicks = computed(() => Math.max(...topReferrers.value.map(r => r.clicks)))
const maxCampaignClicks = computed(() => Math.max(...campaigns.value.map(c => c.clicks)))
const maxSocialClicks = computed(() => Math.max(...socialMedia.value.map(s => s.clicks)))
</script>

<template>
  <div class="space-y-6">
    <!-- Top Referring Domains -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Top Referring Domains
      </BaseHeading>
      <div class="space-y-4">
        <div
          v-for="referrer in topReferrers"
          :key="referrer.domain"
          class="flex items-center justify-between p-4 border border-muted-200 dark:border-muted-700 rounded-lg hover:bg-muted-50 dark:hover:bg-muted-800/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-muted-100 dark:bg-muted-800">
              <Icon :name="referrer.icon" class="size-5 text-muted-600 dark:text-muted-400" />
            </div>
            <div>
              <BaseHeading
                as="h4"
                size="sm"
                weight="semibold"
                class="text-muted-900 dark:text-muted-100"
              >
                {{ referrer.domain }}
              </BaseHeading>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                {{ referrer.percentage }}% of total
              </BaseText>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
              {{ referrer.clicks.toLocaleString() }}
            </BaseText>
            <div class="w-24 h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary-500 rounded-full transition-all"
                :style="{ width: `${referrer.percentage}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Campaign Tracking -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Campaign Tracking
      </BaseHeading>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-muted-200 dark:border-muted-700 bg-muted-50 dark:bg-muted-800/50">
            <tr>
              <th class="px-4 py-3 text-start">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Campaign
                </BaseText>
              </th>
              <th class="px-4 py-3 text-start">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Clicks
                </BaseText>
              </th>
              <th class="px-4 py-3 text-start">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  Conversions
                </BaseText>
              </th>
              <th class="px-4 py-3 text-start">
                <BaseText size="xs" weight="semibold" class="text-muted-500 dark:text-muted-400">
                  CTR
                </BaseText>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-muted-200 dark:divide-muted-700">
            <tr
              v-for="campaign in campaigns"
              :key="campaign.name"
              class="hover:bg-muted-50 dark:hover:bg-muted-800/50 transition-colors"
            >
              <td class="px-4 py-3">
                <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-muted-100">
                  {{ campaign.name }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                  {{ campaign.clicks.toLocaleString() }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseText size="sm" class="text-muted-600 dark:text-muted-400">
                  {{ campaign.conversions.toLocaleString() }}
                </BaseText>
              </td>
              <td class="px-4 py-3">
                <BaseChip
                  color="success"
                  size="sm"
                >
                  {{ campaign.ctr }}%
                </BaseChip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- Social Media Performance -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Social Media Performance
      </BaseHeading>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="social in socialMedia"
          :key="social.platform"
          class="p-4 border border-muted-200 dark:border-muted-700 rounded-lg hover:bg-muted-50 dark:hover:bg-muted-800/50 transition-colors"
        >
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 rounded-lg bg-muted-100 dark:bg-muted-800">
              <Icon :name="social.icon" class="size-5 text-muted-600 dark:text-muted-400" />
            </div>
            <BaseHeading
              as="h4"
              size="sm"
              weight="semibold"
              class="text-muted-900 dark:text-muted-100"
            >
              {{ social.platform }}
            </BaseHeading>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Clicks
              </BaseText>
              <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                {{ social.clicks.toLocaleString() }}
              </BaseText>
            </div>
            <div class="flex items-center justify-between">
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Engagement
              </BaseText>
              <BaseChip
                color="success"
                size="sm"
              >
                {{ social.engagement }}%
              </BaseChip>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

