<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createLeaseSchema, type CreateLeaseSchema } from '~/schemas/lease'
import type { Lease, LeaseStatus } from '~/types/lease'
import type { Unit } from '~/types/unit'
import type { ApiResponse } from '~/types'

const props = defineProps<{
  buildingId: string
  tenantId: string
  lease?: Lease
  mode: 'create' | 'edit'
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
  startDate: string
  endDate: string
  rentAmount: number | string
  securityDeposit?: number | string
  status: LeaseStatus
}>({
  tenantId: props.tenantId,
  unitId: props.lease?.unitId || '',
  startDate: props.lease?.startDate ? new Date(props.lease.startDate).toISOString().split('T')[0] || '' : '',
  endDate: props.lease?.endDate ? new Date(props.lease.endDate).toISOString().split('T')[0] || '' : '',
  rentAmount: props.lease?.rentAmount || 0,
  securityDeposit: props.lease?.securityDeposit || '',
  status: props.lease?.status as LeaseStatus || 'active',
})

const loading = ref(false)
const loadingUnits = ref(false)
const units = ref<Unit[]>([])

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'terminated', label: 'Terminated' },
]

const unitOptions = computed(() =>
  units.value.map(u => ({
    value: u.id,
    label: `${u.unitNumber}${u.floor ? ` - Floor ${u.floor}` : ''}`,
  }))
)

const selectedUnit = computed({
  get: () => unitOptions.value.find(u => u.value === state.unitId),
  set: (val: { value: string; label: string } | undefined) => {
    state.unitId = val?.value || ''
  }
})

const selectedStatus = computed({
  get: () => statusOptions.find(s => s.value === state.status),
  set: (val: { value: string; label: string } | undefined) => {
    state.status = (val?.value as LeaseStatus) || 'active'
  }
})

async function fetchUnits() {
  loadingUnits.value = true
  try {
    const response = await buildingApi<ApiResponse<Unit[]>>(
      props.buildingId,
      '/v1/app/units'
    )
    units.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch units', description: error.message, color: 'error' })
  } finally {
    loadingUnits.value = false
  }
}

async function onSubmit(event: FormSubmitEvent<CreateLeaseSchema>) {
  loading.value = true
  try {
    if (props.mode === 'create') {
      await buildingApi<ApiResponse<Lease>>(
        props.buildingId,
        '/v1/app/leases',
        {
          method: 'POST',
          body: event.data,
        }
      )
      toast.add({ title: 'Lease created successfully', color: 'success' })
    } else {
      const { tenantId, unitId, status, ...updateData } = event.data
      await buildingApi<ApiResponse<Lease>>(
        props.buildingId,
        `/v1/app/leases/${props.lease!.id}`,
        {
          method: 'PATCH',
          body: updateData,
        }
      )
      toast.add({ title: 'Lease updated successfully', color: 'success' })
    }
    emit('success')
  } catch (error: any) {
    toast.add({
      title: props.mode === 'create' ? 'Failed to create lease' : 'Failed to update lease',
      description: error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUnits()
})
</script>

<template>
  <UForm :schema="createLeaseSchema" :state="state" @submit="onSubmit" class="space-y-4">
    <UFormField label="Unit" name="unitId" required>
      <USelectMenu v-model="selectedUnit" :items="unitOptions" :loading="loadingUnits" placeholder="Select unit"
        class="w-full" />
    </UFormField>

    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Start Date" name="startDate" required>
        <UInput v-model="state.startDate" type="date" :ui="{ root: 'w-full' }" />
      </UFormField>

      <UFormField label="End Date" name="endDate" required>
        <UInput v-model="state.endDate" type="date" :ui="{ root: 'w-full' }" />
      </UFormField>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Monthly Rent" name="rentAmount" required>
        <UInput v-model.number="state.rentAmount" type="number" placeholder="0.00" :ui="{ root: 'w-full' }" />
      </UFormField>

      <UFormField label="Security Deposit" name="securityDeposit">
        <UInput v-model.number="state.securityDeposit" type="number" placeholder="0.00" :ui="{ root: 'w-full' }" />
      </UFormField>
    </div>

    <div class="flex gap-2 justify-end pt-4">
      <UButton type="button" color="neutral" variant="ghost" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="loading">
        {{ mode === 'create' ? 'Create Lease' : 'Update Lease' }}
      </UButton>
    </div>
  </UForm>
</template>