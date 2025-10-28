<script setup lang="ts">
import type { AddonInputPassword } from '#components'
import { toTypedSchema } from '@vee-validate/zod'
import { Field, useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  layout: 'empty',
  title: 'Register',
})

const passwordRef = ref<InstanceType<typeof AddonInputPassword>>()

const VALIDATION_TEXT = {
  EMAIL_REQUIRED: 'A valid email is required',
  USERNAME_LENGTH: 'Username must be at least 3 characters',
  PASSWORD_LENGTH: 'Password must be at least 6 characters with letters and numbers',
  PASSWORD_CONTAINS_EMAIL: 'Password cannot contain your email',
  PASSWORD_MATCH: 'Passwords do not match',
  TERMS_REQUIRED: 'You must agree to the terms and conditions',
}

// This is the Zod schema for the form input
const zodSchema = z
  .object({
    username: z.string().min(3, VALIDATION_TEXT.USERNAME_LENGTH),
    email: z.string().email(VALIDATION_TEXT.EMAIL_REQUIRED),
    password: z.string()
      .min(6, VALIDATION_TEXT.PASSWORD_LENGTH)
      .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, 'Password must contain at least 6 characters with letters and numbers'),
    confirmPassword: z.string(),
    terms: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // This is a custom validation function that will be called
    // before the form is submitted
    // Only apply password strength validation if password meets basic requirements
    if (data.password.length >= 6 && /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(data.password)) {
      if (passwordRef.value?.validation?.feedback?.warning || passwordRef.value?.validation?.feedback?.suggestions?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: passwordRef.value?.validation?.feedback?.warning || passwordRef.value.validation.feedback?.suggestions?.[0],
          path: ['password'],
        })
      }
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_TEXT.PASSWORD_MATCH,
        path: ['confirmPassword'],
      })
    }
    if (!data.terms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_TEXT.TERMS_REQUIRED,
        path: ['terms'],
      })
    }
  })

type FormInput = z.infer<typeof zodSchema>

const validationSchema = toTypedSchema(zodSchema)
const initialValues = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  terms: false,
} satisfies FormInput

const { values, handleSubmit, isSubmitting, setFieldError } = useForm({
  validationSchema,
  initialValues,
})

const router = useRouter()
const { register } = useAuth()

// This is where you would send the form data to the server
const onSubmit = handleSubmit(async (_values) => {
  const result = await register({
    username: values.username,
    email: values.email,
    password: values.password,
    firstName: values.username, // Using username as firstName for demo
  })
  
  if (result.success) {
    router.push('/auth/verify-email')
  } else {
    if (result.error?.includes('username')) {
      setFieldError('username', 'This username is already taken')
    } else if (result.error?.includes('email')) {
      setFieldError('email', 'This email is already registered')
    } else {
      setFieldError('email', result.error || 'Registration failed')
    }
  }
})
</script>

