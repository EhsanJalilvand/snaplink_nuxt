<script setup lang="ts">
import type { SmartLink } from '~/types/url-shortener'

const props = defineProps<{
  smartLinks: SmartLink[]
  isLoading?: boolean
  collectionLookup?: Record<string, string>
  linkLookup?: Record<string, string>
}>()

const emit = defineEmits<{
  copy: [url: string]
}>()

const getStatus = (link: SmartLink) => {
  const now = new Date()

  if (link.expiresAt) {
    const expiresAt = new Date(link.expiresAt)
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt < now) {
      return { label: 'Expired', color: 'danger' }
    }
  }

  if (link.isOneTime && link.currentClicks > 0) {
    return { label: 'Consumed', color: 'warning' }
  }

  if (link.clickLimit && link.currentClicks >= link.clickLimit) {
    return { label: 'Limit reached', color: 'warning' }
  }

  return { label: 'Active', color: 'success' }
}

const getCollectionName = (id: string) => {
  return props.collectionLookup?.[id] ?? id.slice(0, 6)
}

const getFallbackLabel = (link: SmartLink) => {
  if (!link.defaultLinkId) {
    return 'None'
  }
  if (props.linkLookup?.[link.defaultLinkId]) {
    return props.linkLookup[link.defaultLinkId]
  }
  return `#${link.defaultLinkId.slice(0, 6)}`
}
</script>

<template>
  <BaseCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <BaseHeading as="h3" size="md" weight="semibold">
            SmartLinks
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            Conditional routes powered by your workspace links.
          </BaseParagraph>
        </div>
      </div>
    </template>

    <div class="relative">
      <table class="min-w-full divide-y divide-muted-200 dark:divide-muted-700">
        <thead class="bg-muted-50 dark:bg-muted-800/60 text-muted-500 text-xs uppercase">
          <tr>
            <th class="px-4 py-3 text-left font-semibold">SmartLink</th>
            <th class="px-4 py-3 text-left font-semibold">Routing Rules</th>
            <th class="px-4 py-3 text-left font-semibold">Fallback</th>
            <th class="px-4 py-3 text-left font-semibold">Collections</th>
            <th class="px-4 py-3 text-left font-semibold">Status</th>
            <th class="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-muted-200 dark:divide-muted-700">
          <tr v-if="isLoading">
            <td class="px-4 py-6" colspan="6">
              <div class="space-y-3">
                <div class="h-3 rounded bg-muted-200 dark:bg-muted-700 animate-pulse" />
                <div class="h-3 rounded bg-muted-200 dark:bg-muted-700 animate-pulse w-3/4" />
                <div class="h-3 rounded bg-muted-200 dark:bg-muted-700 animate-pulse w-1/2" />
              </div>
            </td>
          </tr>
          <tr
            v-for="link in smartLinks"
            :key="link.id"
            class="text-sm"
          >
            <td class="px-4 py-4 align-top">
              <div class="font-semibold text-muted-900 dark:text-white flex items-center gap-2">
                {{ link.name }}
                <BaseTag
                  v-if="link.hasPassword"
                  color="warning"
                  size="sm"
                  rounded="full"
                >
                  Protected
                </BaseTag>
              </div>
              <div class="text-xs text-muted-500 dark:text-muted-400 mt-1">
                {{ link.shortUrl || `snap.ly/${link.shortCode}` }}
              </div>
              <div class="text-[11px] uppercase tracking-wide text-muted-400 mt-1 flex gap-2">
                <span>{{ link.rules.length }} rules</span>
                <span>•</span>
                <span>{{ link.currentClicks }} clicks</span>
                <span v-if="link.clickLimit">/ {{ link.clickLimit }}</span>
              </div>
            </td>
            <td class="px-4 py-4 align-top">
              <div class="space-y-1.5 max-w-sm">
                <div
                  v-for="rule in link.rules.slice(0, 3)"
                  :key="rule.id || rule.summary"
                  class="text-xs text-muted-600 dark:text-muted-300 line-clamp-2"
                >
                  {{ rule.summary }}
                </div>
                <div
                  v-if="link.rules.length > 3"
                  class="text-[11px] text-muted-400"
                >
                  +{{ link.rules.length - 3 }} more
                </div>
              </div>
            </td>
            <td class="px-4 py-4 align-top">
              <div class="text-sm text-muted-700 dark:text-muted-200">
                {{ getFallbackLabel(link) }}
              </div>
              <div v-if="link.defaultLinkId" class="text-[11px] text-muted-400">
                Fallback
              </div>
            </td>
            <td class="px-4 py-4 align-top">
              <div class="flex flex-wrap gap-2">
                <BaseTag
                  v-for="collectionId in link.collectionIds || []"
                  :key="collectionId"
                  color="primary"
                  rounded="full"
                  size="sm"
                >
                  {{ getCollectionName(collectionId) }}
                </BaseTag>
                <BaseTag
                  v-if="!link.collectionIds || !link.collectionIds.length"
                  color="muted"
                  rounded="full"
                  size="sm"
                >
                  None
                </BaseTag>
              </div>
            </td>
            <td class="px-4 py-4 align-top">
              <BaseTag
                v-bind="getStatus(link)"
                rounded="full"
                size="sm"
              >
                {{ getStatus(link).label }}
              </BaseTag>
            </td>
            <td class="px-4 py-4 align-top">
              <div class="flex justify-end gap-2">
                <BaseButton
                  size="sm"
                  variant="outline"
                  color="primary"
                  @click="emit('copy', link.shortUrl || link.shortCode)"
                >
                  <Icon name="solar:copy-linear" class="size-4" />
                  Copy
                </BaseButton>
              </div>
            </td>
          </tr>
          <tr v-if="!smartLinks.length && !isLoading">
            <td class="px-4 py-8 text-center text-muted-500" colspan="6">
              No SmartLinks yet. Create your first AI-optimized redirect.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </BaseCard>
</template>


