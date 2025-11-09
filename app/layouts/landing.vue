<script setup lang="ts">
import { SnapLinkPanelLanguage } from '#components'
import { getLocaleFlag } from '~/utils/locale'
import { useAppLocale } from '~/composables/useLocale'
import { useTranslations } from '~/composables/useTranslations'

const isMobileMenuOpen = ref(false)
const currentLocale = useAppLocale()
const { open } = usePanels()
const { t } = useTranslations()

// Ory Kratos authentication
const { user, isAuthenticated, logout, checkAuth } = useAuth()

// Use shared user data composable for consistent state across all components
const { userDisplayName, user: sharedUser, refreshUser } = useUserData()

// Get user avatar - prioritize user avatar, fallback to ui-avatars
const userAvatar = computed(() => {
  if (sharedUser.value?.avatar) {
    return sharedUser.value.avatar
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName.value)}&background=6366f1&color=fff`
})

// Check authentication status when layout mounts
onMounted(async () => {
  if (process.client) {
    await checkAuth()
    await refreshUser()
  }
})

// Handle logout
const handleLogout = async () => {
  await logout()
  await refreshUser()
}

const landingQuickLinks = [
  {
    label: 'Profile',
    description: 'View and edit your account details',
    icon: 'solar:user-linear',
    to: '/dashboard/settings',
  },
  {
    label: 'Dashboard',
    description: 'Jump into your personalized workspace',
    icon: 'solar:home-2-linear',
    to: '/dashboard',
  },
]

const landingSupportLinks = [
  {
    label: 'Contact support',
    icon: 'solar:lifebuoy-linear',
    to: '/support',
    query: { tab: 'support' },
  },
]

const userEmail = computed(() => sharedUser.value?.email ?? user.value?.email ?? '')

const menu = computed(() => [
  { label: t.value.menu.about, to: '/about' },
  { label: t.value.menu.activity, to: '/activity' },
  { label: t.value.menu.blog, to: '/blog' },
  { label: t.value.menu.terms, to: '/terms' },
])
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-muted-900">
    <!-- Header -->
    <header class="fixed inset-x-0 top-0 z-50 mx-auto max-w-[calc(100%_-_40px)] mt-4 lg:max-w-7xl">
      <div class="flex items-center justify-between rounded-2xl border border-transparent bg-white/95 p-4 shadow-xl backdrop-blur-md dark:bg-muted-950/95 dark:border-muted-700">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <NuxtLink to="/" class="ms-2 inline-flex items-center gap-3" aria-label="Go to SnapLink homepage">
            <BrandLogoMark size="md" />
            <span class="text-lg font-semibold text-primary-600 dark:text-primary-300">SnapLink</span>
          </NuxtLink>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden lg:flex lg:w-auto lg:flex-row lg:bg-transparent">
          <TairoMenu>
            <TairoMenuList class="flex-col lg:flex-row">
              <TairoMenuItem v-for="item in menu" :key="item.label">
                <TairoMenuLink as-child>
                  <NuxtLink :to="item.to" active-class="text-primary-500">
                    {{ item.label }}
                  </NuxtLink>
                </TairoMenuLink>
              </TairoMenuItem>
            </TairoMenuList>
          </TairoMenu>
        </div>

        <!-- Right side actions -->
        <div class="flex items-center justify-end gap-2">
          <!-- Language Selector -->
          <button
            type="button"
            class="border-muted-200 hover:ring-muted-200 dark:hover:ring-muted-700 dark:border-muted-700 dark:bg-muted-800 dark:ring-offset-muted-900 flex size-10 items-center justify-center rounded-full border bg-white ring-1 ring-transparent transition-all duration-300 hover:ring-offset-4 shrink-0"
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

          <!-- Auth Buttons (if not logged in) -->
          <div v-if="!isAuthenticated" class="hidden sm:flex items-center gap-2">
            <BaseButton size="sm" variant="ghost" to="/auth/login">
              Login
            </BaseButton>
            <BaseButton size="sm" variant="primary" to="/auth/register">
              Register
            </BaseButton>
          </div>

          <!-- User Menu (if logged in) -->
          <BaseDropdown
            v-else
            class="hidden sm:flex"
            variant="default"
            :bindings="{
              content: {
                align: 'end',
                sideOffset: 10,
                class: 'max-w-[320px] p-0 z-[70] drop-shadow-xl'
              },
            }"
          >
            <template #button>
              <button
                type="button"
                class="flex items-center gap-2 rounded-full p-1 hover:bg-muted-100 dark:hover:bg-muted-800 transition-colors"
              >
                <BaseChip size="sm" color="custom" :offset="3" class="text-success-500">
                  <BaseAvatar size="xs" :src="userAvatar" />
                </BaseChip>
                <span class="hidden lg:inline text-sm font-medium text-muted-700 dark:text-muted-300">
                  {{ userDisplayName }}
                </span>
              </button>
            </template>
       

            <div class="px-4 py-3">
              <p class="text-xs font-medium uppercase tracking-wide text-muted-500 dark:text-muted-400">
                Quick links
              </p>
              <div class="mt-2 space-y-2">
                <NuxtLink
                  v-for="link in landingQuickLinks"
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
              <div class="mt-2 space-y-2">
                <NuxtLink
                  v-for="resource in landingSupportLinks"
                  :key="resource.label"
                  :to="resource.to ? { path: resource.to, query: resource.query } : undefined"
                  :href="resource.href"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-600 transition hover:bg-muted-100 hover:text-primary-600 dark:text-muted-400 dark:hover:bg-muted-900 dark:hover:text-primary-300"
                  :target="resource.href ? '_blank' : undefined"
                  rel="noopener"
                >
                  <Icon :name="resource.icon" class="size-4" />
                  <span>{{ resource.label }}</span>
                  <Icon
                    v-if="resource.href"
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

          <!-- Mobile menu button -->
          <button
            type="button"
            class="lg:hidden p-2"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <div class="space-y-1.5">
              <span
                class="bg-primary-600 block h-0.5 transition-all duration-300"
                :class="isMobileMenuOpen ? 'w-2' : 'w-6'"
              />
              <span
                class="bg-primary-600 block h-0.5 transition-all duration-300"
                :class="isMobileMenuOpen ? 'w-6' : 'w-6'"
              />
              <span
                class="bg-primary-600 block h-0.5 transition-all duration-300"
                :class="isMobileMenuOpen ? 'w-4' : 'w-6'"
              />
            </div>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div v-if="isMobileMenuOpen" class="mt-2 rounded-2xl border bg-white p-4 shadow-xl dark:bg-muted-950 dark:border-muted-700">
        <div class="space-y-2">
          <NuxtLink
            v-for="item in menu"
            :key="item.label"
            :to="item.to"
            class="block px-3 py-2 text-sm font-medium text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-muted-50 dark:hover:bg-muted-800 rounded-md transition-colors"
          >
            {{ item.label }}
          </NuxtLink>
          <!-- Language Selector (Mobile) -->
          <div class="pt-2 border-t border-muted-200 dark:border-muted-700">
            <button
              type="button"
              class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-muted-50 dark:hover:bg-muted-800 rounded-md transition-colors w-full justify-start"
              @click="open(SnapLinkPanelLanguage)"
            >
              <img
                class="size-5 rounded-full"
                :src="getLocaleFlag(currentLocale)"
                alt="flag icon"
              >
              <span>{{ currentLocale }}</span>
            </button>
          </div>

          <!-- Auth Buttons (Mobile) -->
          <div v-if="!isAuthenticated" class="pt-2 border-t border-muted-200 dark:border-muted-700">
            <div class="flex flex-col space-y-2">
              <BaseButton size="sm" variant="ghost" to="/auth/login" class="justify-start">
                Login
              </BaseButton>
              <BaseButton size="sm" variant="primary" to="/auth/register" class="justify-start">
                Register
              </BaseButton>
            </div>
          </div>
          
          <!-- User Menu (Mobile) -->
          <div v-else class="pt-2 border-t border-muted-200 dark:border-muted-700">
            <div class="flex flex-col space-y-2">
              <NuxtLink to="/dashboard" class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-muted-50 dark:hover:bg-muted-800 rounded-md transition-colors">
                <BaseAvatar size="xs" :src="userAvatar" />
                <span>{{ userDisplayName }}</span>
              </NuxtLink>
              <BaseButton size="sm" variant="ghost" @click="handleLogout" class="justify-start">
                <Icon name="ph:sign-out" class="size-4" />
                <span>Logout</span>
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="pt-20">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-muted-50 dark:bg-muted-800 border-t border-muted-200 dark:border-muted-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Brand -->
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center space-x-2 mb-4">
              <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Icon name="solar:link-linear" class="w-5 h-5 text-white" />
              </div>
              <span class="text-xl font-bold text-muted-900 dark:text-muted-100">SnapLink</span>
            </div>
            <p class="text-muted-600 dark:text-muted-400 mb-4 max-w-md">
              {{ t.footer.description }}
            </p>
            <div class="flex space-x-4">
              <BaseButton size="sm" variant="ghost">
                <Icon name="lucide:twitter" class="w-4 h-4" />
              </BaseButton>
              <BaseButton size="sm" variant="ghost">
                <Icon name="lucide:github" class="w-4 h-4" />
              </BaseButton>
              <BaseButton size="sm" variant="ghost">
                <Icon name="lucide:linkedin" class="w-4 h-4" />
              </BaseButton>
            </div>
          </div>

          <!-- Product -->
          <div>
            <h3 class="text-sm font-semibold text-muted-900 dark:text-muted-100 mb-4">
              {{ t.footer.product }}
            </h3>
            <ul class="space-y-2">
              <li>
                <NuxtLink to="/features" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {{ t.footer.features }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/pricing" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {{ t.footer.pricing }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/api" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {{ t.footer.api }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/integrations" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {{ t.footer.integrations }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Company -->
          <div>
            <h3 class="text-sm font-semibold text-muted-900 dark:text-muted-100 mb-4">
              {{ t.footer.company }}
            </h3>
            <ul class="space-y-2">
              <li>
                <NuxtLink to="/about" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {{ t.footer.about }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/blog" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {{ t.footer.blog }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/careers" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {{ t.footer.careers }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/contact" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {{ t.footer.contact }}
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom -->
        <div class="mt-8 pt-8 border-t border-muted-200 dark:border-muted-700">
          <div class="flex flex-col md:flex-row justify-between items-center">
            <p class="text-sm text-muted-600 dark:text-muted-400">
              {{ t.footer.copyright }}
            </p>
            <div class="flex space-x-6 mt-4 md:mt-0">
              <NuxtLink to="/privacy" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                {{ t.footer.privacy }}
              </NuxtLink>
              <NuxtLink to="/terms" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                {{ t.footer.terms }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>