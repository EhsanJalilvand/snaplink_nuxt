import process from 'node:process'

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
    // Ory Kratos
    kratosAdminUrl: process.env.KRATOS_ADMIN_URL || 'http://localhost:4434',
    kratosPublicUrl: process.env.KRATOS_PUBLIC_URL || 'http://localhost:4433',
    // Ory Hydra
    hydraAdminUrl: process.env.HYDRA_ADMIN_URL || 'http://localhost:4445',
    hydraPublicUrl: process.env.HYDRA_PUBLIC_URL || 'http://localhost:4444',
    // OAuth2 Client
    oauth2ClientId: process.env.OAUTH2_CLIENT_ID || 'snapplink-frontend',
    // Avatar Storage
    avatarStoragePath: process.env.AVATAR_STORAGE_PATH || 'avatars',
    avatarBaseUrl: process.env.AVATAR_BASE_URL || '/uploads/avatars',
    // API Endpoints
    apiGatewayBaseUrl:
      process.env.API_GATEWAY_BASE_URL ||
      process.env.NUXT_API_GATEWAY_BASE_URL ||
      'http://localhost:5100', // Ocelot API Gateway
    apiInternalBaseUrl: process.env.API_INTERNAL_BASE_URL || process.env.NUXT_API_INTERNAL_BASE_URL || '/api',
    
    // Public keys (exposed to client-side)
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || process.env.APP_URL || 'http://localhost:3000',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'SnapLink',
      // Ory Kratos
      kratosPublicUrl: process.env.KRATOS_PUBLIC_URL || 'http://localhost:4433',
      // Ory Hydra
      hydraPublicUrl: process.env.HYDRA_PUBLIC_URL || 'http://localhost:4444',
      // OAuth2
      oauth2ClientId: process.env.OAUTH2_CLIENT_ID || 'snapplink-frontend',
      oauth2RedirectUri: process.env.OAUTH2_REDIRECT_URI || 'http://localhost:3000/auth/callback',
      apiGatewayBaseUrl:
        process.env.NUXT_PUBLIC_API_GATEWAY_BASE_URL ||
        process.env.API_GATEWAY_BASE_URL ||
        'http://localhost:5100', // Ocelot API Gateway
      apiInternalBaseUrl: process.env.NUXT_PUBLIC_API_INTERNAL_BASE_URL || process.env.API_INTERNAL_BASE_URL || '/api',
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