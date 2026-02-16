<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createPaymentSchema, type CreatePaymentSchema } from '~/schemas/payment'
import type { Payment, PaymentType, PaymentCalendar } from '~/types/payment'
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
  amount: number
  type: PaymentType
  paymentDate: string
  monthsCovered: string[]
  notes?: string
}>({
  tenantId: '',
  amount: 0,
  type: 'rent' as PaymentType,
  paymentDate: new Date().toISOString().split('T')[0] || '',
  monthsCovered: [],
  notes: '',
})

const loading = ref(false)
const loadingTenants = ref(false)
const loadingCalendar = ref(false)
const tenants = ref<Tenant[]>([])
const paymentCalendar = ref<PaymentCalendar[]>([])

const typeOptions = [
  { value: 'rent', label: 'Rent' },
  { value: 'utility', label: 'Utility' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'other', label: 'Other' },
]

const tenantOptions = computed(() =>
  tenants.value
    .filter(t => t.status === 'active')
    .map(t => ({
      value: t.id,
      label: `${t.name} ${t.unit ? `(${t.unit.unitNumber})` : ''}`,
    }))
)

// Months that can be covered by a payment: unpaid (current/future) or overdue (past due, not paid)
const unpaidMonths = computed(() => {
  if (!paymentCalendar.value.length) return []

  return paymentCalendar.value[0]?.periods
    .filter(p => p.status === 'unpaid' || p.status === 'overdue')
    .map(p => ({
      value: p.month,
      label: new Date(p.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
    })) || []
})

const selectedTenant = computed({
  get: () => tenantOptions.value.find(t => t.value === state.tenantId),
  set: (val: { value: string; label: string } | undefined) => {
    state.tenantId = val?.value || ''
    if (state.tenantId) {
      fetchPaymentCalendar(state.tenantId)
    }
  }
})

const selectedMonths = computed({
  get: () => unpaidMonths.value.filter(m => state.monthsCovered.includes(m.value)),
  set: (val: Array<{ value: string; label: string }>) => {
    state.monthsCovered = val.map(v => v.value)
  }
})

const selectedType = computed({
  get: () => typeOptions.find(t => t.value === state.type),
  set: (val: { value: string; label: string } | undefined) => {
    state.type = (val?.value as PaymentType) || 'rent'
  }
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

async function fetchPaymentCalendar(tenantId: string) {
  loadingCalendar.value = true
  try {
    const response = await buildingApi<ApiResponse<PaymentCalendar[]>>(
      props.buildingId,
      `/v1/app/payments/calendar/${tenantId}`
    )
    paymentCalendar.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch payment calendar', description: error.message, color: 'error' })
  } finally {
    loadingCalendar.value = false
  }
}

async function onSubmit(event: FormSubmitEvent<CreatePaymentSchema>) {
  loading.value = true
  try {
    await buildingApi<ApiResponse<Payment>>(
      props.buildingId,
      '/v1/app/payments',
      {
        method: 'POST',
        body: event.data,
      }
    )
    toast.add({ title: 'Payment recorded successfully', color: 'success' })
    emit('success')
  } catch (error: any) {
    toast.add({
      title: 'Failed to record payment',
      description: error.message,
      color: 'error'
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
  <UForm :schema="createPaymentSchema" :state="state" @submit="onSubmit" class="space-y-4">
    <UFormField label="Tenant" name="tenantId" required>
      <USelectMenu v-model="selectedTenant" :items="tenantOptions" :loading="loadingTenants" placeholder="Select tenant"
        class="w-full" />
    </UFormField>

    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Amount" name="amount" required>
        <UInput v-model.number="state.amount" type="number" placeholder="0.00" :ui="{ root: 'w-full' }" />
      </UFormField>

      <UFormField label="Payment Type" name="type" required>
        <USelectMenu v-model="selectedType" :items="typeOptions" class="w-full" />
      </UFormField>
    </div>

    <UFormField label="Payment Date" name="paymentDate" required>
      <UInput v-model="state.paymentDate" type="date" :ui="{ root: 'w-full' }" />
    </UFormField>

    <UFormField v-if="state.type === 'rent' && unpaidMonths.length > 0" label="Months Covered" name="monthsCovered">
      <USelectMenu v-model="selectedMonths" :items="unpaidMonths" multiple placeholder="Select months" class="w-full" />
      <template #hint>
        <span class="text-xs text-gray-500">Select which months this payment covers</span>
      </template>
    </UFormField>

    <UFormField label="Notes" name="notes">
      <UTextarea v-model="state.notes" placeholder="Additional notes (optional)" :rows="3" :ui="{ root: 'w-full' }" />
    </UFormField>

    <div class="flex gap-2 justify-end pt-4">
      <UButton type="button" color="neutral" variant="ghost" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="loading">
        Record Payment
      </UButton>
    </div>
  </UForm>
</template>