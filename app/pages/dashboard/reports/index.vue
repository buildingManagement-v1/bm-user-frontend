<script setup lang="ts">
import { Bar, Doughnut, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineController,
  LineElement,
  PointElement,
  Filler,
} from 'chart.js'
import type { TableColumn } from '@nuxt/ui'
import type {
  LeaseExpirationItem,
  MaintenanceReport,
  OccupancyReport,
  PortfolioReport,
  ReportSummary,
  RevenueReport,
  TenantReport,
} from '~/types/report'
import type { Building } from '~/types/building'
import type { ApiResponse, PageInfo } from '~/types'

const REPORTS_PAGE_SIZE = 10

function clientPageInfo(total: number, page: number, limit: number): PageInfo {
  const totalPages = Math.ceil(total / limit) || 1
  const currentPage = Math.max(1, Math.min(page, totalPages))
  return {
    current_page: currentPage,
    per_page: limit,
    total_pages: totalPages,
    total_count: total,
    has_previous: currentPage > 1,
    has_next: currentPage < totalPages,
  }
}

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineController,
  LineElement,
  PointElement,
  Filler,
)

const { api, buildingApi } = useApi()
const toast = useToast()
const { selectedBuildingId } = useSelectedBuilding()

const buildings = ref<Building[]>([])
const loadingBuildings = ref(false)

const summaryData = ref<ReportSummary | null>(null)
const loadingSummary = ref(false)

const occupancyData = ref<OccupancyReport | null>(null)
const revenueData = ref<RevenueReport | null>(null)
const tenantData = ref<TenantReport | null>(null)
const maintenanceData = ref<MaintenanceReport | null>(null)
const portfolioData = ref<PortfolioReport | null>(null)

const loadingOccupancy = ref(false)
const loadingRevenue = ref(false)
const loadingTenants = ref(false)
const loadingMaintenance = ref(false)
const loadingPortfolio = ref(false)

const revenueStartDate = ref('')
const revenueEndDate = ref('')

const pageVacant = ref(1)
const pageOutstanding = ref(1)
const pageExpirations = ref(1)
const pagePaymentHistory = ref(1)
const limitReports = ref(REPORTS_PAGE_SIZE)

const tabs = [
  { slot: 'portfolio', label: 'Portfolio' },
  { slot: 'occupancy', label: 'Occupancy' },
  { slot: 'revenue', label: 'Revenue' },
  { slot: 'tenants', label: 'Tenants' },
  { slot: 'maintenance', label: 'Maintenance' },
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

const occupancyTrendChartData = computed(() => {
  const byMonth = occupancyData.value?.occupancyByMonth
  if (!byMonth?.length) return null
  const labels = byMonth.map((r) => {
    const [y, m] = r.month.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  })
  return {
    labels,
    datasets: [{
      label: 'Occupancy %',
      data: byMonth.map((r) => r.occupancyRate),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.12)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#8b5cf6',
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
    }],
  }
})

const revenueByMonthChartData = computed(() => {
  if (!revenueData.value || revenueData.value.revenueByMonth.length === 0) return null
  const labels = revenueData.value.revenueByMonth.map(r => {
    const [y, m] = r.month.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  })
  return {
    labels,
    datasets: [
      {
        label: 'Expected',
        data: revenueData.value.revenueByMonth.map(r => r.expected),
        borderColor: '#94a3b8',
        backgroundColor: 'transparent',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#94a3b8',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
      },
      {
        label: 'Collected',
        data: revenueData.value.revenueByMonth.map(r => r.collected),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
      },
    ],
  }
})

const vacantUnitsColumns: TableColumn<OccupancyReport['vacantUnitsList'][0]>[] = [
  { accessorKey: 'unitNumber', header: 'Unit' },
  { accessorKey: 'floor', header: 'Floor' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'rentPrice', header: 'Rent Price' },
]

const paginatedVacant = computed(() => {
  const list = occupancyData.value?.vacantUnitsList ?? []
  const limit = limitReports.value
  const page = pageVacant.value
  const start = (page - 1) * limit
  return list.slice(start, start + limit)
})
const pageInfoVacant = computed(() =>
  occupancyData.value
    ? clientPageInfo(occupancyData.value.vacantUnitsList.length, pageVacant.value, limitReports.value)
    : null
)

