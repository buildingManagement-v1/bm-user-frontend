<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { forgotPasswordSchema, type ForgotPasswordSchema } from '~/schemas/auth'

definePageMeta({
  layout: false,
})

const config = useRuntimeConfig()
const router = useRouter()
const toast = useToast()

const state = reactive({
  email: '',
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<ForgotPasswordSchema>) {
  loading.value = true
  try {
    await $fetch(`${config.public.apiUrl}/v1/app/auth/forgot-password`, {
      method: 'POST',
      body: { email: event.data.email },
    })

    toast.add({
      title: 'OTP sent',
      description: 'Check your email for the reset code',
      color: 'success'
    })

    router.push(`/reset-password?email=${encodeURIComponent(event.data.email)}`)
  } catch (error: any) {
    toast.add({
      title: 'Failed to send OTP',
      description: error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <UCard class="w-full max-w-md shadow-xl">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p class="text-sm text-gray-500 mt-1">Enter your email to receive a reset code</p>
        </div>
      </template>

      <UForm :schema="forgotPasswordSchema" :state="state" @submit="onSubmit" class="space-y-4">
        <UFormField label="Email" name="email" required>
          <UInput v-model="state.email" type="email" placeholder="your@email.com" icon="i-heroicons-envelope" size="lg"
            :ui="{ root: 'w-full' }" />
        </UFormField>

        <div class="text-sm text-center">
          Remember your password?
          <NuxtLink to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </NuxtLink>
        </div>

        <UButton type="submit" color="primary" block size="lg" :loading="loading">
          Send Reset Code
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>