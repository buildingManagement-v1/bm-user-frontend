<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { onboardTenantSchema, type OnboardTenantSchema } from '~/schemas/tenant'
import type { Unit } from '~/types/unit'
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

const state = reactive<OnboardTenantSchema>({
  name: '',
  email: '',
  phone: '',
  password: '',
  unitId: '',
  leaseStartDate: '',
  leaseEndDate: '',
  rentAmount: 0,
  securityDeposit: 0,
  notes: '',
})

const loading = ref(false)
const loadingUnits = ref(false)
const units = ref<Unit[]>([])

const unitOptions = computed(() =>
  units.value
    .filter(u => u.status === 'vacant')
    .map(u => ({
      value: u.id,
      label: `${u.unitNumber}${u.floor ? ` - Floor ${u.floor}` : ''} - $${u.rentPrice}`,
    }))
)

const selectedUnit = computed({
  get: () => unitOptions.value.find(u => u.value === state.unitId),
  set: (val: { value: string; label: string } | undefined) => {
    state.unitId = val?.value || ''

    // Auto-fill rent amount from selected unit
    if (val?.value) {
      const unit = units.value.find(u => u.id === val.value)
      if (unit) {
        state.rentAmount = Number(unit.rentPrice)
      }
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
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch units', description: error.message, color: 'error' })
  } finally {
    loadingUnits.value = false
  }
}

async function onSubmit(event: FormSubmitEvent<OnboardTenantSchema>) {
  loading.value = true
  try {
    await buildingApi<ApiResponse<any>>(
      props.buildingId,
      '/v1/app/tenants/onboard',
      {
        method: 'POST',
        body: event.data,
      }
    )
    toast.add({ title: 'Tenant onboarded successfully', color: 'success' })
    emit('success')
  } catch (error: any) {
    toast.add({
      title: 'Failed to onboard tenant',
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
  <UForm id="onboard-form" :schema="onboardTenantSchema" :state="state" @submit="onSubmit" class="space-y-6">
    <!-- Tenant Information Section -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tenant Information</h3>

      <UFormField label="Name" name="name" required>
        <UInput v-model="state.name" placeholder="John Doe" :ui="{ root: 'w-full' }" />
      </UFormField>

      <UFormField label="Email" name="email" required>
        <UInput v-model="state.email" type="email" placeholder="john@example.com" :ui="{ root: 'w-full' }" />
      </UFormField>

      <UFormField label="Phone" name="phone">
        <UInput v-model="state.phone" type="tel" placeholder="+1 234 567 8900" :ui="{ root: 'w-full' }" />
      </UFormField>

      <UFormField label="Password (Optional)" name="password">
        <UInput v-model="state.password" type="password" placeholder="Leave empty for no password"
          :ui="{ root: 'w-full' }" />
      </UFormField>
    </div>

    <!-- Unit Assignment Section -->
    <div class="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Unit Assignment</h3>

      <UFormField label="Select Unit" name="unitId" required>
        <USelectMenu v-model="selectedUnit" :items="unitOptions" :loading="loadingUnits"
          placeholder="Select a vacant unit" class="w-full" />
      </UFormField>

      <p v-if="unitOptions.length === 0 && !loadingUnits" class="text-sm text-orange-600 dark:text-orange-400">
        No vacant units available. Please create or make a unit vacant first.
      </p>
    </div>

    <!-- Lease Details Section -->
    <div class="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Lease Details</h3>

      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Start Date" name="leaseStartDate" required>
          <UInput v-model="state.leaseStartDate" type="date" :ui="{ root: 'w-full' }" />
        </UFormField>

        <UFormField label="End Date" name="leaseEndDate" required>
          <UInput v-model="state.leaseEndDate" type="date" :ui="{ root: 'w-full' }" />
        </UFormField>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Monthly Rent" name="rentAmount" required>
          <UInput v-model.number="state.rentAmount" type="number" min="0" step="0.01" placeholder="0.00"
            :ui="{ root: 'w-full' }">
            <template #leading>
              <span class="text-gray-500 dark:text-gray-400">$</span>
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Security Deposit" name="securityDeposit">
          <UInput v-model.number="state.securityDeposit" type="number" min="0" step="0.01" placeholder="0.00"
            :ui="{ root: 'w-full' }">
            <template #leading>
              <span class="text-gray-500 dark:text-gray-400">$</span>
            </template>
          </UInput>
        </UFormField>
      </div>

      <UFormField label="Notes" name="notes">
        <UTextarea v-model="state.notes" placeholder="Additional lease notes..." :rows="3" :ui="{ root: 'w-full' }" />
      </UFormField>
    </div>
  </UForm>
</template>