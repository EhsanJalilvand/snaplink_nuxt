<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Dashboard',
})

const { user, logout } = useAuth()

const handleLogout = async () => {
  await logout()
  await navigateTo('/auth/login')
}
</script>

<template>
  <div class="min-h-screen bg-muted-50 dark:bg-muted-900">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-muted-800 dark:text-muted-100">
          Welcome to Dashboard
        </h1>
        <p class="text-muted-600 dark:text-muted-400 mt-2">
          Hello, {{ user?.username || 'User' }}! You are successfully logged in.
        </p>
      </div>

      <!-- User Info Card -->
      <div class="bg-white dark:bg-muted-800 rounded-lg shadow-sm border border-muted-200 dark:border-muted-700 p-6 mb-6">
        <h2 class="text-xl font-semibold text-muted-800 dark:text-muted-100 mb-4">
          User Information
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-muted-600 dark:text-muted-400">Username</label>
            <p class="text-muted-800 dark:text-muted-100">{{ user?.username || 'N/A' }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-600 dark:text-muted-400">Email</label>
            <p class="text-muted-800 dark:text-muted-100">{{ user?.email || 'N/A' }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-600 dark:text-muted-400">First Name</label>
            <p class="text-muted-800 dark:text-muted-100">{{ user?.firstName || 'N/A' }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-600 dark:text-muted-400">Last Name</label>
            <p class="text-muted-800 dark:text-muted-100">{{ user?.lastName || 'N/A' }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-600 dark:text-muted-400">Email Verified</label>
            <p class="text-muted-800 dark:text-muted-100">
              <span :class="user?.emailVerified ? 'text-green-600' : 'text-red-600'">
                {{ user?.emailVerified ? 'Yes' : 'No' }}
              </span>
            </p>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-600 dark:text-muted-400">Roles</label>
            <p class="text-muted-800 dark:text-muted-100">{{ user?.roles?.join(', ') || 'N/A' }}</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-4">
        <BaseButton
          @click="handleLogout"
          variant="danger"
          class="px-6"
        >
          <Icon name="ph:sign-out" class="w-4 h-4 mr-2" />
          Logout
        </BaseButton>
        
        <BaseButton
          to="/auth/forgot-password"
          variant="outline"
          class="px-6"
        >
          <Icon name="ph:key" class="w-4 h-4 mr-2" />
          Change Password
        </BaseButton>
      </div>
    </div>
  </div>
</template>
