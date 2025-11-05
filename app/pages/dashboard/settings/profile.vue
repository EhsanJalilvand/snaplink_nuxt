<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Field, useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  title: 'Edit Profile',
  layout: 'dashboard',
})

const VALIDATION_TEXT = {
  FIRSTNAME_REQUIRED: 'First name is required',
  FIRSTNAME_TOO_LONG: 'First name is too long',
  LASTNAME_TOO_LONG: 'Last name is too long',
  EMAIL_REQUIRED: 'A valid email is required',
  EMAIL_INVALID: 'Invalid email address',
}

// This is the Zod schema for the form input (only firstName and lastName)
const zodSchema = z.object({
  firstName: z.string()
    .min(1, VALIDATION_TEXT.FIRSTNAME_REQUIRED)
    .max(100, VALIDATION_TEXT.FIRSTNAME_TOO_LONG),
  lastName: z.string()
    .max(100, VALIDATION_TEXT.LASTNAME_TOO_LONG)
    .optional()
    .transform((val) => val || ''),
})

type FormInput = z.infer<typeof zodSchema>

const validationSchema = toTypedSchema(zodSchema)

// Use shared user data composable for consistent state across all components
const { user: sharedUser, refreshUser } = useUserData()

const {
  handleSubmit,
  isSubmitting,
  setFieldError,
  resetForm,
  errors,
  setValues,
  setFieldValue,
} = useForm({
  validationSchema,
  initialValues: {
    firstName: '',
    lastName: '',
  },
})

const success = ref(false)
const toaster = useNuiToasts()
const router = useRouter()


// Watch for user data changes to update form - only on client side
watch(sharedUser, (newUser) => {
  if (newUser) {
    nextTick(() => {
      setFieldValue('firstName', newUser.firstName || '')
      setFieldValue('lastName', newUser.lastName || '')
    })
  }
}, { immediate: true })

// Also update on mount to ensure values are set
onMounted(() => {
  nextTick(() => {
    if (sharedUser.value) {
      setFieldValue('firstName', sharedUser.value.firstName || '')
      setFieldValue('lastName', sharedUser.value.lastName || '')
    }
  })
})

const onSubmit = handleSubmit(async (values) => {
  success.value = false

  try {
    // Call update profile API (only firstName and lastName, no email)
    const response = await $fetch('/api/auth/profile', {
      method: 'PUT',
      body: {
        firstName: values.firstName,
        lastName: values.lastName || undefined,
      },
    })

    if (response.success) {
      // Refresh all user data from server (shared cache)
      await refreshUser()
      
      // Also refresh auth state to update layout
      const { checkAuth: refreshAuth } = useAuth()
      await refreshAuth()

      toaster.add({
        title: 'Success',
        description: 'Your profile has been updated!',
        icon: 'ph:check',
        progress: true,
      })

      success.value = true
      setTimeout(() => {
        success.value = false
      }, 3000)
    }
  }
  catch (error: any) {
    // Handle errors
    if (error.statusCode === 400 && error.data) {
      // Handle validation errors
      const validationErrors = error.data as Array<{ path: string[]; message: string }>
      validationErrors.forEach((err) => {
        if (err.path && err.path.length > 0) {
          setFieldError(err.path[0] as keyof FormInput, err.message)
        }
      })
    }
    else if (error.statusCode === 409) {
      // Handle conflict errors
      const errorMessage = error.statusMessage || error.message || 'Failed to update profile'
      toaster.add({
        title: 'Error',
        description: errorMessage,
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
    }
    else {
      toaster.add({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        icon: 'lucide:alert-triangle',
        color: 'danger',
        progress: true,
      })
    }

    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to update profile',
      icon: 'lucide:alert-triangle',
      color: 'danger',
      progress: true,
    })
  }
})

</script>

<template>
  <form
    method="POST"
    action=""
    class="w-full pb-16 max-w-3xl dark:[--color-input-default-bg:var(--color-muted-950)]"
    novalidate
    @submit.prevent="onSubmit"
  >
    <div class="flex items-center justify-between border-b border-muted-300 dark:border-muted-800 pb-4 mb-6">
      <div>
        <BaseHeading
          as="h1"
          size="2xl"
          weight="bold"
          class="text-muted-800 dark:text-muted-100 mb-2"
        >
          Edit Profile
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Update your personal information
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton
          type="button"
          variant="ghost"
          to="/dashboard/settings"
        >
          Cancel
        </BaseButton>
        <BaseButton
          type="submit"
          variant="primary"
          :disabled="isSubmitting"
          :loading="isSubmitting"
        >
          Save
        </BaseButton>
      </div>
    </div>

    <div>
      <div class="space-y-12">
        <BaseMessage v-if="success" @close="success = false">
          Your profile has been updated!
        </BaseMessage>

        <TairoFormGroup
          label="Profile Picture"
          sublabel="This is how others will recognize you"
        >
          <div class="flex justify-center">
            <AvatarEditor size="lg" />
          </div>
        </TairoFormGroup>

        <TairoFormGroup
          label="Personal Information"
          sublabel="Update your name and email address"
        >
          <div class="grid grid-cols-12 gap-4">
            <Field
              v-slot="{ field, errorMessage, handleChange, handleBlur }"
              name="firstName"
            >
              <BaseField
                v-slot="{ inputAttrs, inputRef }"
                label="First Name"
                :error="errorMessage"
                :disabled="isSubmitting"
                class="col-span-12 sm:col-span-6"
                required
              >
                <TairoInput
                  :ref="inputRef"
                  v-bind="inputAttrs"
                  :model-value="field.value"
                  :aria-invalid="errorMessage ? 'true' : undefined"
                  icon="solar:user-rounded-linear"
                  placeholder="First name"
                  rounded="lg"
                  @update:model-value="handleChange"
                  @blur="handleBlur"
                />
              </BaseField>
            </Field>

            <Field
              v-slot="{ field, errorMessage, handleChange, handleBlur }"
              name="lastName"
            >
              <BaseField
                v-slot="{ inputAttrs, inputRef }"
                label="Last Name (Optional)"
                :error="errorMessage"
                :disabled="isSubmitting"
                class="col-span-12 sm:col-span-6"
              >
                <TairoInput
                  :ref="inputRef"
                  v-bind="inputAttrs"
                  :model-value="field.value"
                  :aria-invalid="errorMessage ? 'true' : undefined"
                  icon="solar:user-rounded-linear"
                  placeholder="Last name"
                  rounded="lg"
                  @update:model-value="handleChange"
                  @blur="handleBlur"
                />
              </BaseField>
            </Field>

          </div>
        </TairoFormGroup>
      </div>
    </div>
  </form>
</template>

