<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createUnitSchema, updateUnitSchema, type CreateUnitSchema, type UpdateUnitSchema } from '~/schemas/unit'
import type { Unit, UnitType, UnitStatus } from '~/types/unit'
import type { ApiResponse } from '~/types'

const props = defineProps<{
  mode: 'create' | 'edit'
  buildingId: string
  unit?: Unit
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const { buildingApi } = useApi()
const toast = useToast()

const state = reactive<{
  unitNumber: string
  floor?: number
  size?: number
  type?: UnitType
  rentPrice: number
  status: UnitStatus
}>({
  unitNumber: props.unit?.unitNumber || '',
  floor: props.unit?.floor,
  size: props.unit?.size,
  type: props.unit?.type,
  rentPrice: props.unit?.rentPrice || 0,
  status: props.unit?.status as UnitStatus || 'vacant',
})

const loading = ref(false)

const typeOptions = [
  { value: 'retail', label: 'Retail' },
  { value: 'office', label: 'Office' },
  { value: 'storage', label: 'Storage' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'other', label: 'Other' },
]

const statusOptions = [
  { value: 'vacant', label: 'Vacant' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'inactive', label: 'Inactive' },
]

const selectedType = computed({
  get: () => typeOptions.find(t => t.value === state.type),
  set: (val: { value: string; label: string } | undefined) => {
    state.type = val?.value as UnitType | undefined
  }
})

const selectedStatus = computed({
  get: () => statusOptions.find(s => s.value === state.status),
  set: (val: { value: string; label: string } | undefined) => {
    state.status = (val?.value as UnitStatus) || 'vacant'
  }
})

async function onSubmit(event: FormSubmitEvent<CreateUnitSchema | UpdateUnitSchema>) {
  loading.value = true
  try {
    if (props.mode === 'create') {
      await buildingApi<ApiResponse<Unit>>(
        props.buildingId,
        '/v1/app/units',
        {
          method: 'POST',
          body: event.data,
        }
      )
      toast.add({ title: 'Unit created successfully', color: 'success' })
    } else {
      await buildingApi<ApiResponse<Unit>>(
        props.buildingId,
        `/v1/app/units/${props.unit!.id}`,
        {
          method: 'PATCH',
          body: event.data,
        }
      )
      toast.add({ title: 'Unit updated successfully', color: 'success' })
    }
    emit('success')
  } catch (error: any) {
    toast.add({
      title: props.mode === 'create' ? 'Failed to create unit' : 'Failed to update unit',
      description: error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UForm :schema="mode === 'create' ? createUnitSchema : updateUnitSchema" :state="state" @submit="onSubmit"
    class="space-y-4">
    <UFormField label="Unit Number" name="unitNumber" required>
      <UInput v-model="state.unitNumber" placeholder="e.g., 101, A-1" :ui="{ root: 'w-full' }" />
    </UFormField>

    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Floor" name="floor">
        <UInput v-model.number="state.floor" type="number" placeholder="Floor number" :ui="{ root: 'w-full' }" />
      </UFormField>

      <UFormField label="Size (m²)" name="size">
        <UInput v-model.number="state.size" type="number" step="0.01" placeholder="Square meters"
          :ui="{ root: 'w-full' }" />
      </UFormField>
    </div>

    <UFormField label="Type" name="type">
      <USelectMenu v-model="selectedType" :items="typeOptions" placeholder="Select type" class="w-full" />
    </UFormField>

    <UFormField label="Rent Price" name="rentPrice" required>
      <UInput v-model.number="state.rentPrice" type="number" step="0.01" placeholder="Monthly rent"
        icon="i-heroicons-currency-dollar" :ui="{ root: 'w-full' }" />
    </UFormField>

    <UFormField label="Status" name="status">
      <USelectMenu v-model="selectedStatus" :items="statusOptions" class="w-full" />
    </UFormField>

    <div class="flex gap-2 justify-end pt-4">
      <UButton type="button" color="neutral" variant="ghost" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="loading">
        {{ mode === 'create' ? 'Create Unit' : 'Update Unit' }}
      </UButton>
    </div>
  </UForm>
</template>