const paginatedOutstanding = computed(() => {
  const list = revenueData.value?.outstanding.groupedByLease ?? []
  const limit = limitReports.value
  const page = pageOutstanding.value
  const start = (page - 1) * limit
  return list.slice(start, start + limit)
})
const pageInfoOutstanding = computed(() =>
  revenueData.value
    ? clientPageInfo(revenueData.value.outstanding.groupedByLease.length, pageOutstanding.value, limitReports.value)
    : null
)

const allExpirations = computed(() => {
  const d = tenantData.value
  if (!d) return []
  return [...d.expiringIn30.list, ...d.expiringIn60.list, ...d.expiringIn90.list]
})
const paginatedExpirations = computed(() => {
  const list = allExpirations.value
  const limit = limitReports.value
  const page = pageExpirations.value
  const start = (page - 1) * limit
  return list.slice(start, start + limit)
})
const pageInfoExpirations = computed(() =>
  tenantData.value ? clientPageInfo(allExpirations.value.length, pageExpirations.value, limitReports.value) : null
)

const paginatedPaymentHistory = computed(() => {
  const list = tenantData.value?.paymentHistory ?? []
  const limit = limitReports.value
  const page = pagePaymentHistory.value
  const start = (page - 1) * limit
  return list.slice(start, start + limit)
})
const pageInfoPaymentHistory = computed(() =>
  tenantData.value
    ? clientPageInfo(tenantData.value.paymentHistory.length, pagePaymentHistory.value, limitReports.value)
    : null
)

type OutstandingGrouped = RevenueReport['outstanding']['groupedByLease'][0]
const outstandingColumns: TableColumn<OutstandingGrouped>[] = [
  { accessorKey: 'tenant', header: 'Tenant' },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'totalAmount', header: 'Total' },
  { accessorKey: 'periodCount', header: 'Periods' },
  { accessorKey: 'months', header: 'Months' },
  { accessorKey: 'maxDaysOverdue', header: 'Oldest (days)' },
]

const expirationColumns: TableColumn<LeaseExpirationItem>[] = [
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
    if (buildings.value.length > 0 && selectedBuildingId.value) {
      const exists = buildings.value.some(b => b.id === selectedBuildingId.value)
      if (!exists) selectedBuildingId.value = buildings.value[0]!.id
    }
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch buildings', description: error.message, color: 'error' })
  } finally {
    loadingBuildings.value = false
  }
}

async function fetchSummary() {
  if (!selectedBuildingId.value) return
  loadingSummary.value = true
  try {
    const response = await buildingApi<ApiResponse<ReportSummary>>(
      selectedBuildingId.value,
      '/v1/app/reports/summary'
    )
    summaryData.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch summary', description: error.message, color: 'error' })
  } finally {
    loadingSummary.value = false
  }
}

