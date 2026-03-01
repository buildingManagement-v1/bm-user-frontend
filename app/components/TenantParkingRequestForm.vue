<script setup lang="ts">
import type { ApiResponse } from '~/types'
import type { TenantParkingRequest } from '~/types/parking'

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const { api } = useApi()
const toast = useToast()

interface LeaseOption {
  id: string
  unit: { id: string; unitNumber: string; floor?: number }
  status: string
}

const state = reactive<{
  leaseId: string
  licensePlate: string
}>({
  leaseId: '',
  licensePlate: '',
})

const loading = ref(false)
const loadingProfile = ref(false)
const profileLeases = ref<LeaseOption[]>([])

const leaseOptions = computed(() =>
  profileLeases.value
    .filter(l => l.status === 'active' && l.unit)
    .map(l => ({ value: l.id, label: `Unit ${l.unit.unitNumber}` }))
)

async function fetchProfile() {
  loadingProfile.value = true
  try {
    const res = await api<ApiResponse<{ leases: LeaseOption[] }>>('/v1/tenant/profile')
    profileLeases.value = res.data?.leases ?? []
  } catch (e: any) {
    toast.add({ title: 'Failed to load units', description: e.message, color: 'error' })
  } finally {
    loadingProfile.value = false
  }
}

async function onSubmit() {
  const plate = state.licensePlate?.trim()
  if (!plate) {
    toast.add({ title: 'Please enter a license plate', color: 'error' })
    return
  }
  if (!state.leaseId) {
    toast.add({ title: 'Please select a unit', color: 'error' })
    return
  }
  loading.value = true
  try {
    await api<ApiResponse<TenantParkingRequest>>('/v1/tenant/parking-requests', {
      method: 'POST',
      body: { leaseId: state.leaseId, licensePlate: plate },
    })
    toast.add({ title: 'Parking request submitted. It will be reviewed by management.', color: 'success' })
    emit('success')
  } catch (e: any) {
    toast.add({ title: 'Failed to submit request', description: e.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <UFormField label="Unit" required>
      <USelectMenu
        :model-value="leaseOptions.find(u => u.value === state.leaseId)"
        :items="leaseOptions"
        :loading="loadingProfile"
        placeholder="Select unit"
        class="w-full"
        @update:model-value="(v: { value: string } | undefined) => { state.leaseId = v?.value ?? '' }"
      />
    </UFormField>

    <UFormField label="License plate" required>
      <UInput
        v-model="state.licensePlate"
        placeholder="e.g. ABC-1234"
        :ui="{ root: 'w-full' }"
      />
    </UFormField>

    <div class="flex gap-2 justify-end pt-4">
      <UButton type="button" color="neutral" variant="ghost" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="loading">
        Submit for approval
      </UButton>
    </div>
  </form>
</template>
