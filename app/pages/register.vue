<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { registerSchema, type RegisterSchema } from '~/schemas/auth'

definePageMeta({
  layout: false,
})

const { register } = useAuth()
const router = useRouter()
const toast = useToast()

const state = reactive({
  name: '',
  email: '',
  password: '',
  phone: '',
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<RegisterSchema>) {
  loading.value = true
  try {
    await register(
      event.data.name,
      event.data.email,
      event.data.password,
      event.data.phone
    )
    toast.add({ title: 'Registration successful', color: 'success' })
    router.push('/dashboard')
  } catch (error: any) {
    toast.add({
      title: 'Registration failed',
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
          <h1 class="text-2xl font-bold text-gray-900">Create Account</h1>
          <p class="text-sm text-gray-500 mt-1">Register as a building owner</p>
        </div>
      </template>

      <UForm :schema="registerSchema" :state="state" @submit="onSubmit" class="space-y-4">
        <UFormField label="Full Name" name="name" required>
          <UInput v-model="state.name" placeholder="John Doe" icon="i-heroicons-user" size="lg"
            :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="Email" name="email" required>
          <UInput v-model="state.email" type="email" placeholder="your@email.com" icon="i-heroicons-envelope" size="lg"
            :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="Phone" name="phone">
          <UInput v-model="state.phone" type="tel" placeholder="+1234567890" icon="i-heroicons-phone" size="lg"
            :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="Password" name="password" required>
          <UInput v-model="state.password" type="password" placeholder="Min 8 characters" icon="i-heroicons-lock-closed"
            size="lg" :ui="{ root: 'w-full' }" />
        </UFormField>

        <div class="text-sm text-center">
          Already have an account?
          <NuxtLink to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </NuxtLink>
        </div>

        <UButton type="submit" color="primary" block size="lg" :loading="loading">
          Create Account
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>