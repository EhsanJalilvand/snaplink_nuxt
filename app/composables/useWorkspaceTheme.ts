import { useState } from '#imports'
import type { AppearanceSettings, AnimationSpeedOption, BorderRadiusOption, ThemeOption } from '~/types/preferences'

const DEFAULT_APPEARANCE: AppearanceSettings = {
  primaryColor: '#6366f1',
  theme: 'light',
  fontFamily: 'Inter',
  borderRadius: 'md',
  animationSpeed: 'normal',
  accentColor: '#8b5cf6',
  logoUrl: '',
  faviconUrl: '',
}

const FONT_STACKS: Record<string, string> = {
  Inter: '"Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  Roboto: '"Roboto", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  Poppins: '"Poppins", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  'Open Sans': '"Open Sans", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  IRANSansX: '"IRANSansX", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
}

const FONT_GOOGLE_NAMES: Record<string, string> = {
  Inter: 'Inter:wght@400;500;600;700',
  Roboto: 'Roboto:wght@400;500;600;700',
  Poppins: 'Poppins:wght@400;500;600;700',
  'Open Sans': 'Open+Sans:wght@400;500;600;700',
}

const loadGoogleFont = (fontFamily: string) => {
  if (!import.meta.client) {
    return
  }

  const fontName = FONT_GOOGLE_NAMES[fontFamily]
  if (!fontName) {
    return // Font not in Google Fonts or already loaded
  }

  // Check if font is already loaded (check for both font name and Google Fonts link)
  const fontNameEscaped = fontFamily.replace(/\s+/g, '+')
  const existingLink = document.querySelector(`link[href*="${fontNameEscaped}"], link[href*="${fontFamily}"]`)
  if (existingLink) {
    return
  }

  // Also check if font is already available via @nuxt/fonts (Inter might be preloaded)
  if (fontFamily === 'Inter') {
    // Inter is likely already loaded via @nuxt/fonts, but we'll still add the link if needed
    const interLink = document.querySelector('link[href*="fonts.googleapis.com"][href*="Inter"]')
    if (interLink) {
      return
    }
  }

  // Load font from Google Fonts
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${fontName}&display=swap`
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
  
  if (import.meta.dev) {
    console.log(`[useWorkspaceTheme] Loading Google Font: ${fontFamily}`)
  }
}

const RADIUS_MAP: Record<BorderRadiusOption, string> = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '14px',
}

const ANIMATION_MAP: Record<AnimationSpeedOption, string> = {
  fast: '120ms',
  normal: '200ms',
  slow: '320ms',
}

const PALETTE_STOPS: Record<string, number> = {
  '50': 0.9,
  '100': 0.75,
  '200': 0.6,
  '300': 0.45,
  '400': 0.3,
  '500': 0,
  '600': -0.1,
  '700': -0.2,
  '800': -0.35,
  '900': -0.5,
  '950': -0.65,
}

interface RGB {
  r: number
  g: number
  b: number
}

const clamp = (value: number) => Math.min(255, Math.max(0, value))

const hexToRgb = (hex: string): RGB => {
  const normalized = hex.replace('#', '')
  const bigint = parseInt(normalized.length === 3 ? normalized.repeat(2) : normalized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return { r, g, b }
}

const rgbToHex = ({ r, g, b }: RGB) => {
  const toHex = (value: number) => clamp(value).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const mixColor = (color: RGB, target: RGB, amount: number): RGB => ({
  r: Math.round(color.r + (target.r - color.r) * amount),
  g: Math.round(color.g + (target.g - color.g) * amount),
  b: Math.round(color.b + (target.b - color.b) * amount),
})

const adjustColor = (hex: string, amount: number) => {
  const color = hexToRgb(hex)
  if (amount === 0) {
    return hex
  }

  const target: RGB = amount > 0 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 }
  const adjusted = mixColor(color, target, Math.min(1, Math.abs(amount)))
  return rgbToHex(adjusted)
}

const applyThemeMode = (theme: ThemeOption) => {
  if (!import.meta.client) {
    return
  }

  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    return
  }

  if (theme === 'light') {
    root.classList.remove('dark')
    return
  }

  const prefersDark = window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
  root.classList.toggle('dark', prefersDark)
}

const applyPalette = (primary: string) => {
  if (!import.meta.client) {
    return
  }

  const root = document.documentElement
  Object.entries(PALETTE_STOPS).forEach(([stop, offset]) => {
    root.style.setProperty(`--color-primary-${stop}`, adjustColor(primary, offset))
  })
  root.style.setProperty('--color-chart-base', adjustColor(primary, -0.1))
}

const applyFont = (fontFamily: string) => {
  if (!import.meta.client) {
    return
  }

  // Load font from Google Fonts if needed
  loadGoogleFont(fontFamily)

  const stack = FONT_STACKS[fontFamily] ?? FONT_STACKS.Inter
  const root = document.documentElement
  
  // Update CSS variables for Tailwind
  root.style.setProperty('--font-sans', stack)
  root.style.setProperty('--font-heading', stack)
  
  // Apply directly to root and body for immediate effect
  root.style.fontFamily = stack
  if (document.body) {
    document.body.style.fontFamily = stack
  }
  
  // Also create/update a style tag to ensure it applies globally
  let styleTag = document.getElementById('workspace-font-style')
  if (!styleTag) {
    styleTag = document.createElement('style')
    styleTag.id = 'workspace-font-style'
    document.head.appendChild(styleTag)
  }
  
  styleTag.textContent = `
    :root {
      --font-sans: ${stack} !important;
      --font-heading: ${stack} !important;
    }
    html,
    body,
    [class*="font-sans"],
    [class*="font-"]:not([class*="font-mono"]) {
      font-family: ${stack} !important;
    }
  `
}

const applyRadius = (radius: BorderRadiusOption) => {
  if (!import.meta.client) {
    return
  }

  const value = RADIUS_MAP[radius] ?? RADIUS_MAP.md
  const root = document.documentElement
  root.style.setProperty('--workspace-radius', value)
  
  // Apply to all elements with border-radius classes
  // We'll use a global style tag for this
  let styleTag = document.getElementById('workspace-radius-style')
  if (!styleTag) {
    styleTag = document.createElement('style')
    styleTag.id = 'workspace-radius-style'
    document.head.appendChild(styleTag)
  }
  
  // Apply radius to common Tailwind classes - simpler approach
  const radiusValue = parseFloat(value)
  const radiusSm = `${radiusValue * 0.5}px`
  const radiusMd = `${radiusValue * 0.75}px`
  const radiusLg = value
  const radiusXl = `${radiusValue * 1.25}px`
  const radius2xl = `${radiusValue * 1.5}px`
  
  styleTag.textContent = `
    :root {
      --workspace-radius: ${value};
      --workspace-radius-sm: ${radiusSm};
      --workspace-radius-md: ${radiusMd};
      --workspace-radius-lg: ${radiusLg};
      --workspace-radius-xl: ${radiusXl};
      --workspace-radius-2xl: ${radius2xl};
    }
    /* Apply to rounded-lg elements */
    .rounded-lg {
      border-radius: var(--workspace-radius-lg) !important;
    }
    /* Apply to rounded-xl elements */
    .rounded-xl {
      border-radius: var(--workspace-radius-xl) !important;
    }
    /* Apply to rounded-2xl elements */
    .rounded-2xl {
      border-radius: var(--workspace-radius-2xl) !important;
    }
    /* Apply to rounded-md elements */
    .rounded-md {
      border-radius: var(--workspace-radius-md) !important;
    }
    /* Apply to rounded-sm elements */
    .rounded-sm {
      border-radius: var(--workspace-radius-sm) !important;
    }
    /* Preserve full and none - these should not be overridden */
    .rounded-full {
      border-radius: 9999px !important;
    }
    .rounded-none {
      border-radius: 0 !important;
    }
  `
}

const applyAnimationSpeed = (speed: AnimationSpeedOption) => {
  if (!import.meta.client) {
    return
  }

  const value = ANIMATION_MAP[speed] ?? ANIMATION_MAP.normal
  const root = document.documentElement
  root.style.setProperty('--workspace-animation-duration', value)
  
  // Apply to all elements with transition classes
  let styleTag = document.getElementById('workspace-animation-style')
  if (!styleTag) {
    styleTag = document.createElement('style')
    styleTag.id = 'workspace-animation-style'
    document.head.appendChild(styleTag)
  }
  
  // Apply animation speed to elements with transition classes
  styleTag.textContent = `
    :root {
      --workspace-animation-duration: ${value};
    }
    /* Apply to elements with transition classes */
    [class*="transition"],
    [class*="duration-"]:not([class*="animate-"]),
    button,
    a,
    input,
    select,
    textarea,
    .hover\\:scale-105,
    .hover\\:scale-110 {
      transition-duration: var(--workspace-animation-duration) !important;
    }
    /* Preserve specific durations for critical animations */
    [class*="animate-"],
    .animate-pulse,
    .animate-spin,
    [style*="animation"] {
      transition-duration: inherit !important;
    }
  `
}

export const useWorkspaceTheme = () => {
  const appliedSettings = useState<AppearanceSettings>('snaplink:workspace-theme-applied', () => DEFAULT_APPEARANCE)

  const applyTheme = (settings?: Partial<AppearanceSettings> | null) => {
    if (!import.meta.client) {
      return
    }

    const merged: AppearanceSettings = {
      ...DEFAULT_APPEARANCE,
      ...settings,
    }

    appliedSettings.value = merged
    applyPalette(merged.primaryColor)
    applyFont(merged.fontFamily)
    applyThemeMode(merged.theme)
    // Always apply default values for borderRadius and animationSpeed
    applyRadius('md')
    applyAnimationSpeed('normal')
  }

  const resetTheme = () => {
    if (!import.meta.client) {
      return
    }
    
    // Clean up style tags
    const fontStyle = document.getElementById('workspace-font-style')
    if (fontStyle) {
      fontStyle.remove()
    }
    const radiusStyle = document.getElementById('workspace-radius-style')
    if (radiusStyle) {
      radiusStyle.remove()
    }
    const animationStyle = document.getElementById('workspace-animation-style')
    if (animationStyle) {
      animationStyle.remove()
    }
    
    applyTheme(DEFAULT_APPEARANCE)
  }

  return {
    applyTheme,
    resetTheme,
    appliedSettings,
  }
}


