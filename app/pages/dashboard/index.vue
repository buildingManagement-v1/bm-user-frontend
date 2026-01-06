<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { DashboardStats, UpcomingPayment } from '~/types/dashboard'
import type { Building } from '~/types/building'
import type { ApiResponse } from '~/types'

const { api, buildingApi } = useApi()
const toast = useToast()

const stats = ref<DashboardStats | null>(null)
const upcomingPayments = ref<UpcomingPayment[]>([])
const buildings = ref<Building[]>([])
const selectedBuildingId = ref<string>('')
const loadingStats = ref(false)
const loadingPayments = ref(false)
const loadingBuildings = ref(false)

const columns: TableColumn<UpcomingPayment>[] = [
  { accessorKey: 'tenantName', header: 'Tenant' },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'month', header: 'Due Month' },
  { accessorKey: 'amount', header: 'Amount' },
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

async function fetchStats() {
  if (!selectedBuildingId.value) return

  loadingStats.value = true
  try {
    const response = await buildingApi<ApiResponse<DashboardStats>>(
      selectedBuildingId.value,
      '/v1/app/dashboard/stats'
    )
    stats.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch stats', description: error.message, color: 'error' })
  } finally {
    loadingStats.value = false
  }
}

async function fetchUpcomingPayments() {
  if (!selectedBuildingId.value) return

  loadingPayments.value = true
  try {
    const response = await buildingApi<ApiResponse<UpcomingPayment[]>>(
      selectedBuildingId.value,
      '/v1/app/dashboard/upcoming-payments'
    )
    upcomingPayments.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch upcoming payments', description: error.message, color: 'error' })
  } finally {
    loadingPayments.value = false
  }
}

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split('-')
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

watch(selectedBuildingId, () => {
  if (selectedBuildingId.value) {
    fetchStats()
    fetchUpcomingPayments()
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
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600 mt-1">Overview of your building management</p>
      </div>

      <USelectMenu v-model="selectedBuilding" :items="buildingOptions" placeholder="Select building"
        :loading="loadingBuildings" class="w-64" />
    </div>

    <div v-if="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Tenants</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.totalTenants }}</p>
          </div>
          <UIcon name="i-heroicons-users" class="w-12 h-12 text-primary-500" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Occupancy Rate</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.occupancyRate }}%</p>
            <p class="text-xs text-gray-500 mt-1">{{ stats.occupiedUnits }} / {{ stats.totalUnits }} units</p>
          </div>
          <UIcon name="i-heroicons-building-office-2" class="w-12 h-12 text-success-500" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Revenue This Month</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">${{ stats.revenueThisMonth.toLocaleString() }}</p>
          </div>
          <UIcon name="i-heroicons-banknotes" class="w-12 h-12 text-warning-500" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Pending Maintenance</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.pendingMaintenanceRequests }}</p>
          </div>
          <UIcon name="i-heroicons-wrench-screwdriver" class="w-12 h-12 text-error-500" />
        </div>
      </UCard>
    </div>

    <UCard v-if="selectedBuildingId">
      <template #header>
        <h2 class="text-lg font-semibold">Upcoming Payments (Next 2 Weeks)</h2>
      </template>

      <UTable :data="upcomingPayments" :columns="columns" :loading="loadingPayments">
        <template #tenantName-cell="{ row }">
          <div>
            <p class="font-medium">{{ row.original.tenantName }}</p>
            <p class="text-sm text-gray-500">{{ row.original.tenantEmail }}</p>
          </div>
        </template>

        <template #unit-cell="{ row }">
          <span>{{ row.original.unit.unitNumber }}</span>
        </template>

        <template #month-cell="{ row }">
          <span>{{ formatMonth(row.original.month) }}</span>
        </template>

        <template #amount-cell="{ row }">
          <span class="font-medium">${{ row.original.amount.toLocaleString() }}</span>
        </template>

        <template #empty>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-check-circle" class="w-12 h-12 text-success-400 mx-auto mb-4" />
            <p class="text-gray-900 font-medium mb-2">All caught up!</p>
            <p class="text-gray-500">No upcoming payments in the next 2 weeks</p>
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>