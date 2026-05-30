<script setup lang="ts">
import type { PaymentType, PaymentCalendar, PaymentPeriod } from '~/types/payment'
import type { ApiResponse } from '~/types'
import type { TenantPaymentRequest } from '~/types/payment-request'
import { createPaymentRequestSchema, type CreatePaymentRequestSchema } from '~/schemas/payment-request'

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const { api } = useApi()
const toast = useToast()

const state = reactive<{
  unitId: string
  amount: number
  type: PaymentType
  paymentDate: string
  monthsCovered: string[]
  notes?: string
}>({
  unitId: '',
  amount: 0,
  type: 'rent' as PaymentType,
  paymentDate: new Date().toISOString().split('T')[0] ?? '',
  monthsCovered: [],
  notes: '',
})

const receiptFile = ref<File | null>(null)
const loading = ref(false)
const loadingProfile = ref(false)
const loadingCalendar = ref(false)
interface LeaseOption { unit: { id: string; unitNumber: string; floor?: number }; status: string }
const profileLeases = ref<LeaseOption[]>([])
const paymentCalendar = ref<PaymentCalendar[]>([])

const typeOptions = [
  { value: 'rent', label: 'Rent' },
  { value: 'utility', label: 'Utility' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'other', label: 'Other' },
]

const unitOptions = computed(() => {
  return profileLeases.value
    .filter(l => l.status === 'active' && l.unit)
    .map(l => ({ value: l.unit.id, label: `Unit ${l.unit.unitNumber}` }))
})

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatPeriodLabel(p: Pick<PaymentPeriod, 'periodStart' | 'periodEnd' | 'daysInCycle' | 'month'>): string {
  if (p.periodStart && p.periodEnd) {
    const s = new Date(p.periodStart)
    const e = new Date(p.periodEnd)
    const sm = s.getUTCMonth(), sd = s.getUTCDate(), sy = s.getUTCFullYear()
    const em = e.getUTCMonth(), ed = e.getUTCDate(), ey = e.getUTCFullYear()
    const range = (sm === em && sy === ey)
      ? `${MONTHS_SHORT[sm]} ${sd}–${ed}`
      : `${MONTHS_SHORT[sm]} ${sd} – ${MONTHS_SHORT[em]} ${ed}`
    return p.daysInCycle ? `${range} · ${p.daysInCycle}d` : range
  }
  return new Date(p.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

const isRentType = computed(() => state.type === 'rent')

const unpaidMonths = computed(() => {
  if (!state.unitId || !paymentCalendar.value.length) return []
  const cal = paymentCalendar.value.find((c: PaymentCalendar) => c.unitId === state.unitId)
  if (!cal?.periods) return []
  return (cal.periods as PaymentPeriod[])
    .filter(p => p.status === 'unpaid' || p.status === 'overdue')
    .map(p => ({ value: p.month, label: formatPeriodLabel(p) }))
})

const computedAmount = computed<number>(() => {
  if (isRentType.value && state.monthsCovered.length > 0) {
    const cal = paymentCalendar.value.find((c: PaymentCalendar) => c.unitId === state.unitId)
    if (!cal?.periods) return 0
    return (cal.periods as PaymentPeriod[])
      .filter(p => state.monthsCovered.includes(p.month))
      .reduce((sum, p) => sum + Number(p.rentAmount), 0)
  }
  return state.amount
})

watch(computedAmount, (val) => {
  if (isRentType.value) state.amount = val
}, { immediate: true })

const taxBreakdown = computed(() => {
  if (!isRentType.value || state.monthsCovered.length === 0) return null
  const cal = paymentCalendar.value.find((c: PaymentCalendar) => c.unitId === state.unitId)
  if (!cal) return null
  const base = computedAmount.value
  const vat = cal.vatRate > 0 ? Math.round(base * (cal.vatRate / 100) * 100) / 100 : 0
  const withholding = cal.applyWithholding && cal.withholdingRate > 0
    ? Math.round((base + vat) * (cal.withholdingRate / 100) * 100) / 100
    : 0
  const total = Math.round((base + vat - withholding) * 100) / 100
  if (vat === 0 && withholding === 0) return null
  return { base, vat, vatRate: cal.vatRate, withholding, withholdingRate: cal.withholdingRate, applyWithholding: cal.applyWithholding, total }
})

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

async function fetchCalendar() {
  loadingCalendar.value = true
  try {
    const res = await api<ApiResponse<PaymentCalendar[]>>('/v1/tenant/payment-calendar')
    paymentCalendar.value = res.data ?? []
  } catch (e: any) {
    toast.add({ title: 'Failed to load calendar', description: e.message, color: 'error' })
  } finally {
    loadingCalendar.value = false
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file && file.type.startsWith('image/')) {
    receiptFile.value = file
  } else if (file) {
    toast.add({ title: 'Please select an image file (JPG, PNG, etc.)', color: 'error' })
    receiptFile.value = null
  }
}

async function onSubmit() {
  if (!receiptFile.value) {
    toast.add({ title: 'Please upload a receipt image', color: 'error' })
    return
  }
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('unitId', state.unitId)
    formData.append('amount', String(state.amount))
    formData.append('type', state.type)
    formData.append('paymentDate', state.paymentDate)
    if (state.monthsCovered?.length) formData.append('monthsCovered', JSON.stringify(state.monthsCovered))
    if (state.notes) formData.append('notes', state.notes)
    formData.append('receipt', receiptFile.value)

    await api<ApiResponse<TenantPaymentRequest>>('/v1/tenant/payment-requests', {
      method: 'POST',
      body: formData,
    })
    toast.add({ title: 'Payment request submitted. It will be reviewed by management.', color: 'success' })
    emit('success')
  } catch (e: any) {
    toast.add({ title: 'Failed to submit request', description: e.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfile()
  fetchCalendar()
})
</script>

<template>
  <UForm :schema="createPaymentRequestSchema" :state="state" @submit="onSubmit" class="space-y-4">
    <UFormField label="Unit" name="unitId" required>
      <USelectMenu
        :model-value="unitOptions.find(u => u.value === state.unitId)"
        :items="unitOptions"
        :loading="loadingProfile"
        placeholder="Select unit"
        class="w-full"
        @update:model-value="(v: { value: string } | undefined) => { state.unitId = v?.value ?? '' }"
      />
    </UFormField>

    <div v-if="taxBreakdown" class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm space-y-1">
      <div class="flex justify-between text-gray-700">
        <span>Base rent</span>
        <span>ETB {{ taxBreakdown.base.toLocaleString() }}</span>
      </div>
      <div class="flex justify-between text-gray-700">
        <span>VAT ({{ taxBreakdown.vatRate }}%)</span>
        <span>+ ETB {{ taxBreakdown.vat.toLocaleString() }}</span>
      </div>
      <div v-if="taxBreakdown.applyWithholding && taxBreakdown.withholding > 0" class="flex justify-between text-gray-700">
        <span>Withholding ({{ taxBreakdown.withholdingRate }}%)</span>
        <span>- ETB {{ taxBreakdown.withholding.toLocaleString() }}</span>
      </div>
      <div class="border-t border-gray-300 pt-1 flex justify-between font-semibold text-gray-900">
        <span>Total</span>
        <span>ETB {{ taxBreakdown.total.toLocaleString() }}</span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Amount" name="amount" required :hint="isRentType && state.monthsCovered.length > 0 ? 'Auto-computed from selected periods' : undefined">
        <UInput
          v-model.number="state.amount"
          type="number"
          placeholder="0.00"
          :disabled="isRentType"
          :ui="{ root: 'w-full' }"
        />
      </UFormField>
      <UFormField label="Payment Type" name="type" required>
        <USelectMenu
          :model-value="typeOptions.find(t => t.value === state.type)"
          :items="typeOptions"
          class="w-full"
          @update:model-value="(v: { value: string } | undefined) => { state.type = (v?.value as PaymentType) ?? 'rent' }"
        />
      </UFormField>
    </div>

    <UFormField label="Payment Date" name="paymentDate" required>
      <UInput v-model="state.paymentDate" type="date" :ui="{ root: 'w-full' }" />
    </UFormField>

    <UFormField v-if="state.type === 'rent' && unpaidMonths.length > 0" label="Months covered" name="monthsCovered">
      <USelectMenu
        :model-value="unpaidMonths.filter(m => state.monthsCovered.includes(m.value))"
        :items="unpaidMonths"
        multiple
        placeholder="Select months"
        class="w-full"
        @update:model-value="(v: Array<{ value: string }>) => { state.monthsCovered = v?.map(x => x.value) ?? [] }"
      />
    </UFormField>

    <UFormField label="Receipt image" required>
      <UInput type="file" accept="image/*" @change="onFileChange" :ui="{ root: 'w-full' }" />
      <template v-if="receiptFile" #hint>
        <span class="text-xs text-gray-500">{{ receiptFile.name }}</span>
      </template>
    </UFormField>

    <UFormField label="Notes" name="notes">
      <UTextarea v-model="state.notes" placeholder="Optional notes" :rows="2" :ui="{ root: 'w-full' }" />
    </UFormField>

    <div class="flex gap-2 justify-end pt-4">
      <UButton type="button" color="neutral" variant="ghost" @click="emit('cancel')">Cancel</UButton>
      <UButton type="submit" color="primary" :loading="loading">Submit for approval</UButton>
    </div>
  </UForm>
</template>
