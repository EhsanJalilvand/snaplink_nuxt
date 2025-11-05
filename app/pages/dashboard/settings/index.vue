<script setup lang="ts">
definePageMeta({
  title: 'Account Settings',
  layout: 'dashboard',
})

// Use shared user data composable for consistent state across all components
const { user } = useUserData()

// 2FA status
const twoFactorEnabled = ref(false)
const isTwoFactorLoading = ref(true)

// Fetch 2FA status
const fetchTwoFactorStatus = async () => {
  isTwoFactorLoading.value = true
  try {
    const response = await $fetch('/api/auth/two-factor/status')
    if (response.success) {
      twoFactorEnabled.value = response.enabled
    }
  } catch (error: any) {
    if (import.meta.dev) {
      console.error('[settings/index.vue] Failed to fetch 2FA status:', error)
    }
  } finally {
    isTwoFactorLoading.value = false
  }
}

// Fetch 2FA status on mount
onMounted(() => {
  fetchTwoFactorStatus()
})
</script>

<template>
  <div class="divide-muted-200 dark:divide-muted-800 space-y-20 py-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Account Settings
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Manage your account information, security settings, and preferences
        </BaseParagraph>
      </div>
    </div>

    <!-- Profile Section -->
    <div class="grid gap-8 md:grid-cols-12">
      <!-- Column -->
      <div class="md:col-span-4">
        <BaseHeading
          as="h3"
          size="md"
          weight="medium"
          class="text-muted-800 dark:text-muted-100 mb-1"
        >
          Profile
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Update your personal information and profile details
        </BaseParagraph>
      </div>
      <!-- Column -->
      <div class="md:col-span-8">
        <!-- Profile Picture -->
        <div class="mb-6 px-4">
          <BaseHeading
            as="h3"
            size="xs"
            weight="medium"
            class="text-muted-800 dark:text-muted-100 mb-4"
          >
            Profile Picture
          </BaseHeading>
          <div class="flex items-center gap-4">
            <div class="relative size-20">
              <img
                v-if="user?.avatar"
                :src="user.avatar"
                alt="Profile picture"
                class="size-20 rounded-full object-cover object-center border-4 border-muted-200 dark:border-muted-800"
              >
              <div
                v-else
                class="size-20 rounded-full bg-muted-200 dark:bg-muted-700/60 border-4 border-muted-200 dark:border-muted-800 flex items-center justify-center"
              >
                <Icon name="ph:user-duotone" class="size-10 text-muted-400" />
              </div>
            </div>
            <div>
              <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-400">
                Your profile picture
              </BaseParagraph>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-500">
                Edit in profile settings
              </BaseParagraph>
            </div>
          </div>
        </div>

        <BaseHeading
          as="h3"
          size="xs"
          weight="medium"
          class="border-muted-200 dark:border-muted-800 text-muted-800 dark:text-muted-100 border-b px-4 pb-4"
        >
          Your info
        </BaseHeading>
        <div
          class="divide-muted-200 dark:divide-muted-800 flex flex-col divide-y"
        >
          <!-- Item -->
          <div class="group">
            <NuxtLink
              to="/dashboard/settings/profile"
              class="font-heading text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-800 flex items-center gap-4 p-4 text-sm transition-colors duration-300"
            >
              <div class="flex-1">
                <BaseHeading
                  as="h3"
                  size="xs"
                  weight="medium"
                  class="text-muted-400"
                >
                  Name
                </BaseHeading>
                <BaseText size="sm">
                  {{ user?.firstName || '' }} {{ user?.lastName || '' }}
                </BaseText>
              </div>
              <Icon name="solar:pen-2-linear" class="ms-auto size-4" />
              <BaseText
                size="xs"
                weight="semibold"
                class="text-primary-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              >
                Edit
              </BaseText>
            </NuxtLink>
          </div>
          <!-- Item -->
          <div class="group">
            <div
              class="font-heading text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-800 flex items-center gap-4 p-4 text-sm transition-colors duration-300"
            >
              <div class="flex-1">
                <BaseHeading
                  as="h3"
                  size="xs"
                  weight="medium"
                  class="text-muted-400"
                >
                  Email address
                </BaseHeading>
                <BaseText size="sm">{{ user?.email || 'Not set' }}</BaseText>
              </div>
              <Icon 
                v-if="user?.emailVerified" 
                name="ph:check-circle-fill" 
                class="size-4 text-success-600 dark:text-success-500 ms-auto" 
              />
              <Icon 
                v-else
                name="solar:pen-2-linear" 
                class="ms-auto size-4" 
              />
              <BaseText
                size="xs"
                weight="semibold"
                :class="user?.emailVerified 
                  ? 'text-muted-400 opacity-50' 
                  : 'text-primary-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100'"
              >
                Edit
              </BaseText>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Security Section -->
    <div class="grid gap-8 md:grid-cols-12">
      <!-- Column -->
      <div class="md:col-span-4">
        <BaseHeading
          as="h3"
          size="md"
          weight="medium"
          class="text-muted-800 dark:text-muted-100 mb-1"
        >
          Security
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Manage your password, two-factor authentication, and security settings
        </BaseParagraph>
      </div>
      <!-- Column -->
      <div class="md:col-span-8">
        <BaseHeading
          as="h3"
          size="xs"
          weight="medium"
          class="border-muted-200 dark:border-muted-800 text-muted-800 dark:text-muted-100 border-b px-4 pb-4"
        >
          Account security
        </BaseHeading>
        <div
          class="divide-muted-200 dark:divide-muted-800 flex flex-col divide-y"
        >
          <!-- Item -->
          <div class="group">
            <NuxtLink
              to="/dashboard/settings/security"
              class="font-heading text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-800 flex items-center gap-4 p-4 text-sm transition-colors duration-300"
            >
              <div class="flex-1">
                <BaseHeading
                  as="h3"
                  size="xs"
                  weight="medium"
                  class="text-muted-400"
                >
                  Password
                </BaseHeading>
                <BaseText size="sm">Change password</BaseText>
              </div>
              <Icon name="solar:pen-2-linear" class="ms-auto size-4" />
              <BaseText
                size="xs"
                weight="semibold"
                class="text-primary-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              >
                Edit
              </BaseText>
            </NuxtLink>
          </div>
          <!-- Item -->
          <div class="group">
            <NuxtLink
              to="/dashboard/settings/security"
              class="font-heading text-muted-600 dark:text-muted-400 hover:bg-muted-50 dark:hover:bg-muted-800 flex items-center gap-4 p-4 text-sm transition-colors duration-300"
            >
              <div class="flex-1">
                <BaseHeading
                  as="h3"
                  size="xs"
                  weight="medium"
                  class="text-muted-400"
                >
                  2 Factor Authentication
                </BaseHeading>
                <BaseText 
                  size="sm"
                  :class="!isTwoFactorLoading && twoFactorEnabled 
                    ? 'text-success-600 dark:text-success-500' 
                    : ''"
                >
                  <span v-if="isTwoFactorLoading">Loading...</span>
                  <span v-else-if="twoFactorEnabled">2FA is enabled</span>
                  <span v-else>2FA is disabled</span>
                </BaseText>
              </div>
              <Icon name="solar:pen-2-linear" class="ms-auto size-4" />
              <BaseText
                size="xs"
                weight="semibold"
                class="text-primary-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              >
                Edit
              </BaseText>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
