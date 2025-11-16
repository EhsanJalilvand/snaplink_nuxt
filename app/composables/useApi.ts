import { useRuntimeConfig, useNuiToasts } from '#imports'
import type { FetchError, FetchOptions } from 'ofetch'
import { $fetch } from 'ofetch'
import { useAuth } from './useAuth'

export type ApiBase = 'gateway' | 'internal'

export interface ApiRequestOptions<TResponse, TBody = unknown> extends Omit<FetchOptions<'json'>, 'body' | 'baseURL'> {
  path: string
  base?: ApiBase
  requiresAuth?: boolean
  body?: TBody
  timeout?: number
  retry?: number
  validate?: (data: unknown) => data is TResponse
  quiet?: boolean
}

export interface ApiErrorContext {
  statusCode?: number
  statusMessage?: string
  data?: unknown
  path: string
  base: ApiBase
}

const DEFAULT_TIMEOUT = 7000
const DEFAULT_RETRY = 0
type FetchBody = FetchOptions<'json'>['body']

export function sanitizePath(path: string): string {
  const trimmed = path.trim()

  if (!trimmed) {
    throw new Error('[useApi] Request path is required')
  }

  if (/^[a-z]+:\/\//i.test(trimmed)) {
    throw new Error('[useApi] Absolute URLs are not allowed in useApi')
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function buildUrl(baseUrl: string, path: string): string {
  // If baseUrl is absolute (starts with http:// or https://), use it directly
  if (/^https?:\/\//i.test(baseUrl)) {
    const base = baseUrl.replace(/\/$/, '')
    const target = sanitizePath(path)
    return `${base}${target}`
  }
  
  // For relative URLs, combine them
  const base = baseUrl.replace(/\/$/, '')
  const target = sanitizePath(path)
  return `${base}${target}`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const { refreshAccessToken } = useAuth()
  const toasts = useNuiToasts()
  const activeRequests = useState<number>('snaplink:api-active-requests', () => 0)

  const incrementActiveRequests = () => {
    activeRequests.value += 1
  }

  const decrementActiveRequests = () => {
    activeRequests.value = Math.max(0, activeRequests.value - 1)
  }

  const getBaseUrl = (base: ApiBase): string => {
    if (base === 'internal') {
      // For internal, try public first (client-side), then private (server-side)
      const internalBase = import.meta.client
        ? (config.public as Record<string, any>).apiInternalBaseUrl
        : ((config.public as Record<string, any>).apiInternalBaseUrl ?? (config as Record<string, any>).apiInternalBaseUrl)
      return typeof internalBase === 'string' ? internalBase : '/api'
    }

    // For gateway, use Nuxt server proxy route (which handles authentication)
    // This ensures authentication is handled server-side with cookies
    return '/api/gateway'
  }

  const getAuthHeaders = async (requiresAuth: boolean): Promise<Record<string, string>> => {
    // Authentication is now handled server-side via /api/gateway proxy
    // Cookies are automatically sent with credentials: 'include'
    return {}
  }

  const handleError = (error: unknown, context: ApiErrorContext, quiet?: boolean): never => {
    if (!quiet) {
      const message =
        (error as FetchError)?.data?.message ??
        (error as FetchError)?.statusMessage ??
        (error as Error)?.message ??
        'Unexpected error occurred'

      toasts.add({
        title: 'Request failed',
        description: message,
        icon: 'ph:warning-circle',
      })
    }

    if (import.meta.dev) {
      console.error('[useApi] Request failed', {
        ...context,
        error,
      })
    }

    throw error instanceof Error ? error : new Error('Request failed')
  }

  const request = async <TResponse, TBody = unknown>(options: ApiRequestOptions<TResponse, TBody>): Promise<TResponse> => {
    const {
      path,
      base = 'gateway',
      requiresAuth = true,
      body,
      timeout = DEFAULT_TIMEOUT,
      retry = DEFAULT_RETRY,
      validate,
      quiet,
      ...fetchOptions
    } = options

    const baseUrl = getBaseUrl(base)
    const targetUrl = buildUrl(baseUrl, path)
    const headers = {
      ...(fetchOptions.headers as Record<string, string> | undefined),
      ...(await getAuthHeaders(requiresAuth)),
    }
    const normalizedBody: FetchBody | undefined = body as FetchBody | undefined

    let attempt = 0
    let lastError: unknown

    incrementActiveRequests()

    try {
      while (attempt <= retry) {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined
        const abortTimer = controller ? setTimeout(() => controller.abort(), timeout) : undefined

        try {
          const requestOptions: FetchOptions<'json'> = {
            ...fetchOptions,
            method: fetchOptions.method || (body ? 'POST' : 'GET'),
            credentials: requiresAuth ? 'include' : fetchOptions.credentials,
            headers,
            body: normalizedBody,
          }

          if (controller) {
            requestOptions.signal = controller.signal
          }

          const response = await $fetch<TResponse>(targetUrl, requestOptions)

          if (validate && !validate(response as unknown)) {
            throw new Error('Response validation failed')
          }

          return response
        } catch (error: any) {
          lastError = error

          if (error?.status === 401 && requiresAuth && import.meta.client) {
            const refreshed = await refreshAccessToken().catch(() => false)
            if (refreshed) {
              attempt += 1
              await delay(300)
              continue
            }
          }

          if (controller?.signal.aborted) {
            lastError = new Error('Request timed out')
          }

          if (attempt < retry) {
            attempt += 1
            await delay(250 * attempt)
            continue
          }

          return handleError(
            lastError,
            {
              statusCode: error?.status ?? error?.statusCode,
              statusMessage: error?.statusMessage,
              data: error?.data,
              path,
              base,
            },
            quiet,
          ) as never
        } finally {
          if (abortTimer) {
            clearTimeout(abortTimer)
          }
        }
      }
    } finally {
      decrementActiveRequests()
    }

    return handleError(
      lastError,
      {
        path,
        base,
      },
      quiet,
    )
  }

  const get = <TResponse>(path: string, options?: ApiRequestOptions<TResponse>) => {
    return request<TResponse>({
      ...options,
      path,
      method: 'GET',
    })
  }

  const post = <TResponse, TBody = unknown>(path: string, body: TBody, options?: ApiRequestOptions<TResponse, TBody>) => {
    return request<TResponse, TBody>({
      ...options,
      path,
      method: 'POST',
      body,
    })
  }

  const put = <TResponse, TBody = unknown>(path: string, body: TBody, options?: ApiRequestOptions<TResponse, TBody>) => {
    return request<TResponse, TBody>({
      ...options,
      path,
      method: 'PUT',
      body,
    })
  }

  const patch = <TResponse, TBody = unknown>(path: string, body: TBody, options?: ApiRequestOptions<TResponse, TBody>) => {
    return request<TResponse, TBody>({
      ...options,
      path,
      method: 'PATCH',
      body,
    })
  }

  const destroy = <TResponse>(path: string, options?: ApiRequestOptions<TResponse>) => {
    return request<TResponse>({
      ...options,
      path,
      method: 'DELETE',
    })
  }

  return {
    request,
    get,
    post,
    put,
    patch,
    delete: destroy,
    buildUrl,
    sanitizePath,
    getBaseUrl,
  }
}

export const useApiPendingRequests = () => useState<number>('snaplink:api-active-requests', () => 0)
