<script setup lang="ts">
import type { MaintenanceRequest } from '~/types/maintenance-request'

const props = defineProps<{
  request: MaintenanceRequest
  buildingId: string
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const { buildingApi } = useApi()
const toast = useToast()

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

const selectedStatus = ref(statusOptions.find(s => s.value === props.request.status))
const note = ref('')

const loading = ref(false)

async function submit() {
  if (!selectedStatus.value) return

  loading.value = true
  try {
    await buildingApi(
      props.buildingId,
      `/v1/app/maintenance-requests/${props.request.id}`,
      {
        method: 'PATCH',
        body: {
          status: selectedStatus.value.value,
          note: note.value || undefined
        }
      }
    )
    toast.add({ title: 'Request updated successfully', color: 'success' })
    emit('success')
  } catch (error: any) {
    toast.add({ title: 'Failed to update request', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
      <USelectMenu v-model="selectedStatus" :items="statusOptions" placeholder="Select status" />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Add Note (optional)</label>
      <UTextarea v-model="note" placeholder="Add a note about this update..." :rows="3" />
    </div>

    <div class="flex justify-end gap-3">
      <UButton color="neutral" variant="ghost" @click="emit('cancel')" :disabled="loading">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="loading">
        Update Request
      </UButton>
    </div>
  </form>
</template>