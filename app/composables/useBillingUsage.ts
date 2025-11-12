import { computed, toRefs, useState } from '#imports'
import type {
  BillingUsageMetric,
  BillingUsageModule,
  BillingUsagePayload,
  BillingUsagePeriod,
  BillingUsageResponse,
  BillingUsageSummary,
} from '~/types/billing'
import { useApi } from './useApi'

interface BillingUsageState {
  period: BillingUsagePeriod
  modules: BillingUsageModule[]
  summary: BillingUsageSummary
  isLoading: boolean
  error: string | null
}

type MeterColor = 'success' | 'warning' | 'danger'

type DecoratedMetric = BillingUsageMetric & {
  utilization: number
  meterColor: MeterColor
  utilizationLabel: string
  hasAllowance: boolean
}

type DecoratedModule = BillingUsageModule & {
  metrics: DecoratedMetric[]
  utilization: number
  utilizationState: MeterColor
}

const clampUtilization = (usage: number, included: number): number => {
  if (included <= 0) {
    return usage <= 0 ? 0 : 100
  }
  const ratio = (usage / included) * 100
  return Number(Math.min(Math.max(ratio, 0), 250).toFixed(2))
}

const computeSummary = (
  modules: BillingUsageModule[],
  currencyFallback = 'USD',
): BillingUsageSummary => {
  if (!modules.length) {
    return {
      moduleCount: 0,
      metricCount: 0,
      totalCustomerCost: 0,
      totalVendorCost: 0,
      grossMargin: 0,
      grossMarginPercent: 0,
      averageUtilization: 0,
      currency: currencyFallback,
    }
  }

  const moduleCount = modules.length
  const metricCount = modules.reduce((total, module) => total + module.metrics.length, 0)
  const totalCustomerCost = modules.reduce(
    (total, module) => total + module.cost.customerTotal,
    0,
  )
  const totalVendorCost = modules.reduce(
    (total, module) => total + module.cost.vendorTotal,
    0,
  )
  const grossMargin = totalCustomerCost - totalVendorCost
  const grossMarginPercent = totalCustomerCost === 0 ? 0 : (grossMargin / totalCustomerCost) * 100

  const utilizationSamples = modules
    .flatMap((module) => module.metrics)
    .map((metric) => clampUtilization(metric.usage, metric.included))

  const averageUtilization =
    utilizationSamples.length === 0
      ? 0
      : Number(
          (
            utilizationSamples.reduce((total, value) => total + value, 0) /
            utilizationSamples.length
          ).toFixed(2),
        )

  const distinctCurrencies = [
    ...new Set(modules.map((module) => module.cost.currency).filter(Boolean)),
  ]

  const currency =
    distinctCurrencies.length === 0
      ? currencyFallback
      : distinctCurrencies.length === 1
        ? distinctCurrencies[0]
        : 'MULTI'

  return {
    moduleCount,
    metricCount,
    totalCustomerCost: Number(totalCustomerCost.toFixed(2)),
    totalVendorCost: Number(totalVendorCost.toFixed(2)),
    grossMargin: Number(grossMargin.toFixed(2)),
    grossMarginPercent: Number(grossMarginPercent.toFixed(2)),
    averageUtilization,
    currency,
  }
}

const decorateModules = (modules: BillingUsageModule[], summaryCurrency: string): DecoratedModule[] =>
  modules.map((module) => {
    const metrics = module.metrics.map<DecoratedMetric>((metric) => {
      const utilization = clampUtilization(metric.usage, metric.included)
      const meterColor: MeterColor =
        utilization >= 120 ? 'danger' : utilization >= 90 ? 'warning' : 'success'
      const hasAllowance = metric.included > 0

      return {
        ...metric,
        utilization,
        meterColor,
        hasAllowance,
        utilizationLabel: hasAllowance
          ? `${metric.usage.toLocaleString()} / ${metric.included.toLocaleString()} ${metric.unit}`
          : `${metric.usage.toLocaleString()} ${metric.unit}`,
        currency: metric.currency || summaryCurrency,
      }
    })

    const moduleUtilization =
      metrics.length === 0
        ? 0
        : Number(
            (
              metrics.reduce((total, metric) => total + metric.utilization, 0) /
              metrics.length
            ).toFixed(2),
          )

    const utilizationState: MeterColor =
      moduleUtilization >= 120 ? 'danger' : moduleUtilization >= 90 ? 'warning' : 'success'

    return {
      ...module,
      metrics,
      utilization: moduleUtilization,
      utilizationState,
    }
  })

const EMPTY_SUMMARY: BillingUsageSummary = {
  moduleCount: 0,
  metricCount: 0,
  totalCustomerCost: 0,
  totalVendorCost: 0,
  grossMargin: 0,
  grossMarginPercent: 0,
  averageUtilization: 0,
  currency: 'USD',
}

const initialState = (): BillingUsageState => ({
  period: 'month',
  modules: [],
  summary: EMPTY_SUMMARY,
  isLoading: false,
  error: null,
})

const periodOptions = [
  { label: 'This Month', value: 'month' as BillingUsagePeriod },
  { label: 'This Week', value: 'week' as BillingUsagePeriod },
  { label: 'This Year', value: 'year' as BillingUsagePeriod },
]

export const useBillingUsage = () => {
  const api = useApi()
  const state = useState<BillingUsageState>('snaplink:billing-usage', initialState)

  const setStateFromPayload = (payload?: BillingUsagePayload | null) => {
    if (payload?.period) {
    state.value.period = payload.period
    }

    const modules = payload?.modules ?? []
    state.value.modules = modules
    state.value.summary = payload?.summary ?? computeSummary(modules, state.value.summary.currency || EMPTY_SUMMARY.currency)
    state.value.error = null
  }

  const fetchUsage = async (period: BillingUsagePeriod = state.value.period) => {
    if (state.value.isLoading) {
      return
    }

    state.value.period = period
    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await api.get<BillingUsageResponse>('/billing/usage', {
        base: 'gateway',
        validate: (payload): payload is BillingUsageResponse =>
          typeof payload === 'object' && payload !== null && 'data' in payload,
        retry: 1,
        timeout: 15_000,
        quiet: true,
        query: { period },
      })

      if (response?.data) {
        setStateFromPayload(response.data)
      } else {
        state.value.modules = []
        state.value.summary = EMPTY_SUMMARY
      }
    } catch (error) {
      state.value.error = 'Unable to load usage telemetry. Please try again.'
    } finally {
      state.value.isLoading = false
    }
  }

  const decoratedModules = computed(() => {
    const modules = state.value.modules
    const summaryCurrency = state.value.summary.currency || EMPTY_SUMMARY.currency
    return decorateModules(modules, summaryCurrency)
  })

  return {
    ...toRefs(state.value),
    periodOptions,
    usageModules: decoratedModules,
    fetchUsage,
    computeSummary,
  }
}

