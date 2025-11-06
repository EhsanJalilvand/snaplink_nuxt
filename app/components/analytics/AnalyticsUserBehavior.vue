<script setup lang="ts">
defineProps<{
  selectedIds: string[]
  reportType: 'links' | 'collections'
  period: string
}>()

// Click frequency per user
const clickFrequency = ref([
  { frequency: '1 click', users: 45200, percentage: 36 },
  { frequency: '2-5 clicks', users: 28900, percentage: 23 },
  { frequency: '6-10 clicks', users: 18900, percentage: 15 },
  { frequency: '11-20 clicks', users: 12800, percentage: 10 },
  { frequency: '21-50 clicks', users: 9800, percentage: 8 },
  { frequency: '50+ clicks', users: 11047, percentage: 9 },
])

// Active hours
const activeHours = ref([
  { hour: '00:00', clicks: 1200 },
  { hour: '02:00', clicks: 800 },
  { hour: '04:00', clicks: 600 },
  { hour: '06:00', clicks: 1500 },
  { hour: '08:00', clicks: 8500 },
  { hour: '10:00', clicks: 12000 },
  { hour: '12:00', clicks: 15000 },
  { hour: '14:00', clicks: 18000 },
  { hour: '16:00', clicks: 20000 },
  { hour: '18:00', clicks: 22000 },
  { hour: '20:00', clicks: 15000 },
  { hour: '22:00', clicks: 8000 },
])

// Active days
const activeDays = ref([
  { day: 'Monday', clicks: 18500, short: 'Mon' },
  { day: 'Tuesday', clicks: 19200, short: 'Tue' },
  { day: 'Wednesday', clicks: 20100, short: 'Wed' },
  { day: 'Thursday', clicks: 19800, short: 'Thu' },
  { day: 'Friday', clicks: 21500, short: 'Fri' },
  { day: 'Saturday', clicks: 16800, short: 'Sat' },
  { day: 'Sunday', clicks: 10747, short: 'Sun' },
])

// Repeat clickers
const repeatClickers = ref([
  { userId: 'user_001', clicks: 125, lastClick: '2024-03-10', status: 'active' },
  { userId: 'user_002', clicks: 98, lastClick: '2024-03-09', status: 'active' },
  { userId: 'user_003', clicks: 87, lastClick: '2024-03-08', status: 'active' },
  { userId: 'user_004', clicks: 76, lastClick: '2024-03-07', status: 'active' },
  { userId: 'user_005', clicks: 65, lastClick: '2024-03-06', status: 'active' },
])

const maxHourClicks = computed(() => Math.max(...activeHours.value.map(h => h.clicks)))
const maxDayClicks = computed(() => Math.max(...activeDays.value.map(d => d.clicks)))
</script>

<template>
  <div class="space-y-6">
    <!-- Click Frequency Per User -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Click Frequency Per User
      </BaseHeading>
      <div class="space-y-4">
        <div
          v-for="freq in clickFrequency"
          :key="freq.frequency"
          class="flex items-center justify-between p-4 border border-muted-200 dark:border-muted-700 rounded-lg hover:bg-muted-50 dark:hover:bg-muted-800/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <Icon name="solar:user-id-linear" class="size-5 text-muted-400" />
            <div>
              <BaseText size="sm" weight="medium" class="text-muted-800 dark:text-muted-100">
                {{ freq.frequency }}
              </BaseText>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                {{ freq.percentage }}% of users
              </BaseText>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
              {{ freq.users.toLocaleString() }}
            </BaseText>
            <div class="w-24 h-2 bg-muted-200 dark:bg-muted-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary-500 rounded-full transition-all"
                :style="{ width: `${freq.percentage}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Active Hours -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Active Hours
      </BaseHeading>
      <div class="h-64 flex items-end justify-between gap-1">
        <div
          v-for="hour in activeHours"
          :key="hour.hour"
          class="flex-1 flex flex-col items-center gap-2 group"
        >
          <div
            class="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-600 cursor-pointer"
            :style="{ height: `${(hour.clicks / maxHourClicks) * 100}%` }"
            :title="`${hour.hour}: ${hour.clicks} clicks`"
          />
          <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
            {{ hour.hour }}
          </BaseText>
        </div>
      </div>
    </BaseCard>

    <!-- Active Days -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Active Days
      </BaseHeading>
      <div class="h-48 flex items-end justify-between gap-2">
        <div
          v-for="day in activeDays"
          :key="day.day"
          class="flex-1 flex flex-col items-center gap-2 group"
        >
          <div
            class="w-full bg-success-500 rounded-t transition-all hover:bg-success-600 cursor-pointer"
            :style="{ height: `${(day.clicks / maxDayClicks) * 100}%` }"
            :title="`${day.day}: ${day.clicks} clicks`"
          />
          <div class="text-center">
            <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
              {{ day.short }}
            </BaseText>
            <BaseText size="xs" weight="semibold" class="text-muted-900 dark:text-muted-100 mt-1">
              {{ day.clicks.toLocaleString() }}
            </BaseText>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Repeat Clickers -->
    <BaseCard class="p-6">
      <BaseHeading
        as="h3"
        size="md"
        weight="semibold"
        class="text-muted-800 dark:text-muted-100 mb-6"
      >
        Top Repeat Clickers
      </BaseHeading>
      <div class="space-y-3">
        <div
          v-for="clicker in repeatClickers"
          :key="clicker.userId"
          class="flex items-center justify-between p-4 border border-muted-200 dark:border-muted-700 rounded-lg hover:bg-muted-50 dark:hover:bg-muted-800/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <Icon name="solar:user-id-linear" class="size-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <BaseHeading
                as="h4"
                size="sm"
                weight="semibold"
                class="text-muted-900 dark:text-muted-100"
              >
                {{ clicker.userId }}
              </BaseHeading>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                Last click: {{ new Date(clicker.lastClick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
              </BaseText>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <BaseText size="sm" weight="semibold" class="text-muted-900 dark:text-muted-100">
                {{ clicker.clicks }}
              </BaseText>
              <BaseText size="xs" class="text-muted-500 dark:text-muted-400">
                clicks
              </BaseText>
            </div>
            <BaseChip
              :color="clicker.status === 'active' ? 'success' : 'muted'"
              size="sm"
            >
              {{ clicker.status }}
            </BaseChip>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

