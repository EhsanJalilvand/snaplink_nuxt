<script setup lang="ts">
const emits = defineEmits<{
  close: []
}>()

const { open } = usePanels()
onKeyStroke('Escape', () => emits('close'))

const activeTab = ref('tab-1')
</script>

<template>
  <FocusScope
    class="border-muted-200 dark:border-muted-800 dark:bg-muted-950 border bg-white"
    trapped
    loop
  >
    <div
      class="border-muted-200 dark:border-muted-800 flex h-20 w-full items-center justify-between border-b px-6"
    >
      <BaseHeading
        as="h3"
        size="xs"
        weight="semibold"
        class="text-muted-500 dark:text-muted-100 uppercase"
      >
        Activity
      </BaseHeading>

      <!-- Close button -->
      <button
        type="button"
        class="nui-mask nui-mask-blob hover:bg-muted-100 focus:bg-muted-100 dark:hover:bg-muted-800 dark:focus:bg-muted-800 text-muted-700 dark:text-muted-400 flex size-10 cursor-pointer items-center justify-center outline-transparent transition-colors duration-300"
        @click="() => emits('close')"
      >
        <Icon name="lucide:arrow-right" class="size-4" />
      </button>
    </div>

    <div class="flex h-16 items-center px-6">
      <!-- Tabs -->
      <div
        class="bg-muted-100 dark:bg-muted-900 relative flex h-8 w-full items-center rounded-full font-sans text-sm"
      >
        <button
          type="button"
          class="focus-visible:nui-focus relative z-20 flex h-full flex-1 items-center justify-center"
          :class="activeTab === 'tab-1' ? 'text-white' : 'text-muted-400'"
          @click="activeTab = 'tab-1'"
        >
          <span>Recent</span>
        </button>
        <button
          type="button"
          class="focus-visible:nui-focus relative z-20 flex h-full flex-1 items-center justify-center"
          :class="activeTab === 'tab-2' ? 'text-white' : 'text-muted-400'"
          @click="activeTab = 'tab-2'"
        >
          <span>Links</span>
        </button>
        <button
          type="button"
          class="focus-visible:nui-focus relative z-20 flex h-full flex-1 items-center justify-center"
          :class="activeTab === 'tab-3' ? 'text-white' : 'text-muted-400'"
          @click="activeTab = 'tab-3'"
        >
          <span>Timeline</span>
        </button>
        <div
          class="bg-primary-600 absolute start-0 top-0 z-10 h-full w-1/3 rounded-full transition-all duration-300"
          :class="[
            activeTab === 'tab-1' && 'ms-0',
            activeTab === 'tab-2' && 'ms-[33.3%]',
            activeTab === 'tab-3' && 'ms-[66.6%]',
          ]"
        />
      </div>
    </div>

    <div
      class="nui-slimscroll relative h-[calc(100dvh_-_144px)] w-full overflow-y-auto px-6"
    >
      <div class="pt-3 pb-6">
        <!-- Recent tab content -->
        <div v-if="activeTab === 'tab-1'" class="space-y-4">
          <!-- Activity item -->
          <div
            class="border-muted-300 dark:border-muted-800 dark:bg-muted-900 flex items-center rounded-lg border bg-white p-4"
          >
            <div
              class="relative inline-flex size-9 items-center justify-center rounded-full"
            >
              <div class="flex size-9 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                <Icon name="solar:link-linear" class="size-5 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div class="ms-3">
              <h6
                class="font-heading text-muted-900 text-sm font-medium dark:text-white"
              >
                New link created
              </h6>
              <p class="text-muted-400 font-sans text-xs">
                snap.ly/abc123
              </p>
            </div>
            <div class="ms-auto">
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                2m ago
              </BaseText>
            </div>
          </div>
          <!-- Activity item -->
          <div
            class="border-muted-300 dark:border-muted-800 dark:bg-muted-900 flex items-center rounded-lg border bg-white p-4"
          >
            <div
              class="relative inline-flex size-9 items-center justify-center rounded-full"
            >
              <div class="flex size-9 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30">
                <Icon name="solar:mouse-linear" class="size-5 text-success-600 dark:text-success-400" />
              </div>
            </div>
            <div class="ms-3">
              <h6
                class="font-heading text-muted-900 text-sm font-medium dark:text-white"
              >
                Link clicked
              </h6>
              <p class="text-muted-400 font-sans text-xs">
                snap.ly/xyz789 - 125 clicks
              </p>
            </div>
            <div class="ms-auto">
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                15m ago
              </BaseText>
            </div>
          </div>
          <!-- Activity item -->
          <div
            class="border-muted-300 dark:border-muted-800 dark:bg-muted-900 flex items-center rounded-lg border bg-white p-4"
          >
            <div
              class="relative inline-flex size-9 items-center justify-center rounded-full"
            >
              <div class="flex size-9 items-center justify-center rounded-full bg-info-100 dark:bg-info-900/30">
                <Icon name="solar:folder-linear" class="size-5 text-info-600 dark:text-info-400" />
              </div>
            </div>
            <div class="ms-3">
              <h6
                class="font-heading text-muted-900 text-sm font-medium dark:text-white"
              >
                Collection created
              </h6>
              <p class="text-muted-400 font-sans text-xs">
                Marketing Campaigns
              </p>
            </div>
            <div class="ms-auto">
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                1h ago
              </BaseText>
            </div>
          </div>
          <!-- Activity item -->
          <div
            class="border-muted-300 dark:border-muted-800 dark:bg-muted-900 flex items-center rounded-lg border bg-white p-4"
          >
            <div
              class="relative inline-flex size-9 items-center justify-center rounded-full"
            >
              <div class="flex size-9 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/30">
                <Icon name="solar:chart-2-linear" class="size-5 text-warning-600 dark:text-warning-400" />
              </div>
            </div>
            <div class="ms-3">
              <h6
                class="font-heading text-muted-900 text-sm font-medium dark:text-white"
              >
                Report generated
              </h6>
              <p class="text-muted-400 font-sans text-xs">
                Monthly analytics report
              </p>
            </div>
            <div class="ms-auto">
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                3h ago
              </BaseText>
            </div>
          </div>
        </div>

        <!-- Links tab content -->
        <div v-else-if="activeTab === 'tab-2'" class="space-y-4">
          <!-- Link item -->
          <div
            class="border-muted-300 dark:border-muted-800 dark:bg-muted-900 rounded-lg border bg-white p-4"
          >
            <div class="mb-4 flex items-center">
              <div
                class="relative inline-flex size-9 items-center justify-center rounded-xl"
              >
                <div class="flex size-9 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                  <Icon name="solar:link-linear" class="size-5 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <div class="ms-3">
                <h6
                  class="font-heading text-muted-900 text-sm font-medium dark:text-white"
                >
                  snap.ly/abc123
                </h6>
                <p class="text-muted-400 font-sans text-xs">
                  example.com/very/long/url
                </p>
              </div>
              <NuxtLink
                to="/dashboard/url-shortener/links"
                class="border-muted-200 focus-visible:nui-focus text-muted-400 hover:border-primary-500 hover:text-primary-500 dark:border-muted-800 dark:hover:border-primary-500 ms-auto flex size-9 items-center justify-center rounded-full border transition-colors duration-300"
              >
                <Icon name="feather:arrow-right" class="size-4" />
              </NuxtLink>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon name="solar:mouse-linear" class="size-4 text-muted-400" />
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  1,250 clicks
                </BaseText>
              </div>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Created 2 days ago
              </BaseText>
            </div>
          </div>
          <!-- Link item -->
          <div
            class="border-muted-300 dark:border-muted-800 dark:bg-muted-900 rounded-lg border bg-white p-4"
          >
            <div class="mb-4 flex items-center">
              <div
                class="relative inline-flex size-9 items-center justify-center rounded-xl"
              >
                <div class="flex size-9 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                  <Icon name="solar:link-linear" class="size-5 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <div class="ms-3">
                <h6
                  class="font-heading text-muted-900 text-sm font-medium dark:text-white"
                >
                  snap.ly/xyz789
                </h6>
                <p class="text-muted-400 font-sans text-xs">
                  another-example.com/product
                </p>
              </div>
              <NuxtLink
                to="/dashboard/url-shortener/links"
                class="border-muted-200 focus-visible:nui-focus text-muted-400 hover:border-primary-500 hover:text-primary-500 dark:border-muted-800 dark:hover:border-primary-500 ms-auto flex size-9 items-center justify-center rounded-full border transition-colors duration-300"
              >
                <Icon name="feather:arrow-right" class="size-4" />
              </NuxtLink>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon name="solar:mouse-linear" class="size-4 text-muted-400" />
                <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                  890 clicks
                </BaseText>
              </div>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Created 5 days ago
              </BaseText>
            </div>
          </div>
        </div>

        <!-- Timeline tab content -->
        <div v-else-if="activeTab === 'tab-3'" class="space-y-4">
          <!-- Timeline item -->
          <div
            class="after:border-muted-300 dark:after:border-muted-800 relative flex pb-8 after:absolute after:start-4 after:top-10 after:h-[calc(100%_-_36px)] after:w-px after:border-l after:content-['']"
          >
            <div
              class="border-muted-200 text-muted-400 after:border-muted-300 dark:border-muted-800 dark:bg-muted-900 dark:after:border-muted-800 relative flex size-9 items-center justify-center rounded-full border bg-white shadow-lg after:absolute after:-end-8 after:top-4 after:h-px after:w-5 after:border-t after:content-['']"
            >
              <Icon name="solar:link-linear" class="size-5" />
            </div>
            <div class="ms-10">
              <h6
                class="font-heading text-muted-900 text-sm font-medium dark:text-white"
              >
                Created new link
              </h6>
              <p class="text-muted-400 font-sans text-xs">
                Today - 10:30am
              </p>
            </div>
          </div>
          <!-- Timeline item -->
          <div
            class="after:border-muted-300 dark:after:border-muted-800 relative flex pb-8 after:absolute after:start-4 after:top-10 after:h-[calc(100%_-_36px)] after:w-px after:border-l after:content-['']"
          >
            <div
              class="border-muted-200 text-muted-400 after:border-muted-300 dark:border-muted-800 dark:bg-muted-900 dark:after:border-muted-800 relative flex size-9 items-center justify-center rounded-full border bg-white shadow-lg after:absolute after:-end-8 after:top-4 after:h-px after:w-5 after:border-t after:content-['']"
            >
              <Icon name="solar:mouse-linear" class="size-5" />
            </div>
            <div class="ms-10">
              <h6
                class="font-heading text-muted-900 text-sm font-medium dark:text-white"
              >
                Link clicked 50 times
              </h6>
              <p class="text-muted-400 font-sans text-xs">
                Today - 11:00am
              </p>
            </div>
          </div>
          <!-- Timeline item -->
          <div
            class="after:border-muted-300 dark:after:border-muted-800 relative flex pb-8 after:absolute after:start-4 after:top-10 after:h-[calc(100%_-_36px)] after:w-px after:border-l after:content-['']"
          >
            <div
              class="border-muted-200 text-muted-400 after:border-muted-300 dark:border-muted-800 dark:bg-muted-900 dark:after:border-muted-800 relative flex size-9 items-center justify-center rounded-full border bg-white shadow-lg after:absolute after:-end-8 after:top-4 after:h-px after:w-5 after:border-t after:content-['']"
            >
              <Icon name="solar:folder-linear" class="size-5" />
            </div>
            <div class="ms-10">
              <h6
                class="font-heading text-muted-900 text-sm font-medium dark:text-white"
              >
                Created collection
              </h6>
              <p class="text-muted-400 font-sans text-xs">
                Today - 01:00pm
              </p>
            </div>
          </div>
          <!-- Timeline item -->
          <div
            class="after:border-muted-300 dark:after:border-muted-800 relative flex pb-8 after:absolute after:start-4 after:top-10 after:h-[calc(100%_-_36px)] after:w-px after:border-l after:content-['']"
          >
            <div
              class="border-muted-200 text-muted-400 after:border-muted-300 dark:border-muted-800 dark:bg-muted-900 dark:after:border-muted-800 relative flex size-9 items-center justify-center rounded-full border bg-white shadow-lg after:absolute after:-end-8 after:top-4 after:h-px after:w-5 after:border-t after:content-['']"
            >
              <Icon name="solar:chart-2-linear" class="size-5" />
            </div>
            <div class="ms-10">
              <h6
                class="font-heading text-muted-900 text-sm font-medium dark:text-white"
              >
                Generated report
              </h6>
              <p class="text-muted-400 font-sans text-xs">
                Today - 02:30pm
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FocusScope>
</template>

