<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ActivityLog, ActivityAction, ActivityEntityType } from '~/types/activity-log'
import type { ApiResponse, PaginatedResponse, PageInfo } from '~/types'

const { api, buildingApi } = useApi()
const toast = useToast()

const logs = ref<ActivityLog[]>([])
const { selectedBuildingId } = useSelectedBuilding()
const loading = ref(false)
const pageInfo = ref<PageInfo | null>(null)
const limit = ref(20)
const currentPage = ref(1)

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
  { value: 'parking_request', label: 'Parking Request' },
  { value: 'payment_request', label: 'Payment Request' },
  { value: 'notification', label: 'Notification' },
]

const columns: TableColumn<ActivityLog>[] = [
  { accessorKey: 'createdAt', header: 'Date' },
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'entityType', header: 'Type' },
  { accessorKey: 'userName', header: 'User' },
  { accessorKey: 'details', header: 'Details' },
]

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

async function fetchLogs() {
  if (!selectedBuildingId.value) return

  loading.value = true
  try {
    const params = new URLSearchParams()
    if (startDate.value) params.append('startDate', startDate.value)
    if (endDate.value) params.append('endDate', endDate.value)
    if (selectedEntityType.value) params.append('entityType', selectedEntityType.value)
    if (selectedAction.value) params.append('action', selectedAction.value)
    const offset = (currentPage.value - 1) * limit.value
    params.append('limit', String(limit.value))
    params.append('offset', String(offset))

    const response = await buildingApi<PaginatedResponse<ActivityLog[]>>(
      selectedBuildingId.value,
      `/v1/app/activity-logs?${params.toString()}`
    )
    logs.value = response.data
    pageInfo.value = response.meta.page_info
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch activity logs', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

function goToPage(page: number) {
  if (page < 1 || (pageInfo.value && page > pageInfo.value.total_pages)) return
  currentPage.value = page
  fetchLogs()
}

function onLimitChange(newLimit: number) {
  limit.value = newLimit
  currentPage.value = 1
  fetchLogs()
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString()
}

function formatEntityType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatDetails(details: any, depth = 0): any[] {
  if (!details || typeof details !== 'object') return []

  const entries: any[] = []

  Object.entries(details).forEach(([key, value]) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())

    // Handle nested objects - recursively format them
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      entries.push({
        key: label,
        value: null,
        isNested: true,
        depth
      })
      // Add nested items with increased depth
      entries.push(...formatDetails(value, depth + 1))
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      entries.push({
        key: label,
        value: value.join(', '),
        isNested: false,
        depth
      })
    }
    // Handle primitives
    else {
      entries.push({
        key: label,
        value: String(value),
        isNested: false,
        depth
      })
    }
  })

  return entries
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
    currentPage.value = 1
    fetchLogs()
  }
}, { immediate: true })

</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Activity Logs</h1>
        <p class="text-gray-600 mt-1">Track all changes and actions</p>
      </div>

        <BuildingSelector v-model="selectedBuildingId" />
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
      <PaginationBar
        :page-info="pageInfo"
        item-label="logs"
        :current-count="logs.length"
        :limit="limit"
        show-limit-selector
        @go-to-page="goToPage"
        @update:limit="onLimitChange"
      />
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
          <div v-if="row.original.details" class="text-sm space-y-1">
            <div v-for="(item, idx) in formatDetails(row.original.details)" :key="idx" class="flex gap-2">
              <span class="font-medium text-gray-700">{{ item.key }}:</span>
              <span class="text-gray-600">{{ item.value }}</span>
            </div>
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