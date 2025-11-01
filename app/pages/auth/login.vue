<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Field, useForm } from 'vee-validate'
import { z } from 'zod'

definePageMeta({
  layout: 'empty',
  title: 'Login',
})

const VALIDATION_TEXT = {
  EMAIL_OR_USERNAME_REQUIRED: 'Email or username is required',
  PASSWORD_REQUIRED: 'A password is required',
}

// This is the Zod schema for the form input
// It's used to define the shape that the form data will have
const zodSchema = z.object({
  emailOrUsername: z.string().min(1, VALIDATION_TEXT.EMAIL_OR_USERNAME_REQUIRED),
  password: z.string().min(1, VALIDATION_TEXT.PASSWORD_REQUIRED),
  trustDevice: z.boolean(),
})

// Zod has a great infer method that will
// infer the shape of the schema into a TypeScript type
type FormInput = z.infer<typeof zodSchema>

const validationSchema = toTypedSchema(zodSchema)
const initialValues = {
  emailOrUsername: '',
  password: '',
  trustDevice: false,
} satisfies FormInput

const {
  handleSubmit,
  isSubmitting,
  setFieldError,
} = useForm({
  validationSchema,
  initialValues,
})

const router = useRouter()
const toaster = useNuiToasts()
const { login: loginKeycloak } = useKeycloak()

// This is where you would send the form data to the server
const onSubmit = handleSubmit(async (values) => {
  try {
    // Call login API
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        emailOrUsername: values.emailOrUsername,
        password: values.password,
        trustDevice: values.trustDevice,
      },
    })

    if (response.success) {
      toaster.add({
        title: 'Success',
        description: 'Welcome back!',
        icon: 'ph:user-circle-fill',
        progress: true,
      })
      
      // Redirect to dashboard after successful login
      await router.push('/dashboard')
    }
  } catch (error: any) {
    // Handle errors
    if (error.statusCode === 429) {
      setFieldError('password', 'Too many login attempts. Please try again later.')
    } else if (error.statusCode === 401) {
      setFieldError('password', 'Invalid email or password')
    } else if (error.statusCode === 400 && error.data?.redirectToKeycloak) {
      // Direct Access Grant not enabled - fallback to redirect login
      try {
        await loginKeycloak()
      } catch (redirectError) {
        toaster.add({
          title: 'Configuration Required',
          description: error.data?.help || 'Please enable Direct Access Grant in Keycloak settings',
          icon: 'ph:warning',
          color: 'warning',
          progress: true,
        })
        setFieldError('emailOrUsername', error.message || 'Direct Access Grant not enabled. Using redirect...')
      }
    } else if (error.data) {
      // Handle validation errors
      const errors = error.data as Array<{ path: string[]; message: string }>
      errors.forEach((err) => {
        if (err.path && err.path.length > 0) {
          setFieldError(err.path[0] as keyof FormInput, err.message)
        }
      })
    } else {
      setFieldError('password', error.message || 'Login failed. Please try again.')
    }
  }
})
</script>

<template>
  <div class="dark:bg-muted-800 flex min-h-screen bg-white">
    <div
      class="bg-muted-100 dark:bg-muted-900 relative hidden w-0 flex-1 items-center justify-center lg:flex lg:w-3/5"
    >
      <div
        class="mx-auto flex size-full max-w-4xl items-center justify-center"
      >
        <!-- Media image -->
        <img
          class="mx-auto max-w-xl"
          src="/img/illustrations/magician.svg"
          alt=""
          width="619"
          height="594"
        >
      </div>
    </div>
    <div
      class="relative flex flex-1 flex-col justify-center px-6 py-12 lg:w-2/5 lg:flex-none"
    >
      <div class="dark:bg-muted-800 relative mx-auto w-full max-w-sm bg-white">
        <!-- Nav -->
        <div class="flex w-full items-center justify-between">
          <NuxtLink
            to="/"
            class="text-muted-400 hover:text-primary-500 flex items-center gap-2 font-sans font-medium transition-colors duration-300"
          >
            <Icon name="gg:arrow-long-left" class="size-5" />
            <span>Back to Home</span>
          </NuxtLink>
          <!-- Theme button -->
          <BaseThemeToggle />
        </div>
        <div>
          <BaseHeading
            as="h2"
            size="3xl"
            lead="relaxed"
            weight="medium"
            class="mt-6"
          >
            Welcome back.
          </BaseHeading>
          <BaseParagraph size="sm" class="text-muted-400 mb-6">
            Login with your credentials
          </BaseParagraph>
        </div>

        <!-- Form section -->
        <div class="mt-6">
          <div class="mt-5">
            <!-- Form -->
            <form
              method="POST"
              action=""
              class="mt-6"
              novalidate
              @submit.prevent="onSubmit"
            >
              <div class="space-y-4">
                <Field
                  v-slot="{ field, errorMessage, handleChange, handleBlur }"
                  name="emailOrUsername"
                >
                  <BaseField
                    v-slot="{ inputAttrs, inputRef }"
                    label="Email or Username"
                    :state="errorMessage ? 'error' : 'idle'"
                    :error="errorMessage"
                    :disabled="isSubmitting"
                    required
                  >
                    <BaseInput
                      :ref="inputRef"
                      v-bind="inputAttrs"
                      :model-value="field.value"
                      autocomplete="username"
                      rounded="lg"
                      placeholder="Enter your email or username"
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
                    v-slot="{ inputAttrs, inputRef }"
                    label="Password"
                    :state="errorMessage ? 'error' : 'idle'"
                    :error="errorMessage"
                    :disabled="isSubmitting"
                    required
                  >
                    <BaseInput
                      :ref="inputRef"
                      v-bind="inputAttrs"
                      :model-value="field.value"
                      type="password"
                      autocomplete="current-password"
                      rounded="lg"
                      @update:model-value="handleChange"
                      @blur="handleBlur"
                    />
                  </BaseField>
                </Field>
              </div>

              <!-- Remember -->
              <div class="mt-6 flex items-center justify-between">
                <Field
                  v-slot="{ field, handleChange, handleBlur }"
                  name="trustDevice"
                >
                  <BaseCheckbox
                    :model-value="field.value"
                    :disabled="isSubmitting"
                    label="Trust for 60 days"
                    variant="default"
                    @update:model-value="handleChange"
                    @blur="handleBlur"
                  />
                </Field>

                <div class="text-xs leading-5">
                  <NuxtLink
                    to="/auth/forgot-password"
                    class="text-primary-600 hover:text-primary-500 font-sans font-medium underline-offset-4 transition duration-150 ease-in-out hover:underline"
                  >
                    Forgot your password?
                  </NuxtLink>
                </div>
              </div>

              <!-- Submit -->
              <div class="mt-6">
                <div class="block w-full rounded-md shadow-xs">
                  <BaseButton
                    :disabled="isSubmitting"
                    :loading="isSubmitting"
                    type="submit"
                    variant="primary"
                    rounded="lg"
                    class="h-11! w-full"
                  >
                    Sign in
                  </BaseButton>
                </div>
              </div>
            </form>

            <!-- No account link -->
            <p
              class="text-muted-400 mt-4 flex justify-between font-sans text-xs leading-5"
            >
              <span>Don't have an account?</span>
              <NuxtLink
                to="/auth/register"
                class="text-primary-600 hover:text-primary-500 font-medium underline-offset-4 transition duration-150 ease-in-out hover:underline"
              >
                Create Account
              </NuxtLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
