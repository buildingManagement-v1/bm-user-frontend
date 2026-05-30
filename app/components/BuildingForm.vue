<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { buildingSchema, type BuildingSchema } from '~/schemas/building'
import type { Building } from '~/types/building'
import type { ApiResponse } from '~/types'

const props = defineProps<{
  mode: 'create' | 'edit'
  building?: Building
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const { api } = useApi()
const toast = useToast()

const paymentDayOptions = Array.from({ length: 30 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} of each month`,
}))

const state = reactive({
  name: props.building?.name || '',
  address: props.building?.address || '',
  city: props.building?.city || '',
  country: props.building?.country || '',
  contactEmail: props.building?.contactEmail || '',
  contactPhone: props.building?.contactPhone || '',
  vatRate: props.building?.vatRate ?? ('' as unknown as number),
  withholdingRate: props.building?.withholdingRate ?? ('' as unknown as number),
  paymentCollectionDay: props.building?.paymentCollectionDay ?? undefined as number | undefined,
  totalParkingLots: props.building?.totalParkingLots ?? ('' as unknown as number),
})

const selectedPaymentDay = computed({
  get: () => paymentDayOptions.find(o => o.value === state.paymentCollectionDay),
  set: (val: { value: number; label: string } | undefined) => {
    state.paymentCollectionDay = val?.value
  },
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<BuildingSchema>) {
  loading.value = true
  try {
    if (props.mode === 'create') {
      await api<ApiResponse<Building>>('/v1/app/buildings', {
        method: 'POST',
        body: event.data,
      })
      toast.add({ title: 'Building created successfully', color: 'success' })
    } else {
      await api<ApiResponse<Building>>(`/v1/app/buildings/${props.building!.id}`, {
        method: 'PATCH',
        body: event.data,
      })
      toast.add({ title: 'Building updated successfully', color: 'success' })
    }
    emit('success')
  } catch (error: any) {
    toast.add({
      title: props.mode === 'create' ? 'Failed to create building' : 'Failed to update building',
      description: error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UForm :schema="buildingSchema" :state="state" @submit="onSubmit" class="space-y-4">
    <UFormField label="Building Name" name="name" required>
      <UInput v-model="state.name" placeholder="Enter building name" :ui="{ root: 'w-full' }" />
    </UFormField>

    <UFormField label="Address" name="address">
      <UInput v-model="state.address" placeholder="Street address" :ui="{ root: 'w-full' }" />
    </UFormField>

    <div class="grid grid-cols-2 gap-4">
      <UFormField label="City" name="city">
        <UInput v-model="state.city" placeholder="City" :ui="{ root: 'w-full' }" />
      </UFormField>

      <UFormField label="Country" name="country">
        <UInput v-model="state.country" placeholder="Country" :ui="{ root: 'w-full' }" />
      </UFormField>
    </div>

    <UFormField label="Contact Email" name="contactEmail">
      <UInput v-model="state.contactEmail" type="email" placeholder="contact@building.com" :ui="{ root: 'w-full' }" />
    </UFormField>

    <UFormField label="Contact Phone" name="contactPhone" required>
      <UInput v-model="state.contactPhone" type="tel" placeholder="+1234567890" :ui="{ root: 'w-full' }" />
    </UFormField>

    <div class="border-t border-gray-200 pt-4">
      <p class="text-sm font-medium text-gray-700 mb-3">Tax & Billing Settings</p>
      <div class="grid grid-cols-2 gap-4">
        <UFormField label="VAT Rate (%)" name="vatRate" required>
          <UInput v-model.number="state.vatRate" type="number" min="0" max="100" step="0.1" placeholder="e.g. 15" :ui="{ root: 'w-full' }" />
        </UFormField>
        <UFormField label="Withholding Rate (%)" name="withholdingRate" required>
          <UInput v-model.number="state.withholdingRate" type="number" min="0" max="100" step="0.1" placeholder="e.g. 3" :ui="{ root: 'w-full' }" />
        </UFormField>
      </div>
      <div class="grid grid-cols-2 gap-4 mt-4">
        <UFormField label="Default Payment Collection Day" name="paymentCollectionDay" required>
          <USelectMenu v-model="selectedPaymentDay" :items="paymentDayOptions" placeholder="Select day" class="w-full" />
        </UFormField>
        <UFormField label="Total Parking Lots" name="totalParkingLots" required>
          <UInput v-model.number="state.totalParkingLots" type="number" min="0" placeholder="e.g. 20" :ui="{ root: 'w-full' }" />
        </UFormField>
      </div>
    </div>

    <div class="flex gap-2 justify-end pt-4">
      <UButton type="button" color="neutral" variant="ghost" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="loading">
        {{ mode === 'create' ? 'Create Building' : 'Update Building' }}
      </UButton>
    </div>
  </UForm>
</template>