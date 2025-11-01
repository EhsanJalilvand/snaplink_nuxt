<script setup lang="ts">
import type { InputMask } from 'imask'
import { toTypedSchema } from '@vee-validate/zod'
import IMask from 'imask'
import { Field, useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  title: 'Security Settings',
  layout: 'dashboard',
})

const VALIDATION_TEXT = {
  CURRENT_PASSWORD_REQUIRED: 'Your current password is required',
  NEW_PASSWORD_LENGTH: 'Password must be at least 6 characters with letters and numbers',
  NEW_PASSWORD_MATCH: 'Passwords do not match',
  PHONE_REQUIRED: 'Phone number is required for 2FA',
}

// This is the Zod schema for the form input
const zodSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
    twoFactor: z.object({
      enabled: z.boolean(),
      phoneNumber: z.string().optional(),
    }),
  })
  .superRefine((data, ctx) => {
    // Only validate password fields if at least one is provided
    const hasPasswordFields = !!(data.newPassword || data.confirmPassword || data.currentPassword)
    
    if (hasPasswordFields) {
      // If any password field is filled, all must be filled
      if (!data.currentPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VALIDATION_TEXT.CURRENT_PASSWORD_REQUIRED,
          path: ['currentPassword'],
        })
      }
      if (!data.newPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VALIDATION_TEXT.NEW_PASSWORD_LENGTH,
          path: ['newPassword'],
        })
      } else {
        // Validate password strength only if password is provided
        if (data.newPassword.length < 6) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: VALIDATION_TEXT.NEW_PASSWORD_LENGTH,
            path: ['newPassword'],
          })
        }
        if (!/[A-Za-z]/.test(data.newPassword)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password must contain at least one letter',
            path: ['newPassword'],
          })
        }
        if (!/[0-9]/.test(data.newPassword)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password must contain at least one number',
            path: ['newPassword'],
          })
        }
      }
      if (data.newPassword && data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VALIDATION_TEXT.NEW_PASSWORD_MATCH,
          path: ['confirmPassword'],
        })
      }
    }

    // Validate 2FA phone number only if 2FA is enabled
    if (data.twoFactor.enabled && !data.twoFactor.phoneNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_TEXT.PHONE_REQUIRED,
        path: ['twoFactor.phoneNumber'],
      })
    }
  })

type FormInput = z.infer<typeof zodSchema>

const validationSchema = toTypedSchema(zodSchema)
const initialValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  twoFactor: {
    enabled: false,
    phoneNumber: '',
  },
} satisfies FormInput

const {
  handleSubmit,
  isSubmitting,
  setFieldError,
  resetForm,
  values,
} = useForm({
  validationSchema,
  initialValues,
})

const success = ref(false)
const toaster = useNuiToasts()

// Phone number mask
const phoneInput = useTemplateRef<any>('phoneInput')
const mask = shallowRef<InputMask<{ mask: string }> | undefined>(undefined)

watchEffect(() => {
  if (phoneInput.value?.$el) {
    mask.value = IMask(phoneInput.value.$el, {
      mask: '(000) 000-0000',
    })
  }

  return () => {
    mask.value?.destroy()
    mask.value = undefined
  }
})

