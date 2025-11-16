<script setup lang="ts">
import { ref, watch, nextTick } from '#imports'
import { usePreferencesPermissions } from '~/composables/usePreferencesPermissions'
import type { PermissionMapping } from '~/types/preferences'

const props = defineProps<{
  workspaceId?: string | null
}>()

const {
  permissions,
  rolePermissions,
  permissionsByCategory,
  roles,
  isLoading,
  isSaving,
  error,
  savePermissions,
  getPermissionForRole,
} = usePreferencesPermissions(props.workspaceId)

const permissionMappings = ref<Record<string, boolean>>({})

// Initialize mappings from existing role permissions
const initializeMappings = () => {
  if (import.meta.dev) {
    console.log('[PreferencesPermissions] Initializing mappings...', {
      permissionsCount: permissions.value.length,
      rolePermissionsCount: rolePermissions.value.length,
    })
  }
  // Create a new object instead of Map to ensure Vue reactivity
  const newMappings: Record<string, boolean> = {}
  roles.forEach((role) => {
    permissions.value.forEach((perm) => {
      const key = `${role}-${perm.permission}`
      const allowed = getPermissionForRole(role, perm.permission)
      newMappings[key] = allowed
      // Owner permissions are always true, so this should never happen
      if (import.meta.dev && role === 'Owner' && !allowed) {
        console.warn('[PreferencesPermissions] Owner permission is false (unexpected):', {
          permission: perm.permission,
        })
      }
    })
  })
  permissionMappings.value = newMappings
  // Log only in dev mode and only once per initialization
  if (import.meta.dev) {
    console.log('[PreferencesPermissions] Mappings initialized:', {
      mappingsCount: Object.keys(permissionMappings.value).length,
    })
  }
}

watch([permissions, rolePermissions, () => props.workspaceId], () => {
  if (permissions.value.length > 0) {
    // Use nextTick to ensure Vue reactivity works correctly
    nextTick(() => {
    initializeMappings()
    })
  }
}, { immediate: true, deep: true })

const togglePermission = (role: string, permissionId: number) => {
  // Owner cannot be changed
  if (role === 'Owner') {
    return
  }

  const key = `${role}-${permissionId}`
  const current = permissionMappings.value[key] ?? false
  permissionMappings.value[key] = !current
}

const handleSave = async () => {
  const mappings: PermissionMapping[] = []

  roles.forEach((role) => {
    // Skip Owner role - it cannot be changed
    if (role === 'Owner') {
      return
    }

    permissions.value.forEach((perm) => {
      const key = `${role}-${perm.permission}`
      const allowed = permissionMappings.value[key] ?? false
      mappings.push({
        role: role as PermissionMapping['role'],
        permission: perm.permission,
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
                  :key="`${permission.permission}-${role}`"
                  class="text-center py-3 px-4"
                >
                  <BaseCheckbox
                    :model-value="permissionMappings[`${role}-${permission.permission}`] ?? (role === 'Owner')"
                    :disabled="role === 'Owner' || isLoading"
                    @update:model-value="togglePermission(role, permission.permission)"
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


