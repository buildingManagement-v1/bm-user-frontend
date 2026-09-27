<script setup lang="ts">
import type { MaintenanceRequest } from '~/types/maintenance-request'
import { errorMessage } from '~/types/api'

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

const labels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

// Mirrors the backend's allowed transitions (completed can only be reopened,
// cancelled can only go back to pending)
const transitions: Record<string, string[]> = {
  pending: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['pending', 'completed', 'cancelled'],
  completed: ['in_progress'],
  cancelled: ['pending'],
}

const statusOptions = [props.request.status, ...(transitions[props.request.status] ?? [])].map(value => ({
  value,
  label: value === props.request.status ? `${labels[value]} (current)` : labels[value] ?? value,
}))

const selectedStatus = ref(statusOptions[0])
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
          status: selectedStatus.value.value === props.request.status ? undefined : selectedStatus.value.value,
          note: note.value || undefined
        }
      }
    )
    toast.add({ title: 'Request updated successfully', color: 'success' })
    emit('success')
  } catch (error) {
    toast.add({ title: 'Failed to update request', description: errorMessage(error), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit" class="w-full space-y-4">
    <div class="w-full">
      <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
      <USelectMenu v-model="selectedStatus" :items="statusOptions" placeholder="Select status" class="w-full" />
    </div>

    <div class="w-full">
      <label class="block text-sm font-medium text-gray-700 mb-2">Add Note (optional)</label>
      <UTextarea v-model="note" placeholder="Add a note about this update..." :rows="4" class="w-full" :ui="{ root: 'w-full' }" />
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