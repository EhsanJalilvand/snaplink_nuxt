<script setup lang="ts">
const isMobileMenuOpen = ref(false)

const menu = [
  {
    label: 'About',
    to: '/about',
  },
  {
    label: 'Activity',
    to: '/activity',
  },
  {
    label: 'Blog',
    to: '/blog',
  },
  {
    label: 'Terms',
    to: '/terms',
  },
]

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
]

const selectedLanguage = ref('en')
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-muted-900">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-muted-900/80 backdrop-blur-md border-b border-muted-200 dark:border-muted-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <NuxtLink to="/" class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Icon name="solar:link-linear" class="w-5 h-5 text-white" />
              </div>
              <span class="text-xl font-bold text-muted-900 dark:text-muted-100">SnapLink</span>
            </NuxtLink>
          </div>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center space-x-8">
            <NuxtLink
              v-for="item in menu"
              :key="item.label"
              :to="item.to"
              class="text-sm font-medium text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>

          <!-- Right side actions -->
          <div class="flex items-center space-x-4">
            <!-- Language Selector -->
            <BaseDropdown
              :items="languages.map(lang => ({ label: `${lang.flag} ${lang.name}`, value: lang.code }))"
              :model-value="selectedLanguage"
              @update:model-value="selectedLanguage = $event"
              size="sm"
              variant="ghost"
            >
              <template #trigger>
                <BaseButton size="sm" variant="ghost">
                  <Icon name="lucide:globe" class="w-4 h-4" />
                </BaseButton>
              </template>
            </BaseDropdown>

            <!-- Dark Mode Toggle -->
            <BaseThemeToggle />

            <!-- Auth Buttons -->
            <div class="hidden sm:flex items-center space-x-2">
              <BaseButton size="sm" variant="ghost" to="/login">
                Login
              </BaseButton>
              <BaseButton size="sm" variant="primary" to="/register">
                Register
              </BaseButton>
            </div>

            <!-- Mobile menu button -->
            <BaseButton
              size="sm"
              variant="ghost"
              class="md:hidden"
              @click="isMobileMenuOpen = !isMobileMenuOpen"
            >
              <Icon name="lucide:menu" class="w-4 h-4" />
            </BaseButton>
          </div>
        </div>

        <!-- Mobile Navigation -->
        <div v-if="isMobileMenuOpen" class="md:hidden py-4 border-t border-muted-200 dark:border-muted-700">
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
                <BaseButton size="sm" variant="ghost" to="/login" class="justify-start">
                  Login
                </BaseButton>
                <BaseButton size="sm" variant="primary" to="/register" class="justify-start">
                  Register
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main>
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
              Professional URL shortener and analytics platform. Create, track, and analyze your links with powerful insights.
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
            <h3 class="text-sm font-semibold text-muted-900 dark:text-muted-100 mb-4">Product</h3>
            <ul class="space-y-2">
              <li>
                <NuxtLink to="/features" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Features
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/pricing" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Pricing
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/api" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  API
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/integrations" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Integrations
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Company -->
          <div>
            <h3 class="text-sm font-semibold text-muted-900 dark:text-muted-100 mb-4">Company</h3>
            <ul class="space-y-2">
              <li>
                <NuxtLink to="/about" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  About
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/blog" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Blog
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/careers" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Careers
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/contact" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Contact
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom -->
        <div class="mt-8 pt-8 border-t border-muted-200 dark:border-muted-700">
          <div class="flex flex-col md:flex-row justify-between items-center">
            <p class="text-sm text-muted-600 dark:text-muted-400">
              © 2024 SnapLink. All rights reserved.
            </p>
            <div class="flex space-x-6 mt-4 md:mt-0">
              <NuxtLink to="/privacy" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Privacy Policy
              </NuxtLink>
              <NuxtLink to="/terms" class="text-sm text-muted-600 dark:text-muted-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Terms of Service
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
