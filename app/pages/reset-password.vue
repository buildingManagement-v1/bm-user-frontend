<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { resetPasswordSchema, type ResetPasswordSchema } from '~/schemas/auth'

definePageMeta({
  layout: false,
})

const config = useRuntimeConfig()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const state = reactive({
  email: (route.query.email as string) || '',
  otp: '',
  newPassword: '',
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<ResetPasswordSchema>) {
  loading.value = true
  try {
    await $fetch(`${config.public.apiUrl}/v1/app/auth/reset-password`, {
      method: 'POST',
      body: {
        email: event.data.email,
        otp: event.data.otp,
        newPassword: event.data.newPassword,
      },
    })

    toast.add({
      title: 'Password reset successful',
      description: 'You can now login with your new password',
      color: 'success'
    })

    router.push('/login')
  } catch (error: any) {
    toast.add({
      title: 'Reset failed',
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
          <h1 class="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p class="text-sm text-gray-500 mt-1">Enter the code sent to your email</p>
        </div>
      </template>

      <UForm :schema="resetPasswordSchema" :state="state" @submit="onSubmit" class="space-y-4">
        <UFormField label="Email" name="email" required>
          <UInput v-model="state.email" type="email" placeholder="your@email.com" icon="i-heroicons-envelope" size="lg"
            :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="Reset Code" name="otp" required>
          <UInput v-model="state.otp" placeholder="6-digit code" icon="i-heroicons-key" size="lg" maxlength="6"
            :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="New Password" name="newPassword" required>
          <UInput v-model="state.newPassword" type="password" placeholder="Min 8 characters"
            icon="i-heroicons-lock-closed" size="lg" :ui="{ root: 'w-full' }" />
        </UFormField>

        <div class="text-sm text-center">
          <NuxtLink to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
            Back to login
          </NuxtLink>
        </div>

        <UButton type="submit" color="primary" block size="lg" :loading="loading">
          Reset Password
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>