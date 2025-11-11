<script setup lang="ts">
import { computed } from '#imports'
interface Props {
  dailyEmail: boolean
  dailyTime: string
  weeklyEmail: boolean
  weeklyDay: string
  weekdays: Array<{ label: string; value: string }>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:daily-email': [value: boolean]
  'update:daily-time': [value: string]
  'update:weekly-email': [value: boolean]
  'update:weekly-day': [value: string]
}>()

const dailyEmail = computed({
  get: () => props.dailyEmail,
  set: (value: boolean) => emit('update:daily-email', value),
})

const dailyTime = computed({
  get: () => props.dailyTime,
  set: (value: string) => emit('update:daily-time', value),
})

const weeklyEmail = computed({
  get: () => props.weeklyEmail,
  set: (value: boolean) => emit('update:weekly-email', value),
})

const weeklyDay = computed({
  get: () => props.weeklyDay,
  set: (value: string) => emit('update:weekly-day', value),
})
</script>

<template>
  <BaseCard class="p-6">
    <div class="mb-6">
      <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-800 dark:text-muted-100">
        Automated Reports
      </BaseHeading>
      <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
        Schedule daily summaries and weekly performance reports.
      </BaseParagraph>
    </div>

    <div class="space-y-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
              Daily Summary
            </BaseText>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              Receive a daily overview of link performance at your preferred time.
            </BaseParagraph>
          </div>
          <BaseSwitchBall v-model="dailyEmail" variant="primary" />
        </div>
        <div v-if="dailyEmail">
          <TairoFormGroup label="Summary Time" sublabel="Choose the time to send the summary">
            <TairoInput
              v-model="dailyTime"
              type="time"
              icon="solar:clock-circle-linear"
              rounded="lg"
              class="w-32"
            />
          </TairoFormGroup>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
              Weekly Report
            </BaseText>
            <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
              Receive a detailed analytics report once per week.
            </BaseParagraph>
          </div>
          <BaseSwitchBall v-model="weeklyEmail" variant="primary" />
        </div>
        <div v-if="weeklyEmail">
          <TairoFormGroup label="Report Day" sublabel="Select which day to send the weekly report">
            <TairoSelect
              v-model="weeklyDay"
              icon="solar:calendar-linear"
              rounded="lg"
              class="w-40"
            >
              <BaseSelectItem
                v-for="day in props.weekdays"
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
</template>
