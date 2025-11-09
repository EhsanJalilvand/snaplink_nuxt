<script setup lang="ts">
import { SnapLinkPanelLanguage } from '#components'
import { getLocaleFlag } from '~/utils/locale'
import { useAppLocale } from '~/composables/useLocale'

const currentLocale = useAppLocale()
const { open } = usePanels()

// Ory Kratos authentication
const { user, isAuthenticated, logout, checkAuth } = useAuth()

// Workspace selector
const currentWorkspaceId = useState<string | undefined>('currentWorkspaceId', () => undefined)
const currentWorkspace = useState<{ id: string; name: string } | null>('currentWorkspace', () => null)
const currentWorkspaceLabel = computed(() => currentWorkspace.value?.name ?? 'Select a workspace')

onMounted(() => {
  if (!process.client) {
    return
  }

  const storedWorkspace = localStorage.getItem('snaplink-current-workspace')

  if (!storedWorkspace) {
    return
  }

  try {
    const parsed = JSON.parse(storedWorkspace) as { id: string; name: string }
    currentWorkspaceId.value = parsed.id
    currentWorkspace.value = parsed
  } catch (error) {
    if (import.meta.dev) {
      console.warn('[dashboard.vue] Failed to parse stored workspace', error)
    }
  }
})

watch(currentWorkspace, (workspace) => {
  if (!process.client) {
    return
  }

  if (workspace) {
    localStorage.setItem('snaplink-current-workspace', JSON.stringify(workspace))
  } else {
    localStorage.removeItem('snaplink-current-workspace')
  }
})

const handleCustomizeClick = async () => {
  try {
    const WorkspaceSelectorPanel = (await import('~/components/WorkspaceSelectorPanel.vue')).default
    
    const [selectedWorkspace] = await open(
      WorkspaceSelectorPanel,
      {
        currentWorkspaceId: currentWorkspaceId.value,
      },
      {
        position: 'right',
        size: 'md',
        overlay: true,
      }
    )
    
    if (selectedWorkspace) {
      // TODO: Update current workspace via API
      currentWorkspaceId.value = selectedWorkspace.id
      currentWorkspace.value = {
        id: selectedWorkspace.id,
        name: selectedWorkspace.name,
      }
      
      if (import.meta.dev) {
        console.log('[dashboard.vue] Workspace selected:', selectedWorkspace)
      }
    }
  } catch (error) {
    if (import.meta.dev) {
      console.error('[dashboard.vue] Failed to open workspace selector:', error)
    }
  }
}

const handleActivityClick = async () => {
  try {
    const ActivityPanel = (await import('~/components/ActivityPanel.vue')).default
    
    await open(
      ActivityPanel,
      {},
      {
        position: 'right',
        size: 'sm',
        overlay: true,
      }
    )
  } catch (error) {
    if (import.meta.dev) {
      console.error('[dashboard.vue] Failed to open activity panel:', error)
    }
  }
}

// Use shared user data composable for consistent state across all components
const { user: sharedUser, userDisplayName, refreshUser } = useUserData()

// Also check auth on mount to ensure state is synced
onMounted(async () => {
  await checkAuth()
  await refreshUser()
})

