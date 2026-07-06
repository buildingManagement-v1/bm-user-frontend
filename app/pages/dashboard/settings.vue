<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { changePasswordSchema, deleteAccountSchema, type ChangePasswordSchema, type DeleteAccountSchema } from '~/schemas/auth'
import { z } from 'zod'

definePageMeta({
  layout: 'default',
})

const { user, userType, changePassword, updateEmail, deleteAccount, logout } = useAuth()
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
    await updateEmail(event.data.email)
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
    await changePassword(event.data.currentPassword, event.data.newPassword)
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

const isOwnerOrManager = computed(() => userType.value === 'user' || userType.value === 'manager')
const isOwner = computed(() => userType.value === 'user')

// ── Danger zone: delete account (owners only) ─────────────────────────────
const deleteModalOpen = ref(false)
const deleteLoading = ref(false)
const deleteState = reactive({
  password: '',
})

function openDeleteModal() {
  deleteState.password = ''
  deleteModalOpen.value = true
}

function closeDeleteModal() {
  deleteModalOpen.value = false
}

async function onDeleteSubmit(event: FormSubmitEvent<DeleteAccountSchema>) {
  deleteLoading.value = true
  try {
    const result = await deleteAccount(event.data.password)
    const purgeDate = new Date(result.purgeAt).toLocaleDateString()
    toast.add({
      title: 'Account scheduled for deletion',
      description: `Your account and all its data will be permanently deleted on ${purgeDate}. Contact support before then if you change your mind.`,
      color: 'warning',
    })
    deleteModalOpen.value = false
    logout()
  } catch (error: any) {
    toast.add({ title: 'Failed to delete account', description: error.message, color: 'error' })
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="text-gray-500 mt-1">Manage your account email and password</p>
    </div>

    <div v-if="!isOwnerOrManager" class="rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800">
      <p class="mb-2">Settings are only available for building owners and managers.</p>
      <NuxtLink to="/tenant/settings" class="text-primary-600 hover:underline font-medium">Go to tenant portal settings →</NuxtLink>
    </div>

    <template v-else>
      <UCard variant="elevated">
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

      <UCard variant="elevated">
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

      <UCard v-if="isOwner" variant="elevated" class="border border-red-200">
        <template #header>
          <h2 class="text-lg font-semibold text-red-600">Danger zone</h2>
        </template>
        <div class="space-y-3">
          <p class="text-sm text-gray-600 max-w-2xl">
            Deleting your account removes access to all your buildings, units, tenants, leases,
            payments and managers. Your account is kept for a short grace period during which
            support can restore it — after that, everything is permanently deleted.
          </p>
          <UButton color="error" variant="soft" icon="i-heroicons-trash" @click="openDeleteModal">
            Delete account
          </UButton>
        </div>
      </UCard>
    </template>

    <UModal v-model:open="deleteModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900">Delete your account?</h3>
          </template>
          <UForm :schema="deleteAccountSchema" :state="deleteState" @submit="onDeleteSubmit" class="space-y-4">
            <UAlert
              color="error"
              variant="subtle"
              icon="i-heroicons-exclamation-triangle"
              title="This cannot be undone after the grace period"
              description="All your buildings, tenants, leases and payment records will be permanently deleted. Your managers and tenants will lose access immediately."
            />
            <UFormField label="Confirm your password" name="password" required>
              <UInput v-model="deleteState.password" type="password" placeholder="Enter your password" :ui="{ root: 'w-full' }" />
            </UFormField>
            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="ghost" @click="closeDeleteModal">
                Cancel
              </UButton>
              <UButton type="submit" color="error" :loading="deleteLoading">
                Delete my account
              </UButton>
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
