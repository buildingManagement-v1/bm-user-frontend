<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { MaintenanceRequest } from '~/types/maintenance-request'
import type { ApiResponse, PaginatedResponse, PageInfo } from '~/types'

const { api, buildingApi } = useApi()
const toast = useToast()

const requests = ref<MaintenanceRequest[]>([])
const { selectedBuildingId } = useSelectedBuilding()
const loading = ref(false)
const pageInfo = ref<PageInfo | null>(null)
const limit = ref(20)
const currentPage = ref(1)
const filterStatus = ref<string>('')
const filterPriority = ref<string>('')
const searchQ = ref('')
const deletingId = ref<string | null>(null)

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]
const priorityOptions = [
  { value: '', label: 'All priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const selectedStatusOption = computed({
  get: () => statusOptions.find(o => o.value === filterStatus.value) ?? statusOptions[0],
  set: (v: { value: string } | undefined) => {
    filterStatus.value = v?.value ?? ''
    onFilterChange()
  },
})
const selectedPriorityOption = computed({
  get: () => priorityOptions.find(o => o.value === filterPriority.value) ?? priorityOptions[0],
  set: (v: { value: string } | undefined) => {
    filterPriority.value = v?.value ?? ''
    onFilterChange()
  },
})
const isCreateModalOpen = ref(false)
const isViewModalOpen = ref(false)
const isUpdateModalOpen = ref(false)
const selectedRequest = ref<MaintenanceRequest | null>(null)

const userRole = ref<string>('')

const columns: TableColumn<MaintenanceRequest>[] = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'tenant', header: 'Tenant' },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'priority', header: 'Priority' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Created' },
  { id: 'actions', header: 'Actions' },
]

