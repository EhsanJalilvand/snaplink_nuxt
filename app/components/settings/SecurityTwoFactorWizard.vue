<script setup lang="ts">
const props = defineProps<{
  open: boolean
  step: number
  totalSteps: number
  loading: boolean
  errors: Record<string, string>
  qrCode?: string
  secret?: string
  maskedSecret?: string
  verifyCode: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'previous'): void
  (e: 'continue'): void
  (e: 'verify'): void
  (e: 'done'): void
  (e: 'copy-secret'): void
  (e: 'update:verifyCode', value: string): void
}>()

const close = () => emit('update:open', false)
const handleVerifyInput = (value: string) => emit('update:verifyCode', value)
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="bg-muted-800/70 dark:bg-muted-900/80 fixed inset-0 z-50" />

      <DialogContent
        class="fixed top-[5%] start-1/2 z-[60] max-h-[90vh] w-[90vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl outline-none dark:border-muted-700 dark:bg-muted-900"
      >
        <div class="flex items-center justify-between border-b border-muted-200 p-6 dark:border-muted-700">
          <div class="flex items-center gap-3">
            <Icon name="ph:shield-check" class="size-6 text-primary-500" />
            <div>
              <DialogTitle class="font-heading text-lg font-semibold text-muted-900 dark:text-white">
                Setup two-factor authentication
              </DialogTitle>
              <BaseParagraph size="xs" class="text-muted-500">
                Step {{ step + 1 }} of {{ totalSteps }}
              </BaseParagraph>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div v-for="index in totalSteps" :key="index" class="flex items-center gap-2">
              <div
                class="flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors"
                :class="index - 1 <= step ? 'border-primary-500 bg-primary-500 text-white' : 'border-muted-300 text-muted-400 dark:border-muted-700'"
              >
                <Icon v-if="index - 1 < step" name="ph:check" class="size-4" />
                <span v-else>{{ index }}</span>
              </div>
              <div
                v-if="index < totalSteps"
                class="h-0.5 w-8"
                :class="index - 1 < step ? 'bg-primary-500' : 'bg-muted-300 dark:bg-muted-700'"
              />
            </div>
            <BaseButton class="icon-sm" variant="ghost" @click="close">
              <Icon name="lucide:x" class="size-4" />
            </BaseButton>
          </div>
        </div>

        <div class="nui-slimscroll max-h-[60vh] overflow-y-auto px-6 py-6">
          <div v-if="step === 0" key="step-0" class="space-y-6">
            <div class="text-center">
              <BaseHeading as="h4" size="md" weight="medium" class="mb-2 text-muted-900 dark:text-white">
                Scan QR code
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Scan with your authenticator app to link this device.
              </BaseParagraph>
            </div>

            <div class="flex flex-col items-center gap-4">
              <div class="rounded-2xl border border-muted-200 bg-white p-6 dark:border-muted-700 dark:bg-muted-800">
                <img
                  v-if="qrCode"
                  :src="qrCode"
                  alt="TOTP QR Code"
                  class="max-h-64 max-w-xs"
                >
                <div v-else class="flex h-64 w-64 items-center justify-center text-muted-500">
                  Generating code...
                </div>
              </div>

              <div v-if="secret" class="w-full space-y-2 rounded-xl border border-muted-200 bg-muted-50 p-4 dark:border-muted-700 dark:bg-muted-800">
                <BaseHeading as="h5" size="xs" weight="medium" class="text-muted-700 dark:text-muted-300">
                  Can't scan? Enter this code manually
                </BaseHeading>
                <div class="flex items-center gap-2">
                  <code class="flex-1 rounded bg-white px-3 py-2 text-sm font-mono dark:bg-muted-900">
                    {{ maskedSecret || secret }}
                  </code>
                  <BaseButton size="sm" variant="outline" @click="emit('copy-secret')">
                    <Icon name="ph:copy" class="size-4" />
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="step === 1" key="step-1" class="space-y-6">
            <div class="text-center">
              <BaseHeading as="h4" size="md" weight="medium" class="mb-2 text-muted-900 dark:text-white">
                Enter verification code
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                Enter the 6-digit code generated by your authenticator app.
              </BaseParagraph>
            </div>

            <div class="mx-auto w-full max-w-xs">
              <BaseField label="Verification code" :error="errors.verifyCode">
                <TairoInput
                  :model-value="verifyCode"
                  inputmode="numeric"
                  maxlength="6"
                  placeholder="000000"
                  class="text-center text-2xl font-mono tracking-[0.6em]"
                  rounded="lg"
                  autocomplete="one-time-code"
                  @update:model-value="handleVerifyInput"
                  @keyup.enter="emit('verify')"
                />
              </BaseField>
            </div>
          </div>

          <div v-else class="space-y-6" key="step-2">
            <div class="text-center">
              <div class="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/20">
                <Icon name="ph:check-circle-fill" class="size-12 text-success-500" />
              </div>
              <BaseHeading as="h4" size="md" weight="medium" class="mb-2 text-muted-900 dark:text-white">
                Two-factor enabled
              </BaseHeading>
              <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
                You're all set! Authenticator codes will be required on your next sign-in.
              </BaseParagraph>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-muted-200 p-6 dark:border-muted-700">
          <BaseButton v-if="step > 0 && step < 2" variant="pastel" @click="emit('previous')">
            <Icon name="ph:arrow-left" class="size-4" />
            Previous
          </BaseButton>
          <div v-else />

          <div class="flex items-center gap-2">
            <BaseButton v-if="step < 2" variant="ghost" @click="close">
              Cancel
            </BaseButton>
            <BaseButton
              v-if="step === 0"
              variant="primary"
              :loading="loading"
              @click="emit('continue')"
            >
              Continue
              <Icon name="ph:arrow-right" class="size-4" />
            </BaseButton>
            <BaseButton
              v-else-if="step === 1"
              variant="primary"
              :loading="loading"
              :disabled="verifyCode.length !== 6"
              @click="emit('verify')"
            >
              Verify & enable
              <Icon name="ph:check" class="size-4" />
            </BaseButton>
            <BaseButton v-else variant="primary" @click="emit('done')">
              Done
              <Icon name="ph:check" class="size-4" />
            </BaseButton>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
