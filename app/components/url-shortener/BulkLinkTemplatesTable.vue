<script setup lang="ts">
import type { BulkLinkTemplateListItem } from '~/types/bulk-link'

const props = defineProps<{
  templates: BulkLinkTemplateListItem[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
  clone: [id: string]
  viewCampaigns: [id: string]
}>()

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead>
        <tr class="border-b border-muted-200 dark:border-muted-800">
          <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-500 dark:text-muted-400">
            Template
          </th>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-500 dark:text-muted-400">
            Rules
          </th>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-500 dark:text-muted-400">
            Campaigns
          </th>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-500 dark:text-muted-400">
            Total Links
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
          v-for="template in templates"
          :key="template.id"
          class="hover:bg-muted-50 dark:hover:bg-muted-900/50 transition-colors"
        >
          <td class="px-4 py-4">
            <div class="flex flex-col gap-1">
              <BaseText size="sm" weight="semibold" class="text-muted-800 dark:text-muted-100">
                {{ template.name }}
              </BaseText>
              <BaseParagraph
                v-if="template.description"
                size="xs"
                class="text-muted-500 dark:text-muted-400 line-clamp-1"
              >
                {{ template.description }}
              </BaseParagraph>
            </div>
          </td>
          <td class="px-4 py-4">
            <div class="flex items-center gap-2">
              <Icon name="solar:widget-3-linear" class="size-4 text-muted-400" />
              <BaseText size="sm" class="text-muted-600 dark:text-muted-300">
                {{ template.ruleCount }}
              </BaseText>
            </div>
          </td>
          <td class="px-4 py-4">
            <button
              v-if="template.campaignCount > 0"
              type="button"
              class="flex items-center gap-2 hover:text-primary-500 transition-colors"
              @click="emit('viewCampaigns', template.id)"
            >
              <Icon name="solar:layers-linear" class="size-4 text-muted-400" />
              <BaseText size="sm" class="text-muted-600 dark:text-muted-300">
                {{ template.campaignCount }}
              </BaseText>
            </button>
            <div v-else class="flex items-center gap-2">
              <Icon name="solar:layers-linear" class="size-4 text-muted-400" />
              <BaseText size="sm" class="text-muted-500 dark:text-muted-400">
                0
              </BaseText>
            </div>
          </td>
          <td class="px-4 py-4">
            <div class="flex items-center gap-2">
              <Icon name="solar:link-linear" class="size-4 text-muted-400" />
              <BaseText size="sm" class="text-muted-600 dark:text-muted-300">
                {{ template.totalLinks }}
              </BaseText>
            </div>
          </td>
          <td class="px-4 py-4">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              {{ formatDate(template.createdAt) }}
            </BaseText>
          </td>
          <td class="px-4 py-4">
            <div class="flex items-center justify-end gap-2">
              <BaseButton
                size="sm"
                variant="ghost"
                @click="emit('edit', template.id)"
              >
                <Icon name="solar:pen-linear" class="size-4" />
                <span>Edit</span>
              </BaseButton>
              <BaseButton
                size="sm"
                variant="ghost"
                @click="emit('clone', template.id)"
              >
                <Icon name="solar:copy-linear" class="size-4" />
                <span>Clone</span>
              </BaseButton>
              <BaseButton
                size="sm"
                variant="ghost"
                color="danger"
                @click="emit('delete', template.id)"
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
      v-if="templates.length === 0 && !isLoading"
      class="py-12 text-center"
    >
      <Icon name="solar:document-text-linear" class="mx-auto size-12 text-muted-400 mb-4" />
      <BaseParagraph class="text-muted-500 dark:text-muted-400">
        No templates found
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