function summaryPeriodLabel(summary: ReportSummary) {
  const d = new Date(summary.period.year, summary.period.month - 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

async function fetchOccupancy() {
  if (!selectedBuildingId.value) return

  loadingOccupancy.value = true
  try {
    const response = await buildingApi<ApiResponse<OccupancyReport>>(
      selectedBuildingId.value,
      '/v1/app/reports/occupancy?historyMonths=6'
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

async function fetchMaintenance() {
  if (!selectedBuildingId.value) return
  loadingMaintenance.value = true
  try {
    const response = await buildingApi<ApiResponse<MaintenanceReport>>(
      selectedBuildingId.value,
      '/v1/app/reports/maintenance'
    )
    maintenanceData.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch maintenance report', description: error.message, color: 'error' })
  } finally {
    loadingMaintenance.value = false
  }
}

async function fetchPortfolio() {
  loadingPortfolio.value = true
  try {
    const response = await api<ApiResponse<PortfolioReport>>('/v1/app/reports/portfolio')
    portfolioData.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch portfolio', description: error.message, color: 'error' })
  } finally {
    loadingPortfolio.value = false
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function formatMonthKeys(months: string[]) {
  return months
    .slice(0, 5)
    .map((m) => {
      const [y, mo] = m.split('-')
      return new Date(Number(y), Number(mo!) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    })
    .join(', ') + (months.length > 5 ? ` +${months.length - 5} more` : '')
}

async function downloadExport(report: 'outstanding' | 'expirations' | 'vacant') {
  if (!selectedBuildingId.value) return
  try {
    const config = useRuntimeConfig()
    const { token } = useAuth()
    const url = `${config.public.apiUrl}/v1/app/reports/export?report=${report}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token.value}`, 'x-building-id': selectedBuildingId.value },
    })
    if (!res.ok) throw new Error('Export failed')
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `report-${report}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.add({ title: 'Export downloaded', color: 'success' })
  } catch (error: any) {
    toast.add({ title: 'Export failed', description: error.message, color: 'error' })
  }
}

function selectBuildingFromPortfolio(id: string) {
  selectedBuildingId.value = id
}

watch(selectedBuildingId, () => {
  if (selectedBuildingId.value) {
    pageVacant.value = 1
    pageOutstanding.value = 1
    pageExpirations.value = 1
    pagePaymentHistory.value = 1
    fetchSummary()
    fetchOccupancy()
    fetchRevenue()
    fetchTenants()
    fetchMaintenance()
  }
}, { immediate: true })
watch(limitReports, () => {
  pageVacant.value = 1
  pageOutstanding.value = 1
  pageExpirations.value = 1
  pagePaymentHistory.value = 1
})

onMounted(() => {
  fetchBuildings()
  fetchPortfolio()
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

    <!-- Summary: card-style stats with icons and accents -->
    <UCard v-if="selectedBuildingId" variant="elevated" class="overflow-hidden">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40">
              <UIcon name="i-heroicons-chart-bar" class="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Summary</h2>
              <span v-if="summaryData" class="text-sm text-zinc-500">{{ summaryPeriodLabel(summaryData) }}</span>
            </div>
          </div>
        </div>
      </template>
      <div v-if="loadingSummary" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-primary-500" />
      </div>
      <div v-else-if="summaryData" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
        <UCard variant="elevated">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-building-office-2" class="h-5 w-5 text-primary-500" />
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-500">Occupancy</p>
          </div>
          <p class="mt-2 text-2xl font-bold text-primary-500 dark:text-primary-100">{{ summaryData.occupancyRate }}%</p>
          <p class="text-xs text-zinc-500">{{ summaryData.occupiedUnits }} / {{ summaryData.totalUnits }} units</p>
        </UCard>
        <UCard variant="elevated">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-currency-dollar" class="h-5 w-5 text-zinc-500" />
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-500">Expected (month)</p>
          </div>
          <p class="mt-2 text-xl font-bold text-indigo-700 dark:text-blue-100">ETB {{
            summaryData.expectedRentThisMonth.toLocaleString() }}</p>
        </UCard>
        <UCard variant="elevated">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-banknotes" class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-500">Collected (month)</p>
          </div>
          <p class="mt-2 text-xl font-bold text-emerald-700 dark:text-emerald-400">ETB {{
            summaryData.collectedRentThisMonth.toLocaleString() }}</p>
          <p class="text-xs text-zinc-500">Collection {{ summaryData.collectionRateThisMonth }}%</p>
        </UCard>
        <UCard variant="elevated">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="h-5 w-5 text-red-600 dark:text-red-400" />
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-500">Outstanding</p>
          </div>
          <p class="mt-2 text-xl font-bold text-red-700 dark:text-red-400">ETB {{
            summaryData.outstandingAmount.toLocaleString() }}</p>
          <p class="text-xs text-zinc-500">{{ summaryData.outstandingCount }} period(s)</p>
        </UCard>
        <UCard variant="elevated">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-home" class="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-500">Vacant units</p>
          </div>
          <p class="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-400">{{ summaryData.vacantCount }}</p>
        </UCard>
        <UCard variant="elevated">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-calendar-days" class="h-5 w-5 text-zinc-500" />
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-500">Expiring ≤30d</p>
          </div>
          <p class="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ summaryData.expiringIn30Days }}</p>
          <p class="text-xs text-zinc-500">lease(s)</p>
        </UCard>
      </div>
      <div v-else class="py-8 text-center text-sm text-zinc-500">Select a building to see summary.</div>
      <p v-if="summaryData?.summaryText"
        class="mt-4 text-sm text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-700 pt-4">
        {{ summaryData.summaryText }}
      </p>
    </UCard>

    <div v-if="summaryData && summaryData.openMaintenanceCount > 0"
      class="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm text-amber-800">
      <span class="font-medium">Open maintenance:</span> {{ summaryData.openMaintenanceCount }} request(s) pending or in
      progress.
    </div>

    <UTabs :items="tabs" :ui="{
      list: 'bg-white rounded-full shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]',
      indicator: 'rounded-full'
    }">
      <template #portfolio>
        <div class="space-y-6 pt-4">
          <p class="text-gray-600">Compare all your buildings. Click a building name to view it in the selector.</p>
          <div v-if="loadingPortfolio" class="flex justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-gray-400" />
          </div>
          <UCard v-else-if="portfolioData && portfolioData.buildings.length > 0" variant="elevated">
            <UTable :data="portfolioData.buildings" :columns="[
              { accessorKey: 'name', header: 'Building' },
              { accessorKey: 'occupancyRate', header: 'Occupancy %' },
              { accessorKey: 'collectedThisMonth', header: 'Collected (month)' },
              { accessorKey: 'expectedThisMonth', header: 'Expected (month)' },
              { accessorKey: 'outstandingAmount', header: 'Outstanding' },
              { accessorKey: 'vacantCount', header: 'Vacant' },
              { accessorKey: 'expiringIn30', header: 'Expiring ≤30d' },
              { accessorKey: 'openMaintenance', header: 'Open maint.' },
            ]">
              <template #collectedThisMonth-cell="{ row }">ETB {{ row.original.collectedThisMonth.toLocaleString()
                }}</template>
              <template #expectedThisMonth-cell="{ row }">ETB {{ row.original.expectedThisMonth.toLocaleString()
                }}</template>
              <template #outstandingAmount-cell="{ row }">ETB {{ row.original.outstandingAmount.toLocaleString()
                }}</template>
              <template #occupancyRate-cell="{ row }">{{ row.original.occupancyRate }}%</template>
              <template #name-cell="{ row }">
                <UButton variant="link" size="xs" @click="selectBuildingFromPortfolio(row.original.id)">
                  {{ row.original.name }}
                </UButton>
              </template>
            </UTable>
          </UCard>
          <UCard v-else-if="portfolioData && portfolioData.buildings.length === 0" variant="elevated"
            class="py-8 text-center text-gray-500">
            No buildings in your portfolio yet.
          </UCard>
          <UCard v-else variant="elevated" class="py-8 text-center text-gray-500">
            Could not load portfolio. Try refreshing.
          </UCard>
        </div>
      </template>

      <template #occupancy>
        <div class="space-y-6 pt-4">
          <div v-if="occupancyData" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <UCard variant="elevated">
              <p class="text-sm text-gray-600">Total units</p>
              <p class="mt-1 text-2xl font-bold">{{ occupancyData.totalUnits }}</p>
            </UCard>
            <UCard variant="elevated">
              <p class="text-sm text-gray-600">Occupancy rate</p>
              <p class="mt-1 text-2xl font-bold text-success-600">{{ occupancyData.occupancyRate }}%</p>
            </UCard>
            <UCard variant="elevated">
              <p class="text-sm text-gray-600">Vacant</p>
              <p class="mt-1 text-2xl font-bold text-warning-600">{{ occupancyData.vacantUnits }}</p>
            </UCard>
            <UCard variant="elevated">
              <p class="text-sm text-gray-600">Lost rent / month</p>
              <p class="mt-1 text-2xl font-bold text-error-600">ETB {{ occupancyData.lostRentPerMonth.toLocaleString()
                }}</p>
            </UCard>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UCard v-if="occupancyChartData" variant="elevated">
              <template #header>
                <h3 class="text-lg font-semibold">Distribution</h3>
              </template>
              <div class="flex justify-center" style="height: 200px;">
                <Doughnut :data="occupancyChartData" :options="{ maintainAspectRatio: false }" />
              </div>
            </UCard>
            <UCard v-if="occupancyTrendChartData" variant="elevated">
              <template #header>
                <h3 class="text-lg font-semibold">Occupancy trend (6 months)</h3>
              </template>
              <div style="height: 200px;">
                <Line :data="occupancyTrendChartData"
                  :options="{ maintainAspectRatio: false, responsive: true, scales: { y: { min: 0, max: 100 }, x: { grid: { display: false } } }, plugins: { legend: { position: 'top' } } }" />
              </div>
            </UCard>
          </div>

          <UCard v-if="occupancyData" variant="elevated">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">Vacant Units ({{ occupancyData.vacantUnits }})</h3>
                <UButton size="xs" variant="outline" @click="downloadExport('vacant')">Export CSV</UButton>
              </div>
            </template>
            <UTable :data="paginatedVacant" :columns="vacantUnitsColumns" :loading="loadingOccupancy">
              <template #type-cell="{ row }">
                <UBadge variant="subtle" class="capitalize">{{ row.original.type || 'N/A' }}</UBadge>
              </template>
              <template #rentPrice-cell="{ row }">
                <span class="font-medium">ETB {{ row.original.rentPrice.toLocaleString() }}</span>
              </template>
            </UTable>
            <PaginationBar v-if="pageInfoVacant" :page-info="pageInfoVacant" :current-count="paginatedVacant.length"
              item-label="units" :limit="limitReports" show-limit-selector @go-to-page="pageVacant = $event"
              @update:limit="limitReports = $event" />
          </UCard>
        </div>
      </template>

      <template #revenue>
        <div class="space-y-6 pt-4">
          <UCard variant="elevated">
            <div class="flex flex-wrap gap-4 items-end">
              <UFormField label="Start Date" class="flex-1 min-w-35">
                <UInput v-model="revenueStartDate" type="date" />
              </UFormField>
              <UFormField label="End Date" class="flex-1 min-w-35">
                <UInput v-model="revenueEndDate" type="date" />
              </UFormField>
              <UButton @click="fetchRevenue" :loading="loadingRevenue">Apply</UButton>
            </div>
          </UCard>

          <div v-if="revenueData" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <UCard variant="elevated">
              <p class="text-sm text-gray-600">Expected (period)</p>
              <p class="mt-1 text-2xl font-bold text-gray-900">ETB {{ revenueData.expectedRent.toLocaleString() }}</p>
            </UCard>
            <UCard variant="elevated">
              <p class="text-sm text-gray-600">Collected (period)</p>
              <p class="mt-1 text-2xl font-bold text-success-600">ETB {{ revenueData.collectedRent.toLocaleString() }}
              </p>
            </UCard>
            <UCard variant="elevated">
              <p class="text-sm text-gray-600">Collection rate</p>
              <p class="mt-1 text-2xl font-bold">{{ revenueData.collectionRate }}%</p>
            </UCard>
            <UCard variant="elevated">
              <p class="text-sm text-gray-600">Outstanding</p>
              <p class="mt-1 text-2xl font-bold text-error-600">ETB {{ revenueData.outstanding.amount.toLocaleString()
                }}</p>
              <p class="text-xs text-gray-500">{{ revenueData.outstanding.count }} period(s)</p>
            </UCard>
          </div>

          <UCard v-if="revenueByMonthChartData" variant="elevated">
            <template #header>
              <h3 class="text-lg font-semibold">Revenue by month</h3>
            </template>
            <div style="height: 280px;">
              <Line :data="revenueByMonthChartData"
                :options="{ maintainAspectRatio: false, responsive: true, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }, plugins: { legend: { position: 'top' } } }" />
            </div>
          </UCard>

          <div v-if="revenueData && revenueData.outstanding.amount > 0" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <UCard variant="elevated" class="border-l-4 border-l-amber-400">
              <p class="text-sm text-gray-600">0–30 days overdue</p>
              <p class="mt-1 text-xl font-bold">ETB {{ revenueData.outstanding.aging.days0_30.toLocaleString() }}</p>
            </UCard>
            <UCard variant="elevated" class="border-l-4 border-l-orange-500">
              <p class="text-sm text-gray-600">31–60 days overdue</p>
              <p class="mt-1 text-xl font-bold">ETB {{ revenueData.outstanding.aging.days31_60.toLocaleString() }}</p>
            </UCard>
            <UCard variant="elevated" class="border-l-4 border-l-red-500">
              <p class="text-sm text-gray-600">61+ days overdue</p>
              <p class="mt-1 text-xl font-bold">ETB {{ revenueData.outstanding.aging.days61Plus.toLocaleString() }}</p>
            </UCard>
          </div>

          <UCard v-if="revenueData" variant="elevated">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">Outstanding payments</h3>
                <UButton size="xs" variant="outline" @click="downloadExport('outstanding')">Export CSV</UButton>
              </div>
            </template>
            <UTable :data="paginatedOutstanding" :columns="outstandingColumns" :loading="loadingRevenue">
              <template #tenant-cell="{ row }">
                <span>{{ row.original.tenant.name }}</span>
              </template>
              <template #unit-cell="{ row }">
                <span>{{ row.original.unit.unitNumber }}</span>
              </template>
              <template #totalAmount-cell="{ row }">
                <span class="font-medium">ETB {{ row.original.totalAmount.toLocaleString() }}</span>
              </template>
              <template #periodCount-cell="{ row }">
                <span>{{ row.original.periodCount }}</span>
              </template>
              <template #months-cell="{ row }">
                <span class="text-sm text-gray-600">{{ formatMonthKeys(row.original.months) }}</span>
              </template>
              <template #maxDaysOverdue-cell="{ row }">
                <UBadge
                  :color="row.original.maxDaysOverdue > 60 ? 'error' : row.original.maxDaysOverdue > 30 ? 'warning' : 'neutral'"
                  variant="subtle">
                  {{ row.original.maxDaysOverdue }} days
                </UBadge>
              </template>
            </UTable>
            <PaginationBar v-if="pageInfoOutstanding" :page-info="pageInfoOutstanding"
              :current-count="paginatedOutstanding.length" item-label="items" :limit="limitReports" show-limit-selector
              @go-to-page="pageOutstanding = $event" @update:limit="limitReports = $event" />
          </UCard>
        </div>
      </template>

      <template #tenants>
        <div class="space-y-6 pt-4">
          <div v-if="tenantData" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <UCard variant="elevated">
              <p class="text-sm text-gray-600">Total / Active / Inactive</p>
              <p class="mt-1 text-xl font-bold">{{ tenantData.totalTenants }} / {{ tenantData.activeTenants }} / {{
                tenantData.inactiveTenants }}</p>
            </UCard>
            <UCard variant="elevated" class="border-l-4 border-l-red-500">
              <p class="text-sm text-gray-600">Expiring in 30 days</p>
              <p class="mt-1 text-2xl font-bold text-error-600">{{ tenantData.expiringIn30.count }}</p>
            </UCard>
            <UCard variant="elevated" class="border-l-4 border-l-amber-500">
              <p class="text-sm text-gray-600">Expiring in 60 days</p>
              <p class="mt-1 text-2xl font-bold text-warning-600">{{ tenantData.expiringIn60.count }}</p>
            </UCard>
            <UCard variant="elevated" class="border-l-4 border-l-blue-400">
              <p class="text-sm text-gray-600">Expiring in 90 days</p>
              <p class="mt-1 text-2xl font-bold">{{ tenantData.expiringIn90.count }}</p>
            </UCard>
          </div>

          <UCard v-if="tenantData" variant="elevated">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">Lease expirations (next 90 days)</h3>
                <UButton size="xs" variant="outline" @click="downloadExport('expirations')">Export CSV</UButton>
              </div>
            </template>
            <UTable :data="paginatedExpirations" :columns="expirationColumns" :loading="loadingTenants">
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
            <PaginationBar v-if="pageInfoExpirations" :page-info="pageInfoExpirations"
              :current-count="paginatedExpirations.length" item-label="expirations" :limit="limitReports"
              show-limit-selector @go-to-page="pageExpirations = $event" @update:limit="limitReports = $event" />
          </UCard>

          <UCard v-if="tenantData" variant="elevated">
            <template #header>
              <h3 class="text-lg font-semibold">Payment History Summary</h3>
            </template>
            <UTable :data="paginatedPaymentHistory" :columns="paymentHistoryColumns" :loading="loadingTenants">
              <template #totalPaid-cell="{ row }">
                <span class="font-medium">ETB {{ row.original.totalPaid.toLocaleString() }}</span>
              </template>
              <template #lastPayment-cell="{ row }">
                <span>{{ row.original.lastPayment ? formatDate(row.original.lastPayment) : 'N/A' }}</span>
              </template>
            </UTable>
            <PaginationBar v-if="pageInfoPaymentHistory" :page-info="pageInfoPaymentHistory"
              :current-count="paginatedPaymentHistory.length" item-label="tenants" :limit="limitReports"
              show-limit-selector @go-to-page="pagePaymentHistory = $event" @update:limit="limitReports = $event" />
          </UCard>
        </div>
      </template>

      <template #maintenance>
        <div class="space-y-6 pt-4">
          <div v-if="loadingMaintenance" class="flex justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-gray-400" />
          </div>
          <div v-else-if="maintenanceData" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <UCard variant="elevated">
              <p class="text-sm text-gray-600">Open requests</p>
              <p class="mt-1 text-2xl font-bold">{{ maintenanceData.openCount }}</p>
            </UCard>
            <UCard v-for="(count, priority) in maintenanceData.byPriority" :key="priority" variant="elevated">
              <p class="text-sm text-gray-600 capitalize">{{ priority }}</p>
              <p class="mt-1 text-xl font-bold">{{ count }}</p>
            </UCard>
          </div>
          <p v-else class="text-sm text-gray-500">Select a building to see maintenance summary.</p>
        </div>
      </template>
    </UTabs>
  </div>
</template>