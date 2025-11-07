<script setup lang="ts">
import { nextTick, ref } from 'vue'
import CreateLinkWizard from '~/components/url-shortener/CreateLinkWizard.vue'
import LandingHeroIntro from '~/components/landing/HeroIntro.vue'
import LandingHeroQuickCreateCard from '~/components/landing/HeroQuickCreateCard.vue'

definePageMeta({
  title: 'SnapLink',
  layout: 'landing',
})

const { isAuthenticated } = useAuth()
const toaster = useNuiToasts()

const quickLinkUrl = ref('')
const showCreateLinkWizard = ref(false)
const createLinkWizardRef = ref<InstanceType<typeof CreateLinkWizard> | null>(null)

const toasterMessages = {
  enterUrl: {
    title: 'Enter a URL',
    description: 'Paste a link to launch the creation wizard.',
    icon: 'solar:link-broken-linear',
    color: 'warning',
  },
  invalidUrl: {
    title: 'Invalid URL',
    description: 'Please enter a valid address (https://example.com).',
    icon: 'solar:danger-triangle-linear',
    color: 'danger',
  },
  authRequired: {
    title: 'Sign in to continue',
    description: 'Create an account or log in to generate short links instantly.',
    icon: 'solar:lock-keyhole-linear',
  },
}

const handleQuickCreate = async () => {
  const trimmed = quickLinkUrl.value.trim()

  if (!trimmed) {
    toaster.add({
      ...toasterMessages.enterUrl,
      progress: true,
    })
    return
  }

  try {
    new URL(trimmed)
  } catch (error) {
    toaster.add({
      ...toasterMessages.invalidUrl,
      progress: true,
    })
    return
  }

  if (!isAuthenticated.value) {
    toaster.add({
      ...toasterMessages.authRequired,
      progress: true,
    })
    await navigateTo('/auth/login?returnTo=/dashboard/url-shortener/links')
    return
  }

  showCreateLinkWizard.value = true
  await nextTick()
  createLinkWizardRef.value?.setOriginalUrl(trimmed)
}

const handleWizardClose = () => {
  showCreateLinkWizard.value = false
}

const handleWizardCreated = () => {
  quickLinkUrl.value = ''
}
</script>

<template>
  <div class="pb-24">
    <section class="relative overflow-hidden bg-muted-50 dark:bg-muted-950">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute -top-24 -start-28 h-80 w-80 rounded-full bg-primary-200/35 blur-3xl dark:bg-primary-900/20" />
        <div class="absolute bottom-[-180px] end-[-100px] h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-900/20" />
      </div>
      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_480px] items-start">
          <LandingHeroIntro />

          <LandingHeroQuickCreateCard
            v-model="quickLinkUrl"
            @submit="handleQuickCreate"
          />
        </div>
      </div>
    </section>

    <CreateLinkWizard
      ref="createLinkWizardRef"
      v-model:open="showCreateLinkWizard"
      @close="handleWizardClose"
      @created="handleWizardCreated"
    />
  </div>
</template>