<script setup lang="ts">
import { computed } from '#imports'
interface Props {
  email: boolean
  webhook: boolean
  threshold: number
}

const props = withDefaults(defineProps<Props>(), {
  email: false,
  webhook: false,
  threshold: 0,
})

const emit = defineEmits<{
  'update:email': [value: boolean]
  'update:webhook': [value: boolean]
  'update:threshold': [value: number]
}>()

const emailModel = computed({
  get: () => props.email,
  set: (value: boolean) => emit('update:email', value),
})

const webhookModel = computed({
  get: () => props.webhook,
  set: (value: boolean) => emit('update:webhook', value),
})

const thresholdModel = computed({
  get: () => props.threshold,
  set: (value: number) => emit('update:threshold', value),
})
</script>

<template>
  <BaseCard class="p-6">
    <div class="mb-6">
      <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-800 dark:text-muted-100">
        Link Click Notifications
      </BaseHeading>
      <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
        Get notified when your links receive spikes in click activity.
      </BaseParagraph>
    </div>

    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
            Email Notifications
          </BaseText>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            Receive alerts directly in your inbox.
          </BaseParagraph>
        </div>
        <BaseSwitchBall v-model="emailModel" variant="primary" />
      </div>

      <div class="flex items-center justify-between">
        <div>
          <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
            Webhook Notifications
          </BaseText>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            Push click events to your automation pipelines.
          </BaseParagraph>
        </div>
        <BaseSwitchBall v-model="webhookModel" variant="primary" />
      </div>

      <div v-if="emailModel || webhookModel">
        <TairoFormGroup label="Click Threshold" sublabel="Notify only when clicks exceed this number">
          <TairoInput
            v-model.number="thresholdModel"
            type="number"
            min="0"
            icon="solar:mouse-linear"
            rounded="lg"
            class="w-32"
          />
        </TairoFormGroup>
      </div>
    </div>
  </BaseCard>
</template>