async function fetchRequests() {
  if (!selectedBuildingId.value) return

  loading.value = true
  try {
    const offset = (currentPage.value - 1) * limit.value
    const params = new URLSearchParams()
    params.set('limit', String(limit.value))
    params.set('offset', String(offset))
    if (filterStatus.value) params.set('status', filterStatus.value)
    if (filterPriority.value) params.set('priority', filterPriority.value)
    if (searchQ.value.trim()) params.set('q', searchQ.value.trim())
    const response = await buildingApi<PaginatedResponse<MaintenanceRequest[]>>(
      selectedBuildingId.value,
      `/v1/app/maintenance-requests?${params.toString()}`
    )
    requests.value = response.data
    pageInfo.value = response.meta.page_info
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch requests', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

function goToPage(page: number) {
  if (page < 1 || (pageInfo.value && page > pageInfo.value.total_pages)) return
  currentPage.value = page
  fetchRequests()
}

function onLimitChange(newLimit: number) {
  limit.value = newLimit
  currentPage.value = 1
  fetchRequests()
}

function onFilterChange() {
  currentPage.value = 1
  fetchRequests()
}

function openViewModal(request: MaintenanceRequest) {
  selectedRequest.value = request
  isViewModalOpen.value = true
}

function openUpdateModal(request: MaintenanceRequest) {
  selectedRequest.value = request
  isUpdateModalOpen.value = true
}

async function deleteRequest(id: string) {
  if (!selectedBuildingId.value) return

  if (!confirm('Are you sure you want to delete this maintenance request?')) return

  deletingId.value = id
  try {
    await buildingApi(
      selectedBuildingId.value,
      `/v1/app/maintenance-requests/${id}`,
      { method: 'DELETE' }
    )
    toast.add({ title: 'Request deleted successfully', color: 'success' })
    fetchRequests()
  } catch (error: any) {
    toast.add({ title: 'Failed to delete request', description: error.message, color: 'error' })
  } finally {
    deletingId.value = null
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function handleSuccess() {
  isCreateModalOpen.value = false
  isViewModalOpen.value = false
  isUpdateModalOpen.value = false
  selectedRequest.value = null
  fetchRequests()
}

watch(selectedBuildingId, () => {
  if (selectedBuildingId.value) {
    currentPage.value = 1
    fetchRequests()
  }
}, { immediate: true })

</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
        <p class="text-gray-600 mt-1">Track and manage maintenance requests</p>
      </div>

      <div class="flex items-center gap-3">
        <BuildingSelector v-model="selectedBuildingId" />
        <UButton color="primary" icon="i-heroicons-plus" @click="isCreateModalOpen = true"
          :disabled="!selectedBuildingId">
          New Request
        </UButton>
      </div>
    </div>

    <UCard v-if="selectedBuildingId" class="mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Status</span>
          <USelectMenu v-model="selectedStatusOption" :items="statusOptions" class="w-40" />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Priority</span>
          <USelectMenu v-model="selectedPriorityOption" :items="priorityOptions" class="w-40" />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Tenant name</span>
          <UInput v-model="searchQ" placeholder="Search..." class="w-48" @keyup.enter="onFilterChange" />
          <UButton size="sm" color="neutral" variant="outline" @click="onFilterChange">Search</UButton>
        </div>
      </div>
    </UCard>

    <UCard>
      <PaginationBar
        :page-info="pageInfo"
        item-label="requests"
        :current-count="requests.length"
        :limit="limit"
        show-limit-selector
        @go-to-page="goToPage"
        @update:limit="onLimitChange"
      />
      <UTable :data="requests" :columns="columns" :loading="loading">
        <template #tenant-cell="{ row }">
          <span>{{ row.original.tenant.name }}</span>
        </template>

        <template #unit-cell="{ row }">
          <span v-if="row.original.unit">
            {{ row.original.unit.unitNumber }}
            <span v-if="row.original.unit.floor" class="text-gray-500">
              (Floor {{ row.original.unit.floor }})
            </span>
          </span>
          <span v-else class="text-gray-400">N/A</span>
        </template>

        <template #priority-cell="{ row }">
          <UBadge
            :color="row.original.priority === 'urgent' ? 'error' : row.original.priority === 'high' ? 'warning' : row.original.priority === 'medium' ? 'primary' : 'neutral'"
            variant="subtle" class="capitalize">
            {{ row.original.priority }}
          </UBadge>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.status === 'completed' ? 'success' : row.original.status === 'in_progress' ? 'primary' : row.original.status === 'cancelled' ? 'neutral' : 'warning'"
            variant="subtle" class="capitalize">
            {{ row.original.status.replace('_', ' ') }}
          </UBadge>
        </template>

        <template #createdAt-cell="{ row }">
          <span>{{ formatDate(row.original.createdAt) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <UButton size="xs" color="neutral" variant="ghost" @click="openViewModal(row.original)">
              View
            </UButton>
            <UButton size="xs" color="primary" variant="ghost" @click="openUpdateModal(row.original)">
              Update
            </UButton>
            <UButton size="xs" color="error" variant="ghost" @click="deleteRequest(row.original.id)"
              :loading="deletingId === row.original.id" :disabled="deletingId !== null">
              Delete
            </UButton>
          </div>
        </template>

        <template #empty>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-wrench-screwdriver" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-900 font-medium mb-2">No maintenance requests</p>
            <p class="text-gray-500 mb-4">
              {{ selectedBuildingId ? 'Submit your first request' : 'Select a building to view requests' }}
            </p>
            <UButton v-if="selectedBuildingId" color="primary" @click="isCreateModalOpen = true">
              New Request
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="isCreateModalOpen" title="New Maintenance Request">
      <template #body>
        <MaintenanceRequestForm v-if="selectedBuildingId" :building-id="selectedBuildingId" :user-role="userRole"
          @success="handleSuccess" @cancel="isCreateModalOpen = false" />
      </template>
    </UModal>

    <UModal v-model:open="isViewModalOpen" title="Maintenance Request Details">
      <template #body>
        <div v-if="selectedRequest" class="space-y-4">
          <div>
            <p class="text-sm font-medium text-gray-700">Title</p>
            <p class="text-gray-900">{{ selectedRequest.title }}</p>
          </div>

          <div>
            <p class="text-sm font-medium text-gray-700">Description</p>
            <p class="text-gray-900">{{ selectedRequest.description }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-medium text-gray-700">Priority</p>
              <UBadge
                :color="selectedRequest.priority === 'urgent' ? 'error' : selectedRequest.priority === 'high' ? 'warning' : selectedRequest.priority === 'medium' ? 'primary' : 'neutral'"
                variant="subtle" class="capitalize">
                {{ selectedRequest.priority }}
              </UBadge>
            </div>

            <div>
              <p class="text-sm font-medium text-gray-700">Status</p>
              <UBadge
                :color="selectedRequest.status === 'completed' ? 'success' : selectedRequest.status === 'in_progress' ? 'primary' : selectedRequest.status === 'cancelled' ? 'neutral' : 'warning'"
                variant="subtle" class="capitalize">
                {{ selectedRequest.status.replace('_', ' ') }}
              </UBadge>
            </div>
          </div>

          <div v-if="selectedRequest.notes && selectedRequest.notes.length > 0">
            <p class="text-sm font-medium text-gray-700 mb-2">Notes</p>
            <div class="space-y-2">
              <div v-for="(note, index) in selectedRequest.notes" :key="index" class="bg-gray-50 p-3 rounded-lg">
                <p class="text-sm text-gray-900">{{ note.text }}</p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ note.author }} • {{ formatDate(note.timestamp) }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <UButton color="neutral" variant="ghost" @click="isViewModalOpen = false">
              Close
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="isUpdateModalOpen" title="Update Maintenance Request">
      <template #body>
        <MaintenanceRequestUpdateForm v-if="selectedRequest && selectedBuildingId" :request="selectedRequest"
          :building-id="selectedBuildingId" @success="handleSuccess" @cancel="isUpdateModalOpen = false" />
      </template>
    </UModal>
  </div>
</template>