import type { Ref } from 'vue'
import { computed, isRef } from '#imports'

type AllowedProtocols = Array<'http' | 'https' | 'mailto' | 'tel'>

export interface ValidateUrlOptions {
  allowRelative?: boolean
  allowedHosts?: string[]
  allowedProtocols?: AllowedProtocols
}

export interface SanitizeOptions {
  trim?: boolean
  stripHtml?: boolean
  replaceNewLines?: boolean
}

export const useSecurity = () => {
  const defaultAllowedProtocols: AllowedProtocols = ['http', 'https']

  const escapeHtml = (value: unknown): string => {
    const str = String(value ?? '')
    return str
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }

  const stripHtmlTags = (value: string): string => {
    return value.replace(/<[^>]*>/g, '')
  }

  const sanitizeInput = (value: unknown, options: SanitizeOptions = {}): string => {
    const settings = {
      trim: true,
      stripHtml: true,
      replaceNewLines: false,
      ...options,
    }

    let output = String(value ?? '')

    if (settings.stripHtml) {
      output = stripHtmlTags(output)
    }

    if (settings.trim) {
      output = output.trim()
    }

    if (settings.replaceNewLines) {
      output = output.replace(/\r?\n/g, ' ')
    }

    return output
  }

  const sanitizeHtml = (value: unknown): string => {
    return escapeHtml(value)
  }

  const validateUrl = (input: unknown, options: ValidateUrlOptions = {}): string | null => {
    const value = typeof input === 'string' ? input.trim() : ''
    if (!value) {
      return null
    }

    const {
      allowRelative = false,
      allowedHosts = [],
      allowedProtocols = defaultAllowedProtocols,
    } = options

    try {
      const url = allowRelative ? new URL(value, 'http://placeholder.local') : new URL(value)

      if (!allowRelative && !value.startsWith(`${url.protocol}//`)) {
        return null
      }

      if (!allowedProtocols.includes(url.protocol.replace(':', '') as AllowedProtocols[number])) {
        return null
      }

      if (allowedHosts.length > 0 && !allowedHosts.includes(url.hostname)) {
        return null
      }

      return allowRelative && !value.startsWith('http') ? url.pathname + url.search + url.hash : url.toString()
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useSecurity] Invalid URL provided:', { input, error })
      }
      return null
    }
  }

  const isSafeRedirect = (target: unknown, allowedHosts: string[] = []): boolean => {
    const value = typeof target === 'string' ? target.trim() : ''
    if (!value) {
      return false
    }

    const normalized = validateUrl(value, {
      allowRelative: true,
      allowedHosts,
      allowedProtocols: ['http', 'https'],
    })

    if (!normalized) {
      return false
    }

    // Relative URLs are safe by default
    if (normalized.startsWith('/')) {
      return true
    }

    try {
      const url = new URL(normalized)
      if (allowedHosts.length === 0) {
        const currentHost = process.client ? window.location.hostname : undefined
        return !currentHost || url.hostname === currentHost
      }

      return allowedHosts.includes(url.hostname)
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useSecurity] Failed to evaluate redirect safety:', { target, error })
      }
      return false
    }
  }

  const createTrustedHtml = (value: Ref<string> | string) => {
    return computed(() => sanitizeHtml(isRef(value) ? value.value : value))
  }

  return {
    sanitizeInput,
    sanitizeHtml,
    escapeHtml,
    stripHtmlTags,
    validateUrl,
    isSafeRedirect,
    createTrustedHtml,
  }
}
