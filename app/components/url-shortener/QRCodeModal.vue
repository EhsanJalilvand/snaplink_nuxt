<script setup lang="ts">
import { useQRCode } from '~/composables/useQRCode'

interface Props {
  open: boolean
  url: string
  title?: string
  description?: string
  downloadFileName?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'QR Code',
  description: 'Scan this QR code to access the link',
  downloadFileName: 'qrcode',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { getQRCodeUrl } = useQRCode()

function closeModal() {
  emit('update:open', false)
}

function downloadQRCode() {
  const qrUrl = getQRCodeUrl(props.url, 300)
  const linkElement = document.createElement('a')
  linkElement.href = qrUrl
  linkElement.download = `${props.downloadFileName}.png`
  linkElement.click()
}
</script>

<template>
  <DialogRoot :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogPortal>
      <DialogOverlay class="bg-muted-900/70 fixed inset-0 z-50 backdrop-blur-sm" />
      <DialogContent
        class="fixed top-[4%] start-1/2 z-[100] flex max-h-[92vh] w-[92vw] max-w-md -translate-x-1/2 overflow-hidden rounded-2xl border border-muted-200 bg-white shadow-2xl focus:outline-none dark:border-muted-700 dark:bg-muted-900"
        @pointer-down-outside="closeModal"
        @escape-key-down="closeModal"
      >
        <div class="flex w-full flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-muted-200 px-6 py-5 dark:border-muted-800">
            <div>
              <DialogTitle class="font-heading text-xl font-semibold text-muted-900 dark:text-white">
                {{ title }}
              </DialogTitle>
              <DialogDescription class="mt-1 text-sm text-muted-500 dark:text-muted-400">
                {{ description }}
              </DialogDescription>
            </div>
            <BaseButton
              size="sm"
              variant="ghost"
              icon
              class="rounded-full"
              @click="closeModal"
            >
              <Icon name="lucide:x" class="size-4" />
            </BaseButton>
          </div>

          <!-- Content -->
          <div class="flex flex-col items-center gap-6 p-6">
            <!-- QR Code Image -->
            <div class="relative">
              <div class="p-6 bg-white dark:bg-muted-900 rounded-2xl shadow-lg border-2 border-muted-200 dark:border-muted-700">
                <img
                  :src="getQRCodeUrl(url, 300)"
                  alt="QR Code"
                  class="size-64 rounded-lg"
                >
              </div>
            </div>

            <!-- URL Display -->
            <div class="w-full">
              <BaseText size="xs" weight="medium" class="text-muted-500 dark:text-muted-400 mb-2">
                Link
              </BaseText>
              <div class="px-4 py-3 rounded-lg bg-muted-50 dark:bg-muted-800/50 border border-muted-200 dark:border-muted-700 text-muted-800 dark:text-muted-100 font-mono text-sm break-all">
                {{ url }}
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end w-full p-6 border-t border-muted-200 dark:border-muted-700 gap-3">
            <BaseButton
              variant="outline"
              @click="closeModal"
            >
              Close
            </BaseButton>
            <BaseButton
              variant="primary"
              @click="downloadQRCode"
            >
              <Icon name="ph:download" class="size-4" />
              <span>Download</span>
            </BaseButton>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

