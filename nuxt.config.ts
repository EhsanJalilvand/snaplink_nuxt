export default defineNuxtConfig({
  compatibilityDate: '2024-11-26',
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },

  extends: [
    /**
     * This extends the base Tairo layer.
     */
    '../layers/tairo',
  ],

  modules: [
    'reka-ui/nuxt',
    '@vueuse/nuxt',
    '@nuxt/image',
    '@nuxt/fonts',
  ],

  experimental: {
    viewTransition: true,
    sharedPrerenderData: true,
    defaults: {
      nuxtLink: {
        prefetchOn: {
          visibility: false,
          interaction: true,
        },
      },
    },
  },

  $development: {
    experimental: {
      defaults: {
        nuxtLink: {
          prefetch: false,
        },
      },
    },
  },

  css: [
    /**
     * Load Tailwind CSS
     */
    '~/assets/main.css',
  ],

  fonts: {
    experimental: {
      processCSSVariables: true,
    },
  },

  typescript: {
    tsConfig: {
      // Here you can customize the generated tsconfig.json file
    },
  },

  runtimeConfig: {
    // Private keys (only available on server-side)
    keycloakUrl: process.env.KEYCLOAK_URL || 'http://localhost:8080',
    keycloakRealm: process.env.KEYCLOAK_REALM || 'master',
    keycloakClientId: (() => {
      const clientId = process.env.KEYCLOAK_CLIENT_ID || 'my-client'
      console.log('[nuxt.config.ts] KEYCLOAK_CLIENT_ID from env:', process.env.KEYCLOAK_CLIENT_ID)
      console.log('[nuxt.config.ts] KEYCLOAK_CLIENT_ID final value:', clientId)
      return clientId
    })(),
    keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT || '587',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || 'noreply@snaplink.com',
    
    // Public keys (exposed to client-side)
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'SnapLink',
      keycloakUrl: process.env.KEYCLOAK_URL || 'http://localhost:8080',
      keycloakRealm: process.env.KEYCLOAK_REALM || 'master',
      keycloakClientId: process.env.KEYCLOAK_CLIENT_ID || 'my-client', // Read from env
      keycloakRedirectUri: process.env.KEYCLOAK_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    },
  },

  routeRules: {
    '/': {
      swr: 3600,
    },
    '/auth/**': {
      ssr: false, // Client-side rendering for auth pages
    },
    '/auth/callback': {
      ssr: false, // Client-side rendering for callback
    },
    '/dashboard/**': {
      swr: 3600,
    },
    '/links/**': {
      swr: 3600,
    },
    '/analytics/**': {
      swr: 3600,
    },
  },

  sourcemap: {
    server: false,
    client: false,
  },

  nitro: {
    logging: {
      compressedSizes: false,
    },
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
  },

  vite: {
    define: {
      __VUE_OPTIONS_API__: false,
    },
    css: {
      transformer: 'lightningcss',
    },
    build: {
      target: 'esnext',
      cssMinify: 'lightningcss',
      reportCompressedSize: false,
    },
    optimizeDeps: {
      include: [
        'scule',
        'klona',
        'ohash',
        // AddonInputPassword dependencies
        '@zxcvbn-ts/core',
        '@zxcvbn-ts/language-common',
        '@zxcvbn-ts/language-en',
      ],
    },
  },
})