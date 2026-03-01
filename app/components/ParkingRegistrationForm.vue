<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createParkingRegistrationSchema, type CreateParkingRegistrationSchema } from '~/schemas/parking'
import type { ParkingRegistration } from '~/types/parking'
import type { Tenant } from '~/types/tenant'
import type { ApiResponse } from '~/types'

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
  tenantId: string
  unitId: string
  licensePlate: string
}>({
  tenantId: '',
  unitId: '',
  licensePlate: '',
})

const loading = ref(false)
const loadingTenants = ref(false)
const loadingTenantDetails = ref(false)
const tenants = ref<Tenant[]>([])
const tenantDetails = ref<Tenant | null>(null)

const tenantOptions = computed(() =>
  tenants.value
    .filter(t => t.status === 'active')
    .map(t => ({ value: t.id, label: t.name }))
)

const unitOptions = computed(() => {
  const leases = tenantDetails.value?.leases?.filter(l => l.status === 'active') ?? []
  return leases.map(l => ({
    value: l.unit.id,
    label: `Unit ${l.unit.unitNumber}`,
  }))
})

const selectedTenant = computed({
  get: () => tenantOptions.value.find(t => t.value === state.tenantId),
  set: async (val: { value: string; label: string } | undefined) => {
    state.tenantId = val?.value || ''
    state.unitId = ''
    tenantDetails.value = null
    if (state.tenantId) await fetchTenantDetails(state.tenantId)
  },
})

const selectedUnit = computed({
  get: () => unitOptions.value.find(u => u.value === state.unitId),
  set: (val: { value: string; label: string } | undefined) => {
    state.unitId = val?.value || ''
  },
})

async function fetchTenants() {
  loadingTenants.value = true
  try {
    const response = await buildingApi<ApiResponse<Tenant[]>>(
      props.buildingId,
      '/v1/app/tenants'
    )
    tenants.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch tenants', description: error.message, color: 'error' })
  } finally {
    loadingTenants.value = false
  }
}

async function fetchTenantDetails(tenantId: string) {
  loadingTenantDetails.value = true
  try {
    const response = await buildingApi<ApiResponse<Tenant>>(
      props.buildingId,
      `/v1/app/tenants/${tenantId}`
    )
    tenantDetails.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to load tenant units', description: error.message, color: 'error' })
    tenantDetails.value = null
  } finally {
    loadingTenantDetails.value = false
  }
}

async function onSubmit(event: FormSubmitEvent<CreateParkingRegistrationSchema>) {
  loading.value = true
  try {
    await buildingApi<ApiResponse<ParkingRegistration>>(
      props.buildingId,
      '/v1/app/parking',
      {
        method: 'POST',
        body: event.data,
      }
    )
    toast.add({ title: 'Car registered successfully', color: 'success' })
    emit('success')
  } catch (error: any) {
    const msg = error?.data?.message || error.message || 'Failed to register car'
    toast.add({
      title: 'Registration failed',
      description: msg,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTenants()
})
</script>

<template>
  <UForm :schema="createParkingRegistrationSchema" :state="state" @submit="onSubmit" class="space-y-4">
    <UFormField label="Tenant" name="tenantId" required>
      <USelectMenu
        v-model="selectedTenant"
        :items="tenantOptions"
        :loading="loadingTenants"
        placeholder="Select tenant"
        class="w-full"
      />
    </UFormField>

    <UFormField v-if="state.tenantId" label="Unit" name="unitId" required>
      <USelectMenu
        v-model="selectedUnit"
        :items="unitOptions"
        :loading="loadingTenantDetails"
        placeholder="Select unit"
        class="w-full"
      />
      <template v-if="!loadingTenantDetails && tenantDetails && (!tenantDetails.leases?.length || !unitOptions.length)" #hint>
        <span class="text-xs text-amber-600">This tenant has no active leases.</span>
      </template>
    </UFormField>

    <UFormField label="License plate" name="licensePlate" required>
      <UInput v-model="state.licensePlate" placeholder="e.g. ABC-1234" :ui="{ root: 'w-full' }" />
    </UFormField>

    <div class="flex gap-2 justify-end pt-4">
      <UButton type="button" color="neutral" variant="ghost" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="loading">
        Register car
      </UButton>
    </div>
  </UForm>
</template>
