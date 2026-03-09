<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createTenantSchema, updateTenantSchema, type CreateTenantSchema, type UpdateTenantSchema } from '~/schemas/tenant'
import type { Tenant } from '~/types/tenant'
import { TenantStatus } from '~/types/tenant'
import type { ApiResponse } from '~/types'

const props = defineProps<{
  mode: 'create' | 'edit'
  buildingId: string
  tenant?: Tenant
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const { buildingApi } = useApi()
const toast = useToast()

const state = reactive<CreateTenantSchema | UpdateTenantSchema>(
  props.mode === 'create'
    ? {
      name: '',
      email: '',
      phone: '',
    }
    : {
      name: props.tenant?.name || '',
      email: props.tenant?.email || '',
      phone: props.tenant?.phone,
      status: props.tenant?.status || TenantStatus.ACTIVE,
    }
)

const loading = ref(false)

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const selectedStatus = computed({
  get: () => statusOptions.find(s => s.value === (state as UpdateTenantSchema).status),
  set: (val: { value: string; label: string } | undefined) => {
    if (props.mode === 'edit') {
      (state as UpdateTenantSchema).status = (val?.value as TenantStatus) || 'active'
    }
  }
})

async function onSubmit(event: FormSubmitEvent<CreateTenantSchema | UpdateTenantSchema>) {
  loading.value = true
  try {
    if (props.mode === 'create') {
      await buildingApi<ApiResponse<Tenant>>(
        props.buildingId,
        '/v1/app/tenants',
        {
          method: 'POST',
          body: event.data,
        }
      )
      toast.add({ title: 'Tenant created. Login credentials were sent to their email.', color: 'success' })
    } else {
      await buildingApi<ApiResponse<Tenant>>(
        props.buildingId,
        `/v1/app/tenants/${props.tenant!.id}`,
        {
          method: 'PATCH',
          body: event.data,
        }
      )
      toast.add({ title: 'Tenant updated successfully', color: 'success' })
    }
    emit('success')
  } catch (error: any) {
    toast.add({
      title: props.mode === 'create' ? 'Failed to create tenant' : 'Failed to update tenant',
      description: error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UForm :schema="mode === 'create' ? createTenantSchema : updateTenantSchema" :state="state" @submit="onSubmit"
    class="space-y-4">
    <UFormField label="Name" name="name" required>
      <UInput v-model="state.name" placeholder="John Doe" :ui="{ root: 'w-full' }" />
    </UFormField>

    <UFormField label="Email" name="email" required>
      <UInput v-model="state.email" type="email" placeholder="john@example.com" :ui="{ root: 'w-full' }" />
      <template v-if="mode === 'create'" #hint>
        <span class="text-xs text-zinc-500">A temporary password will be sent to this email.</span>
      </template>
    </UFormField>

    <UFormField label="Phone" name="phone">
      <UInput v-model="state.phone" type="tel" placeholder="+1 234 567 8900" :ui="{ root: 'w-full' }" />
    </UFormField>

    <UFormField v-if="mode === 'edit'" label="Status" name="status">
      <USelectMenu v-model="selectedStatus" :items="statusOptions" class="w-full" />
    </UFormField>

    <div class="flex gap-2 justify-end pt-4">
      <UButton type="button" color="neutral" variant="ghost" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="loading">
        {{ mode === 'create' ? 'Create Tenant' : 'Update Tenant' }}
      </UButton>
    </div>
  </UForm>
</template>