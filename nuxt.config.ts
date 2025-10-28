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
    public: {
      siteUrl: '', // set it via NUXT_PUBLIC_SITE_URL
    },
  },

  routeRules: {
    '/': {
      swr: 3600,
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
    '/settings/**': {
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
      ],
    },
  },
})