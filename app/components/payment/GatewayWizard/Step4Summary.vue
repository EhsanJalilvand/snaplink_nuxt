<script setup lang="ts">
import type { MerchantGateway, AuditLogEntry } from '~/types/payment-gateway'
import AuditLogTimeline from '../AuditLogTimeline.vue'
import GatewayStatusBadge from '../GatewayStatusBadge.vue'
import RiskIndicator from '../RiskIndicator.vue'

interface Props {
  gateway: Partial<MerchantGateway>
  auditLog?: AuditLogEntry[]
}

const props = defineProps<Props>()

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USDC' ? 'USD' : currency,
  }).format(amount)
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <BaseHeading
        as="h3"
        size="lg"
        weight="semibold"
        class="text-muted-900 dark:text-white"
      >
        Review & Submit
      </BaseHeading>
      <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
        Review your gateway configuration before submitting for approval.
      </BaseParagraph>
    </div>

    <!-- Business Info Summary -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h4"
        size="md"
        weight="semibold"
        class="mb-4 text-muted-900 dark:text-white"
      >
        Business Information
      </BaseHeading>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Legal Name
          </BaseText>
          <BaseText size="sm" weight="medium" class="mt-1 text-muted-700 dark:text-muted-300">
            {{ gateway.businessInfo?.legalName || 'N/A' }}
          </BaseText>
        </div>
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Display Name
          </BaseText>
          <BaseText size="sm" weight="medium" class="mt-1 text-muted-700 dark:text-muted-300">
            {{ gateway.businessInfo?.displayName || 'N/A' }}
          </BaseText>
        </div>
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Category
          </BaseText>
          <BaseText size="sm" weight="medium" class="mt-1 text-muted-700 dark:text-muted-300">
            {{ gateway.businessInfo?.category || 'N/A' }}
          </BaseText>
        </div>
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Country
          </BaseText>
          <BaseText size="sm" weight="medium" class="mt-1 text-muted-700 dark:text-muted-300">
            {{ gateway.businessInfo?.country || 'N/A' }}
          </BaseText>
        </div>
      </div>
    </BaseCard>

    <!-- Compliance Summary -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h4"
        size="md"
        weight="semibold"
        class="mb-4 text-muted-900 dark:text-white"
      >
        Compliance Status
      </BaseHeading>
      <div class="grid grid-cols-2 gap-6">
        <div>
          <BaseText size="xs" class="mb-2 text-muted-500 dark:text-muted-400">
            KYC Status
          </BaseText>
          <GatewayStatusBadge
            :status="gateway.compliance?.kyc.status === 'verified' ? 'approved' : gateway.compliance?.kyc.status === 'rejected' ? 'rejected' : 'pending'"
          />
        </div>
        <div>
          <BaseText size="xs" class="mb-2 text-muted-500 dark:text-muted-400">
            KYB Status
          </BaseText>
          <GatewayStatusBadge
            :status="gateway.compliance?.kyb.status === 'verified' ? 'approved' : gateway.compliance?.kyb.status === 'rejected' ? 'rejected' : 'pending'"
          />
        </div>
        <div>
          <BaseText size="xs" class="mb-2 text-muted-500 dark:text-muted-400">
            Risk Score
          </BaseText>
          <RiskIndicator
            v-if="gateway.compliance?.riskScore"
            :level="gateway.compliance.riskScore.level"
            :score="gateway.compliance.riskScore.value"
            :show-label="true"
            :show-score="true"
          />
          <BaseText v-else size="sm" class="text-muted-500">
            Not calculated yet
          </BaseText>
        </div>
        <div>
          <BaseText size="xs" class="mb-2 text-muted-500 dark:text-muted-400">
            Documents
          </BaseText>
          <BaseText size="sm" weight="medium" class="text-muted-700 dark:text-muted-300">
            {{ (gateway.compliance?.kyc.documents?.length || 0) + (gateway.compliance?.kyb.documents?.length || 0) }} uploaded
          </BaseText>
        </div>
      </div>
    </BaseCard>

    <!-- Settings Summary -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h4"
        size="md"
        weight="semibold"
        class="mb-4 text-muted-900 dark:text-white"
      >
        Gateway Settings
      </BaseHeading>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Max Transaction
          </BaseText>
          <BaseText size="sm" weight="medium" class="mt-1 text-muted-700 dark:text-muted-300">
            {{ gateway.settings?.maxTransactionAmount ? formatCurrency(gateway.settings.maxTransactionAmount, 'USD') : 'N/A' }}
          </BaseText>
        </div>
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Daily Volume Limit
          </BaseText>
          <BaseText size="sm" weight="medium" class="mt-1 text-muted-700 dark:text-muted-300">
            {{ gateway.settings?.dailyVolumeLimit ? formatCurrency(gateway.settings.dailyVolumeLimit, 'USD') : 'N/A' }}
          </BaseText>
        </div>
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Allowed Currencies
          </BaseText>
          <div class="mt-1 flex flex-wrap gap-1">
            <BaseChip
              v-for="currency in gateway.settings?.allowedCurrencies || []"
              :key="currency"
              size="xs"
              color="primary"
              variant="pastel"
            >
              {{ currency }}
            </BaseChip>
          </div>
        </div>
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Risk Profile
          </BaseText>
          <BaseText size="sm" weight="medium" class="mt-1 text-muted-700 dark:text-muted-300">
            {{ gateway.settings?.riskProfile || 'N/A' }}
          </BaseText>
        </div>
      </div>
    </BaseCard>

    <!-- API Configuration Summary -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h4"
        size="md"
        weight="semibold"
        class="mb-4 text-muted-900 dark:text-white"
      >
        API Configuration
      </BaseHeading>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            API Keys
          </BaseText>
          <BaseText size="sm" weight="medium" class="mt-1 text-muted-700 dark:text-muted-300">
            {{ gateway.apiKeys?.length || 0 }} configured
          </BaseText>
        </div>
        <div>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Webhooks
          </BaseText>
          <BaseText size="sm" weight="medium" class="mt-1 text-muted-700 dark:text-muted-300">
            {{ gateway.webhooks?.length || 0 }} configured
          </BaseText>
        </div>
      </div>
    </BaseCard>

    <!-- Audit Log Preview -->
    <BaseCard v-if="auditLog && auditLog.length > 0" class="p-6">
      <BaseHeading
        as="h4"
        size="md"
        weight="semibold"
        class="mb-4 text-muted-900 dark:text-white"
      >
        Activity History
      </BaseHeading>
      <AuditLogTimeline
        :entries="auditLog.slice(0, 5)"
        :max-height="'400px'"
      />
    </BaseCard>

    <!-- Warning Messages -->
    <BaseAlert
      v-if="!gateway.compliance?.kyc.documents?.length || !gateway.compliance?.kyb.documents?.length"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Incomplete Documentation
      </template>
      <BaseParagraph size="sm" class="text-muted-600 dark:text-muted-300">
        Please upload all required KYC and KYB documents before submitting for approval.
      </BaseParagraph>
    </BaseAlert>
  </div>
</template>

