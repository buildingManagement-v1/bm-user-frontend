<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import {
  createLeaseSchema,
  terminateLeaseSchema,
  type CreateLeaseSchema,
  type TerminateLeaseSchema,
} from '~/schemas/lease'
import type { Lease, TerminateLeaseResult } from '~/types/lease'
import type { Unit } from '~/types/unit'
import type { Building } from '~/types/building'
import type { ApiResponse } from '~/types'
import { errorMessage } from '~/types/api'

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

const todayIso = new Date().toISOString().slice(0, 10)
const toIsoDate = (value?: string) => (value ? new Date(value).toISOString().slice(0, 10) : '')

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
}>({
  tenantId: props.tenantId,
  unitId: props.lease?.unitId || '',
  startDate: toIsoDate(props.lease?.startDate),
  endDate: toIsoDate(props.lease?.endDate),
  rentAmount: props.lease?.rentAmount || 0,
  securityDeposit: props.lease?.securityDeposit ?? '',
  carsAllowed: props.lease?.carsAllowed ?? '',
  useDefaultPaymentDay: props.lease?.useDefaultPaymentDay ?? true,
  paymentCollectionDay: props.lease?.paymentCollectionDay ?? undefined,
  applyWithholding: props.lease?.applyWithholding ?? false,
})

const loading = ref(false)
const loadingUnits = ref(false)
const units = ref<Unit[]>([])
const building = ref<Building | null>(null)

/** Ended leases are history: shown read-only */
const isEnded = computed(() => props.mode === 'edit' && props.lease?.status !== 'active')
/** The start date is fixed once the first rent cycle has begun */
const hasStarted = computed(() => props.mode === 'edit' && !!props.lease && toIsoDate(props.lease.startDate) <= todayIso)

const taxPreview = computed(() => {
  const base = Number(state.rentAmount)
  if (!base || base <= 0 || !building.value) return null
  const vatRate = Number(building.value.vatRate ?? 0)
  const withholdingRate = Number(building.value.withholdingRate ?? 0)
  if (vatRate === 0 && withholdingRate === 0) return null
  const vat = vatRate > 0 ? Math.round(base * (vatRate / 100) * 100) / 100 : 0
  const withholding = state.applyWithholding && withholdingRate > 0
    ? Math.round((base + vat) * (withholdingRate / 100) * 100) / 100
    : 0
  const total = Math.round((base + vat - withholding) * 100) / 100
  return { base, vat, vatRate, withholding, withholdingRate, total }
})

