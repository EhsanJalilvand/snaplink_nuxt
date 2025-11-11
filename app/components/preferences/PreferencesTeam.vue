<script setup lang="ts">
import { callOnce, ref } from '#imports'
import { usePreferencesTeam } from '~/composables/usePreferencesTeam'

const {
  members,
  isLoading,
  isInviting,
  error,
  roleOptions,
  fetchMembers,
  inviteMember,
  removeMember,
  updateRole,
} = usePreferencesTeam()

const inviteEmail = ref('')
const inviteRole = ref<'member' | 'admin' | 'owner'>('member')

await callOnce(() => fetchMembers())

const handleInvite = async () => {
  if (!inviteEmail.value) {
    return
  }

  await inviteMember({
    email: inviteEmail.value,
    role: inviteRole.value,
  })

  inviteEmail.value = ''
  inviteRole.value = 'member'
}

const handleRemoveMember = async (memberId: string) => {
  await removeMember(memberId)
}

const handleUpdateRole = async (memberId: string, newRole: string) => {
  await updateRole(memberId, newRole as typeof inviteRole.value)
}
</script>

<template>
  <div class="space-y-6">
    <BaseAlert
      v-if="error"
      color="warning"
      variant="pastel"
      class="rounded-2xl"
    >
      <template #title>
        Using cached team members
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

    <!-- Invite Team Member -->
    <div class="bg-white dark:bg-muted-800 rounded-lg border border-muted-200 dark:border-muted-700 p-6">
      <div class="mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Invite Team Member
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Invite team members to collaborate on your workspace
        </BaseParagraph>
      </div>

      <div class="flex gap-4">
        <TairoInput
          v-model="inviteEmail"
          type="email"
          placeholder="Enter email address"
          icon="solar:letter-linear"
          rounded="lg"
          class="flex-1"
          :disabled="isInviting"
        />
        <TairoSelect
          v-model="inviteRole"
          icon="solar:user-id-linear"
          rounded="lg"
          class="w-40"
          :disabled="isInviting"
        >
          <BaseSelectItem
            v-for="option in roleOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </BaseSelectItem>
        </TairoSelect>
        <BaseButton
          variant="primary"
          :loading="isInviting"
          :disabled="isInviting || !inviteEmail"
          @click="handleInvite"
        >
          <Icon name="ph:plus" class="size-4" />
          <span>Invite</span>
        </BaseButton>
      </div>
    </div>

    <!-- Team Members List -->
    <div class="bg-white dark:bg-muted-800 rounded-lg border border-muted-200 dark:border-muted-700 p-6">
      <div class="mb-6">
        <BaseHeading
          as="h3"
          size="md"
          weight="semibold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Team Members
        </BaseHeading>
        <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
          Manage your team members and their roles
        </BaseParagraph>
      </div>

      <div class="space-y-4">
        <div
          v-for="member in members"
          :key="member.id"
          class="flex items-center justify-between p-4 border border-muted-200 dark:border-muted-700 rounded-lg hover:bg-muted-50 dark:hover:bg-muted-700/50 transition-colors"
        >
          <div class="flex items-center gap-4">
            <BaseAvatar
              :src="member.avatar"
              :text="member.name"
              size="md"
            />
            <div>
              <BaseHeading
                as="h4"
                size="sm"
                weight="semibold"
                class="text-muted-800 dark:text-muted-100"
              >
                {{ member.name }}
              </BaseHeading>
              <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
                {{ member.email }}
              </BaseParagraph>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <BaseChip
              :color="member.status === 'active' ? 'success' : 'warning'"
              size="sm"
            >
              {{ member.status === 'active' ? 'Active' : 'Pending' }}
            </BaseChip>

            <TairoSelect
              :model-value="member.role"
              icon="solar:user-id-linear"
              size="sm"
              rounded="lg"
              class="w-32"
              :disabled="isLoading"
              @update:model-value="(value) => handleUpdateRole(member.id, value as string)"
            >
              <BaseSelectItem
                v-for="option in roleOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </BaseSelectItem>
            </TairoSelect>

            <BaseButton
              size="sm"
              variant="ghost"
              color="danger"
              @click="handleRemoveMember(member.id)"
            >
              <Icon name="lucide:trash-2" class="size-4" />
            </BaseButton>
          </div>
        </div>

        <div
          v-if="!isLoading && members.length === 0"
          class="text-center py-12"
        >
          <Icon name="solar:users-group-linear" class="size-12 text-muted-400 mx-auto mb-4" />
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            No team members yet. Invite someone to get started!
          </BaseParagraph>
        </div>
      </div>
    </div>
    <div v-if="isLoading" class="space-y-3">
      <BaseCard
        v-for="index in 3"
        :key="index"
        class="h-24 animate-pulse rounded-xl bg-muted-200/80 dark:bg-muted-800/60"
      />
    </div>
  </div>
</template>

