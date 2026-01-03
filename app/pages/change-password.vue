<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { changePasswordSchema, type ChangePasswordSchema } from '~/schemas/auth'

definePageMeta({
  layout: false,
})

const { changePassword, user } = useAuth()
const router = useRouter()
const toast = useToast()

const state = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const loading = ref(false)
const isManager = computed(() => user.value && 'mustResetPassword' in user.value)

async function onSubmit(event: FormSubmitEvent<ChangePasswordSchema>) {
  loading.value = true
  try {
    await changePassword(event.data.currentPassword, event.data.newPassword)
    toast.add({
      title: 'Password changed successfully',
      description: 'You can now access the dashboard',
      color: 'success'
    })
    router.push('/dashboard')
  } catch (error: any) {
    toast.add({
      title: 'Password change failed',
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
          <UIcon name="i-heroicons-lock-closed" class="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h1 class="text-2xl font-bold text-gray-900">Change Password</h1>
          <p v-if="isManager" class="text-sm text-amber-600 mt-2">
            You must change your password before accessing the system
          </p>
          <p v-else class="text-sm text-gray-500 mt-2">
            Update your password to keep your account secure
          </p>
        </div>
      </template>

      <UForm :schema="changePasswordSchema" :state="state" @submit="onSubmit" class="space-y-4">
        <UFormField label="Current Password" name="currentPassword" required>
          <UInput v-model="state.currentPassword" type="password" placeholder="Enter current password"
            icon="i-heroicons-lock-closed" size="lg" :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="New Password" name="newPassword" required>
          <UInput v-model="state.newPassword" type="password" placeholder="Min 8 characters" icon="i-heroicons-key"
            size="lg" :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="Confirm New Password" name="confirmPassword" required>
          <UInput v-model="state.confirmPassword" type="password" placeholder="Re-enter new password"
            icon="i-heroicons-key" size="lg" :ui="{ root: 'w-full' }" />
        </UFormField>

        <UButton type="submit" color="primary" block size="lg" :loading="loading">
          Change Password
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>