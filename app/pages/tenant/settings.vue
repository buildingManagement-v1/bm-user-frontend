<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { changePasswordSchema, type ChangePasswordSchema } from '~/schemas/auth'
import { z } from 'zod'

definePageMeta({
  layout: 'tenant',
})

const { api } = useApi()
const { user, userCookie } = useAuth()
const toast = useToast()

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const emailState = reactive({
  email: (user.value && 'email' in user.value ? user.value.email : '') as string,
})

const passwordState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const emailLoading = ref(false)
const passwordLoading = ref(false)

watch(user, (u) => {
  if (u && 'email' in u) emailState.email = u.email
}, { immediate: true })

async function onEmailSubmit(event: FormSubmitEvent<{ email: string }>) {
  emailLoading.value = true
  try {
    await api('/v1/tenant/profile', {
      method: 'PATCH',
      body: { email: event.data.email },
    })
    if (user.value && 'email' in user.value) {
      const updated = { ...user.value, email: event.data.email }
      user.value = updated
      if (userCookie) userCookie.value = updated
    }
    toast.add({ title: 'Email updated successfully', color: 'success' })
  } catch (error: any) {
    toast.add({ title: 'Failed to update email', description: error.message, color: 'error' })
  } finally {
    emailLoading.value = false
  }
}

async function onPasswordSubmit(event: FormSubmitEvent<ChangePasswordSchema>) {
  passwordLoading.value = true
  try {
    await api('/v1/tenant/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword: event.data.currentPassword,
        newPassword: event.data.newPassword,
      },
    })
    toast.add({ title: 'Password changed successfully', color: 'success' })
    passwordState.currentPassword = ''
    passwordState.newPassword = ''
    passwordState.confirmPassword = ''
  } catch (error: any) {
    toast.add({ title: 'Failed to change password', description: error.message, color: 'error' })
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="text-gray-500 mt-1">Manage your account email and password</p>
    </div>

    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Change email</h2>
      </template>
      <UForm :schema="emailSchema" :state="emailState" @submit="onEmailSubmit" class="space-y-4">
        <UFormField label="Email" name="email" required>
          <UInput v-model="emailState.email" type="email" placeholder="your@email.com" :ui="{ root: 'w-full max-w-md' }" />
        </UFormField>
        <UButton type="submit" color="primary" :loading="emailLoading">
          Update email
        </UButton>
      </UForm>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Change password</h2>
      </template>
      <UForm :schema="changePasswordSchema" :state="passwordState" @submit="onPasswordSubmit" class="space-y-4">
        <UFormField label="Current password" name="currentPassword" required>
          <UInput v-model="passwordState.currentPassword" type="password" placeholder="Enter current password" :ui="{ root: 'w-full max-w-md' }" />
        </UFormField>
        <UFormField label="New password" name="newPassword" required>
          <UInput v-model="passwordState.newPassword" type="password" placeholder="Min 8 characters" :ui="{ root: 'w-full max-w-md' }" />
        </UFormField>
        <UFormField label="Confirm new password" name="confirmPassword" required>
          <UInput v-model="passwordState.confirmPassword" type="password" placeholder="Re-enter new password" :ui="{ root: 'w-full max-w-md' }" />
        </UFormField>
        <UButton type="submit" color="primary" :loading="passwordLoading">
          Change password
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>
