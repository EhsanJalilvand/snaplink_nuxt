<script setup lang="ts">
definePageMeta({
  title: 'SnapLink - Professional URL Shortener & Analytics',
  layout: 'landing',
})

// Hero section data
const heroStats = ref([
  { label: 'Links Created', value: '1M+' },
  { label: 'Clicks Tracked', value: '50M+' },
  { label: 'Active Users', value: '10K+' },
  { label: 'Countries', value: '150+' },
])

// Features data
const features = ref([
  {
    icon: 'solar:link-linear',
    title: 'URL Shortening',
    description: 'Create short, memorable links instantly with our powerful URL shortener.',
  },
  {
    icon: 'solar:chart-2-linear',
    title: 'Analytics',
    description: 'Track clicks, locations, devices, and more with detailed analytics.',
  },
  {
    icon: 'solar:shield-check-linear',
    title: 'Security',
    description: 'Advanced security features to protect your links and data.',
  },
  {
    icon: 'solar:settings-linear',
    title: 'Customization',
    description: 'Custom domains, branded links, and personalized short URLs.',
  },
  {
    icon: 'solar:api-linear',
    title: 'API Access',
    description: 'Integrate with our powerful API for seamless automation.',
  },
  {
    icon: 'solar:users-group-linear',
    title: 'Team Management',
    description: 'Collaborate with your team and manage multiple accounts.',
  },
])
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-br from-primary-50 to-blue-50 dark:from-muted-900 dark:to-muted-800 py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold text-muted-900 dark:text-muted-100 mb-6">
            Professional
            <span class="text-primary-600 dark:text-primary-400">URL Shortener</span>
            & Analytics
          </h1>
          <p class="text-xl text-muted-600 dark:text-muted-400 mb-8 max-w-3xl mx-auto">
            Create, track, and analyze your links with powerful insights. 
            Perfect for businesses, marketers, and content creators.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <BaseButton size="lg" variant="primary" to="/register">
              <Icon name="solar:add-circle-linear" class="w-5 h-5" />
              <span>Get Started Free</span>
            </BaseButton>
            <BaseButton size="lg" variant="outline" to="/demo">
              <Icon name="solar:play-circle-linear" class="w-5 h-5" />
              <span>Watch Demo</span>
            </BaseButton>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div
              v-for="stat in heroStats"
              :key="stat.label"
              class="text-center"
            >
              <div class="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {{ stat.value }}
              </div>
              <div class="text-sm text-muted-600 dark:text-muted-400">
                {{ stat.label }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-white dark:bg-muted-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold text-muted-900 dark:text-muted-100 mb-4">
            Everything you need to manage your links
          </h2>
          <p class="text-xl text-muted-600 dark:text-muted-400 max-w-2xl mx-auto">
            Powerful features designed to help you create, track, and optimize your links for maximum impact.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="bg-muted-50 dark:bg-muted-800 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4">
              <Icon :name="feature.icon" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 class="text-xl font-semibold text-muted-900 dark:text-muted-100 mb-2">
              {{ feature.title }}
            </h3>
            <p class="text-muted-600 dark:text-muted-400">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-primary-600 dark:bg-primary-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to get started?
        </h2>
        <p class="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
          Join thousands of users who trust SnapLink for their URL shortening and analytics needs.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <BaseButton size="lg" variant="secondary" to="/register">
            <span>Start Free Trial</span>
          </BaseButton>
          <BaseButton size="lg" variant="outline" class="border-white text-white hover:bg-white hover:text-primary-600" to="/contact">
            <span>Contact Sales</span>
          </BaseButton>
        </div>
      </div>
    </section>
  </div>
</template>