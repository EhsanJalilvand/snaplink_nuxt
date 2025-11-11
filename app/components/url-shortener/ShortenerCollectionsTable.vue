<script setup lang="ts">
import type { ShortenerCollection } from '~/types/url-shortener'

interface StatusClass {
  container: string
  icon: string
}

interface Props {
  collections: ShortenerCollection[]
  selectedIds: string[]
  isLoading?: boolean
  allSelected?: boolean
  indeterminate?: boolean
  statusColorClass?: (color: ShortenerCollection['color']) => StatusClass
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  allSelected: false,
  indeterminate: false,
  statusColorClass: () => ({ container: 'bg-primary-100 dark:bg-primary-900/30', icon: 'text-primary-600 dark:text-primary-400' }),
})

const emit = defineEmits<{
  'toggle-select': [id: string]
  'toggle-all': [selected: boolean]
  delete: [id: string]
  report: [id: string]
}>()

const handleToggleSelect = (id: string) => emit('toggle-select', id)
const handleToggleAll = (checked: boolean) => emit('toggle-all', checked)
const handleDelete = (id: string) => emit('delete', id)
const handleReport = (id: string) => emit('report', id)
</script>

<template>
  <div>
    <div v-if="isLoading" class="space-y-2">
      <div
        v-for="index in 6"
        :key="`collections-skeleton-${index}`"
        class="h-18 rounded-xl border border-muted-200/70 bg-muted-100/60 animate-pulse dark:border-muted-700/60 dark:bg-muted-900/30"
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
          Collection
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="stable">
          Links
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="stable">
          Total Clicks
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="stable">
          Created
        </TairoFlexTableHeading>
        <TairoFlexTableHeading type="shrink">
          Actions
        </TairoFlexTableHeading>
      </template>

      <TairoFlexTableRow v-for="collection in collections" :key="collection.id" rounded="md">
        <TairoFlexTableCell type="shrink" data-content="Selection">
          <BaseCheckbox
            :checked="selectedIds.includes(collection.id)"
            rounded="sm"
            color="primary"
            @update:checked="() => handleToggleSelect(collection.id)"
          />
        </TairoFlexTableCell>

        <TairoFlexTableCell type="grow" data-content="Collection">
          <div class="flex items-center gap-3">
            <div
              class="p-2 rounded-lg shrink-0"
              :class="statusColorClass(collection.color).container"
            >
              <Icon name="solar:folder-linear" class="size-5" :class="statusColorClass(collection.color).icon" />
            </div>
            <div class="min-w-0">
              <BaseHeading as="h4" size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                {{ collection.name }}
              </BaseHeading>
              <BaseParagraph size="xs" class="line-clamp-1 text-muted-500 dark:text-muted-400">
                {{ collection.description || 'No description provided' }}
              </BaseParagraph>
            </div>
          </div>
        </TairoFlexTableCell>

        <TairoFlexTableCell type="stable" data-content="Links">
          <div class="flex items-center gap-2">
            <Icon name="solar:link-linear" class="size-4 text-muted-400" />
            <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
              {{ collection.linkCount }}
            </BaseText>
          </div>
        </TairoFlexTableCell>

        <TairoFlexTableCell type="stable" data-content="Total Clicks">
          <div class="flex items-center gap-2">
            <Icon name="solar:mouse-linear" class="size-4 text-muted-400" />
            <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
              {{ collection.totalClicks.toLocaleString() }}
            </BaseText>
          </div>
        </TairoFlexTableCell>

        <TairoFlexTableCell type="stable" data-content="Created">
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            {{ new Date(collection.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}
          </BaseText>
        </TairoFlexTableCell>

        <TairoFlexTableCell type="shrink" data-content="Actions">
          <div class="flex items-center gap-1">
            <BaseButton size="sm" variant="ghost" icon class="rounded-full" @click="handleReport(collection.id)">
              <Icon name="ph:chart-line" class="size-4" />
            </BaseButton>
            <BaseButton size="sm" variant="ghost" icon color="danger" class="rounded-full" @click="handleDelete(collection.id)">
              <Icon name="ph:trash" class="size-4" />
            </BaseButton>
          </div>
        </TairoFlexTableCell>
      </TairoFlexTableRow>
    </TairoFlexTable>
  </div>
</template>
