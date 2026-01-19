<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { loginSchema, type LoginSchema } from '~/schemas/auth'

definePageMeta({
  layout: false,
})

const { login } = useAuth()
const router = useRouter()
const toast = useToast()

const state = reactive({
  email: '',
  password: '',
})

const userTypeOptions = [
  { value: 'user', label: 'Building Owner' },
  { value: 'manager', label: 'Building Manager' },
  { value: 'tenant', label: 'Tenant' },
]

const selectedUserType = ref(userTypeOptions[0])
const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<LoginSchema>) {
  loading.value = true
  try {
    await login(event.data.email, event.data.password, (selectedUserType.value?.value as UserType) || 'user')
    toast.add({ title: 'Login successful', color: 'success' })
    if (selectedUserType.value?.value === 'tenant') {
      await router.push('/tenant/dashboard')
    } else {
      await router.push('/dashboard')
    }
  } catch (error: any) {
    toast.add({
      title: 'Login failed',
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
      <NuxtImg src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"
        alt="Modern building interior" class="absolute inset-0 w-full h-full object-cover" />
      <div class="absolute inset-0 bg-linear-to-br from-primary-900/80 via-primary-800/70 to-primary-900/80"></div>

      <div class="relative h-full flex flex-col justify-between p-12">
        <NuxtLink to="/" class="flex items-center gap-3 text-white">
          <div class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <UIcon name="i-heroicons-building-office-2" class="w-7 h-7" />
          </div>
          <span class="text-3xl font-bold">BuildingMS</span>
        </NuxtLink>

        <div class="text-white max-w-xl">
          <h1 class="text-5xl font-bold mb-6 leading-tight">
            Welcome Back to Your Property Command Center
          </h1>
          <p class="text-xl text-primary-100 mb-12 leading-relaxed">
            Manage your entire property portfolio with ease. Track tenants, handle maintenance,
            and monitor finances - all from one powerful dashboard.
          </p>

          <div class="space-y-6">
            <div class="flex items-start gap-4">
              <div
                class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <UIcon name="i-heroicons-shield-check" class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-semibold text-lg mb-1">Bank-Level Security</h3>
                <p class="text-primary-200">Your data is encrypted and protected with enterprise-grade security</p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div
                class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <UIcon name="i-heroicons-bolt" class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-semibold text-lg mb-1">Real-Time Updates</h3>
                <p class="text-primary-200">Stay informed with instant notifications for important events</p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div
                class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <UIcon name="i-heroicons-device-phone-mobile" class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-semibold text-lg mb-1">Access Anywhere</h3>
                <p class="text-primary-200">Manage your properties from any device, anytime, anywhere</p>
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
          <h2 class="text-4xl font-bold text-gray-900 mb-3">Sign In</h2>
          <p class="text-gray-600 text-lg">Welcome back! Please enter your details.</p>
        </div>

        <UForm :schema="loginSchema" :state="state" @submit="onSubmit" class="space-y-6">
          <UFormField label="Login As" required>
            <USelectMenu :search-input="false" v-model="selectedUserType" :items="userTypeOptions" size="lg"
              class="w-full" />
          </UFormField>

          <UFormField label="Email Address" name="email" required>
            <UInput v-model="state.email" type="email" placeholder="Enter your email" icon="i-heroicons-envelope"
              size="lg" :ui="{ root: 'w-full' }" />
          </UFormField>

          <UFormField label="Password" name="password" required>
            <UInput v-model="state.password" type="password" placeholder="Enter your password"
              icon="i-heroicons-lock-closed" size="lg" :ui="{ root: 'w-full' }" />
          </UFormField>

          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500">
              <span class="text-sm text-gray-600 group-hover:text-gray-900 transition">Remember me</span>
            </label>
            <NuxtLink to="/forgot-password"
              class="text-sm text-primary-600 hover:text-primary-700 font-medium transition">
              Forgot password?
            </NuxtLink>
          </div>

          <UButton type="submit" color="primary" block size="xl" :loading="loading" class="font-semibold">
            Sign In
          </UButton>
        </UForm>

        <div class="mt-8 text-center">
          <p class="text-gray-600">
            Don't have an account?
            <NuxtLink to="/register" class="text-primary-600 hover:text-primary-700 font-semibold ml-1 transition">
              Sign up for free
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>