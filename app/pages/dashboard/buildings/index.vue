<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Building } from '~/types/building'
import type { ApiResponse } from '~/types'

const { api } = useApi()
const toast = useToast()

const buildings = ref<Building[]>([])
const loading = ref(false)
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedBuilding = ref<Building | null>(null)

const columns: TableColumn<Building>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'city', header: 'Location' },
  { accessorKey: 'contactEmail', header: 'Contact' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: 'Actions' },
]

async function fetchBuildings() {
  loading.value = true
  try {
    const response = await api<ApiResponse<Building[]>>('/v1/app/buildings')
    buildings.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch buildings', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

function openEditModal(building: Building) {
  selectedBuilding.value = building
  isEditModalOpen.value = true
}

async function deleteBuilding(id: string) {
  if (!confirm('Are you sure you want to delete this building?')) return

  try {
    await api(`/v1/app/buildings/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Building deleted successfully', color: 'success' })
    fetchBuildings()
  } catch (error: any) {
    toast.add({ title: 'Failed to delete building', description: error.message, color: 'error' })
  }
}

function handleSuccess() {
  isCreateModalOpen.value = false
  isEditModalOpen.value = false
  selectedBuilding.value = null
  fetchBuildings()
}

onMounted(() => {
  fetchBuildings()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Buildings</h1>
        <p class="text-gray-600 mt-1">Manage your properties and buildings</p>
      </div>

      <UButton color="primary" icon="i-heroicons-plus" @click="isCreateModalOpen = true">
        Add Building
      </UButton>
    </div>

    <UCard>
      <UTable :data="buildings" :columns="columns" :loading="loading">
        <template #city-cell="{ row }">
          <span v-if="row.original.city">{{ row.original.city }}, {{ row.original.country }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #contactEmail-cell="{ row }">
          <span v-if="row.original.contactEmail">{{ row.original.contactEmail }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="row.original.status === 'active' ? 'success' : 'neutral'" variant="subtle">
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex gap-2">
            <UButton size="xs" color="neutral" variant="ghost" @click="openEditModal(row.original)">
              Edit
            </UButton>
            <UButton size="xs" color="error" variant="ghost" @click="deleteBuilding(row.original.id)">
              Delete
            </UButton>
          </div>
        </template>

        <template #empty>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-building-office-2" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-900 font-medium mb-2">No buildings yet</p>
            <p class="text-gray-500 mb-4">Get started by creating your first building</p>
            <UButton color="primary" @click="isCreateModalOpen = true">
              Add Building
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="isCreateModalOpen" title="Add New Building">
      <template #body>
        <BuildingForm mode="create" @success="handleSuccess" @cancel="isCreateModalOpen = false" />
      </template>
    </UModal>

    <UModal v-model:open="isEditModalOpen" title="Edit Building">
      <template #body>
        <BuildingForm v-if="selectedBuilding" mode="edit" :building="selectedBuilding" @success="handleSuccess"
          @cancel="isEditModalOpen = false" />
      </template>
    </UModal>
  </div>
</template>