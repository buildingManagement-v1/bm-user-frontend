<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ActivityLog, ActivityAction, ActivityEntityType } from '~/types/activity-log'
import type { Building } from '~/types/building'
import type { ApiResponse } from '~/types'

const { api, buildingApi } = useApi()
const toast = useToast()

const logs = ref<ActivityLog[]>([])
const buildings = ref<Building[]>([])
const selectedBuildingId = ref<string>('')
const loading = ref(false)
const loadingBuildings = ref(false)

const startDate = ref('')
const endDate = ref('')
const selectedEntityType = ref<ActivityEntityType | ''>('')
const selectedAction = ref<ActivityAction | ''>('')

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'status_change', label: 'Status Change' },
]

const entityTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'unit', label: 'Unit' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'lease', label: 'Lease' },
  { value: 'payment', label: 'Payment' },
  { value: 'maintenance_request', label: 'Maintenance Request' },
  { value: 'manager', label: 'Manager' },
  { value: 'invoice', label: 'Invoice' },
]

const columns: TableColumn<ActivityLog>[] = [
  { accessorKey: 'createdAt', header: 'Date' },
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'entityType', header: 'Type' },
  { accessorKey: 'userName', header: 'User' },
  { accessorKey: 'details', header: 'Details' },
]

const buildingOptions = computed(() =>
  buildings.value.map(b => ({ value: b.id, label: b.name }))
)

const selectedBuilding = computed({
  get: () => buildingOptions.value.find(b => b.value === selectedBuildingId.value),
  set: (val: { value: string; label: string } | undefined) => {
    selectedBuildingId.value = val?.value || ''
  }
})

const selectedActionOption = computed({
  get: () => actionOptions.find(a => a.value === selectedAction.value),
  set: (val: { value: string; label: string } | undefined) => {
    selectedAction.value = (val?.value as ActivityAction) || ''
  }
})

const selectedEntityOption = computed({
  get: () => entityTypeOptions.find(e => e.value === selectedEntityType.value),
  set: (val: { value: string; label: string } | undefined) => {
    selectedEntityType.value = (val?.value as ActivityEntityType) || ''
  }
})

async function fetchBuildings() {
  loadingBuildings.value = true
  try {
    const response = await api<ApiResponse<Building[]>>('/v1/app/buildings')
    buildings.value = response.data.filter(b => b.status === 'active')
    if (buildings.value.length > 0 && !selectedBuildingId.value) {
      selectedBuildingId.value = buildings.value[0]!.id
    }
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch buildings', description: error.message, color: 'error' })
  } finally {
    loadingBuildings.value = false
  }
}

async function fetchLogs() {
  if (!selectedBuildingId.value) return

  loading.value = true
  try {
    const params = new URLSearchParams()
    if (startDate.value) params.append('startDate', startDate.value)
    if (endDate.value) params.append('endDate', endDate.value)
    if (selectedEntityType.value) params.append('entityType', selectedEntityType.value)
    if (selectedAction.value) params.append('action', selectedAction.value)

    const response = await buildingApi<ApiResponse<ActivityLog[]>>(
      selectedBuildingId.value,
      `/v1/app/activity-logs?${params.toString()}`
    )
    logs.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch activity logs', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString()
}

function formatEntityType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getActionColor(action: string) {
  switch (action) {
    case 'create': return 'success'
    case 'update': return 'primary'
    case 'delete': return 'error'
    case 'status_change': return 'warning'
    default: return 'neutral'
  }
}

watch(selectedBuildingId, () => {
  if (selectedBuildingId.value) {
    fetchLogs()
  }
})

onMounted(() => {
  fetchBuildings()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Activity Logs</h1>
        <p class="text-gray-600 mt-1">Track all changes and actions</p>
      </div>

      <USelectMenu v-model="selectedBuilding" :items="buildingOptions" placeholder="Select building"
        :loading="loadingBuildings" class="w-64" />
    </div>

    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Filters</h3>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UFormField label="Start Date">
          <UInput v-model="startDate" type="date" />
        </UFormField>

        <UFormField label="End Date">
          <UInput v-model="endDate" type="date" />
        </UFormField>

        <UFormField label="Action">
          <USelectMenu v-model="selectedActionOption" :items="actionOptions" />
        </UFormField>

        <UFormField label="Entity Type">
          <USelectMenu v-model="selectedEntityOption" :items="entityTypeOptions" />
        </UFormField>
      </div>

      <div class="flex justify-end mt-4">
        <UButton @click="fetchLogs" :loading="loading">Apply Filters</UButton>
      </div>
    </UCard>

    <UCard>
      <UTable :data="logs" :columns="columns" :loading="loading">
        <template #createdAt-cell="{ row }">
          <span class="text-sm">{{ formatDate(row.original.createdAt) }}</span>
        </template>

        <template #action-cell="{ row }">
          <UBadge :color="getActionColor(row.original.action)" variant="subtle" class="capitalize">
            {{ row.original.action.replace(/_/g, ' ') }}
          </UBadge>
        </template>

        <template #entityType-cell="{ row }">
          <span class="text-sm">{{ formatEntityType(row.original.entityType) }}</span>
        </template>

        <template #userName-cell="{ row }">
          <div>
            <p class="font-medium text-sm">{{ row.original.userName }}</p>
            <p class="text-xs text-gray-500 capitalize">{{ row.original.userRole }}</p>
          </div>
        </template>

        <template #details-cell="{ row }">
          <div v-if="row.original.details" class="text-sm text-gray-600 max-w-xs truncate">
            {{ JSON.stringify(row.original.details) }}
          </div>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #empty>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-clipboard-document-list" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-900 font-medium mb-2">No activity logs</p>
            <p class="text-gray-500">
              {{ selectedBuildingId ? 'No logs found for the selected filters' : 'Select a building to view logs' }}
            </p>
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>