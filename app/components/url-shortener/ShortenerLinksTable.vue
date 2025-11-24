<script setup lang="ts">
import type { ShortenerLink, ShortenerLinkStatus } from '~/types/url-shortener'

interface StatusConfig {
  label: string
  color: string
  icon: string
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
        return { label: 'Active', color: 'success', icon: 'ph:check-circle' }
      case 'paused':
        return { label: 'Paused', color: 'warning', icon: 'ph:pause-circle' }
      case 'expired':
        return { label: 'Expired', color: 'muted', icon: 'ph:clock' }
      default:
        return { label: 'Unknown', color: 'muted', icon: 'ph:question' }
    }
  },
})

const emit = defineEmits<{
  'toggle-select': [id: string]
  'toggle-all': [selected: boolean]
  copy: [link: ShortenerLink]
  delete: [id: string]
}>()

const handleToggleSelect = (id: string) => emit('toggle-select', id)
const handleToggleAll = (checked: boolean) => emit('toggle-all', checked)
const handleCopy = (link: ShortenerLink) => emit('copy', link)
const handleDelete = (id: string) => emit('delete', id)
</script>

<template>
  <ClientOnly>
    <div>
      <div v-if="isLoading" class="space-y-2">
      <div
        v-for="index in 6"
        :key="`links-skeleton-${index}`"
        class="h-16 rounded-xl border border-muted-200/70 bg-muted-100/60 animate-pulse dark:border-muted-700/60 dark:bg-muted-900/30"
      />
    </div>
    <TairoFlexTable v-else>
      <template #header>
        <TairoFlexTableHeading type="shrink">
          <BaseCheckbox
            :checked="allSelected"
            :indeterminate="indeterminate"
            rounded="sm"
            color="primary"
            @update:checked="handleToggleAll"
          />
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="grow">
          Link
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="stable">
          Clicks
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="stable">
          Collection
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="stable">
          Status
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="stable">
          Created
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="shrink">
          Actions
        </TairoFlexTableHeading>
      </template>

      <TairoFlexTableRow v-for="link in links" :key="link.id" rounded="md">
        <TairoFlexTableCell type="shrink" data-content="Selection">
          <BaseCheckbox
            :checked="selectedIds.includes(link.id)"
            rounded="sm"
            color="primary"
            @update:checked="() => handleToggleSelect(link.id)"
          />
        </TairoFlexTableCell>
        <TairoFlexTableCell type="grow" data-content="Link">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <NuxtLink :to="`/dashboard/url-shortener/links/${link.id}/edit`" class="hover:underline">
                <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                  {{ link.shortUrl }}
                </BaseHeading>
              </NuxtLink>
              <BaseButton size="sm" variant="ghost" @click.stop="handleCopy(link)">
                <Icon name="ph:copy" class="size-3" />
              </BaseButton>
            </div>
            <BaseParagraph size="xs" class="line-clamp-1 text-muted-500 dark:text-muted-400">
              {{ link.originalUrl }}
            </BaseParagraph>
          </div>
        </TairoFlexTableCell>

        <TairoFlexTableCell type="stable" data-content="Clicks">
          <div class="flex items-center gap-2">
            <Icon name="solar:mouse-linear" class="size-4 text-muted-400" />
            <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
              {{ link.clicks.toLocaleString() }}
            </BaseText>
          </div>
        </TairoFlexTableCell>

        <TairoFlexTableCell type="stable" data-content="Collection">
          <div v-if="link.collectionNames && link.collectionNames.length > 0" class="flex flex-wrap gap-1">
            <BaseChip
              v-for="(collectionName, index) in link.collectionNames.slice(0, 2)"
              :key="index"
              size="sm"
              variant="pastel"
              color="primary"
            >
              {{ collectionName }}
            </BaseChip>
            <BaseChip
              v-if="link.collectionNames.length > 2"
              size="sm"
              variant="pastel"
              color="muted"
            >
              +{{ link.collectionNames.length - 2 }}
            </BaseChip>
          </div>
          <div v-else-if="link.collection" class="flex flex-wrap gap-1">
            <BaseChip size="sm" variant="pastel" color="primary">
              {{ link.collection }}
            </BaseChip>
          </div>
          <BaseText v-else size="xs" class="text-muted-400 dark:text-muted-500">
            —
          </BaseText>
        </TairoFlexTableCell>

        <TairoFlexTableCell type="stable" data-content="Status">
          <BaseChip :color="statusConfig(link.status).color" size="sm">
            <Icon :name="statusConfig(link.status).icon" class="size-3" />
            <span>{{ statusConfig(link.status).label }}</span>
          </BaseChip>
        </TairoFlexTableCell>

        <TairoFlexTableCell type="stable" data-content="Created">
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            {{ new Date(link.createdAt).toLocaleDateString() }}
          </BaseText>
        </TairoFlexTableCell>

        <TairoFlexTableCell type="shrink" data-content="Actions">
          <div class="flex items-center gap-1">
            <BaseButton 
              size="sm" 
              variant="ghost" 
              icon 
              class="rounded-full" 
              @click="() => navigateTo(`/dashboard/url-shortener/links/${link.id}/edit`)"
            >
              <Icon name="ph:pencil" class="size-4" />
            </BaseButton>
            <BaseButton size="sm" variant="ghost" icon color="danger" class="rounded-full" @click="handleDelete(link.id)">
              <Icon name="ph:trash" class="size-4" />
            </BaseButton>
          </div>
        </TairoFlexTableCell>
      </TairoFlexTableRow>
    </TairoFlexTable>
    </div>
    <template #fallback>
      <div class="space-y-2">
        <div
          v-for="index in 6"
          :key="`links-skeleton-${index}`"
          class="h-16 rounded-xl border border-muted-200/70 bg-muted-100/60 animate-pulse dark:border-muted-700/60 dark:bg-muted-900/30"
        />
      </div>
    </template>
  </ClientOnly>
</template>
