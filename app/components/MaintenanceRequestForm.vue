<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createMaintenanceRequestSchema, type CreateMaintenanceRequestSchema } from '~/schemas/maintenance-request'
import type { MaintenanceRequest, MaintenanceRequestPriority } from '~/types/maintenance-request'
import type { Unit } from '~/types/unit'
import type { Tenant } from '~/types/tenant'
import type { ApiResponse } from '~/types'
import { errorMessage } from '~/types/api'

const props = defineProps<{
  buildingId: string
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const { buildingApi } = useApi()
const toast = useToast()

const state = reactive<{
  title: string
  description: string
  priority: MaintenanceRequestPriority
  tenantId?: string
  unitId?: string
}>({
  title: '',
  description: '',
  priority: 'medium' as MaintenanceRequestPriority,
  tenantId: undefined,
  unitId: undefined,
})

const loading = ref(false)
const loadingOptions = ref(false)
const tenants = ref<Tenant[]>([])
const units = ref<Unit[]>([])

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const tenantOptions = computed(() =>
  tenants.value
    .filter(t => t.status === 'active')
    .map(t => ({ value: t.id, label: t.name }))
)

const unitOptions = computed(() =>
  units.value.map(u => ({
    value: u.id,
    label: `Unit ${u.unitNumber}${u.floor ? ` (Floor ${u.floor})` : ''}`,
  }))
)

const selectedPriority = computed({
  get: () => priorityOptions.find(p => p.value === state.priority),
  set: (val: { value: string; label: string } | undefined) => {
    state.priority = (val?.value as MaintenanceRequestPriority) || 'medium'
  }
})

const selectedTenant = computed({
  get: () => tenantOptions.value.find(t => t.value === state.tenantId),
  set: (val: { value: string; label: string } | undefined) => {
    state.tenantId = val?.value
  }
})

const selectedUnit = computed({
  get: () => unitOptions.value.find(u => u.value === state.unitId),
  set: (val: { value: string; label: string } | undefined) => {
    state.unitId = val?.value
  }
})

async function fetchOptions() {
  loadingOptions.value = true
  try {
    const [tenantRes, unitRes] = await Promise.all([
      buildingApi<ApiResponse<Tenant[]>>(props.buildingId, '/v1/app/tenants'),
      buildingApi<ApiResponse<Unit[]>>(props.buildingId, '/v1/app/units'),
    ])
    tenants.value = tenantRes.data
    units.value = unitRes.data
  } catch (error) {
    toast.add({ title: 'Failed to load tenants and units', description: errorMessage(error), color: 'error' })
  } finally {
    loadingOptions.value = false
  }
}

async function onSubmit(event: FormSubmitEvent<CreateMaintenanceRequestSchema>) {
  loading.value = true
  try {
    await buildingApi<ApiResponse<MaintenanceRequest>>(
      props.buildingId,
      '/v1/app/maintenance-requests',
      {
        method: 'POST',
        body: event.data,
      }
    )
    toast.add({ title: 'Maintenance request created', color: 'success' })
    emit('success')
  } catch (error) {
    toast.add({
      title: 'Failed to create request',
      description: errorMessage(error),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(fetchOptions)
</script>

<template>
  <UForm :schema="createMaintenanceRequestSchema" :state="state" class="space-y-4" @submit="onSubmit">
    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Tenant" name="tenantId" hint="Optional">
        <USelectMenu v-model="selectedTenant" :items="tenantOptions" :loading="loadingOptions"
          placeholder="No tenant" class="w-full" />
      </UFormField>
      <UFormField label="Unit" name="unitId" hint="Optional">
        <USelectMenu v-model="selectedUnit" :items="unitOptions" :loading="loadingOptions"
          :placeholder="state.tenantId ? 'Tenant\'s unit' : 'Common area'" class="w-full" />
      </UFormField>
    </div>
    <p class="text-xs text-gray-500 -mt-2">
      Leave both empty for common areas (lobby, lifts, …). With a tenant and no unit, their leased unit is used.
    </p>

    <UFormField label="Title" name="title" required>
      <UInput v-model="state.title" placeholder="Brief description of the issue" :ui="{ root: 'w-full' }" />
    </UFormField>

    <UFormField label="Description" name="description" required>
      <UTextarea v-model="state.description" placeholder="Provide detailed information about the issue" :rows="4"
        :ui="{ root: 'w-full' }" />
    </UFormField>

    <UFormField label="Priority" name="priority">
      <USelectMenu v-model="selectedPriority" :items="priorityOptions" class="w-full" />
    </UFormField>

    <div class="flex gap-2 justify-end pt-4">
      <UButton type="button" color="neutral" variant="ghost" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="loading">
        Create Request
      </UButton>
    </div>
  </UForm>
</template>