// Occupied units can still take a lease that starts after the current one ends
const unitOptions = computed(() =>
  units.value.map(u => ({
    value: u.id,
    label: `${u.unitNumber}${u.floor ? ` - Floor ${u.floor}` : ''}${u.id === props.lease?.unitId ? '' : u.status === 'occupied' ? ' (occupied — future start only)' : u.status === 'inactive' ? ' (inactive)' : ''}`,
    disabled: u.status === 'inactive',
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

async function fetchUnits() {
  loadingUnits.value = true
  try {
    const response = await buildingApi<ApiResponse<Unit[]>>(
      props.buildingId,
      '/v1/app/units'
    )
    units.value = response.data
  } catch (error) {
    toast.add({ title: 'Failed to fetch units', description: errorMessage(error), color: 'error' })
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

function buildBody(data: CreateLeaseSchema) {
  const body: Record<string, unknown> = { ...data }
  for (const key of ['securityDeposit', 'carsAllowed'] as const) {
    if (body[key] === '' || body[key] === undefined) delete body[key]
  }
  if (data.useDefaultPaymentDay) delete body.paymentCollectionDay
  if (props.mode === 'edit') {
    delete body.tenantId
    delete body.unitId
    if (hasStarted.value) delete body.startDate
  }
  return body
}

async function onSubmit(event: FormSubmitEvent<CreateLeaseSchema>) {
  loading.value = true
  try {
    if (props.mode === 'create') {
      await buildingApi<ApiResponse<Lease>>(props.buildingId, '/v1/app/leases', {
        method: 'POST',
        body: buildBody(event.data),
      })
      toast.add({ title: 'Lease created successfully', color: 'success' })
    } else {
      await buildingApi<ApiResponse<Lease>>(props.buildingId, `/v1/app/leases/${props.lease!.id}`, {
        method: 'PATCH',
        body: buildBody(event.data),
      })
      toast.add({ title: 'Lease updated successfully', color: 'success' })
    }
    emit('success')
  } catch (error) {
    toast.add({
      title: props.mode === 'create' ? 'Failed to create lease' : 'Failed to update lease',
      description: errorMessage(error),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// ─── Early termination ────────────────────────────────────────────────────
const showTerminate = ref(false)
const terminating = ref(false)
const terminateState = reactive<TerminateLeaseSchema>({ effectiveDate: todayIso, reason: '' })
const earliestTermination = computed(() => {
  const start = toIsoDate(props.lease?.startDate)
  return start && start < todayIso ? start : todayIso
})

async function onTerminate(event: FormSubmitEvent<TerminateLeaseSchema>) {
  if (!props.lease) return
  terminating.value = true
  try {
    const res = await buildingApi<ApiResponse<TerminateLeaseResult>>(
      props.buildingId,
      `/v1/app/leases/${props.lease.id}/terminate`,
      {
        method: 'POST',
        body: { effectiveDate: event.data.effectiveDate, reason: event.data.reason || undefined },
      }
    )
    const r = res.data
    const owed = r.outstandingRent > 0
      ? ` ETB ${r.outstandingRent.toLocaleString()} (before tax) is still owed.`
      : ' Nothing is owed.'
    const prepaid = r.prepaidPeriodsAfterEnd > 0
      ? ` ${r.prepaidPeriodsAfterEnd} prepaid period(s) fall after the end date — settle a refund with the tenant.`
      : ''
    toast.add({
      title: `Lease ended on ${r.effectiveDate}`,
      description: `${r.removedPeriods} future period(s) removed.${owed}${prepaid}`,
      color: 'success',
      duration: 10000,
    })
    showTerminate.value = false
    emit('success')
  } catch (error) {
    toast.add({ title: 'Failed to terminate lease', description: errorMessage(error), color: 'error' })
  } finally {
    terminating.value = false
  }
}

onMounted(() => {
  fetchUnits()
  fetchBuilding()
})
</script>

<template>
  <div class="space-y-4">
    <UAlert v-if="isEnded" color="neutral" variant="subtle" icon="i-heroicons-lock-closed"
      :title="`This lease is ${lease?.status}`"
      :description="lease?.terminationReason ? `Reason: ${lease.terminationReason}` : 'Ended leases can no longer be edited.'" />
    <UAlert v-else-if="mode === 'edit'" color="info" variant="subtle" icon="i-heroicons-information-circle"
      description="Changes to rent, dates or payment day apply to rent cycles that haven't started or been paid yet." />

    <UForm :schema="createLeaseSchema" :state="state" :disabled="isEnded" class="space-y-4" @submit="onSubmit">
      <UFormField label="Unit" name="unitId" required>
        <USelectMenu v-model="selectedUnit" :items="unitOptions" :loading="loadingUnits" placeholder="Select unit"
          :disabled="mode === 'edit'" class="w-full" />
      </UFormField>

      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Start Date" name="startDate" required
          :help="hasStarted ? 'Fixed once the lease has started' : undefined">
          <UInput v-model="state.startDate" type="date" :disabled="hasStarted" :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="End Date" name="endDate" required>
          <UInput v-model="state.endDate" type="date" :min="mode === 'edit' ? todayIso : undefined" :ui="{ root: 'w-full' }" />
        </UFormField>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Monthly Rent (ETB, before tax)" name="rentAmount" required>
          <UInput v-model.number="state.rentAmount" type="number" min="0" step="0.01" placeholder="0.00" :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="Security Deposit (ETB)" name="securityDeposit">
          <UInput v-model.number="state.securityDeposit" type="number" min="0" placeholder="0.00" :ui="{ root: 'w-full' }" />
        </UFormField>
      </div>

      <UFormField label="Cars allowed (parking)" name="carsAllowed"
        :hint="building ? (building.totalParkingLots ? `Building capacity: ${building.totalParkingLots} total lots` : 'This building has no parking lots') : undefined">
        <UInput v-model.number="state.carsAllowed" type="number" min="0" placeholder="0" :ui="{ root: 'w-full' }" />
      </UFormField>

      <div class="space-y-3 rounded-lg border border-gray-200 p-4">
        <p class="text-sm font-medium text-gray-700">Payment settings</p>

        <UFormField name="useDefaultPaymentDay">
          <UCheckbox
            v-model="state.useDefaultPaymentDay"
            label="Use building default payment date"
            :description="building?.paymentCollectionDay ? `Building default: day ${building.paymentCollectionDay}` : 'No default set on this building'"
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

      <div v-if="taxPreview" class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm space-y-1">
        <p class="text-xs font-medium text-gray-500 mb-2">Monthly payment breakdown</p>
        <div class="flex justify-between text-gray-700">
          <span>Base rent</span>
          <span>ETB {{ taxPreview.base.toLocaleString() }}</span>
        </div>
        <div class="flex justify-between text-gray-700">
          <span>VAT ({{ taxPreview.vatRate }}%)</span>
          <span>+ ETB {{ taxPreview.vat.toLocaleString() }}</span>
        </div>
        <div v-if="state.applyWithholding && taxPreview.withholding > 0" class="flex justify-between text-gray-700">
          <span>Withholding ({{ taxPreview.withholdingRate }}%)</span>
          <span>- ETB {{ taxPreview.withholding.toLocaleString() }}</span>
        </div>
        <div class="border-t border-gray-300 pt-1 flex justify-between font-semibold text-gray-900">
          <span>Tenant pays</span>
          <span>ETB {{ taxPreview.total.toLocaleString() }}</span>
        </div>
      </div>

      <div class="flex gap-2 justify-end pt-2">
        <UButton type="button" color="neutral" variant="ghost" @click="emit('cancel')">
          {{ isEnded ? 'Close' : 'Cancel' }}
        </UButton>
        <UButton v-if="!isEnded" type="submit" color="primary" :loading="loading">
          {{ mode === 'create' ? 'Create Lease' : 'Update Lease' }}
        </UButton>
      </div>
    </UForm>

    <!-- Early termination (active leases only) -->
    <div v-if="mode === 'edit' && lease?.status === 'active'" class="pt-4 border-t border-gray-200">
      <UButton v-if="!showTerminate" type="button" color="error" variant="soft" size="sm"
        icon="i-heroicons-x-circle" @click="() => { showTerminate = true }">
        Terminate lease early
      </UButton>
      <UForm v-else :schema="terminateLeaseSchema" :state="terminateState" class="space-y-3" @submit="onTerminate">
        <p class="text-sm text-gray-600">
          Rent is charged up to and including the last day: later unpaid periods are removed and the period
          containing that day is prorated. Earlier unpaid rent stays owed. The unit is freed and parking released.
        </p>
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Last day of tenancy" name="effectiveDate" required>
            <UInput v-model="terminateState.effectiveDate" type="date" :min="earliestTermination" :max="todayIso"
              :ui="{ root: 'w-full' }" />
          </UFormField>
          <UFormField label="Reason" name="reason">
            <UInput v-model="terminateState.reason" placeholder="e.g. Moved out early" :ui="{ root: 'w-full' }" />
          </UFormField>
        </div>
        <div class="flex gap-2">
          <UButton type="button" color="neutral" variant="ghost" size="sm" @click="() => { showTerminate = false }">Cancel</UButton>
          <UButton type="submit" color="error" size="sm" :loading="terminating">Terminate lease</UButton>
        </div>
      </UForm>
    </div>
  </div>
</template>
