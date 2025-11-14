<script setup lang="ts">
import { ref, watch } from '#imports'
import { usePreferencesPermissions } from '~/composables/usePreferencesPermissions'
import type { PermissionMapping } from '~/types/preferences'

const props = defineProps<{
  workspaceId?: string | null
}>()

const {
  permissions,
  permissionsByCategory,
  roles,
  isLoading,
  isSaving,
  error,
  savePermissions,
  getPermissionForRole,
} = usePreferencesPermissions(props.workspaceId)

const permissionMappings = ref<Map<string, boolean>>(new Map())

// Initialize mappings from existing role permissions
const initializeMappings = () => {
  permissionMappings.value.clear()
  roles.forEach((role) => {
    permissions.value.forEach((perm) => {
      const key = `${role}-${perm.id}`
      permissionMappings.value.set(key, getPermissionForRole(role, perm.id))
    })
  })
}

watch([permissions, () => props.workspaceId], () => {
  if (permissions.value.length > 0) {
    initializeMappings()
  }
}, { immediate: true })

const togglePermission = (role: string, permissionId: number) => {
  // Owner cannot be changed
  if (role === 'Owner') {
    return
  }

  const key = `${role}-${permissionId}`
  const current = permissionMappings.value.get(key) ?? false
  permissionMappings.value.set(key, !current)
}

const handleSave = async () => {
  const mappings: PermissionMapping[] = []

  roles.forEach((role) => {
    permissions.value.forEach((perm) => {
      const key = `${role}-${perm.id}`
      const allowed = permissionMappings.value.get(key) ?? false
      mappings.push({
        role: role as PermissionMapping['role'],
        permission: perm.id,
        allowed,
      })
    })
  })

  await savePermissions(mappings)
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
        Unable to load permissions
      </template>
      <p class="text-sm text-muted-600 dark:text-muted-300">
        {{ error }}
      </p>
    </BaseAlert>

    <div
      v-if="isLoading"
      class="space-y-3"
    >
      <BaseCard
        v-for="index in 3"
        :key="index"
        class="h-24 animate-pulse rounded-xl bg-muted-200/80 dark:bg-muted-800/60"
      />
    </div>

    <template v-else>
      <div
        v-for="category in permissionsByCategory"
        :key="category.category"
        class="bg-white dark:bg-muted-800 rounded-lg border border-muted-200 dark:border-muted-700 p-6"
      >
        <div class="mb-6">
          <BaseHeading
            as="h3"
            size="md"
            weight="semibold"
            class="text-muted-800 dark:text-muted-100 mb-2"
          >
            {{ category.category }}
          </BaseHeading>
          <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
            Manage permissions for {{ category.category.toLowerCase() }}
          </BaseParagraph>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-muted-200 dark:border-muted-700">
                <th class="text-left py-3 px-4 text-sm font-semibold text-muted-600 dark:text-muted-400">
                  Permission
                </th>
                <th
                  v-for="role in roles"
                  :key="role"
                  class="text-center py-3 px-4 text-sm font-semibold text-muted-600 dark:text-muted-400"
                >
                  {{ role }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="permission in category.permissions"
                :key="permission.id"
                class="border-b border-muted-100 dark:border-muted-800/50 hover:bg-muted-50 dark:hover:bg-muted-700/50"
              >
                <td class="py-3 px-4">
                  <div>
                    <BaseText
                      size="sm"
                      weight="medium"
                      class="text-muted-800 dark:text-muted-100"
                    >
                      {{ permission.name }}
                    </BaseText>
                    <BaseText
                      size="xs"
                      class="text-muted-500 dark:text-muted-400"
                    >
                      {{ permission.description }}
                    </BaseText>
                  </div>
                </td>
                <td
                  v-for="role in roles"
                  :key="`${permission.id}-${role}`"
                  class="text-center py-3 px-4"
                >
                  <BaseCheckbox
                    :model-value="permissionMappings.get(`${role}-${permission.id}`) ?? (role === 'Owner')"
                    :disabled="role === 'Owner' || isLoading"
                    @update:model-value="togglePermission(role, permission.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <BaseButton
          variant="primary"
          :loading="isSaving"
          :disabled="isSaving || isLoading"
          @click="handleSave"
        >
          <Icon name="ph:check" class="size-4" />
          <span>Save Changes</span>
        </BaseButton>
      </div>
    </template>
  </div>
</template>

