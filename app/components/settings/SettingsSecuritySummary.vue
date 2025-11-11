<script setup lang="ts">
const props = defineProps<{
  twoFactorEnabled: boolean
  isLoading?: boolean
  statusLabel: string
  statusColor: string
}>()
</script>

<template>
  <BaseCard class="p-6">
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-muted-100">
          Security
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Strengthen access to keep your workspace safe.
        </BaseParagraph>
      </div>
      <NuxtLink to="/dashboard/settings/security">
        <BaseButton size="sm" variant="outline" color="primary">
          <Icon name="solar:lock-keyhole-linear" class="size-4" />
          Review security
        </BaseButton>
      </NuxtLink>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <BaseCard class="border border-muted-200/70 bg-muted-50/60 p-4 dark:border-muted-800/60 dark:bg-muted-900/30">
        <div class="flex items-center gap-3">
          <div class="rounded-full bg-primary-100 p-2 dark:bg-primary-900/30">
            <Icon name="solar:password-linear" class="size-5 text-primary-500 dark:text-primary-300" />
          </div>
          <div>
            <BaseHeading as="h4" size="xs" weight="medium" class="text-muted-500 dark:text-muted-400">
              Password hygiene
            </BaseHeading>
            <BaseParagraph size="sm" class="text-muted-700 dark:text-muted-200">
              Rotate your password every 90 days.
            </BaseParagraph>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="border border-muted-200/70 bg-muted-50/60 p-4 dark:border-muted-800/60 dark:bg-muted-900/30">
        <div class="flex items-start gap-3">
          <div class="rounded-full bg-info-100 p-2 dark:bg-info-900/30">
            <Icon name="solar:shield-linear" class="size-5 text-info-500 dark:text-info-300" />
          </div>
          <div class="flex-1">
            <BaseHeading as="h4" size="xs" weight="medium" class="text-muted-500 dark:text-muted-400">
              Two-factor authentication
            </BaseHeading>
            <div class="mt-1 flex items-center gap-2">
              <BaseChip v-if="!isLoading" :color="statusColor" size="xs">
                {{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}
              </BaseChip>
              <div v-else class="h-5 w-16 rounded bg-muted-200/80 animate-pulse dark:bg-muted-800/60" />
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                {{ statusLabel }}
              </BaseParagraph>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </BaseCard>
</template>
