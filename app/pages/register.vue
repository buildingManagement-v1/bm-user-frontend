<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { registerSchema, type RegisterSchema } from '~/schemas/auth'

definePageMeta({
  layout: false,
})

const { api } = useApi()
const router = useRouter()
const toast = useToast()

const state = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<RegisterSchema>) {
  loading.value = true
  try {
    await api('/v1/app/auth/register', {
      method: 'POST',
      body: event.data,
    })
    toast.add({ title: 'Registration successful! Please login.', color: 'success' })
    await router.push('/login')
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
  <div class="min-h-screen flex">
    <!-- Left Side - Image with Overlay -->
    <div class="hidden lg:block lg:w-3/5 relative overflow-hidden">
      <NuxtImg src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80" alt="Modern workspace"
        class="absolute inset-0 w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-primary-900/95"></div>

      <div class="relative h-full flex flex-col justify-between p-12">
        <NuxtLink to="/" class="flex items-center gap-3 text-white">
          <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <UIcon name="i-heroicons-building-office-2" class="w-7 h-7" />
          </div>
          <span class="text-3xl font-bold">BuildingMS</span>
        </NuxtLink>

        <div class="text-white max-w-xl">
          <h1 class="text-5xl font-bold mb-6 leading-tight">
            Start Managing Smarter, Not Harder
          </h1>
          <p class="text-xl text-primary-100 mb-12 leading-relaxed">
            Join thousands of property managers who have transformed their operations.
            Get started in minutes with our intuitive platform.
          </p>

          <div class="space-y-6">
            <div class="flex items-start gap-4">
              <div
                class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <UIcon name="i-heroicons-rocket-launch" class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-semibold text-lg mb-1">Quick Setup</h3>
                <p class="text-primary-200">Get up and running in under 5 minutes with our guided onboarding</p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div
                class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <UIcon name="i-heroicons-credit-card" class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-semibold text-lg mb-1">No Credit Card Required</h3>
                <p class="text-primary-200">Start with our free plan. Upgrade only when you're ready to scale</p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div
                class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <UIcon name="i-heroicons-user-group" class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-semibold text-lg mb-1">Expert Support</h3>
                <p class="text-primary-200">Our team is here to help you succeed every step of the way</p>
              </div>
            </div>
          </div>
        </div>

        <div class="text-primary-200 text-sm">
          © 2026 BuildingMS. All rights reserved.
        </div>
      </div>
    </div>

    <!-- Right Side - Form -->
    <div class="w-full lg:w-2/5 flex items-center justify-center p-8 lg:p-16 bg-white">
      <div class="w-full max-w-md">
        <NuxtLink to="/" class="lg:hidden flex items-center gap-2 text-primary-600 mb-8">
          <UIcon name="i-heroicons-building-office-2" class="w-8 h-8" />
          <span class="text-2xl font-bold">BuildingMS</span>
        </NuxtLink>

        <div class="mb-10">
          <h2 class="text-4xl font-bold text-gray-900 mb-3">Create Account</h2>
          <p class="text-gray-600 text-lg">Start your property management journey today.</p>
        </div>

        <UForm :schema="registerSchema" :state="state" @submit="onSubmit" class="space-y-5">
          <UFormField label="Full Name" name="name" required>
            <UInput v-model="state.name" placeholder="John Doe" icon="i-heroicons-user" size="lg"
              :ui="{ root: 'w-full' }" />
          </UFormField>

          <UFormField label="Email Address" name="email" required>
            <UInput v-model="state.email" type="email" placeholder="you@example.com" icon="i-heroicons-envelope"
              size="lg" :ui="{ root: 'w-full' }" />
          </UFormField>

          <UFormField label="Phone Number" name="phone" required>
            <UInput v-model="state.phone" type="tel" placeholder="+1 (555) 000-0000" icon="i-heroicons-phone" size="lg"
              :ui="{ root: 'w-full' }" />
          </UFormField>

          <UFormField label="Password" name="password" required>
            <UInput v-model="state.password" type="password" placeholder="Create a strong password"
              icon="i-heroicons-lock-closed" size="lg" :ui="{ root: 'w-full' }" />
          </UFormField>

          <UFormField label="Confirm Password" name="confirmPassword" required>
            <UInput v-model="state.confirmPassword" type="password" placeholder="Re-enter your password"
              icon="i-heroicons-lock-closed" size="lg" :ui="{ root: 'w-full' }" />
          </UFormField>

          <div class="flex items-start gap-2">
            <input type="checkbox" required
              class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-1">
            <label class="text-sm text-gray-600">
              I agree to the <a href="#" class="text-primary-600 hover:text-primary-700 font-medium">Terms of
                Service</a> and <a href="#" class="text-primary-600 hover:text-primary-700 font-medium">Privacy
                Policy</a>
            </label>
          </div>

          <UButton type="submit" color="primary" block size="xl" :loading="loading" class="font-semibold">
            Create Account
          </UButton>
        </UForm>

        <div class="mt-8 text-center">
          <p class="text-gray-600">
            Already have an account?
            <NuxtLink to="/login" class="text-primary-600 hover:text-primary-700 font-semibold ml-1 transition">
              Sign in
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>