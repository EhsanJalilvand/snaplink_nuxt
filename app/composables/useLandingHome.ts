import { nextTick, ref } from 'vue'
import { navigateTo, useAuth, useNuiToasts } from '#imports'
import { useSecurity } from './useSecurity'

type CreateLinkWizardInstance = InstanceType<
  typeof import('~/components/url-shortener/CreateLinkWizard.vue').default
>

interface ToastPayload {
  title: string
  description: string
  icon: string
  color?: string
}

const QUICK_CREATE_MESSAGES: Record<'enterUrl' | 'invalidUrl' | 'authRequired', ToastPayload> = {
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

export const useLandingHome = () => {
  const { isAuthenticated } = useAuth()
  const toasts = useNuiToasts()
  const security = useSecurity()

  const quickLinkUrl = ref('')
  const showCreateWizard = ref(false)
  const createLinkWizardRef = ref<CreateLinkWizardInstance | null>(null)

  const emitToast = (message: ToastPayload) => {
    toasts.add({
      ...message,
      description: security.escapeHtml(message.description),
      progress: true,
    })
  }

  const handleQuickCreate = async () => {
    const trimmed = security.sanitizeInput(quickLinkUrl.value, {
      trim: true,
    })

    if (!trimmed) {
      emitToast(QUICK_CREATE_MESSAGES.enterUrl)
      return
    }

    const validated = security.validateUrl(trimmed, {
      allowedProtocols: ['http', 'https'],
    })

    if (!validated) {
      emitToast(QUICK_CREATE_MESSAGES.invalidUrl)
      return
    }

    if (!isAuthenticated.value) {
      emitToast(QUICK_CREATE_MESSAGES.authRequired)
      await navigateTo({
        path: '/auth/login',
        query: {
          returnTo: '/dashboard/url-shortener/links',
        },
      })
      return
    }

    showCreateWizard.value = true
    await nextTick()
    createLinkWizardRef.value?.setOriginalUrl(validated)
  }

  const handleWizardClose = () => {
    showCreateWizard.value = false
  }

  const handleWizardCreated = () => {
    quickLinkUrl.value = ''
  }

  return {
    quickLinkUrl,
    showCreateWizard,
    createLinkWizardRef,
    handleQuickCreate,
    handleWizardClose,
    handleWizardCreated,
  }
}

