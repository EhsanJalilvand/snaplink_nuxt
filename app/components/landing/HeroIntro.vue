<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <BaseTag rounded="full" size="sm" class="bg-primary-100 text-primary-600 inline-flex items-center gap-2">
        <Icon name="solar:stars-minimalistic-linear" class="size-4" />
        SnapLink Workspace
      </BaseTag>
      <BaseChip rounded="full" size="sm" class="bg-muted-100 text-muted-600 dark:bg-muted-900 dark:text-muted-300">
        Internal alpha · invite only
      </BaseChip>
    </div>

    <div class="space-y-4">
      <h1 class="text-4xl sm:text-5xl font-bold leading-tight text-muted-900 dark:text-muted-100">
        Launch short links with pro analytics, guardrails, and billing built-in.
      </h1>
      <p class="text-base sm:text-lg text-muted-600 dark:text-muted-300 max-w-2xl">
        SnapLink is the control room for URLs and collections. The core stack is ready—you get the same tools we use internally while we finish the remaining modules.
      </p>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <BaseCard class="flex items-center gap-3 rounded-2xl border border-muted-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-muted-800 dark:bg-muted-900/80">
        <div class="rounded-xl bg-primary-100 dark:bg-primary-900/30 p-2">
          <Icon name="solar:api-linear" class="size-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-white">
            API first
          </BaseText>
          <BaseParagraph size="2xs" class="text-muted-500 dark:text-muted-400">
            UI actions mirror REST
          </BaseParagraph>
        </div>
      </BaseCard>
      <BaseCard class="flex items-center gap-3 rounded-2xl border border-muted-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-muted-800 dark:bg-muted-900/80">
        <div class="rounded-xl bg-indigo-100 dark:bg-indigo-900/30 p-2">
          <Icon name="solar:laptop-linear" class="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-white">
            Workspace control
          </BaseText>
          <BaseParagraph size="2xs" class="text-muted-500 dark:text-muted-400">
            Roles coming next
          </BaseParagraph>
        </div>
      </BaseCard>
      <BaseCard class="flex items-center gap-3 rounded-2xl border border-muted-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-muted-800 dark:bg-muted-900/80">
        <div class="rounded-xl bg-emerald-100 dark:bg-emerald-900/30 p-2">
          <Icon name="solar:wallet-linear" class="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-white">
            Pay as you go
          </BaseText>
          <BaseParagraph size="2xs" class="text-muted-500 dark:text-muted-400">
            Card + crypto top-up
          </BaseParagraph>
        </div>
      </BaseCard>
      <BaseCard class="flex items-center gap-3 rounded-2xl border border-muted-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-muted-800 dark:bg-muted-900/80">
        <div class="rounded-xl bg-amber-100 dark:bg-amber-900/30 p-2">
          <Icon name="solar:brain-linear" class="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-white">
            AI analytics
          </BaseText>
          <BaseParagraph size="2xs" class="text-muted-500 dark:text-muted-400">
            Insights on every click
          </BaseParagraph>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
