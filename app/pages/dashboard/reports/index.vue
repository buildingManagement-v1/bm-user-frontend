<script setup lang="ts">
import { Bar, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import type { TableColumn } from '@nuxt/ui'
import type { OccupancyReport, RevenueReport, TenantReport } from '~/types/report'
import type { Building } from '~/types/building'
import type { ApiResponse } from '~/types'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const { api, buildingApi } = useApi()
const toast = useToast()

const buildings = ref<Building[]>([])
const selectedBuildingId = ref<string>('')
const loadingBuildings = ref(false)

const occupancyData = ref<OccupancyReport | null>(null)
const revenueData = ref<RevenueReport | null>(null)
const tenantData = ref<TenantReport | null>(null)

const loadingOccupancy = ref(false)
const loadingRevenue = ref(false)
const loadingTenants = ref(false)

const revenueStartDate = ref('')
const revenueEndDate = ref('')

const tabs = [
  { slot: 'occupancy', label: 'Occupancy' },
  { slot: 'revenue', label: 'Revenue' },
  { slot: 'tenants', label: 'Tenants' },
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

const occupancyChartData = computed(() => {
  if (!occupancyData.value) return null
  return {
    labels: ['Occupied', 'Vacant'],
    datasets: [{
      data: [occupancyData.value.occupiedUnits, occupancyData.value.vacantUnits],
      backgroundColor: ['#10b981', '#e5e7eb'],
    }]
  }
})

const revenueChartData = computed(() => {
  if (!revenueData.value || revenueData.value.revenueByUnit.length === 0) return null
  return {
    labels: revenueData.value.revenueByUnit.map(r => r.unitNumber),
    datasets: [{
      label: 'Revenue',
      data: revenueData.value.revenueByUnit.map(r => r.revenue),
      backgroundColor: '#3b82f6',
    }]
  }
})

const vacantUnitsColumns: TableColumn<OccupancyReport['vacantUnitsList'][0]>[] = [
  { accessorKey: 'unitNumber', header: 'Unit' },
  { accessorKey: 'floor', header: 'Floor' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'rentPrice', header: 'Rent Price' },
]

const outstandingColumns: TableColumn<RevenueReport['outstanding']['periods'][0]>[] = [
  { accessorKey: 'tenant', header: 'Tenant' },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'month', header: 'Month' },
  { accessorKey: 'amount', header: 'Amount' },
  { accessorKey: 'status', header: 'Status' },
]

const expirationColumns: TableColumn<TenantReport['upcomingExpirations'][0]>[] = [
  { accessorKey: 'tenant', header: 'Tenant' },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'endDate', header: 'End Date' },
  { accessorKey: 'daysUntilExpiration', header: 'Days Left' },
]

const paymentHistoryColumns: TableColumn<TenantReport['paymentHistory'][0]>[] = [
  { accessorKey: 'tenantName', header: 'Tenant' },
  { accessorKey: 'totalPaid', header: 'Total Paid' },
  { accessorKey: 'paymentsCount', header: 'Payments' },
  { accessorKey: 'lastPayment', header: 'Last Payment' },
]

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

async function fetchOccupancy() {
  if (!selectedBuildingId.value) return

  loadingOccupancy.value = true
  try {
    const response = await buildingApi<ApiResponse<OccupancyReport>>(
      selectedBuildingId.value,
      '/v1/app/reports/occupancy'
    )
    occupancyData.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch occupancy report', description: error.message, color: 'error' })
  } finally {
    loadingOccupancy.value = false
  }
}

async function fetchRevenue() {
  if (!selectedBuildingId.value) return

  loadingRevenue.value = true
  try {
    const params = new URLSearchParams()
    if (revenueStartDate.value) params.append('startDate', revenueStartDate.value)
    if (revenueEndDate.value) params.append('endDate', revenueEndDate.value)

    const response = await buildingApi<ApiResponse<RevenueReport>>(
      selectedBuildingId.value,
      `/v1/app/reports/revenue?${params.toString()}`
    )
    revenueData.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch revenue report', description: error.message, color: 'error' })
  } finally {
    loadingRevenue.value = false
  }
}

