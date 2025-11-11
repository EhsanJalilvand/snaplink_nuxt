<script setup lang="ts">
import { definePageMeta } from '#imports'
import CreateLinkWizard from '~/components/url-shortener/CreateLinkWizard.vue'
import LandingHeroIntro from '~/components/landing/HeroIntro.vue'
import LandingHeroQuickCreateCard from '~/components/landing/HeroQuickCreateCard.vue'
import LandingModulesShowcase from '~/components/landing/ModulesShowcase.vue'
import LandingCapabilitiesGrid from '~/components/landing/CapabilitiesGrid.vue'
import LandingPricingShowcase from '~/components/landing/PricingShowcase.vue'
import LandingApiSample from '~/components/landing/ApiSample.vue'
import LandingEarlyAccessCta from '~/components/landing/EarlyAccessCta.vue'
import { useLandingHome } from '~/composables/useLandingHome'

definePageMeta({
  title: 'SnapLink',
  layout: 'landing',
})

const {
  quickLinkUrl,
  showCreateWizard,
  createLinkWizardRef,
  handleQuickCreate,
  handleWizardClose,
  handleWizardCreated,
} = useLandingHome()
</script>

<template>
  <div class="pb-24 space-y-24">
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

    <LandingModulesShowcase />

    <LandingCapabilitiesGrid />

    <LandingPricingShowcase />

    <LandingApiSample />

    <LandingEarlyAccessCta />

    <CreateLinkWizard
      ref="createLinkWizardRef"
      v-model:open="showCreateWizard"
      @close="handleWizardClose"
      @created="handleWizardCreated"
    />
  </div>
</template>