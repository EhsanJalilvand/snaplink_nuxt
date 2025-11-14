import { computed, watch } from '#imports'
import { useSecurity } from './useSecurity'

const DEFAULT_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: 'solar:chart-2-linear' },
  { id: 'geographic', label: 'Geographic Insights', icon: 'solar:map-point-linear' },
  { id: 'device', label: 'Device & Technology', icon: 'solar:smartphone-linear' },
  { id: 'referral', label: 'Referral & Source', icon: 'solar:link-linear' },
  { id: 'behavior', label: 'User Behavior', icon: 'ph:users' },
  { id: 'geodevice', label: 'Geo-Device Insights', icon: 'solar:global-linear' },
]

interface UseReportsOptions {
  sections?: Array<{ id: string; label: string; icon: string }>
}

export const useUrlShortenerReports = (options: UseReportsOptions = {}) => {
  const route = useRoute()
  const router = useRouter()
  const security = useSecurity()

  const sections = options.sections ?? DEFAULT_SECTIONS
  const defaultSection = sections[0]?.id ?? 'overview'

  const sanitizeSection = (value: string | undefined) => {
    const trimmed = security.sanitizeInput(value ?? '', { trim: true })
    return sections.some(section => section.id === trimmed) ? trimmed : defaultSection
  }

  const sanitizePeriod = (value: string | undefined) => {
    const allowed = new Set(['7d', '30d', '90d', '1y'])
    const trimmed = security.sanitizeInput(value ?? '', { trim: true })
    return allowed.has(trimmed) ? trimmed : '30d'
  }

  const sanitizeReportType = (value: string | undefined) => {
    return value === 'collections' ? 'collections' : 'links'
  }

  const period = ref(sanitizePeriod(route.query.period as string | undefined))
  const activeSection = ref(sanitizeSection(route.query.section as string | undefined))

  const reportType = computed<'links' | 'collections'>(() =>
    sanitizeReportType(route.query.type as string | undefined),
  )
  const selectedIds = computed(() => {
    const ids = (route.query.ids as string) ?? ''
    return ids
      .split(',')
      .map(id => security.sanitizeInput(id, { trim: true }))
      .filter(Boolean)
  })

  watch([period, activeSection], ([nextPeriod, nextSection]) => {
    router.replace({
      query: {
        ...route.query,
        period: nextPeriod !== '30d' ? nextPeriod : undefined,
        section: nextSection !== defaultSection ? nextSection : undefined,
      },
    })
  })

  const selectedSummary = computed(() => {
    const count = selectedIds.value.length
    if (reportType.value === 'links') {
      return `${count} link(s) selected`
    }
    return `${count} collection(s) selected`
  })

  const setSection = (sectionId: string) => {
    activeSection.value = sanitizeSection(sectionId)
  }

  const setPeriod = (value: string) => {
    period.value = sanitizePeriod(value)
  }

  const navigateBack = () => {
    router.back()
  }

  return {
    sections,
    period,
    activeSection,
    reportType,
    selectedIds,
    selectedSummary,
    setSection,
    setPeriod,
    navigateBack,
  }
}
