<script setup lang="ts">
import { nextTick, ref } from 'vue'
import CreateLinkWizard from '~/components/url-shortener/CreateLinkWizard.vue'

definePageMeta({
  title: 'SnapLink – The Link Operating System for Modern Teams',
  layout: 'landing',
})

const { isAuthenticated } = useAuth()
const toaster = useNuiToasts()

const quickLinkUrl = ref('')
const showCreateLinkWizard = ref(false)
const createLinkWizardRef = ref<InstanceType<typeof CreateLinkWizard> | null>(null)

const featureCards = [
  {
    title: 'Smart URLs',
    description: 'Brand, reroute, expire, and ship QR codes instantly.',
    icon: 'solar:link-square-linear',
  },
  {
    title: 'Collections',
    description: 'Group campaigns, run bulk actions, and launch quick reports.',
    icon: 'solar:folder-with-files-linear',
  },
  {
    title: 'Payments',
    description: 'Collect with PaymentLink, card or crypto, plus live alerts.',
    icon: 'solar:wallet-linear',
  },
  {
    title: 'Profiles & Surveys',
    description: 'BioLink and SurveyLink ready to publish with branding.',
    icon: 'solar:user-id-linear',
  },
]

const workflowSteps = [
  {
    step: '01',
    title: 'Drop a link',
    description: 'Paste a URL or import many at once.',
  },
  {
    step: '02',
    title: 'Pick the rules',
    description: 'Visibility, domains, passwords, expiries—no code needed.',
  },
  {
    step: '03',
    title: 'Ship everywhere',
    description: 'Share, generate QR, embed, or trigger webhooks.',
  },
  {
    step: '04',
    title: 'Track & react',
    description: 'Realtime dashboards and alerts keep the team in sync.',
  },
]

const liveTiles = [
  {
    title: 'Realtime clicks',
    value: '+3,482',
    detail: 'Past 24h across links, surveys, and bios.',
  },
  {
    title: 'Revenue today',
    value: '$12.6K',
    detail: 'PaymentLink settlements across teams.',
  },
  {
    title: 'Active guardrails',
    value: '27',
    detail: 'Usage alerts, balance limits, webhook pings.',
  },
]

const automationHighlights = [
  {
    icon: 'solar:code-square-linear',
    title: 'REST + webhooks',
    description: 'Anything you click in the app is exposed via API.',
  },
  {
    icon: 'solar:terminal-linear',
    title: 'CLI ready',
    description: 'TypeScript SDK and examples ship with the stack.',
  },
  {
    icon: 'solar:lock-keyhole-linear',
    title: 'Secure by default',
    description: 'OAuth2, TOTP, and workspace roles baked in.',
  },
]

const pricing = {
  price: '$0.009',
  unit: 'per resolved click',
  promise: 'First 1,000 clicks on every link are free. No monthly minimum.',
  features: [
    'Unlimited URL, Survey, Bio, Quiz, and Payment links',
    'Realtime analytics, filters, and CSV export',
    'Collections with bulk edits and quick reporting',
    'Usage alerts, balance guardrails, and auto top-up',
  ],
  boosts: [
    'Volume pricing after 1M monthly clicks',
    '1% PaymentLink crypto fee (waived above $250k)',
    'Webhook events for billing and usage spikes',
  ],
  crypto: ['USDC', 'USDT', 'ETH', 'BTC'],
}

const testimonials = [
  {
    quote: 'We moved campaigns in the same night we installed SnapLink.',
    author: 'Ava Rahimi',
    role: 'Growth · NovaPay',
  },
  {
    quote: 'Collections plus guardrails keep our launches tight and calm.',
    author: 'Liam Chen',
    role: 'Ops · Loop Studios',
  },
]

