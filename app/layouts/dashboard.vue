<script setup lang="ts">
const menu = [
  {
    label: 'Dashboard',
    icon: 'solar:sidebar-minimalistic-linear',
    links: [
      {
        label: 'Overview',
        icon: 'solar:chart-linear',
        to: '/dashboard',
      },
      {
        label: 'Quick Stats',
        icon: 'solar:graph-up-linear',
        to: '/dashboard/stats',
      },
    ],
  },
  {
    label: 'Links',
    icon: 'solar:link-linear',
    links: [
      {
        label: 'All Links',
        icon: 'solar:list-linear',
        to: '/links',
      },
      {
        label: 'Create Link',
        icon: 'solar:add-circle-linear',
        to: '/links/create',
      },
      {
        label: 'Bulk Import',
        icon: 'solar:upload-linear',
        to: '/links/import',
      },
    ],
  },
  {
    label: 'Analytics',
    icon: 'solar:chart-2-linear',
    links: [
      {
        label: 'Overview',
        icon: 'solar:pie-chart-2-linear',
        to: '/analytics',
      },
      {
        label: 'Traffic',
        icon: 'solar:chart-square-linear',
        to: '/analytics/traffic',
      },
      {
        label: 'Geographic',
        icon: 'solar:map-linear',
        to: '/analytics/geographic',
      },
      {
        label: 'Devices',
        icon: 'solar:smartphone-linear',
        to: '/analytics/devices',
      },
    ],
  },
  {
    label: 'Settings',
    icon: 'solar:settings-linear',
    links: [
      {
        label: 'General',
        icon: 'solar:settings-linear',
        to: '/settings',
      },
      {
        label: 'API Keys',
        icon: 'solar:key-linear',
        to: '/settings/api',
      },
      {
        label: 'Team',
        icon: 'solar:users-group-linear',
        to: '/settings/team',
      },
      {
        label: 'Billing',
        icon: 'solar:card-linear',
        to: '/settings/billing',
      },
    ],
  },
]

const route = useRoute()
const sidebarId = ref(getRouteSidebarId())

watch(() => route.path, () => {
  sidebarId.value = getRouteSidebarId()
})

function getRouteSidebarId() {
  // search for the active menu item
  for (const item of menu) {
    if (item.links.some(link => link.to === route.path || (link.children && link.children.some(child => child.to === route.path)))) {
      return item.label
    }
  }

  return 'Dashboard'
}
</script>

<template>
  <TairoSidebarLayout
    v-slot="{ toggleMobileNav }"
    v-model="sidebarId"
  >
    <TairoSidebarNav>
      <TairoSidebar>
        <NuxtLink to="/" class="flex items-center justify-center size-14 shrink-0">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Icon name="solar:link-linear" class="w-5 h-5 text-white" />
            </div>
            <span class="text-xl font-bold text-primary-600 dark:text-primary-400">SnapLink</span>
          </div>
        </NuxtLink>

        <TairoSidebarLinks class="overflow-y-auto nui-slimscroll">
          <BaseTooltip
            v-for="item in menu"
            :key="item.label"
            :content="item.label"
            variant="dark"
            :bindings="{
              content: { side: 'left' },
              portal: { disabled: true },
            }"
          >
            <TairoSidebarTrigger :value="item.label">
              <Icon :name="item.icon" class="size-5" />
            </TairoSidebarTrigger>
          </BaseTooltip>
        </TairoSidebarLinks>

        <TairoSidebarLinks class="shrink-0 mt-auto">
          <BaseTooltip
            content="Customize"
            variant="dark"
            :bindings="{
              content: { side: 'left' },
              portal: { disabled: true },
            }"
          >
            <TairoSidebarLink tabindex="0">
              <Icon name="solar:palette-round-linear" class="size-5" />
            </TairoSidebarLink>
          </BaseTooltip>
          <BaseTooltip
            content="Settings"
            variant="dark"
            :bindings="{
              content: { side: 'left' },
              portal: { disabled: true },
            }"
          >
            <TairoSidebarLink to="/settings">
              <Icon name="solar:settings-linear" class="size-5" />
            </TairoSidebarLink>
          </BaseTooltip>
          <TairoSidebarLink>
            <BaseThemeToggle class="scale-90" />
          </TairoSidebarLink>
          <TairoSidebarLink to="/settings/profile">
            <BaseChip size="sm" pulse color="custom" :offset="3" class="text-green-600 flex items-center justify-center">
              <BaseAvatar
                size="xs"
                src="/img/avatars/10.svg"
              />
            </BaseChip>
          </TairoSidebarLink>
        </TairoSidebarLinks>
      </TairoSidebar>

      <template v-for="item in menu" :key="item.label">
        <TairoSidebarSubsidebar :value="item.label">
        <TairoSidebarSubsidebarHeader>
          {{ item.label }}
        </TairoSidebarSubsidebarHeader>
        <TairoSidebarSubsidebarContent>
          <template v-for="link in item.links" :key="link.label">
            <TairoSidebarSubsidebarLink v-if="!link.children" :to="link.to">
              <Icon :name="link.icon" class="size-4 text-muted-500 dark:text-muted-400" />
              <span>{{ link.label }}</span>
            </TairoSidebarSubsidebarLink>
            <TairoSidebarSubsidebarCollapsible
              v-else
              :children="link.children"
              :default-open="link.children.some((child) => child.to === $route.path) || undefined"
            >
              <template #trigger>
                <TairoSidebarSubsidebarCollapsibleTrigger>
                  <Icon :name="link.icon" class="size-4 text-muted-500 dark:text-muted-400" />
                  <span>{{ link.label }}</span>
                </TairoSidebarSubsidebarCollapsibleTrigger>
              </template>
            </TairoSidebarSubsidebarCollapsible>
          </template>
        </TairoSidebarSubsidebarContent>
        </TairoSidebarSubsidebar>
      </template>
    </TairoSidebarNav>

    <TairoSidebarContent class="min-h-screen">
      <div class="px-4 md:px-6 xl:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <BaseButton
              size="sm"
              variant="ghost"
              class="md:hidden"
              @click="toggleMobileNav"
            >
              <Icon name="lucide:menu" class="size-4" />
            </BaseButton>
            <div>
              <h1 class="text-xl font-semibold text-muted-900 dark:text-muted-100">
                SnapLink Dashboard
              </h1>
              <p class="text-sm text-muted-500 dark:text-muted-400">
                Professional URL Shortener & Analytics
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <BaseButton size="sm" variant="primary">
              <Icon name="solar:add-circle-linear" class="size-4" />
              <span>Create Link</span>
            </BaseButton>
          </div>
        </div>
      </div>
      <slot />
    </TairoSidebarContent>
  </TairoSidebarLayout>
</template>
