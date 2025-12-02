<script setup lang="ts">
import type { BulkLinkCampaign } from '~/types/bulk-link'

const props = defineProps<{
  campaigns: BulkLinkCampaign[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  view: [id: string]
  delete: [id: string, deleteSmartLinks: boolean]
}>()

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const handleDelete = (campaign: BulkLinkCampaign) => {
  const deleteSmartLinks = confirm(
    `Delete campaign "${campaign.name}"?\n\n` +
    `- Click OK to delete campaign AND all ${campaign.createdLinks} SmartLinks\n` +
    `- Click Cancel to delete only campaign (SmartLinks will be preserved)`
  )
  
  emit('delete', campaign.id, deleteSmartLinks)
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead>
        <tr class="border-b border-muted-200 dark:border-muted-800">
          <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-500 dark:text-muted-400">
            Campaign
          </th>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-500 dark:text-muted-400">
            Template
          </th>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-500 dark:text-muted-400">
            SmartLinks
          </th>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-500 dark:text-muted-400">
            Total Clicks
          </th>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-500 dark:text-muted-400">
            Created
          </th>
          <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-500 dark:text-muted-400">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-muted-200 dark:divide-muted-800">
        <tr
          v-for="campaign in campaigns"
          :key="campaign.id"
          class="hover:bg-muted-50 dark:hover:bg-muted-900/50 transition-colors cursor-pointer"
          @click="emit('view', campaign.id)"
        >
          <td class="px-4 py-4">
            <div class="flex flex-col gap-1">
              <BaseText size="sm" weight="semibold" class="text-muted-800 dark:text-muted-100">
                {{ campaign.name }}
              </BaseText>
              <BaseParagraph
                v-if="campaign.description"
                size="xs"
                class="text-muted-500 dark:text-muted-400 line-clamp-1"
              >
                {{ campaign.description }}
              </BaseParagraph>
            </div>
          </td>
          <td class="px-4 py-4">
            <BaseText size="sm" class="text-muted-600 dark:text-muted-300">
              {{ campaign.templateName }}
            </BaseText>
          </td>
          <td class="px-4 py-4">
            <div class="flex items-center gap-2">
              <div class="flex flex-col gap-0.5">
                <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
                  {{ campaign.createdLinks }} / {{ campaign.totalLinks }}
                </BaseText>
                <BaseParagraph
                  v-if="campaign.createdLinks < campaign.totalLinks"
                  size="xs"
                  class="text-warning-500"
                >
                  {{ campaign.totalLinks - campaign.createdLinks }} failed
                </BaseParagraph>
              </div>
            </div>
          </td>
          <td class="px-4 py-4">
            <div class="flex items-center gap-2">
              <Icon name="solar:cursor-linear" class="size-4 text-muted-400" />
              <BaseText size="sm" class="text-muted-600 dark:text-muted-300">
                {{ campaign.totalClicks.toLocaleString() }}
              </BaseText>
            </div>
          </td>
          <td class="px-4 py-4">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              {{ formatDate(campaign.createdAt) }}
            </BaseText>
          </td>
          <td class="px-4 py-4" @click.stop>
            <div class="flex items-center justify-end gap-2">
              <BaseButton
                size="sm"
                variant="outline"
                @click="emit('view', campaign.id)"
              >
                <Icon name="solar:eye-linear" class="size-4" />
                <span>View</span>
              </BaseButton>
              <BaseButton
                size="sm"
                variant="ghost"
                color="danger"
                @click="handleDelete(campaign)"
              >
                <Icon name="solar:trash-bin-trash-linear" class="size-4" />
                <span>Delete</span>
              </BaseButton>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-if="campaigns.length === 0 && !isLoading"
      class="py-12 text-center"
    >
      <Icon name="solar:layers-linear" class="mx-auto size-12 text-muted-400 mb-4" />
      <BaseParagraph class="text-muted-500 dark:text-muted-400">
        No campaigns found
      </BaseParagraph>
    </div>

    <div
      v-if="isLoading"
      class="py-12 text-center"
    >
      <Icon name="svg-spinners:90-ring-with-bg" class="mx-auto size-8 text-primary-500" />
    </div>
  </div>
</template>