const onSubmit = handleSubmit(async (values) => {
  success.value = false

  try {
    // If password fields are filled, update password
    if (values.currentPassword && values.newPassword) {
      const passwordResponse = await $fetch('/api/auth/change-password', {
        method: 'PUT',
        body: {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
      })

      if (passwordResponse.success) {
        toaster.add({
          title: 'Success',
          description: 'Password has been changed!',
          icon: 'ph:check',
          progress: true,
        })
      }
    }

    // If 2FA is enabled/disabled, update 2FA settings
    if (values.twoFactor.enabled !== initialValues.twoFactor.enabled) {
      const twoFactorResponse = await $fetch('/api/auth/two-factor', {
        method: 'PUT',
        body: {
          enabled: values.twoFactor.enabled,
          phoneNumber: values.twoFactor.phoneNumber || undefined,
        },
      })

      if (twoFactorResponse.success) {
        toaster.add({
          title: 'Success',
          description: values.twoFactor.enabled
            ? '2FA has been enabled!'
            : '2FA has been disabled!',
          icon: 'ph:check',
          progress: true,
        })
      }
    }

    success.value = true
    resetForm()
    setTimeout(() => {
      success.value = false
    }, 3000)
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
    else if (error.statusCode === 401) {
      setFieldError('currentPassword', 'Current password is incorrect')
    }
    else {
      setFieldError('newPassword', error.message || 'Failed to update security settings')
    }

    toaster.add({
      title: 'Error',
      description: error.message || 'Failed to update security settings',
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
          Security Settings
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Manage your password and two-factor authentication
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
          Your security settings have been updated!
        </BaseMessage>

        <TairoFormGroup
          label="Change Password"
          sublabel="For an improved account security"
        >
          <div class="grid grid-cols-12 gap-4">
            <Field
              v-slot="{ field, errorMessage, handleChange, handleBlur }"
              name="currentPassword"
            >
              <BaseField
                v-slot="{ inputAttrs, inputRef }"
                label="Current Password"
                :error="errorMessage"
                :disabled="isSubmitting"
                class="col-span-12"
              >
                <TairoInput
                  :ref="inputRef"
                  v-bind="inputAttrs"
                  :model-value="field.value"
                  :aria-invalid="errorMessage ? 'true' : undefined"
                  type="password"
                  icon="solar:lock-keyhole-linear"
                  placeholder="Current password"
                  autocomplete="current-password"
                  rounded="lg"
                  @update:model-value="handleChange"
                  @blur="handleBlur"
                />
              </BaseField>
            </Field>

            <Field
              v-slot="{ field, errorMessage, handleChange, handleBlur }"
              name="newPassword"
            >
              <BaseField
                v-slot="{ inputAttrs, inputRef }"
                label="New Password"
                :error="errorMessage"
                :disabled="isSubmitting"
                class="col-span-12"
              >
                <TairoInput
                  :ref="inputRef"
                  v-bind="inputAttrs"
                  :model-value="field.value"
                  :aria-invalid="errorMessage ? 'true' : undefined"
                  type="password"
                  icon="solar:lock-keyhole-linear"
                  placeholder="New password"
                  autocomplete="new-password"
                  rounded="lg"
                  @update:model-value="handleChange"
                  @blur="handleBlur"
                />
              </BaseField>
            </Field>

            <Field
              v-slot="{ field, errorMessage, handleChange, handleBlur }"
              name="confirmPassword"
            >
              <BaseField
                v-slot="{ inputAttrs, inputRef }"
                label="Confirm New Password"
                :error="errorMessage"
                :disabled="isSubmitting"
                class="col-span-12"
              >
                <TairoInput
                  :ref="inputRef"
                  v-bind="inputAttrs"
                  :model-value="field.value"
                  :aria-invalid="errorMessage ? 'true' : undefined"
                  type="password"
                  autocomplete="new-password"
                  icon="solar:lock-keyhole-linear"
                  placeholder="Repeat new password"
                  rounded="lg"
                  @update:model-value="handleChange"
                  @blur="handleBlur"
                />
              </BaseField>
            </Field>
          </div>
        </TairoFormGroup>

        <TairoFormGroup
          label="2 Factor Authentication"
          sublabel="Two factor authentication for additional security"
        >
          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12">
              <Field
                v-slot="{ field, handleChange, handleBlur }"
                name="twoFactor.enabled"
              >
                <BaseSwitchThin
                  :model-value="field.value"
                  :disabled="isSubmitting"
                  label="Enable 2FA"
                  sublabel="Toggle 2 factor authentication"
                  variant="primary"
                  @update:model-value="handleChange"
                  @blur="handleBlur"
                />
              </Field>
            </div>

            <Field
              v-slot="{ field, errorMessage, handleChange, handleBlur }"
              name="twoFactor.phoneNumber"
            >
              <BaseField
                v-show="values.twoFactor?.enabled"
                v-slot="{ inputAttrs }"
                label="Phone Number"
                :error="errorMessage"
                :disabled="isSubmitting"
                class="col-span-12"
              >
                <TairoInput
                  ref="phoneInput"
                  v-bind="inputAttrs"
                  :model-value="field.value"
                  :aria-invalid="errorMessage ? 'true' : undefined"
                  type="tel"
                  icon="ph:phone-duotone"
                  placeholder="(000) 000-0000"
                  autocomplete="tel"
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