<template>
  <div class="h-screen md:flex dark:[--color-input-default-bg:var(--color-muted-950)]">
    <div
      class="from-primary-900 to-primary-500 i group relative hidden w-1/2 items-center justify-around overflow-hidden bg-gradient-to-tr md:flex"
    >
      <div class="mx-auto max-w-xs text-center">
        <BaseHeading
          as="h2"
          size="3xl"
          weight="medium"
          class="text-white"
        >
          Have an Account?
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-200 mb-3">
          No need to waste time on this page, let's take you back to your
          account
        </BaseParagraph>
        <BaseButton
          to="/auth/login"
          rounded="lg"
          class="w-full"
        >
          Login to Account
        </BaseButton>
      </div>
      <div
        class="bg-muted-200/20 absolute -start-6 -top-6 h-14 w-0 origin-top-left rotate-45 rounded-full transition-all delay-[25ms] duration-300 group-hover:w-72"
      />
      <div
        class="bg-muted-200/20 absolute -top-12 start-20 h-14 w-0 origin-top-left rotate-45 rounded-full transition-all delay-75 duration-300 group-hover:w-48"
      />
      <div
        class="bg-muted-200/20 absolute -start-7 top-24 h-14 w-0 origin-top-left rotate-45 rounded-full transition-all delay-150 duration-300 group-hover:w-40"
      />

      <div
        class="bg-muted-200/20 absolute -bottom-6 -end-6 h-14 w-0 origin-bottom-right rotate-45 rounded-full transition-all delay-150 duration-300 group-hover:w-72"
      />
      <div
        class="bg-muted-200/20 absolute -bottom-12 end-20 h-14 w-0 origin-bottom-right rotate-45 rounded-full transition-all delay-75 duration-300 group-hover:w-48"
      />
      <div
        class="bg-muted-200/20 absolute -end-7 bottom-24 h-14 w-0 origin-bottom-right rotate-45 rounded-full transition-all delay-[25ms] duration-300 group-hover:w-40"
      />
    </div>
    <div
      class="dark:bg-muted-900 flex flex-col items-center justify-between bg-white py-10 md:w-1/2"
    >
      <div class="mx-auto flex w-full max-w-xs items-center justify-between">
        <NuxtLink
          to="/"
          class="text-muted-400 hover:text-primary-500 dark:text-muted-700 dark:hover:text-primary-500 transition-colors duration-300"
        >
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Icon name="solar:link-linear" class="w-5 h-5 text-white" />
            </div>
            <span class="text-xl font-bold text-primary-600 dark:text-primary-400">SnapLink</span>
          </div>
        </NuxtLink>
        <div>
          <BaseThemeToggle />
        </div>
      </div>
      <form
        method="POST"
        action=""
        class="mx-auto w-full max-w-xs"
        novalidate
        @submit.prevent="onSubmit"
      >
        <BaseHeading
          as="h2"
          size="3xl"
          weight="medium"
        >
          Welcome to SnapLink
        </BaseHeading>
        <BaseParagraph size="sm" class="text-muted-400 mb-6">
          Let's start by creating you account
        </BaseParagraph>

        <div class="mb-4 space-y-3">
          <Field
            v-slot="{ field, errorMessage, handleChange, handleBlur }"
            name="username"
          >
            <BaseField
              v-slot="{ inputAttrs, inputRef }"
              label="Username"
              :state="errorMessage ? 'error' : 'idle'"
              :error="errorMessage"
              :disabled="isSubmitting"
              required
            >
              <TairoInput
                :ref="inputRef"
                v-bind="inputAttrs"
                :model-value="field.value"
                autocomplete="username"
                rounded="lg"
                icon="solar:user-rounded-linear"
                @update:model-value="handleChange"
                @blur="handleBlur"
              />
            </BaseField>
          </Field>
          <Field
            v-slot="{ field, errorMessage, handleChange, handleBlur }"
            name="email"
          >
            <BaseField
              v-slot="{ inputAttrs, inputRef }"
              label="Email Address"
              :state="errorMessage ? 'error' : 'idle'"
              :error="errorMessage"
              :disabled="isSubmitting"
              required
            >
              <TairoInput
                :ref="inputRef"
                v-bind="inputAttrs"
                :model-value="field.value"
                type="email"
                autocomplete="current-email"
                rounded="lg"
                icon="solar:mention-circle-linear"
                @update:model-value="handleChange"
                @blur="handleBlur"
              />
            </BaseField>
          </Field>
          <Field
            v-slot="{ field, errorMessage, handleChange, handleBlur }"
            name="password"
          >
            <BaseField
              v-slot="{ inputAttrs }"
              label="Password"
              :state="errorMessage ? 'error' : 'idle'"
              :error="errorMessage"
              :disabled="isSubmitting"
              required
            >
              <LazyAddonInputPassword
                ref="passwordRef"
                v-bind="inputAttrs"
                :model-value="field.value"
                :error="errorMessage"
                icon="solar:lock-keyhole-linear"
                :disabled="isSubmitting"
                :user-inputs="[values.username ?? '', values.email ?? '']"
                rounded="lg"
                class="rounded-s-none border-s-0 ring-0!"
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
              label="Confirm password"
              :state="errorMessage ? 'error' : 'idle'"
              :error="errorMessage"
              :disabled="isSubmitting"
              required
            >
              <TairoInput
                :ref="inputRef"
                v-bind="inputAttrs"
                :model-value="field.value"
                type="password"
                rounded="lg"
                icon="ph:check"
                @update:model-value="handleChange"
                @blur="handleBlur"
              />
            </BaseField>
          </Field>
        </div>

        <div class="mb-4">
          <Field
            v-slot="{ field, errorMessage, handleChange, handleBlur }"
            name="terms"
          >
            <BaseCheckbox
              :model-value="field.value"
              :disabled="isSubmitting"
              :error="errorMessage"
              variant="default"
              @update:model-value="handleChange"
              @blur="handleBlur"
            >
              <span>
                <span>
                  I accept the
                </span>
                <a
                  href="#"
                  class="text-primary-500 hover:underline focus:underline"
                >Terms of Service</a>
              </span>
            </BaseCheckbox>
          </Field>
        </div>

        <BaseButton
          :disabled="isSubmitting"
          :loading="isSubmitting"
          type="submit"
          rounded="lg"
          variant="primary"
          class="h-11! w-full"
        >
          Create Account
        </BaseButton>
        <!-- No account link -->
        <p
          class="text-muted-400 mt-4 flex justify-between font-sans text-sm leading-5"
        >
          <span>Have an account?</span>
          <NuxtLink
            to="/auth/login"
            class="text-primary-600 hover:text-primary-500 font-medium underline-offset-4 transition duration-150 ease-in-out hover:underline focus:underline focus:outline-none"
          >
            Login here
          </NuxtLink>
        </p>
      </form>
      <div class="text-center">
        <BaseText size="sm" class="text-muted-400">
          © {{ new Date().getFullYear() }} SnapLink. All rights reserved.
        </BaseText>
      </div>
    </div>
  </div>
</template>
