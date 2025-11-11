<script setup lang="ts">
import { Field, useForm } from 'vee-validate'
import { watch } from '#imports'

const { schema, initialValues, submit, isSuccess } = useSecurityPassword()

const {
  handleSubmit,
  isSubmitting,
  resetForm,
  setFieldError,
} = useForm({
  validationSchema: schema,
  initialValues: initialValues.value,
})

watch(initialValues, (values) => {
  resetForm({ values })
})

const onSubmit = handleSubmit(async (values) => {
  await submit(values, {
    resetForm: () => resetForm({ values: initialValues.value }),
    setFieldError,
  })
})

const dismissSuccess = () => {
  isSuccess.value = false
}
</script>

<template>
  <BaseCard class="p-6">
    <form class="space-y-6" novalidate @submit.prevent="onSubmit">
      <div class="flex items-center justify-between">
        <div>
          <BaseHeading as="h3" size="md" weight="semibold" class="text-muted-900 dark:text-muted-100">
            Change password
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
            Use a unique passphrase that combines letters, numbers, and symbols.
          </BaseParagraph>
        </div>
        <BaseButton type="submit" :loading="isSubmitting" :disabled="isSubmitting">
          Save password
        </BaseButton>
      </div>

      <Transition name="fade">
        <BaseMessage v-if="isSuccess" variant="success" @close="dismissSuccess">
          Your password has been changed.
        </BaseMessage>
      </Transition>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="newPassword" v-slot="{ field, errorMessage, handleChange, handleBlur, meta }">
          <BaseField label="New password" :error="errorMessage" required>
            <TairoInput
              :model-value="field.value"
              type="password"
              icon="solar:lock-password-linear"
              placeholder="Enter new password"
              rounded="lg"
              :aria-invalid="meta.touched && errorMessage ? 'true' : undefined"
              autocomplete="new-password"
              @update:model-value="handleChange"
              @blur="handleBlur"
            />
          </BaseField>
        </Field>

        <Field name="confirmPassword" v-slot="{ field, errorMessage, handleChange, handleBlur, meta }">
          <BaseField label="Confirm password" :error="errorMessage">
            <TairoInput
              :model-value="field.value"
              type="password"
              icon="solar:lock-linear"
              placeholder="Re-enter new password"
              rounded="lg"
              :aria-invalid="meta.touched && errorMessage ? 'true' : undefined"
              autocomplete="new-password"
              @update:model-value="handleChange"
              @blur="handleBlur"
            />
          </BaseField>
        </Field>
      </div>

      <BaseParagraph size="xs" class="text-muted-500 dark:text-muted-400">
        Leaving the fields blank keeps your current password unchanged.
      </BaseParagraph>
    </form>
  </BaseCard>
</template>