const handleQuickCreate = async () => {
  const trimmed = quickLinkUrl.value.trim()

  if (!trimmed) {
    toaster.add({
      title: 'Enter a URL',
      description: 'Paste a link to launch the creation wizard.',
      icon: 'solar:link-broken-linear',
      color: 'warning',
      progress: true,
    })
    return
  }

  try {
    new URL(trimmed)
  } catch (error) {
    toaster.add({
      title: 'Invalid URL',
      description: 'Please enter a valid address (https://example.com).',
      icon: 'solar:danger-triangle-linear',
      color: 'danger',
      progress: true,
    })
    return
  }

  if (!isAuthenticated.value) {
    toaster.add({
      title: 'Sign in to continue',
      description: 'Create an account or log in to generate short links instantly.',
      icon: 'solar:lock-keyhole-linear',
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
  <div class="space-y-20 pb-24">
    <!-- Hero -->
    <section class="relative overflow-hidden bg-muted-50 dark:bg-muted-950">
      <div class="absolute inset-0 pointer-events-none">
        <Icon name="solar:infinity-linear" class="absolute bottom-[-140px] start-[-120px] h-[260px] w-[260px] rotate-12 text-muted-200/50 dark:text-muted-800/30" />
      </div>
      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div class="grid gap-12 lg:grid-cols-[1fr_420px] items-start">
          <div class="space-y-6">
            <BaseTag rounded="full" size="sm" class="bg-primary-100 text-primary-600 inline-flex items-center gap-2">
              <Icon name="solar:stars-minimalistic-linear" class="size-4" />
              SnapLink Workspace
            </BaseTag>
            <div class="space-y-3">
              <h1 class="text-4xl sm:text-5xl font-bold leading-tight text-muted-900 dark:text-muted-100">
                Ship smarter links in one place.
              </h1>
              <p class="text-lg text-muted-600 dark:text-muted-300 max-w-xl">
                Short links, surveys, bios, payments, and collections share the same dashboard, analytics, and alerts.
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <BaseChip rounded="full" size="sm" class="bg-primary-100 text-primary-600">
                <Icon name="solar:api-linear" class="size-4 me-1" />
                API first
              </BaseChip>
              <BaseChip rounded="full" size="sm" class="bg-indigo-100 text-indigo-600">
                <Icon name="solar:infinity-linear" class="size-4 me-1" />
                Collections
              </BaseChip>
              <BaseChip rounded="full" size="sm" class="bg-emerald-100 text-emerald-600">
                <Icon name="solar:wallet-linear" class="size-4 me-1" />
                Crypto ready
              </BaseChip>
            </div>
            <p class="text-sm text-muted-500 dark:text-muted-300 max-w-xl">
              Every action mirrors the API. First 1,000 clicks per link remain free with full analytics.
            </p>
            <BaseCard class="bg-white dark:bg-muted-900 border border-muted-200 dark:border-muted-800 rounded-3xl px-6 py-5 shadow-sm">
              <div class="flex flex-wrap items-center gap-4">
                <BaseChip rounded="full" size="sm" class="bg-primary-100 text-primary-600">
                  <Icon name="solar:users-group-linear" class="size-4 me-1" />
                  10K+ teams live
                </BaseChip>
                <span class="text-sm text-muted-500 dark:text-muted-300">
                  Launch links tonight. Monitor clicks, revenue, and guardrails from day one.
                </span>
              </div>
            </BaseCard>
          </div>

          <BaseCard class="relative bg-white dark:bg-muted-900 border border-muted-200 dark:border-muted-800 rounded-3xl p-8 shadow-xl">
            <div class="space-y-3 mb-6">
              <BaseTag rounded="full" size="sm" class="bg-primary-100 text-primary-600 w-fit">
                Quick create
              </BaseTag>
              <h2 class="text-2xl font-semibold text-muted-900 dark:text-white">
                Paste a link. Deploy in seconds.
              </h2>
            </div>
            <form class="space-y-4" @submit.prevent="handleQuickCreate">
              <div class="relative">
                <Icon name="solar:link-linear" class="absolute top-1/2 -translate-y-1/2 start-5 size-6 text-muted-400" />
                <input
                  v-model="quickLinkUrl"
                  type="url"
                  placeholder="https://your-next-launch.com"
                  class="w-full rounded-2xl border border-muted-200 dark:border-muted-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-200/50 dark:focus:ring-primary-500/30 ps-14 pe-4 py-4 text-base placeholder:text-muted-400 dark:placeholder:text-muted-500 transition"
                >
              </div>
              <BaseButton type="submit" size="lg" variant="primary" class="w-full justify-center shadow-lg shadow-primary-500/20">
                <Icon name="solar:flash-linear" class="size-5 me-2" />
                Shorten now
              </BaseButton>
            </form>
            <div class="mt-6 space-y-3 text-sm text-muted-500">
              <div class="flex items-start gap-2">
                <Icon name="solar:api-linear" class="size-5 text-primary-500" />
                <span>Wizard mirrors the same settings available through REST.</span>
              </div>
              <div class="flex items-start gap-2">
                <Icon name="solar:shield-check-linear" class="size-5 text-primary-500" />
                <span>TOTP-secured sessions keep workspace data private.</span>
              </div>
              <div class="flex items-start gap-2">
                <Icon name="solar:card-linear" class="size-5 text-primary-500" />
                <span>Pay as you go with card or crypto auto top-up.</span>
              </div>
            </div>
            <p class="mt-5 text-xs font-medium text-primary-500">
              Free tier covers 1,000 tracked clicks per link.
            </p>
          </BaseCard>
        </div>
      </div>
    </section>

    <!-- Core features -->
    <section>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <BaseTag rounded="full" size="sm" class="bg-muted-100 text-muted-600 dark:bg-muted-900 dark:text-muted-300">
              What you get
            </BaseTag>
            <h2 class="mt-3 text-3xl font-bold text-muted-900 dark:text-muted-100">
              One toolkit for every link-driven launch.
            </h2>
          </div>
          <p class="max-w-md text-sm text-muted-600 dark:text-muted-400">
            Each module lands with the same analytics, guardrails, and billing controls.
          </p>
        </div>
        <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <BaseCard
            v-for="feature in featureCards"
            :key="feature.title"
            class="rounded-3xl border border-muted-200 dark:border-muted-800 bg-white dark:bg-muted-900 p-6 shadow-sm hover:-translate-y-1 transition"
          >
            <div class="rounded-2xl bg-primary-100 dark:bg-primary-900/30 w-fit p-3 mb-4">
              <Icon :name="feature.icon" class="size-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 class="text-lg font-semibold text-muted-900 dark:text-white mb-2">{{ feature.title }}</h3>
            <p class="text-sm text-muted-600 dark:text-muted-400">{{ feature.description }}</p>
          </BaseCard>
        </div>
      </div>
    </section>

    <!-- Workflow -->
    <section class="bg-muted-50 dark:bg-muted-950 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <BaseTag rounded="full" size="sm" class="bg-indigo-100 text-indigo-600">
              How it flows
            </BaseTag>
            <h2 class="mt-3 text-3xl font-bold text-muted-900 dark:text-muted-100">
              From link idea to live campaign in four moves.
            </h2>
          </div>
          <p class="max-w-sm text-sm text-muted-600 dark:text-muted-400">
            Wizards guide each team while keeping guardrails tight.
          </p>
        </div>
        <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <BaseCard
            v-for="step in workflowSteps"
            :key="step.title"
            class="rounded-2xl border border-muted-200 dark:border-muted-800 bg-white dark:bg-muted-900 p-6 flex flex-col gap-3"
          >
            <BaseTag rounded="full" size="sm" class="w-fit bg-muted-100 dark:bg-muted-800 text-muted-600 dark:text-muted-300">
              {{ step.step }}
            </BaseTag>
            <h3 class="text-lg font-semibold text-muted-900 dark:text-white">{{ step.title }}</h3>
            <p class="text-sm text-muted-600 dark:text-muted-400">{{ step.description }}</p>
          </BaseCard>
        </div>
      </div>
    </section>

    <!-- Live snapshot -->
    <section>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 lg:grid-cols-[420px_1fr] items-start">
        <BaseCard class="rounded-3xl border border-muted-200 dark:border-muted-800 bg-white dark:bg-muted-900 p-8 space-y-4">
          <BaseTag rounded="full" size="sm" class="bg-emerald-100 text-emerald-600 w-fit">
            Live snapshot
          </BaseTag>
          <h2 class="text-2xl font-semibold text-muted-900 dark:text-white">
            Dashboards update with every click.
          </h2>
          <p class="text-sm text-muted-600 dark:text-muted-400">
            Watch campaigns move, share instant reports, and relax knowing guardrails are armed.
          </p>
          <div class="space-y-3 text-sm text-muted-500 dark:text-muted-300">
            <div class="flex items-start gap-2">
              <Icon name="solar:chart-square-linear" class="size-5 text-primary-500" />
              <span>Clicks, sources, devices, and revenue stream in without refresh.</span>
            </div>
            <div class="flex items-start gap-2">
              <Icon name="solar:bell-linear" class="size-5 text-primary-500" />
              <span>Low balance, anomaly, and webhook alerts keep ops in sync.</span>
            </div>
            <div class="flex items-start gap-2">
              <Icon name="solar:folder-linear" class="size-5 text-primary-500" />
              <span>Collections push summaries straight into reports and exports.</span>
            </div>
          </div>
        </BaseCard>
        <div class="grid gap-6 sm:grid-cols-2">
          <BaseCard
            v-for="tile in liveTiles"
            :key="tile.title"
            class="rounded-3xl border border-muted-200 dark:border-muted-800 bg-white dark:bg-muted-900 p-6"
          >
            <p class="text-xs uppercase tracking-wide text-muted-500 dark:text-muted-400 mb-2">{{ tile.title }}</p>
            <p class="text-3xl font-semibold text-muted-900 dark:text-white">{{ tile.value }}</p>
            <p class="mt-3 text-sm text-muted-600 dark:text-muted-400">{{ tile.detail }}</p>
          </BaseCard>
        </div>
      </div>
    </section>

    <!-- Automation & API -->
    <section class="bg-muted-50 dark:bg-muted-950 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 lg:grid-cols-[1fr_360px] items-start">
        <div class="space-y-6">
          <BaseTag rounded="full" size="sm" class="bg-primary-100 text-primary-600 w-fit">
            Automation & API
          </BaseTag>
          <h2 class="text-3xl font-bold text-muted-900 dark:text-muted-100">
            Build your own flows without leaving SnapLink.
          </h2>
          <p class="text-sm text-muted-600 dark:text-muted-400 max-w-xl">
            Ship scripts, integrate billing, or trigger custom journeys using the same endpoints the product uses internally.
          </p>
          <div class="grid gap-4 md:grid-cols-3">
            <BaseCard
              v-for="note in automationHighlights"
              :key="note.title"
              class="rounded-2xl border border-muted-200 dark:border-muted-800 bg-white dark:bg-muted-900 p-6"
            >
              <div class="rounded-2xl bg-primary-100 dark:bg-primary-900/30 w-fit p-3 mb-4">
                <Icon :name="note.icon" class="size-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 class="text-lg font-semibold text-muted-900 dark:text-white mb-2">{{ note.title }}</h3>
              <p class="text-sm text-muted-600 dark:text-muted-400">{{ note.description }}</p>
            </BaseCard>
          </div>
        </div>
        <BaseCard class="rounded-3xl border border-primary-100 dark:border-primary-900/30 bg-white dark:bg-muted-900 p-8 space-y-4 shadow-sm">
          <BaseTag rounded="full" size="sm" class="bg-primary-50 text-primary-600">
            Sample request
          </BaseTag>
          <pre class="bg-muted-100 dark:bg-muted-950 rounded-2xl p-4 text-xs text-muted-700 dark:text-muted-200 overflow-x-auto">
POST /api/links
{
  "url": "https://snap.link/demo",
  "domain": "snap.ly",
  "collection": "launch",
  "expiresAt": null
}
          </pre>
          <p class="text-xs text-muted-500 dark:text-muted-400">
            The same body powers the wizard and bulk importer.
          </p>
        </BaseCard>
      </div>
    </section>

    <!-- Pricing -->
    <section>
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="rounded-3xl bg-gradient-to-br from-muted-900 via-muted-800 to-primary-900 text-white p-10 md:p-14 shadow-2xl">
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12">
            <div class="max-w-xl space-y-6">
              <BaseTag rounded="full" size="sm" class="bg-white/20 text-white/90">
                Pay As You Go · Crypto Ready
              </BaseTag>
              <h2 class="text-3xl md:text-4xl font-bold leading-tight">
                Pay per click. Top up with card or crypto.
              </h2>
              <p class="text-white/70 text-base md:text-lg">
                Start free, then $0.009 for each resolved click with usage alerts baked in.
              </p>
              <div class="flex flex-wrap items-center gap-4">
                <BaseButton size="lg" variant="white" class="text-primary-700" to="/auth/register">
                  Get Started Free
                </BaseButton>
                <BaseButton size="lg" variant="outline" class="border-white text-white" to="/contact">
                  Talk to Sales
                </BaseButton>
              </div>
            </div>
            <div class="flex-1 bg-white/10 backdrop-blur rounded-3xl border border-white/15 p-8 space-y-6">
              <div class="flex items-end gap-4">
                <span class="text-5xl font-bold text-white">{{ pricing.price }}</span>
                <span class="text-white/70">{{ pricing.unit }}</span>
              </div>
              <p class="text-sm text-emerald-200">{{ pricing.promise }}</p>
              <ul class="space-y-3 text-sm text-white/85">
                <li v-for="feature in pricing.features" :key="feature" class="flex items-start gap-3">
                  <Icon name="solar:check-read-linear" class="size-5 text-emerald-300 mt-0.5" />
                  <span>{{ feature }}</span>
                </li>
              </ul>
              <div class="border-t border-white/15 pt-6 space-y-4">
                <p class="text-sm font-semibold text-white/85">Usage boosts</p>
                <ul class="space-y-2 text-sm text-white/70">
                  <li v-for="boost in pricing.boosts" :key="boost" class="flex items-start gap-2">
                    <Icon name="solar:activity-linear" class="size-4 mt-1 text-primary-200" />
                    <span>{{ boost }}</span>
                  </li>
                </ul>
                <div>
                  <p class="text-sm font-semibold text-white/85 mb-2">Crypto accepted</p>
                  <div class="flex flex-wrap gap-2">
                    <BaseChip
                      v-for="token in pricing.crypto"
                      :key="token"
                      rounded="full"
                      size="sm"
                      class="bg-white/15 text-white"
                    >
                      <Icon name="solar:wallet-linear" class="size-4 me-1" />
                      {{ token }}
                    </BaseChip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section>
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid gap-6 md:grid-cols-2">
          <BaseCard
            v-for="testimonial in testimonials"
            :key="testimonial.author"
            class="rounded-3xl border border-muted-200 dark:border-muted-800 bg-white dark:bg-muted-900 p-8 shadow-xl"
          >
            <Icon name="solar:quotes-linear" class="size-8 text-primary-500 mb-4" />
            <p class="text-lg text-muted-700 dark:text-muted-200 mb-6">“{{ testimonial.quote }}”</p>
            <div>
              <p class="font-semibold text-muted-900 dark:text-white">{{ testimonial.author }}</p>
              <p class="text-sm text-muted-500 dark:text-muted-400">{{ testimonial.role }}</p>
            </div>
          </BaseCard>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section>
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="rounded-3xl border border-primary-200 dark:border-primary-900/40 bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-primary-900/40 dark:via-muted-950 dark:to-primary-900/20 p-10 md:p-14 text-center space-y-6">
          <BaseTag rounded="full" size="sm" class="bg-primary-100 text-primary-600">
            Ready when you are
          </BaseTag>
          <h2 class="text-3xl md:text-4xl font-bold text-muted-900 dark:text-white">
            Drop your next link and let guardrails handle the rest.
          </h2>
          <p class="text-muted-600 dark:text-muted-300 text-base md:text-lg max-w-3xl mx-auto">
            Join 10K+ teams using SnapLink for links, surveys, bios, and payments in one place.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <BaseButton size="lg" variant="primary" to="/auth/register">
              Create Free Account
            </BaseButton>
            <BaseButton size="lg" variant="outline" to="/auth/login">
              Login and Build
            </BaseButton>
          </div>
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