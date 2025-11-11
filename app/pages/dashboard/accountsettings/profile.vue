<script setup lang="ts">
import { Field, useForm } from 'vee-validate'
import { watch } from '#imports'

definePageMeta({
  title: 'Edit Profile',
  layout: 'dashboard',
})

const { schema, initialValues, submit, isSuccess } = useProfileForm()

const {
  handleSubmit,
  isSubmitting,
  setFieldError,
  resetForm,
} = useForm({
  validationSchema: schema,
  initialValues: initialValues.value,
})

watch(initialValues, (values) => {
  resetForm({ values })
})

const onSubmit = handleSubmit(async (values) => {
  await submit(values, (field, message) => setFieldError(field, message))
})

const dismissSuccess = () => {
  isSuccess.value = false
}
</script>

<template>
  <form
    class="mx-auto w-full max-w-3xl space-y-10 pb-16"
    novalidate
    @submit.prevent="onSubmit"
  >
    <div class="flex justify-start">
      <BaseButton
        to="/dashboard/accountsettings"
        variant="link"
        class="gap-2 px-0 text-sm text-primary-500 hover:text-primary-600 dark:text-primary-300 dark:hover:text-primary-200"
      >
        <Icon name="solar:arrow-left-linear" class="size-4" />
        Back to account overview
      </BaseButton>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-muted-200 pb-4 dark:border-muted-800">
      <div>
        <BaseHeading as="h1" size="2xl" weight="bold" class="text-muted-900 dark:text-muted-100">
          Edit profile
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-500 dark:text-muted-400">
          Update personal details used across your workspace.
        </BaseParagraph>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton variant="ghost" to="/dashboard/accountsettings">
          Cancel
        </BaseButton>
        <BaseButton type="submit" variant="primary" :loading="isSubmitting" :disabled="isSubmitting">
          Save changes
        </BaseButton>
      </div>
    </div>

    <Transition name="fade">
      <BaseMessage v-if="isSuccess" @close="dismissSuccess">
        Your profile has been updated!
      </BaseMessage>
    </Transition>

    <BaseCard class="p-6">
      <TairoFormGroup
        label="Profile picture"
        sublabel="This is how others recognize you across SnapLink."
      >
        <div class="flex justify-center">
          <AvatarEditor size="lg" />
        </div>
      </TairoFormGroup>
    </BaseCard>

    <BaseCard class="p-6">
      <TairoFormGroup
        label="Personal information"
        sublabel="Keep your contact information current."
      >
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field name="firstName" v-slot="{ field, errorMessage, handleChange, handleBlur, meta }">
            <BaseField label="First name" :error="errorMessage" required>
              <TairoInput
                :model-value="field.value"
                icon="solar:user-rounded-linear"
                placeholder="First name"
                rounded="lg"
                :aria-invalid="meta.touched && errorMessage ? 'true' : undefined"
                @update:model-value="handleChange"
                @blur="handleBlur"
              />
            </BaseField>
          </Field>

          <Field name="lastName" v-slot="{ field, errorMessage, handleChange, handleBlur, meta }">
            <BaseField label="Last name (optional)" :error="errorMessage">
              <TairoInput
                :model-value="field.value"
                icon="solar:user-rounded-linear"
                placeholder="Last name"
                rounded="lg"
                :aria-invalid="meta.touched && errorMessage ? 'true' : undefined"
                @update:model-value="handleChange"
                @blur="handleBlur"
              />
            </BaseField>
          </Field>
        </div>
      </TairoFormGroup>
    </BaseCard>
  </form>
</template>

