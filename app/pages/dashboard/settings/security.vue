<script setup lang="ts">
import { callOnce } from '#imports'
import SecurityPageHeader from '~/components/settings/SecurityPageHeader.vue'
import SecurityPasswordCard from '~/components/settings/SecurityPasswordCard.vue'
import SecurityTwoFactorCard from '~/components/settings/SecurityTwoFactorCard.vue'
import SecurityTwoFactorWizard from '~/components/settings/SecurityTwoFactorWizard.vue'
import { useTwoFactor } from '~/composables/useTwoFactor'

definePageMeta({
  title: 'Security Settings',
  layout: 'dashboard',
})

const twoFactor = useTwoFactor()

await callOnce(() => twoFactor.fetchStatus())

const handleEnableTwoFactor = () => {
  twoFactor.startSetup()
}

const handleDisableTwoFactor = () => {
  twoFactor.disable()
}

const handleWizardContinue = () => {
  if (twoFactor.wizard.step.value < 2) {
    twoFactor.wizard.step.value += 1
  }
}

const handleWizardPrevious = () => {
  if (twoFactor.wizard.step.value > 0) {
    twoFactor.wizard.step.value -= 1
  }
}

const handleWizardDone = () => {
  twoFactor.closeWizard()
}

const updateVerifyCode = (value: string) => {
  twoFactor.wizard.state.verifyCode = value.replace(/\D/g, '').slice(0, 6)
}

const updateWizardOpen = (value: boolean) => {
  if (!value) {
    twoFactor.closeWizard()
  } else {
    twoFactor.wizard.open.value = true
  }
}
</script>

<template>
  <div class="space-y-8 pb-16">
    <SecurityPageHeader
      title="Security settings"
      subtitle="Rotate your password regularly and enable two-factor authentication for extra protection."
    />

    <SecurityPasswordCard />

    <SecurityTwoFactorCard
      :enabled="twoFactor.status.value.enabled"
      :is-loading="twoFactor.isStatusLoading.value"
      :status-error="twoFactor.statusError.value"
      :on-enable="handleEnableTwoFactor"
      :on-disable="handleDisableTwoFactor"
    />

    <SecurityTwoFactorWizard
      :open="twoFactor.wizard.open.value"
      :step="twoFactor.wizard.step.value"
      :total-steps="3"
      :loading="twoFactor.wizard.loading.value"
      :errors="twoFactor.wizard.errors"
      :qr-code="twoFactor.wizard.state.qrCode"
      :secret="twoFactor.wizard.state.secret"
      :masked-secret="twoFactor.wizard.maskedSecret.value"
      :verify-code="twoFactor.wizard.state.verifyCode"
      @update:open="updateWizardOpen"
      @previous="handleWizardPrevious"
      @continue="handleWizardContinue"
      @verify="twoFactor.verifyCode"
      @done="handleWizardDone"
      @copy-secret="twoFactor.copySecret"
      @update:verifyCode="updateVerifyCode"
    />
  </div>
</template>

