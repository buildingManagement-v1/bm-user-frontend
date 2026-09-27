<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import {
  changePasswordSchema,
  tenantContactSchema,
  updateEmailSchema,
  type ChangePasswordSchema,
  type TenantContactSchema,
  type UpdateEmailSchema,
} from '~/schemas/auth'
import { errorMessage, type ApiResponse } from '~/types/api'

definePageMeta({
  layout: 'tenant',
})

const { api } = useApi()
const { user, setUser, changePassword } = useAuth()
const toast = useToast()

const contactState = reactive<TenantContactSchema>({ phone: '' })
const emailState = reactive<UpdateEmailSchema>({ email: '', currentPassword: '' })
const passwordState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const contactLoading = ref(false)
const emailLoading = ref(false)
const passwordLoading = ref(false)

watch(user, (u) => {
  if (u) {
    emailState.email = u.email
    contactState.phone = u.phone ?? ''
  }
}, { immediate: true })

async function updateProfile(body: Record<string, string>) {
  const res = await api<ApiResponse<{ email: string; phone: string | null }>>('/v1/tenant/profile', {
    method: 'PATCH',
    body,
  })
  if (user.value) {
    setUser({ ...user.value, email: res.data.email, phone: res.data.phone ?? undefined })
  }
}

async function onContactSubmit(event: FormSubmitEvent<TenantContactSchema>) {
  contactLoading.value = true
  try {
    await updateProfile({ phone: event.data.phone })
    toast.add({ title: 'Phone number updated', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Failed to update phone', description: errorMessage(error), color: 'error' })
  } finally {
    contactLoading.value = false
  }
}

async function onEmailSubmit(event: FormSubmitEvent<UpdateEmailSchema>) {
  emailLoading.value = true
  try {
    await updateProfile({ email: event.data.email, currentPassword: event.data.currentPassword })
    emailState.currentPassword = ''
    toast.add({ title: 'Email updated successfully', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Failed to update email', description: errorMessage(error), color: 'error' })
  } finally {
    emailLoading.value = false
  }
}

async function onPasswordSubmit(event: FormSubmitEvent<ChangePasswordSchema>) {
  passwordLoading.value = true
  try {
    await changePassword(event.data.currentPassword, event.data.newPassword)
    toast.add({
      title: 'Password changed successfully',
      description: 'You were signed out on your other devices.',
      color: 'success',
    })
    passwordState.currentPassword = ''
    passwordState.newPassword = ''
    passwordState.confirmPassword = ''
  } catch (error) {
    toast.add({ title: 'Failed to change password', description: errorMessage(error), color: 'error' })
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="text-gray-500 mt-1">Manage your contact details, email and password</p>
    </div>

    <UCard variant="elevated">
      <template #header>
        <h2 class="text-lg font-semibold">Contact</h2>
      </template>
      <UForm :schema="tenantContactSchema" :state="contactState" class="space-y-4" @submit="onContactSubmit">
        <UFormField label="Phone" name="phone">
          <UInput v-model="contactState.phone" type="tel" placeholder="+251 9..." :ui="{ root: 'w-full max-w-md' }" />
        </UFormField>
        <UButton type="submit" color="primary" :loading="contactLoading">
          Save phone
        </UButton>
      </UForm>
    </UCard>

    <UCard variant="elevated">
      <template #header>
        <h2 class="text-lg font-semibold">Change email</h2>
        <p class="text-sm text-gray-500 mt-1">You sign in and receive invoices with this email.</p>
      </template>
      <UForm :schema="updateEmailSchema" :state="emailState" class="space-y-4" @submit="onEmailSubmit">
        <UFormField label="Email" name="email" required>
          <UInput v-model="emailState.email" type="email" placeholder="your@email.com" :ui="{ root: 'w-full max-w-md' }" />
        </UFormField>
        <UFormField label="Current password" name="currentPassword" required>
          <UInput v-model="emailState.currentPassword" type="password" placeholder="Confirm it's you"
            :ui="{ root: 'w-full max-w-md' }" />
        </UFormField>
        <UButton type="submit" color="primary" :loading="emailLoading">
          Update email
        </UButton>
      </UForm>
    </UCard>

    <UCard variant="elevated">
      <template #header>
        <h2 class="text-lg font-semibold">Change password</h2>
      </template>
      <UForm :schema="changePasswordSchema" :state="passwordState" class="space-y-4" @submit="onPasswordSubmit">
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