async function fetchTenants() {
  if (!selectedBuildingId.value) return

  loadingTenants.value = true
  try {
    const response = await buildingApi<ApiResponse<TenantReport>>(
      selectedBuildingId.value,
      '/v1/app/reports/tenants'
    )
    tenantData.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch tenant report', description: error.message, color: 'error' })
  } finally {
    loadingTenants.value = false
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

watch(selectedBuildingId, () => {
  if (selectedBuildingId.value) {
    fetchOccupancy()
    fetchRevenue()
    fetchTenants()
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
        <h1 class="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p class="text-gray-600 mt-1">Detailed insights and reports</p>
      </div>

      <USelectMenu v-model="selectedBuilding" :items="buildingOptions" placeholder="Select building"
        :loading="loadingBuildings" class="w-64" />
    </div>

    <UTabs :items="tabs">
      <template #occupancy>
        <div class="space-y-6 pt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Occupancy Overview</h3>
              </template>
              <div v-if="occupancyData" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600">Total Units</p>
                    <p class="text-2xl font-bold">{{ occupancyData.totalUnits }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">Occupancy Rate</p>
                    <p class="text-2xl font-bold text-success-600">{{ occupancyData.occupancyRate }}%</p>
                  </div>
                </div>
              </div>
            </UCard>

            <UCard v-if="occupancyChartData">
              <template #header>
                <h3 class="text-lg font-semibold">Distribution</h3>
              </template>
              <div class="flex justify-center" style="height: 200px;">
                <Doughnut :data="occupancyChartData" :options="{ maintainAspectRatio: false }" />
              </div>
            </UCard>
          </div>

          <UCard v-if="occupancyData">
            <template #header>
              <h3 class="text-lg font-semibold">Vacant Units ({{ occupancyData.vacantUnits }})</h3>
            </template>
            <UTable :data="occupancyData.vacantUnitsList" :columns="vacantUnitsColumns" :loading="loadingOccupancy">
              <template #type-cell="{ row }">
                <UBadge variant="subtle" class="capitalize">{{ row.original.type || 'N/A' }}</UBadge>
              </template>
              <template #rentPrice-cell="{ row }">
                <span class="font-medium">${{ row.original.rentPrice.toLocaleString() }}</span>
              </template>
            </UTable>
          </UCard>
        </div>
      </template>

      <template #revenue>
        <div class="space-y-6 pt-4">
          <UCard>
            <div class="flex gap-4 items-end">
              <UFormField label="Start Date" class="flex-1">
                <UInput v-model="revenueStartDate" type="date" />
              </UFormField>
              <UFormField label="End Date" class="flex-1">
                <UInput v-model="revenueEndDate" type="date" />
              </UFormField>
              <UButton @click="fetchRevenue" :loading="loadingRevenue">Apply</UButton>
            </div>
          </UCard>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UCard v-if="revenueData">
              <div>
                <p class="text-sm text-gray-600">Total Revenue</p>
                <p class="text-2xl font-bold text-success-600">${{ revenueData.totalRevenue.toLocaleString() }}</p>
              </div>
            </UCard>
            <UCard v-if="revenueData">
              <div>
                <p class="text-sm text-gray-600">Outstanding Amount</p>
                <p class="text-2xl font-bold text-error-600">${{ revenueData.outstanding.amount.toLocaleString() }}</p>
              </div>
            </UCard>
            <UCard v-if="revenueData">
              <div>
                <p class="text-sm text-gray-600">Outstanding Count</p>
                <p class="text-2xl font-bold text-warning-600">{{ revenueData.outstanding.count }}</p>
              </div>
            </UCard>
          </div>

          <UCard v-if="revenueChartData">
            <template #header>
              <h3 class="text-lg font-semibold">Revenue by Unit</h3>
            </template>
            <div style="height: 300px;">
              <Bar :data="revenueChartData" :options="{ maintainAspectRatio: false, responsive: true }" />
            </div>
          </UCard>

          <UCard v-if="revenueData">
            <template #header>
              <h3 class="text-lg font-semibold">Outstanding Payments</h3>
            </template>
            <UTable :data="revenueData.outstanding.periods" :columns="outstandingColumns" :loading="loadingRevenue">
              <template #tenant-cell="{ row }">
                <span>{{ row.original.tenant.name }}</span>
              </template>
              <template #unit-cell="{ row }">
                <span>{{ row.original.unit.unitNumber }}</span>
              </template>
              <template #amount-cell="{ row }">
                <span class="font-medium">${{ row.original.amount.toLocaleString() }}</span>
              </template>
              <template #status-cell="{ row }">
                <UBadge :color="row.original.status === 'overdue' ? 'error' : 'warning'" variant="subtle"
                  class="capitalize">
                  {{ row.original.status }}
                </UBadge>
              </template>
            </UTable>
          </UCard>
        </div>
      </template>

      <template #tenants>
        <div class="space-y-6 pt-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UCard v-if="tenantData">
              <div>
                <p class="text-sm text-gray-600">Total Tenants</p>
                <p class="text-2xl font-bold">{{ tenantData.totalTenants }}</p>
              </div>
            </UCard>
            <UCard v-if="tenantData">
              <div>
                <p class="text-sm text-gray-600">Active Tenants</p>
                <p class="text-2xl font-bold text-success-600">{{ tenantData.activeTenants }}</p>
              </div>
            </UCard>
            <UCard v-if="tenantData">
              <div>
                <p class="text-sm text-gray-600">Inactive Tenants</p>
                <p class="text-2xl font-bold text-gray-400">{{ tenantData.inactiveTenants }}</p>
              </div>
            </UCard>
          </div>

          <UCard v-if="tenantData">
            <template #header>
              <h3 class="text-lg font-semibold">Upcoming Lease Expirations (60 Days)</h3>
            </template>
            <UTable :data="tenantData.upcomingExpirations" :columns="expirationColumns" :loading="loadingTenants">
              <template #tenant-cell="{ row }">
                <div>
                  <p class="font-medium">{{ row.original.tenant.name }}</p>
                  <p class="text-sm text-gray-500">{{ row.original.tenant.email }}</p>
                </div>
              </template>
              <template #unit-cell="{ row }">
                <span>{{ row.original.unit.unitNumber }}</span>
              </template>
              <template #endDate-cell="{ row }">
                <span>{{ formatDate(row.original.endDate) }}</span>
              </template>
              <template #daysUntilExpiration-cell="{ row }">
                <UBadge :color="row.original.daysUntilExpiration <= 30 ? 'error' : 'warning'" variant="subtle">
                  {{ row.original.daysUntilExpiration }} days
                </UBadge>
              </template>
            </UTable>
          </UCard>

          <UCard v-if="tenantData">
            <template #header>
              <h3 class="text-lg font-semibold">Payment History Summary</h3>
            </template>
            <UTable :data="tenantData.paymentHistory" :columns="paymentHistoryColumns" :loading="loadingTenants">
              <template #totalPaid-cell="{ row }">
                <span class="font-medium">${{ row.original.totalPaid.toLocaleString() }}</span>
              </template>
              <template #lastPayment-cell="{ row }">
                <span>{{ row.original.lastPayment ? formatDate(row.original.lastPayment) : 'N/A' }}</span>
              </template>
            </UTable>
          </UCard>
        </div>
      </template>
    </UTabs>
  </div>
</template>