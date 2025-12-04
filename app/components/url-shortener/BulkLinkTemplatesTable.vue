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

const truncateText = (text: string | null | undefined, maxLength: number) => {
  if (!text) return null
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

const getRulesSummary = (template: BulkLinkTemplateListItem) => {
  if (template.ruleCount === 0) return 'No rules'
  if (template.ruleCount === 1) return '1 rule'
  return `${template.ruleCount} rules`
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div
        v-for="index in 3"
        :key="`template-skeleton-${index}`"
        class="h-40 rounded-xl border-l-4 border-primary-300/50 dark:border-primary-700/50 border border-primary-200/50 dark:border-primary-800/50 bg-gradient-to-br from-white to-primary-50/30 dark:from-muted-900 dark:to-primary-950/30 animate-pulse"
      />
            </div>

    <!-- Empty State -->
    <div
      v-else-if="templates.length === 0"
      class="py-12 text-center"
    >
      <Icon name="solar:document-text-linear" class="mx-auto size-12 text-muted-400 mb-4" />
      <BaseParagraph class="text-muted-500 dark:text-muted-400">
        No templates found
      </BaseParagraph>
    </div>

    <!-- Template Cards -->
    <div v-else class="space-y-3">
      <div
        v-for="template in templates"
        :key="template.id"
        class="group relative rounded-xl border-l-4 border-primary-400 dark:border-primary-500 border border-primary-200/50 dark:border-primary-800/50 bg-gradient-to-br from-white to-primary-50/30 dark:from-muted-900 dark:to-primary-950/30 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-xl hover:shadow-primary-500/10 dark:hover:shadow-primary-500/20 transition-all duration-300"
      >
        <div class="p-6">
          <div class="flex-1 min-w-0 space-y-5">
            <!-- Template Name & Actions Row -->
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0 space-y-2">
                <div class="flex items-center gap-2">
                  <BaseText size="base" weight="semibold" class="text-primary-600 dark:text-primary-400">
                    {{ template.name }}
                  </BaseText>
                  <Icon
                    v-if="template.hasPassword"
                    name="ph:lock-fill"
                    class="size-4 text-secondary-500 shrink-0"
                    title="Password protected"
                  />
                  <Icon
                    v-if="template.isOneTime"
                    name="ph:clock-countdown-fill"
                    class="size-4 text-primary-500 shrink-0"
                    title="One-time use"
                  />
                </div>
                <BaseText v-if="template.description" size="xs" class="text-muted-500 dark:text-muted-400 line-clamp-1">
                  {{ template.description }}
                </BaseText>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1 shrink-0">
                <BaseButton
                  size="sm"
                  variant="ghost"
                  icon
                  class="rounded-full"
                  @click="emit('edit', template.id)"
                >
                  <Icon name="ph:pencil" class="size-4" />
                </BaseButton>
                <BaseButton
                  size="sm"
                  variant="ghost"
                  icon
                  class="rounded-full"
                  @click="emit('clone', template.id)"
                >
                  <Icon name="ph:copy" class="size-4" />
                </BaseButton>
                <BaseButton
                  size="sm"
                  variant="ghost"
                  icon
                  color="danger"
                  class="rounded-full"
                  @click="emit('delete', template.id)"
                >
                  <Icon name="ph:trash" class="size-4" />
                </BaseButton>
              </div>
            </div>

            <!-- Info Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <!-- Rules -->
              <div class="space-y-2.5">
                <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                  Rules
                </BaseText>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <Icon name="ph:git-branch" class="size-4 text-primary-500 shrink-0" />
                    <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                      {{ getRulesSummary(template) }}
                    </BaseText>
                  </div>
                </div>
              </div>

              <!-- Usage -->
              <div class="space-y-2.5">
                <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                  Usage
                </BaseText>
                <div class="space-y-2">
                  <div 
                    class="flex items-center gap-2"
                    :class="template.campaignCount > 0 ? 'cursor-pointer hover:text-secondary-600' : ''"
                    @click="template.campaignCount > 0 ? emit('viewCampaigns', template.id) : null"
                  >
                    <Icon name="ph:layers" class="size-4 text-secondary-500 shrink-0" />
                    <BaseText size="xs" :class="template.campaignCount > 0 ? 'text-secondary-600 dark:text-secondary-400' : 'text-muted-600 dark:text-muted-400'">
                      {{ template.campaignCount }} campaign{{ template.campaignCount !== 1 ? 's' : '' }}
                    </BaseText>
                  </div>
                  <div class="flex items-center gap-2">
                    <Icon name="ph:link" class="size-4 text-muted-400 shrink-0" />
                    <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                      {{ template.totalLinks }} total links
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
                      {{ formatDate(template.createdAt) }}
                    </BaseText>
                  </div>
                  <div class="flex items-center gap-2">
                    <Icon name="ph:clock-clockwise" class="size-4 text-muted-400 shrink-0" />
                    <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                      {{ formatDate(template.updatedAt) }}
                    </BaseText>
                  </div>
                </div>
              </div>

              <!-- Quick Stats -->
              <div class="space-y-2.5">
                <BaseText size="xs" weight="semibold" class="uppercase tracking-wider text-muted-400 dark:text-muted-500">
                  Quick Stats
                </BaseText>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <Icon name="ph:chart-bar" class="size-4 text-secondary-500 shrink-0" />
                    <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                      {{ template.totalLinks > 0 ? `Avg ${Math.round(template.totalLinks / Math.max(template.campaignCount, 1))} links/campaign` : 'No data' }}
                    </BaseText>
                  </div>
                  <div class="flex items-center gap-2">
                    <Icon name="ph:activity" class="size-4 text-primary-500 shrink-0" />
                    <BaseText size="xs" class="text-muted-600 dark:text-muted-400">
                      {{ template.campaignCount > 0 ? 'Active template' : 'Unused template' }}
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




