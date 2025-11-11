<script setup lang="ts">
import { computed } from '#imports'
interface StatusState {
  email: boolean
  webhook?: boolean
}

interface Props {
  expired: StatusState
  limit: StatusState
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:expired-email': [value: boolean]
  'update:limit-email': [value: boolean]
  'update:limit-webhook': [value: boolean]
}>()

const expiredEmail = computed({
  get: () => props.expired.email,
  set: (value: boolean) => emit('update:expired-email', value),
})

const limitEmail = computed({
  get: () => props.limit.email,
  set: (value: boolean) => emit('update:limit-email', value),
})

const limitWebhook = computed({
  get: () => props.limit.webhook ?? false,
  set: (value: boolean) => emit('update:limit-webhook', value),
})
</script>

<template>
  <BaseCard class="p-6">
    <div class="mb-6">
      <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-800 dark:text-muted-100">
        Link Status Notifications
      </BaseHeading>
      <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
        Stay informed about link expirations and limit thresholds.
      </BaseParagraph>
    </div>

    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
            Link Expired
          </BaseText>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            Notify your team when a short link has expired.
          </BaseParagraph>
        </div>
        <BaseSwitchBall v-model="expiredEmail" variant="primary" />
      </div>

      <div class="flex items-center justify-between">
        <div>
          <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
            Link Reached Click Limit
          </BaseText>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            Trigger alerts when a link reaches its configured limit.
          </BaseParagraph>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <BaseSwitchBall v-model="limitEmail" variant="primary" />
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Email
            </BaseText>
          </div>
          <div class="flex items-center gap-2">
            <BaseSwitchBall v-model="limitWebhook" variant="primary" />
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              Webhook
            </BaseText>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
