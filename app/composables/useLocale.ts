import { watch } from '#imports'

const LOCALE_STORAGE_KEY = 'snaplink:locale'

export function useAppLocale() {
  // Initialize from localStorage if available
  const getInitialLocale = (): string => {
    if (!import.meta.client) {
      return 'en'
    }
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
      if (stored) {
        return stored
      }
    } catch (error) {
      if (import.meta.dev) {
        console.warn('[useAppLocale] Failed to read from localStorage', error)
      }
    }
    return 'en'
  }
  
  const locale = useState<string>('app-locale', () => getInitialLocale())
  
  // Watch locale changes and persist to localStorage
  if (import.meta.client) {
    watch(locale, (newLocale) => {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
      } catch (error) {
        if (import.meta.dev) {
          console.warn('[useAppLocale] Failed to save to localStorage', error)
        }
      }
    }, { immediate: false })
    
    // Hydrate from localStorage on mount
    const stored = getInitialLocale()
    if (stored && stored !== locale.value) {
      locale.value = stored
    }
  }
  
  return locale
}
