<script setup lang="ts">
import type { KYCInfo, KYBInfo } from '~/types/payment-gateway'
import RejectionReasonForm from '../RejectionReasonForm.vue'

interface Props {
  kyc: KYCInfo
  kyb: KYBInfo
  isEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false,
})

const emit = defineEmits<{
  'update:kyc': [value: KYCInfo]
  'update:kyb': [value: KYBInfo]
}>()

const localKYC = ref<KYCInfo>({
  ...props.kyc,
})

const localKYB = ref<KYBInfo>({
  ...props.kyb,
})

const kycDocumentTypes = [
  { label: 'Passport', value: 'passport' as const },
  { label: 'National ID', value: 'national_id' as const },
  { label: "Driver's License", value: 'drivers_license' as const },
  { label: 'Other', value: 'other' as const },
]

const kybDocumentTypes = [
  { label: 'Business License', value: 'business_license' as const },
  { label: 'Tax Certificate', value: 'tax_certificate' as const },
  { label: 'Bank Statement', value: 'bank_statement' as const },
  { label: 'Proof of Address', value: 'proof_of_address' as const },
  { label: 'Articles of Incorporation', value: 'articles_of_incorporation' as const },
  { label: 'Other', value: 'other' as const },
]

const uploadingKYC = ref<string | null>(null)
const uploadingKYB = ref<string | null>(null)

const handleKYCDocumentUpload = async (file: File, type: typeof kycDocumentTypes[number]['value']) => {
  uploadingKYC.value = type
  
  // Simulate upload
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const newDoc = {
    id: Math.random().toString(36).substring(7),
    type,
    name: file.name,
    fileUrl: URL.createObjectURL(file),
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
    status: 'pending' as const,
  }
  
  localKYC.value.documents = [...localKYC.value.documents, newDoc]
  localKYC.value.status = localKYC.value.status === 'not_started' ? 'in_progress' : localKYC.value.status
  
  uploadingKYC.value = null
  emit('update:kyc', { ...localKYC.value })
}

const handleKYBDocumentUpload = async (file: File, type: typeof kybDocumentTypes[number]['value']) => {
  uploadingKYB.value = type
  
  // Simulate upload
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const newDoc = {
    id: Math.random().toString(36).substring(7),
    type,
    name: file.name,
    fileUrl: URL.createObjectURL(file),
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
    status: 'pending' as const,
  }
  
  localKYB.value.documents = [...localKYB.value.documents, newDoc]
  localKYB.value.status = localKYB.value.status === 'not_started' ? 'in_progress' : localKYB.value.status
  
  uploadingKYB.value = null
  emit('update:kyb', { ...localKYB.value })
}