// Get user avatar - prioritize user avatar, fallback to ui-avatars
const userAvatar = computed(() => {
  if (sharedUser.value?.avatar) {
    return sharedUser.value.avatar
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName.value)}&background=6366f1&color=fff`
})

// Handle logout
const handleLogout = async () => {
  await logout()
  // Refresh user data after logout
  await refreshUser()
}

type MenuLink = {
  label: string
  icon: string
  to?: string
  children?: MenuLink[]
}

interface MenuItem {
  label: string
  icon: string
  links: MenuLink[]
}

const quickLinks = [
  {
    label: 'Profile',
    description: 'Update your personal details and preferences',
    icon: 'solar:user-linear',
    to: '/dashboard/settings',
  },
  {
    label: 'Billing',
    description: 'Subscription, invoices and payment methods',
    icon: 'solar:card-linear',
    to: '/dashboard/billing/overview',
  },
]

const supportActions = [
  {
    label: 'Contact support',
    icon: 'solar:lifebuoy-linear',
    to: '/support',
    query: { tab: 'support' },
  },
]

const menu: MenuItem[] = [
  {
    label: 'URL Shortener',
    icon: 'solar:link-linear',
    links: [
      {
        label: 'Overview',
        icon: 'solar:chart-2-linear',
        to: '/dashboard/url-shortener/overview',
      },
      {
        label: 'Links',
        icon: 'solar:link-round-linear',
        to: '/dashboard/url-shortener/links',
      },
      {
        label: 'Collections',
        icon: 'solar:folder-linear',
        to: '/dashboard/url-shortener/collections',
      },
      {
        label: 'Notifications',
        icon: 'solar:bell-linear',
        to: '/dashboard/url-shortener/notifications',
      },
    ],
  },
  {
    label: 'Payment',
    icon: 'solar:wallet-bold-duotone',
    links: [
      {
        label: 'Overview',
        icon: 'solar:chart-linear',
        to: '/dashboard/payment/overview',
      },
      {
        label: 'Payment Links',
        icon: 'solar:link-circle-linear',
        to: '/dashboard/payment/links',
      },
      {
        label: 'Merchant Gateway',
        icon: 'solar:shop-linear',
        to: '/dashboard/payment/gateway',
      },
      {
        label: 'Notification Settings',
        icon: 'solar:bell-bing-linear',
        to: '/dashboard/payment/notifications',
      },
    ],
  },
  {
    label: 'Survey Link',
    icon: 'solar:clipboard-list-linear',
    links: [
      {
        label: 'Overview',
        icon: 'solar:chart-2-linear',
        to: '/dashboard/survey-link/overview',
      },
    ],
  },
  {
    label: 'BioLink',
    icon: 'solar:user-id-linear',
    links: [
      {
        label: 'Overview',
        icon: 'solar:chart-2-linear',
        to: '/dashboard/biolink/overview',
      },
    ],
  },
  {
    label: 'Quiz Link',
    icon: 'solar:document-text-linear',
    links: [
      {
        label: 'Overview',
        icon: 'solar:chart-2-linear',
        to: '/dashboard/quiz-link/overview',
      },
    ],
  },
  {
    label: 'Billing',
    icon: 'solar:card-linear',
    links: [
      {
        label: 'Overview',
        icon: 'solar:chart-2-linear',
        to: '/dashboard/billing/overview',
      },
      {
        label: 'Usage',
        icon: 'solar:graph-up-linear',
        to: '/dashboard/billing/usage',
      },
      {
        label: 'Invoices',
        icon: 'solar:document-linear',
        to: '/dashboard/billing/invoices',
      },
      {
        label: 'Alerts & Limits',
        icon: 'solar:bell-linear',
        to: '/dashboard/billing/alerts',
      },
    ],
  },
]

const route = useRoute()
const router = useRouter()
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

  return menu[0]?.label || 'URL Shortener'
}

function handlePrimaryNavClick(item: MenuItem) {
  const flatLinks = item.links ?? []

  const overviewLink = flatLinks.find(link => link.label === 'Overview')

  const firstLink = overviewLink ?? flatLinks[0]

  if (!firstLink) {
    return
  }

  if (firstLink.to) {
    router.push(firstLink.to)
    return
  }

  if (firstLink.children?.length) {
    const childOverview = firstLink.children.find(child => child.label === 'Overview')
    const childTarget = childOverview ?? firstLink.children[0]

    if (childTarget?.to) {
      router.push(childTarget.to)
    }
  }
}
</script>

<template>
  <TairoSidebarLayout
    v-slot="{ toggleMobileNav }"
    v-model="sidebarId"
  >
    <TairoSidebarNav>
      <TairoSidebar>
        <NuxtLink to="/dashboard" class="flex items-center justify-center size-14 shrink-0">
          <BrandLogoMark size="md" />
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
            <TairoSidebarTrigger :value="item.label" @click="handlePrimaryNavClick(item)">
              <Icon :name="item.icon" class="size-5" />
            </TairoSidebarTrigger>
          </BaseTooltip>
        </TairoSidebarLinks>

        <TairoSidebarLinks class="shrink-0 mt-auto border-t border-muted-200 dark:border-muted-800 pt-2">
          <BaseTooltip
            content="Select Workspace"
            variant="dark"
            :bindings="{
              content: { side: 'left' },
              portal: { disabled: true },
            }"
          >
            <TairoSidebarLink tabindex="0" @click="handleCustomizeClick">
              <Icon name="solar:palette-round-linear" class="size-5" />
            </TairoSidebarLink>
          </BaseTooltip>
          <BaseTooltip
            content="Preferences"
            variant="dark"
            :bindings="{
              content: { side: 'left' },
              portal: { disabled: true },
            }"
          >
            <TairoSidebarLink to="/dashboard/preferences">
              <Icon name="solar:settings-linear" class="size-5" />
            </TairoSidebarLink>
          </BaseTooltip>
          <BaseTooltip
            content="Account Settings"
            variant="dark"
            :bindings="{
              content: { side: 'left' },
              portal: { disabled: true },
            }"
          >
            <TairoSidebarLink to="/dashboard/settings">
              <Icon name="solar:user-id-linear" class="size-5" />
            </TairoSidebarLink>
          </BaseTooltip>
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
      <div class="border-muted-200 dark:border-muted-800 sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-white/95 px-4 backdrop-blur-md dark:bg-muted-950/95 md:px-6 lg:px-8 relative">
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
              All-in-One Link Management Platform
            </p>
          </div>
        </div>

        <div class="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex">
          <div
            class="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50/80 px-4 py-1.5 text-sm font-medium text-primary-700 shadow-sm dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-200"
          >
            <Icon name="solar:layers-linear" class="size-4" />
            <span>{{ currentWorkspaceLabel }}</span>
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

          <!-- Activity Button -->
          <button
            type="button"
            class="border-muted-200 hover:ring-muted-200 dark:hover:ring-muted-700 dark:border-muted-700 dark:bg-muted-800 dark:ring-offset-muted-900 flex size-10 items-center justify-center rounded-full border bg-white ring-1 ring-transparent transition-all duration-300 hover:ring-offset-4 relative"
            @click="handleActivityClick"
          >
            <Icon name="solar:history-linear" class="size-5" />
            <span class="absolute top-0 end-0 flex size-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full size-2 bg-primary-500"></span>
            </span>
          </button>

          <!-- User Menu -->
          <BaseDropdown
            v-if="isAuthenticated && sharedUser"
            variant="default"
            :bindings="{
              content: {
                align: 'end',
                sideOffset: 12,
                class: 'max-w-[320px] p-0',
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
                    v-if="sharedUser"
                    size="xs"
                    :src="userAvatar"
                  />
                </BaseChip>
                <span class="hidden lg:inline text-sm font-medium text-muted-700 dark:text-muted-300">
                  {{ userDisplayName }}
                </span>
              </button>
            </template>
         

            <div class="px-4 pb-3 py-3">
              <p class="text-xs font-medium uppercase tracking-wide text-muted-500 dark:text-muted-400">
                Quick links
              </p>
              <div class="mt-2 space-y-2">
                <NuxtLink
                  v-for="link in quickLinks"
                  :key="link.label"
                  :to="link.to"
                  class="group flex items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-primary-500/40 hover:bg-primary-500/5 dark:hover:border-primary-500/30"
                >
                  <div class="flex size-9 items-center justify-center rounded-lg bg-muted-100 text-muted-600 transition group-hover:bg-primary-500 group-hover:text-white dark:bg-muted-900 dark:text-muted-300">
                    <Icon :name="link.icon" class="size-4" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-muted-900 transition group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-300">
                      {{ link.label }}
                    </p>
                    <p class="text-xs text-muted-500 dark:text-muted-400">
                      {{ link.description }}
                    </p>
                  </div>
                </NuxtLink>
              </div>
            </div>

            <BaseDropdownSeparator />

            <div class="px-4 py-3">
              <p class="text-xs font-medium uppercase tracking-wide text-muted-500 dark:text-muted-400">
                Support
              </p>
              <div class="mt-2 grid grid-cols-1 gap-2">
                <NuxtLink
                  v-for="action in supportActions"
                  :key="action.label"
                  :to="action.to ? { path: action.to, query: action.query } : undefined"
                  :href="action.href"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-600 transition hover:bg-muted-100 hover:text-primary-600 dark:text-muted-400 dark:hover:bg-muted-900 dark:hover:text-primary-300"
                  target="_blank"
                  rel="noopener"
                >
                  <Icon :name="action.icon" class="size-4" />
                  <span>{{ action.label }}</span>
                  <Icon
                    v-if="action.href"
                    name="solar:export-outline"
                    class="ms-auto size-3 text-muted-400"
                  />
                </NuxtLink>
              </div>
            </div>

            <BaseDropdownSeparator />

            <BaseDropdownItem class="group" @click="handleLogout">
              <Icon name="ph:sign-out" class="size-4 text-muted-500 transition group-hover:text-destructive-500" />
              <span class="group-hover:text-destructive-500">Logout</span>
            </BaseDropdownItem>
          </BaseDropdown>
        </div>
      </div>

      <!-- Main Content -->
      <div class="px-4 md:px-6 xl:px-8">
        <slot />
      </div>
    </TairoSidebarContent>
  </TairoSidebarLayout>
</template>
