<script setup lang="ts">
import { SnapLinkPanelLanguage } from '#components'
import { getLocaleFlag } from '~/utils/locale'
import { useAppLocale } from '~/composables/useLocale'

const currentLocale = useAppLocale()
const { open } = usePanels()

// Keycloak authentication - check auth on mount to restore state after refresh
const { user, isAuthenticated, logout, checkAuth } = useKeycloak()

// Fetch user from server on mount and when route changes (for refresh)
const { data: userData, refresh: refreshUser } = useFetch('/api/auth/me', {
  immediate: true,
  default: () => ({ success: false, user: null, isAuthenticated: false }),
})

// Sync server user data with composable state
watch(userData, (newData) => {
  if (newData?.success && newData?.user) {
    // Update composable state from server data
    checkAuth()
  }
}, { immediate: true })

// Also check auth on mount to ensure state is synced
onMounted(async () => {
  await checkAuth()
})

// Get user display name - prioritize server data, fallback to composable state
const userDisplayName = computed(() => {
  const currentUser = userData.value?.user || user.value
  if (!currentUser) return ''
  return currentUser.firstName
    ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
    : currentUser.username || currentUser.email || 'User'
})

// Handle logout
const handleLogout = async () => {
  await logout()
  // Refresh user data after logout
  await refreshUser()
}

// Open Keycloak Account Console
const openKeycloakAccount = () => {
  const keycloakUrl = config.public.keycloakUrl || 'http://localhost:8080'
  const keycloakRealm = config.public.keycloakRealm || 'master'
  const accountUrl = `${keycloakUrl}/realms/${keycloakRealm}/account`
  
  // Open in new tab - Keycloak will handle SSO authentication
  window.open(accountUrl, '_blank')
}

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
    label: 'Utility',
    icon: 'solar:home-smile-linear',
    links: [
      {
        label: 'Invoice v2',
        icon: 'solar:document-linear',
        to: '/layouts/utility-invoice-2',
      },
      {
        label: 'Invoice v1',
        icon: 'solar:invoice-linear',
        to: '/layouts/utility-invoice',
      },
      {
        label: 'Action v1',
        icon: 'solar:shield-user-linear',
        to: '/layouts/utility-action-1',
      },
      {
        label: 'Action v2',
        icon: 'solar:shield-check-linear',
        to: '/layouts/utility-action-2',
      },
      {
        label: 'System Status',
        icon: 'solar:server-path-linear',
        to: '/layouts/utility-status',
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

// Get runtime config
const config = useRuntimeConfig()

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
      <!-- Top Navbar -->
      <div class="border-muted-200 dark:border-muted-800 sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-white/95 px-4 backdrop-blur-md dark:bg-muted-950/95 md:px-6 lg:px-8">
        <!-- Left side - Logo and Title -->
        <div class="flex items-center gap-4">
          <BaseButton
            size="sm"
            variant="ghost"
            class="md:hidden"
            @click="toggleMobileNav"
          >
            <Icon name="lucide:menu" class="size-4" />
          </BaseButton>
          <div class="hidden md:block">
            <h1 class="text-xl font-semibold text-muted-900 dark:text-muted-100">
              SnapLink Dashboard
            </h1>
            <p class="text-sm text-muted-500 dark:text-muted-400">
              Professional URL Shortener & Analytics
            </p>
          </div>
        </div>

        <!-- Right side - Language, Theme, User -->
        <div class="flex items-center gap-2">
          <!-- Language Selector -->
          <button
            type="button"
            class="border-muted-200 hover:ring-muted-200 dark:hover:ring-muted-700 dark:border-muted-700 dark:bg-muted-800 dark:ring-offset-muted-900 flex size-10 items-center justify-center rounded-full border bg-white ring-1 ring-transparent transition-all duration-300 hover:ring-offset-4"
            @click="open(SnapLinkPanelLanguage)"
          >
            <img
              class="size-6 rounded-full"
              :src="getLocaleFlag(currentLocale)"
              alt="flag icon"
            >
          </button>

          <!-- Dark Mode Toggle -->
          <BaseThemeToggle aria-label="Toggle darkmode" />

          <!-- User Menu -->
          <BaseDropdown
            v-if="(isAuthenticated || userData?.isAuthenticated) && (user || userData?.user)"
            variant="default"
            :bindings="{
              content: {
                align: 'end',
                sideOffset: 10,
              },
            }"
          >
            <template #button>
              <button
                type="button"
                class="flex items-center gap-2 rounded-full p-1 hover:bg-muted-100 dark:hover:bg-muted-800 transition-colors"
              >
                <BaseChip size="sm" color="custom" :offset="3" class="text-success-500">
                  <BaseAvatar
                    size="xs"
                    :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=6366f1&color=fff`"
                  />
                </BaseChip>
                <span class="hidden lg:inline text-sm font-medium text-muted-700 dark:text-muted-300">
                  {{ userDisplayName }}
                </span>
              </button>
            </template>
            <BaseDropdownItem to="/dashboard">
              <Icon name="solar:user-linear" class="size-4" />
              <span>Dashboard</span>
            </BaseDropdownItem>
            <BaseDropdownItem 
              @click="openKeycloakAccount"
            >
              <Icon name="solar:settings-linear" class="size-4" />
              <span>Account Settings</span>
            </BaseDropdownItem>
            <BaseDropdownDivider />
            <BaseDropdownItem @click="handleLogout">
              <Icon name="ph:sign-out" class="size-4" />
              <span>Logout</span>
            </BaseDropdownItem>
          </BaseDropdown>

          <!-- Create Link Button -->
          <BaseButton size="sm" variant="primary">
            <Icon name="solar:add-circle-linear" class="size-4" />
            <span class="hidden md:inline">Create Link</span>
          </BaseButton>
        </div>
      </div>

      <!-- Main Content -->
      <div class="px-4 md:px-6 xl:px-8">
        <slot />
      </div>
    </TairoSidebarContent>
  </TairoSidebarLayout>
</template>
