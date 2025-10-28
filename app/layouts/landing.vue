<script setup lang="ts">
import { SnapLinkPanelLanguage } from '#components'
import { getLocaleFlag } from '~/utils/locale'
import { useAppLocale } from '~/composables/useLocale'
import { useTranslations } from '~/composables/useTranslations'

const isMobileMenuOpen = ref(false)
const currentLocale = useAppLocale()
const { open } = usePanels()
const { t } = useTranslations()

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
        <div class="flex w-1/2 items-center gap-2 md:w-1/5">
          <NuxtLink to="/" class="ms-2 inline-flex" aria-label="Go to SnapLink homepage">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Icon name="solar:link-linear" class="w-5 h-5 text-white" />
              </div>
              <span class="text-xl font-bold text-primary-600 dark:text-primary-400">SnapLink</span>
            </div>
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
        <div class="flex w-1/2 items-center justify-end gap-2 md:w-1/5">
          <!-- Language Selector -->
          <button
            type="button"
          class="border-muted-200 hover:ring-muted-200 dark:hover:ring-muted-700 dark:border-muted-700 dark:bg-muted-800 dark:ring-offset-muted-900 flex size-10 items-center justify-center rounded-full border bg-white ring-1 ring-transparent transition-all duration-300 hover:ring-offset-4"
            @click="open(SnapLinkPanelLanguage)"
          >
            <img
              class="size-8 rounded-full"
              :src="getLocaleFlag(currentLocale)"
              alt="flag icon"
            >
          </button>

          <!-- Dark Mode Toggle -->
          <BaseThemeToggle aria-label="Toggle darkmode" />

          <!-- Auth Buttons -->
          <div class="hidden sm:flex items-center gap-2">
            <BaseButton size="sm" variant="ghost" to="/auth/login">
              Login
            </BaseButton>
            <BaseButton size="sm" variant="primary" to="/auth/register">
              Register
            </BaseButton>
          </div>

          <!-- User Avatar (if logged in) -->
          <NuxtLink to="/profile" class="hidden lg:flex">
            <BaseAvatar size="xs" src="/img/avatars/10.svg" />
          </NuxtLink>

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
          <div class="pt-2 border-t border-muted-200 dark:border-muted-700">
            <div class="flex flex-col space-y-2">
              <BaseButton size="sm" variant="ghost" to="/auth/login" class="justify-start">
                Login
              </BaseButton>
              <BaseButton size="sm" variant="primary" to="/auth/register" class="justify-start">
                Register
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