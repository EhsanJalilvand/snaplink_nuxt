<script setup lang="ts">
definePageMeta({
  title: 'Account Settings',
  layout: 'dashboard',
})

// Fetch user data
const { data: userData } = useFetch('/api/auth/me', {
  key: 'user-settings-data',
  default: () => ({ success: false, user: null, isAuthenticated: false }),
})

const user = computed(() => userData.value?.user)
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
                  Email address
                </BaseHeading>
                <BaseText size="sm">{{ user?.email || 'Not set' }}</BaseText>
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
                  Username
                </BaseHeading>
                <BaseText size="sm">{{ user?.username || 'Not set' }}</BaseText>
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
                <BaseText size="sm">Setup 2FA for additional security</BaseText>
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

