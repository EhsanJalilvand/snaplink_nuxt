<script setup lang="ts">
definePageMeta({
  title: 'Notifications',
  layout: 'dashboard',
})

const toaster = useNuiToasts()

// Notification settings
const settings = ref({
  linkClick: {
    email: true,
    webhook: false,
    threshold: 100,
  },
  linkExpired: {
    email: true,
    webhook: false,
  },
  linkReachedLimit: {
    email: true,
    webhook: true,
  },
  dailySummary: {
    email: true,
    webhook: false,
    time: '09:00',
  },
  weeklyReport: {
    email: true,
    webhook: false,
    day: 'monday',
  },
})

const isSaving = ref(false)

const handleSave = async () => {
  isSaving.value = true
  try {
    // TODO: API call to save notification settings
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toaster.add({
      title: 'Success',
      description: 'Notification settings saved successfully!',
      icon: 'ph:check',
      progress: true,
    })
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to save notification settings',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  } finally {
    isSaving.value = false
  }
}

const weekDays = [
  { label: 'Monday', value: 'monday' },
  { label: 'Tuesday', value: 'tuesday' },
  { label: 'Wednesday', value: 'wednesday' },
  { label: 'Thursday', value: 'thursday' },
  { label: 'Friday', value: 'friday' },
  { label: 'Saturday', value: 'saturday' },
  { label: 'Sunday', value: 'sunday' },
]
</script>

<template>
  <div class="space-y-6 py-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Notifications
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Configure how you receive notifications about your links
        </BaseParagraph>
      </div>
      <BaseButton
        variant="primary"
        :loading="isSaving"
        :disabled="isSaving"
        @click="handleSave"
      >
        <Icon name="ph:check" class="size-4" />
        <span>Save Changes</span>
      </BaseButton>
    </div>

    <!-- Link Click Notifications -->
    <BaseCard class="p-6">
      <div class="mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Link Click Notifications
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Get notified when your links receive clicks
        </BaseParagraph>
      </div>

      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
              Email Notifications
            </BaseText>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              Receive email alerts for link clicks
            </BaseParagraph>
          </div>
          <BaseSwitchBall
            v-model="settings.linkClick.email"
            variant="primary"
          />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
              Webhook Notifications
            </BaseText>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              Send click events to webhook URL
            </BaseParagraph>
          </div>
          <BaseSwitchBall
            v-model="settings.linkClick.webhook"
            variant="primary"
          />
        </div>

        <div v-if="settings.linkClick.email || settings.linkClick.webhook">
          <TairoFormGroup
            label="Click Threshold"
            sublabel="Only notify when clicks exceed this number"
          >
            <TairoInput
              v-model="settings.linkClick.threshold"
              type="number"
              placeholder="100"
              icon="solar:mouse-linear"
              rounded="lg"
              class="w-32"
            />
          </TairoFormGroup>
        </div>
      </div>
    </BaseCard>

    <!-- Link Status Notifications -->
    <BaseCard class="p-6">
      <div class="mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Link Status Notifications
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Get notified about link status changes
        </BaseParagraph>
      </div>

      <div class="space-y-6">
        <!-- Link Expired -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
                Link Expired
              </BaseText>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                Get notified when a link expires
              </BaseParagraph>
            </div>
            <div class="flex items-center gap-4">
              <BaseSwitchBall
                v-model="settings.linkExpired.email"
                variant="primary"
              />
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Email
              </BaseText>
            </div>
          </div>
        </div>

        <!-- Link Reached Limit -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
                Link Reached Click Limit
              </BaseText>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                Get notified when a link reaches its click limit
              </BaseParagraph>
            </div>
            <div class="flex items-center gap-4">
              <BaseSwitchBall
                v-model="settings.linkReachedLimit.email"
                variant="primary"
              />
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Email
              </BaseText>
              <BaseSwitchBall
                v-model="settings.linkReachedLimit.webhook"
                variant="primary"
              />
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Webhook
              </BaseText>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Reports -->
    <BaseCard class="p-6">
      <div class="mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Automated Reports
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Schedule automated reports and summaries
        </BaseParagraph>
      </div>

      <div class="space-y-6">
        <!-- Daily Summary -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
                Daily Summary
              </BaseText>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                Receive daily summary of your link performance
              </BaseParagraph>
            </div>
            <BaseSwitchBall
              v-model="settings.dailySummary.email"
              variant="primary"
            />
          </div>
          <div v-if="settings.dailySummary.email">
            <TairoFormGroup
              label="Summary Time"
              sublabel="Time to send daily summary"
            >
              <TairoInput
                v-model="settings.dailySummary.time"
                type="time"
                icon="solar:clock-circle-linear"
                rounded="lg"
                class="w-32"
              />
            </TairoFormGroup>
          </div>
        </div>

        <!-- Weekly Report -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
                Weekly Report
              </BaseText>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                Receive weekly analytics report
              </BaseParagraph>
            </div>
            <BaseSwitchBall
              v-model="settings.weeklyReport.email"
              variant="primary"
            />
          </div>
          <div v-if="settings.weeklyReport.email">
            <TairoFormGroup
              label="Report Day"
              sublabel="Day of the week to send report"
            >
              <TairoSelect
                v-model="settings.weeklyReport.day"
                icon="solar:calendar-linear"
                rounded="lg"
                class="w-40"
              >
                <BaseSelectItem
                  v-for="day in weekDays"
                  :key="day.value"
                  :value="day.value"
                >
                  {{ day.label }}
                </BaseSelectItem>
              </TairoSelect>
            </TairoFormGroup>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

