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

const state = reactive({
  name: props.building?.name || '',
  address: props.building?.address || '',
  city: props.building?.city || '',
  country: props.building?.country || '',
  contactEmail: props.building?.contactEmail || '',
  contactPhone: props.building?.contactPhone || '',
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

    <UFormField label="Contact Phone" name="contactPhone">
      <UInput v-model="state.contactPhone" type="tel" placeholder="+1234567890" :ui="{ root: 'w-full' }" />
    </UFormField>

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