<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Manager } from '~/types/manager'
import type { ApiResponse } from '~/types'

const { api } = useApi()
const toast = useToast()

const managers = ref<Manager[]>([])
const loading = ref(false)
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedManager = ref<Manager | null>(null)

const columns: TableColumn<Manager>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'phone', header: 'Phone' },
  { accessorKey: 'buildingCount', header: 'Buildings' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: 'Actions' },
]

async function fetchManagers() {
  loading.value = true
  try {
    const response = await api<ApiResponse<Manager[]>>('/v1/app/managers')
    managers.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch managers', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

function openEditModal(manager: Manager) {
  selectedManager.value = manager
  isEditModalOpen.value = true
}

async function deleteManager(id: string) {
  if (!confirm('Are you sure you want to delete this manager?')) return

  try {
    await api(`/v1/app/managers/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Manager deleted successfully', color: 'success' })
    fetchManagers()
  } catch (error: any) {
    toast.add({ title: 'Failed to delete manager', description: error.message, color: 'error' })
  }
}

function handleSuccess() {
  isCreateModalOpen.value = false
  isEditModalOpen.value = false
  selectedManager.value = null
  fetchManagers()
}

onMounted(() => {
  fetchManagers()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Managers</h1>
        <p class="text-gray-600 mt-1">Manage building managers and their access</p>
      </div>

      <UButton color="primary" icon="i-heroicons-plus" @click="isCreateModalOpen = true">
        Add Manager
      </UButton>
    </div>

    <UCard>
      <UTable :data="managers" :columns="columns" :loading="loading">
        <template #phone-cell="{ row }">
          <span v-if="row.original.phone">{{ row.original.phone }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #buildingCount-cell="{ row }">
          <span>{{ row.original.buildingCount || 0 }}</span>
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
            <UButton size="xs" color="error" variant="ghost" @click="deleteManager(row.original.id)">
              Delete
            </UButton>
          </div>
        </template>

        <template #empty>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-users" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-900 font-medium mb-2">No managers yet</p>
            <p class="text-gray-500 mb-4">Add managers to help you manage your buildings</p>
            <UButton color="primary" @click="isCreateModalOpen = true">
              Add Manager
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="isCreateModalOpen" title="Add New Manager">
      <template #body>
        <ManagerForm mode="create" @success="handleSuccess" @cancel="isCreateModalOpen = false" />
      </template>
    </UModal>

    <UModal v-model:open="isEditModalOpen" title="Edit Manager">
      <template #body>
        <ManagerForm v-if="selectedManager" mode="edit" :manager="selectedManager" @success="handleSuccess"
          @cancel="isEditModalOpen = false" />
      </template>
    </UModal>
  </div>
</template>