const removeDocument = (id: string, type: 'kyc' | 'kyb') => {
  if (type === 'kyc') {
    localKYC.value.documents = localKYC.value.documents.filter(doc => doc.id !== id)
    emit('update:kyc', { ...localKYC.value })
  } else {
    localKYB.value.documents = localKYB.value.documents.filter(doc => doc.id !== id)
    emit('update:kyb', { ...localKYB.value })
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

watch(() => props.kyc, (newValue) => {
  if (newValue) localKYC.value = { ...newValue }
}, { deep: true })

watch(() => props.kyb, (newValue) => {
  if (newValue) localKYB.value = { ...newValue }
}, { deep: true })
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
        Compliance & Verification
      </BaseHeading>
      <BaseParagraph size="sm" class="mt-2 text-muted-500 dark:text-muted-400">
        Upload required documents for KYC (Know Your Customer) and KYB (Know Your Business) verification.
      </BaseParagraph>
    </div>

    <!-- KYC Section -->
    <BaseCard class="p-6">
      <div class="mb-6 flex items-center gap-3">
        <div class="flex size-12 items-center justify-center rounded-xl border-2 border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20">
          <Icon
            name="solar:user-id-bold-duotone"
            class="size-6 text-primary-500"
          />
        </div>
        <div>
          <BaseHeading
            as="h4"
            size="md"
            weight="semibold"
            class="text-muted-900 dark:text-white"
          >
            KYC (Know Your Customer)
          </BaseHeading>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Verify individual identity and eligibility
          </BaseText>
        </div>
        <BaseChip
          v-if="localKYC.status !== 'not_started'"
          size="sm"
          :color="localKYC.status === 'verified' ? 'success' : localKYC.status === 'rejected' ? 'danger' : 'info'"
          variant="pastel"
        >
          {{ localKYC.status.replace('_', ' ') }}
        </BaseChip>
      </div>

      <!-- KYC Documents -->
      <div class="space-y-4">
        <div
          v-for="docType in kycDocumentTypes"
          :key="docType.value"
          class="rounded-xl border border-muted-200 bg-muted-50/50 p-4 dark:border-muted-700 dark:bg-muted-900/30"
        >
          <div class="mb-3 flex items-center justify-between">
            <div>
              <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                {{ docType.label }}
              </BaseText>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Upload {{ docType.label.toLowerCase() }} document
              </BaseText>
            </div>
            <input
              :id="`kyc-${docType.value}`"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              class="hidden"
              @change="(e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) handleKYCDocumentUpload(file, docType.value)
              }"
            >
            <BaseButton
              :variant="uploadingKYC === docType.value ? 'primary' : 'outline'"
              size="sm"
              :loading="uploadingKYC === docType.value"
              @click="document.getElementById(`kyc-${docType.value}`)?.click()"
            >
              <Icon name="solar:upload-bold-duotone" class="size-4" />
              Upload
            </BaseButton>
          </div>

          <!-- Uploaded Documents -->
          <div
            v-if="localKYC.documents.filter(d => d.type === docType.value).length > 0"
            class="mt-3 space-y-2"
          >
            <div
              v-for="doc in localKYC.documents.filter(d => d.type === docType.value)"
              :key="doc.id"
              class="flex items-center justify-between rounded-lg border border-muted-200 bg-white px-3 py-2 dark:border-muted-700 dark:bg-muted-900"
            >
              <div class="flex items-center gap-3">
                <Icon
                  name="solar:document-bold-duotone"
                  class="size-5 text-muted-400"
                />
                <div>
                  <BaseText size="xs" weight="medium" class="text-muted-700 dark:text-muted-300">
                    {{ doc.name }}
                  </BaseText>
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    {{ formatFileSize(doc.fileSize) }} • {{ new Date(doc.uploadedAt).toLocaleDateString() }}
                  </BaseText>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <BaseChip
                  size="xs"
                  :color="doc.status === 'verified' ? 'success' : doc.status === 'rejected' ? 'danger' : 'warning'"
                  variant="pastel"
                >
                  {{ doc.status }}
                </BaseChip>
                <BaseButton
                  size="sm"
                  variant="ghost"
                  icon
                  color="danger"
                  @click="removeDocument(doc.id, 'kyc')"
                >
                  <Icon name="solar:trash-bin-minimalistic-bold-duotone" class="size-4" />
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- KYC Rejection Reason (if rejected) -->
      <div
        v-if="localKYC.status === 'rejected' && localKYC.rejectionReason"
        class="mt-6"
      >
        <RejectionReasonForm
          :model-value="localKYC.rejectionReason"
          label="Rejection Details"
          :required="false"
        />
      </div>
    </BaseCard>

    <!-- KYB Section -->
    <BaseCard class="p-6">
      <div class="mb-6 flex items-center gap-3">
        <div class="flex size-12 items-center justify-center rounded-xl border-2 border-info-200 bg-info-50 dark:border-info-800 dark:bg-info-900/20">
          <Icon
            name="solar:buildings-bold-duotone"
            class="size-6 text-info-500"
          />
        </div>
        <div>
          <BaseHeading
            as="h4"
            size="md"
            weight="semibold"
            class="text-muted-900 dark:text-white"
          >
            KYB (Know Your Business)
          </BaseHeading>
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            Verify business registration and legitimacy
          </BaseText>
        </div>
        <BaseChip
          v-if="localKYB.status !== 'not_started'"
          size="sm"
          :color="localKYB.status === 'verified' ? 'success' : localKYB.status === 'rejected' ? 'danger' : 'info'"
          variant="pastel"
        >
          {{ localKYB.status.replace('_', ' ') }}
        </BaseChip>
      </div>

      <!-- KYB Documents -->
      <div class="space-y-4">
        <div
          v-for="docType in kybDocumentTypes"
          :key="docType.value"
          class="rounded-xl border border-muted-200 bg-muted-50/50 p-4 dark:border-muted-700 dark:bg-muted-900/30"
        >
          <div class="mb-3 flex items-center justify-between">
            <div>
              <BaseText size="sm" weight="medium" class="text-muted-900 dark:text-white">
                {{ docType.label }}
              </BaseText>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Upload {{ docType.label.toLowerCase() }} document
              </BaseText>
            </div>
            <input
              :id="`kyb-${docType.value}`"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              class="hidden"
              @change="(e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) handleKYBDocumentUpload(file, docType.value)
              }"
            >
            <BaseButton
              :variant="uploadingKYB === docType.value ? 'primary' : 'outline'"
              size="sm"
              :loading="uploadingKYB === docType.value"
              @click="document.getElementById(`kyb-${docType.value}`)?.click()"
            >
              <Icon name="solar:upload-bold-duotone" class="size-4" />
              Upload
            </BaseButton>
          </div>

          <!-- Uploaded Documents -->
          <div
            v-if="localKYB.documents.filter(d => d.type === docType.value).length > 0"
            class="mt-3 space-y-2"
          >
            <div
              v-for="doc in localKYB.documents.filter(d => d.type === docType.value)"
              :key="doc.id"
              class="flex items-center justify-between rounded-lg border border-muted-200 bg-white px-3 py-2 dark:border-muted-700 dark:bg-muted-900"
            >
              <div class="flex items-center gap-3">
                <Icon
                  name="solar:document-bold-duotone"
                  class="size-5 text-muted-400"
                />
                <div>
                  <BaseText size="xs" weight="medium" class="text-muted-700 dark:text-muted-300">
                    {{ doc.name }}
                  </BaseText>
                  <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                    {{ formatFileSize(doc.fileSize) }} • {{ new Date(doc.uploadedAt).toLocaleDateString() }}
                  </BaseText>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <BaseChip
                  size="xs"
                  :color="doc.status === 'verified' ? 'success' : doc.status === 'rejected' ? 'danger' : 'warning'"
                  variant="pastel"
                >
                  {{ doc.status }}
                </BaseChip>
                <BaseButton
                  size="sm"
                  variant="ghost"
                  icon
                  color="danger"
                  @click="removeDocument(doc.id, 'kyb')"
                >
                  <Icon name="solar:trash-bin-minimalistic-bold-duotone" class="size-4" />
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- KYB Rejection Reason (if rejected) -->
      <div
        v-if="localKYB.status === 'rejected' && localKYB.rejectionReason"
        class="mt-6"
      >
        <RejectionReasonForm
          :model-value="localKYB.rejectionReason"
          label="Rejection Details"
          :required="false"
        />
      </div>
    </BaseCard>
  </div>
</template>

