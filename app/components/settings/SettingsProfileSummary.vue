<script setup lang="ts">
const props = defineProps<{
  displayName: string
  email?: string | null
  avatarUrl?: string | null
  emailVerified?: boolean
}>()
</script>

<template>
  <BaseCard class="p-6">
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-muted-100">
          Profile
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Keep your personal information accurate and recognizable.
        </BaseParagraph>
      </div>
      <NuxtLink to="/dashboard/accountsettings/profile">
        <BaseButton size="sm" variant="outline" color="primary">
          <Icon name="solar:pen-2-linear" class="size-4" />
          Edit profile
        </BaseButton>
      </NuxtLink>
    </div>

    <div class="mt-6 flex flex-wrap items-center gap-6">
      <div class="relative">
        <BaseAvatar :src="avatarUrl || undefined" :text="displayName" size="xl" />
      </div>
      <div class="min-w-[220px] space-y-2">
        <div>
          <BaseText size="xs" class="uppercase tracking-wide text-muted-400">
            Display name
          </BaseText>
          <BaseHeading as="h4" size="lg" weight="semibold" class="text-muted-900 dark:text-muted-100">
            {{ displayName || 'Not set' }}
          </BaseHeading>
        </div>
        <div>
          <BaseText size="xs" class="uppercase tracking-wide text-muted-400">
            Email
          </BaseText>
          <div class="flex items-center gap-2">
            <BaseText size="sm" class="text-muted-600 dark:text-muted-300">
              {{ email || 'Not set' }}
            </BaseText>
            <BaseChip
              v-if="emailVerified"
              color="success"
              size="xs"
            >
              <Icon name="ph:check-circle" class="size-3" />
              Verified
            </BaseChip>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
