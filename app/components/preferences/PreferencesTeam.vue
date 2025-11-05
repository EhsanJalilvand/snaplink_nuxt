<script setup lang="ts">
import { ref } from 'vue'
import { useNuiToasts } from '#imports'

const toaster = useNuiToasts()

// Team members state
const teamMembers = ref([
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Owner',
    avatar: null,
    status: 'active',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Admin',
    avatar: null,
    status: 'active',
  },
])

const isInviting = ref(false)
const inviteEmail = ref('')
const inviteRole = ref('member')

const roleOptions = [
  { label: 'Member', value: 'member' },
  { label: 'Admin', value: 'admin' },
  { label: 'Owner', value: 'owner' },
]

const handleInvite = async () => {
  if (!inviteEmail.value) {
    toaster.add({
      title: 'Error',
      description: 'Please enter an email address',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
    return
  }

  isInviting.value = true
  try {
    // TODO: API call to invite team member
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    teamMembers.value.push({
      id: Date.now().toString(),
      name: inviteEmail.value.split('@')[0],
      email: inviteEmail.value,
      role: inviteRole.value,
      avatar: null,
      status: 'pending',
    })

    inviteEmail.value = ''
    inviteRole.value = 'member'

    toaster.add({
      title: 'Success',
      description: 'Invitation sent successfully!',
      icon: 'ph:check',
      progress: true,
    })
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to send invitation',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  } finally {
    isInviting.value = false
  }
}

const handleRemoveMember = async (memberId: string) => {
  try {
    // TODO: API call to remove team member
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    teamMembers.value = teamMembers.value.filter(m => m.id !== memberId)
    
    toaster.add({
      title: 'Success',
      description: 'Team member removed successfully!',
      icon: 'ph:check',
      progress: true,
    })
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to remove team member',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  }
}

const handleUpdateRole = async (memberId: string, newRole: string) => {
  try {
    // TODO: API call to update team member role
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const member = teamMembers.value.find(m => m.id === memberId)
    if (member) {
      member.role = newRole
    }
    
    toaster.add({
      title: 'Success',
      description: 'Role updated successfully!',
      icon: 'ph:check',
      progress: true,
    })
  } catch (error: any) {
    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to update role',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  }
}
</script>

<template>
  <div class="space-y-6">
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
        />
        <TairoSelect
          v-model="inviteRole"
          icon="solar:user-id-linear"
          rounded="lg"
          class="w-40"
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
          v-for="member in teamMembers"
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
          v-if="teamMembers.length === 0"
          class="text-center py-12"
        >
          <Icon name="solar:users-group-linear" class="size-12 text-muted-400 mx-auto mb-4" />
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            No team members yet. Invite someone to get started!
          </BaseParagraph>
        </div>
      </div>
    </div>
  </div>
</template>

