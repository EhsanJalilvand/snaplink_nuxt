import { computed, watch } from '#imports'
import { useAppLocale } from './useLocale'

/**
 * RTL (Right-to-Left) languages
 */
const RTL_LANGUAGES = ['fa', 'ar', 'he', 'ur', 'yi'] as const

/**
 * Composable to manage application direction (LTR/RTL) based on locale
 * Uses useHead to set dir and lang attributes on html element
 */
export const useAppDirection = () => {
  const locale = useAppLocale()
  
  /**
   * Check if current locale is RTL
   */
  const isRTL = computed(() => {
    return RTL_LANGUAGES.includes(locale.value as typeof RTL_LANGUAGES[number])
  })
  
  /**
   * Get direction for current locale
   */
  const direction = computed<'ltr' | 'rtl'>(() => {
    return isRTL.value ? 'rtl' : 'ltr'
  })
  
  /**
   * Use useHead to set dir and lang attributes on html element
   * This works for both SSR and client-side
   */
  useHead({
    htmlAttrs: {
      dir: direction,
      lang: locale,
    },
  })
  
  return {
    isRTL,
    direction,
  }
}

