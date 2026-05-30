<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createLeaseSchema, type CreateLeaseSchema } from '~/schemas/lease'
import type { Lease, LeaseStatus } from '~/types/lease'
import type { Unit } from '~/types/unit'
import type { Building } from '~/types/building'
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
  carsAllowed?: number | string
  useDefaultPaymentDay: boolean
  paymentCollectionDay?: number
  applyWithholding: boolean
  status: LeaseStatus
}>({
  tenantId: props.tenantId,
  unitId: props.lease?.unitId || '',
  startDate: props.lease?.startDate ? new Date(props.lease.startDate).toISOString().split('T')[0] || '' : '',
  endDate: props.lease?.endDate ? new Date(props.lease.endDate).toISOString().split('T')[0] || '' : '',
  rentAmount: props.lease?.rentAmount || 0,
  securityDeposit: props.lease?.securityDeposit || '',
  carsAllowed: props.lease?.carsAllowed ?? '',
  useDefaultPaymentDay: props.lease?.useDefaultPaymentDay ?? true,
  paymentCollectionDay: props.lease?.paymentCollectionDay ?? undefined,
  applyWithholding: props.lease?.applyWithholding ?? false,
  status: props.lease?.status as LeaseStatus || 'active',
})

const loading = ref(false)
const loadingUnits = ref(false)
const units = ref<Unit[]>([])
const building = ref<Building | null>(null)
const showTerminateConfirm = ref(false)
const terminateConfirmText = ref('')
const terminating = ref(false)

const paymentDayOptions = Array.from({ length: 30 }, (_, i) => ({
  value: i + 1,
  label: `Day ${i + 1}`,
}))

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
]

const unitOptions = computed(() =>
  units.value.map(u => ({
    value: u.id,
    label: `${u.unitNumber}${u.floor ? ` - Floor ${u.floor}` : ''}${u.status === 'occupied' ? ' (Occupied)' : ''}`,
    disabled: u.status === 'occupied'
  }))
)

const selectedUnit = computed({
  get: () => unitOptions.value.find(u => u.value === state.unitId),
  set: (val: { value: string; label: string } | undefined) => {
    state.unitId = val?.value || ''

    const unit = units.value.find(u => u.id === val?.value)
    if (unit?.rentPrice && props.mode === 'create') {
      state.rentAmount = unit.rentPrice
    }
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

async function fetchBuilding() {
  try {
    const response = await buildingApi<ApiResponse<Building>>(
      props.buildingId,
      `/v1/app/buildings/${props.buildingId}`
    )
    building.value = response.data
  } catch {
    // non-critical — hint won't show
  }
}

function sanitizeOptionalNumber(body: Record<string, unknown>, key: string) {
  const v = body[key]
  if (v === '' || v === undefined) delete body[key]
}

function buildCreateBody(data: CreateLeaseSchema) {
  const body: Record<string, unknown> = { ...data }
  sanitizeOptionalNumber(body, 'securityDeposit')
  sanitizeOptionalNumber(body, 'carsAllowed')
  if (data.useDefaultPaymentDay) {
    delete body['paymentCollectionDay']
  }
  return body
}

function buildUpdateBody(data: Omit<CreateLeaseSchema, 'tenantId' | 'unitId'>) {
  const body: Record<string, unknown> = { ...data, status: data.status }
  sanitizeOptionalNumber(body, 'securityDeposit')
  sanitizeOptionalNumber(body, 'carsAllowed')
  return body
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
          body: buildCreateBody(event.data),
        }
      )
      toast.add({ title: 'Lease created successfully', color: 'success' })
    } else {
      const { tenantId, unitId, ...updateData } = event.data
      await buildingApi<ApiResponse<Lease>>(
        props.buildingId,
        `/v1/app/leases/${props.lease!.id}`,
        { method: 'PATCH', body: buildUpdateBody(updateData) }
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

async function confirmTerminate() {
  if (terminateConfirmText.value.toLowerCase() !== 'terminate' || !props.lease || !props.buildingId) return
  terminating.value = true
  try {
    await buildingApi<ApiResponse<Lease>>(
      props.buildingId,
      `/v1/app/leases/${props.lease.id}`,
      { method: 'PATCH', body: { status: 'terminated' } }
    )
    toast.add({ title: 'Lease terminated successfully', color: 'success' })
    showTerminateConfirm.value = false
    terminateConfirmText.value = ''
    emit('success')
  } catch (error: any) {
    toast.add({ title: 'Failed to terminate lease', description: error.message || '', color: 'error' })
  } finally {
    terminating.value = false
  }
}

function cancelTerminate() {
  showTerminateConfirm.value = false
  terminateConfirmText.value = ''
}

onMounted(() => {
  fetchUnits()
  fetchBuilding()
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


    <UFormField label="Cars allowed (parking)" name="carsAllowed" :hint="building?.totalParkingLots ? `Building capacity: ${building.totalParkingLots} total lots` : undefined">
      <UInput v-model.number="state.carsAllowed" type="number" min="0" placeholder="0" :ui="{ root: 'w-full' }" />
    </UFormField>

    <div class="space-y-3 rounded-lg border border-gray-200 p-4">
      <p class="text-sm font-medium text-gray-700">Payment settings</p>

      <UFormField name="useDefaultPaymentDay">
        <UCheckbox
          v-model="state.useDefaultPaymentDay"
          label="Use building default payment date"
          :description="building?.paymentCollectionDay ? `Building default: Day ${building.paymentCollectionDay}` : 'No default set on this building'"
        />
      </UFormField>

      <UFormField v-if="!state.useDefaultPaymentDay" label="Payment collection day" name="paymentCollectionDay" required>
        <USelectMenu
          v-model="state.paymentCollectionDay"
          :items="paymentDayOptions"
          value-key="value"
          placeholder="Select day"
          class="w-full"
        />
      </UFormField>

      <UFormField name="applyWithholding">
        <UCheckbox
          v-model="state.applyWithholding"
          label="Tenant will pay withholding tax"
        />
      </UFormField>
    </div>

    <UFormField v-if="mode === 'edit'" label="Status" name="status">
      <USelectMenu v-model="selectedStatus" :items="statusOptions" placeholder="Select status" class="w-full" />
    </UFormField>

    <!-- Terminate (edit mode, active lease only) -->
    <div v-if="mode === 'edit' && lease?.status === 'active' && !showTerminateConfirm"
      class="pt-2 border-t border-gray-200">
      <UButton type="button" color="error" variant="soft" size="sm" @click="showTerminateConfirm = true">
        Terminate lease
      </UButton>
    </div>
    <div v-else-if="mode === 'edit' && lease?.status === 'active' && showTerminateConfirm"
      class="pt-2 border-t border-gray-200 space-y-2">
      <p class="text-sm text-gray-600">Type <strong>terminate</strong> below to confirm.</p>
      <UInput v-model="terminateConfirmText" placeholder="terminate" class="w-full" />
      <div class="flex gap-2">
        <UButton type="button" color="neutral" variant="ghost" size="sm" @click="cancelTerminate">Cancel</UButton>
        <UButton type="button" color="error" size="sm" :disabled="terminateConfirmText.toLowerCase() !== 'terminate'"
          :loading="terminating" @click="confirmTerminate">
          Confirm terminate
        </UButton>
      </div>
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