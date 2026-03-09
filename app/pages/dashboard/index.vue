<script setup lang="ts">
import { Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import type { TableColumn } from '@nuxt/ui'
import type { DashboardStats, UpcomingPayment, RevenueByMonth } from '~/types/dashboard'
import type { Building } from '~/types/building'
import type { ApiResponse } from '~/types'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const { api, buildingApi } = useApi()
const toast = useToast()
const { selectedBuildingId } = useSelectedBuilding()

const stats = ref<DashboardStats | null>(null)
const upcomingPayments = ref<UpcomingPayment[]>([])
const revenueByMonth = ref<RevenueByMonth[]>([])
const buildings = ref<Building[]>([])
const loadingStats = ref(false)
const loadingPayments = ref(false)
const loadingRevenue = ref(false)
const loadingBuildings = ref(false)

const columns: TableColumn<UpcomingPayment>[] = [
  { accessorKey: 'tenantName', header: 'Tenant' },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'months', header: 'Months Due' },
  { accessorKey: 'totalAmount', header: 'Total' },
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

const occupancyDonutData = computed(() => {
  const s = stats.value
  if (!s || s.totalUnits === 0) return null
  const vacant = s.totalUnits - s.occupiedUnits
  return {
    labels: ['Occupied', 'Vacant'],
    datasets: [{
      data: [s.occupiedUnits, vacant],
      backgroundColor: ['#8b5cf6', '#e4e4e7'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }
})

const occupancyDonutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: { position: 'bottom' as const },
  },
}

const revenueBarData = computed(() => {
  const data = revenueByMonth.value
  if (!data?.length) return null
  return {
    labels: data.map(d => d.label),
    datasets: [{
      label: 'Revenue (ETB)',
      data: data.map(d => d.revenue),
      backgroundColor: 'rgba(139, 92, 246, 0.35)',
      borderColor: '#8b5cf6',
      borderWidth: 1,
      borderRadius: 8,
    }],
  }
})

const revenueBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } },
  },
  plugins: {
    legend: { position: 'top' as const },
  },
}

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

async function fetchRevenueByMonth() {
  if (!selectedBuildingId.value) return

  loadingRevenue.value = true
  try {
    const response = await buildingApi<ApiResponse<RevenueByMonth[]>>(
      selectedBuildingId.value,
      '/v1/app/dashboard/revenue-by-month'
    )
    revenueByMonth.value = response.data ?? []
  } catch {
    revenueByMonth.value = []
  } finally {
    loadingRevenue.value = false
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
    fetchRevenueByMonth()
  }
}, { immediate: true })

onMounted(() => {
  fetchBuildings()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Hero + building selector -->
    <div class="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary-500 via-primary-600 to-indigo-700 px-8 py-10 text-white shadow-xl">
      <div class="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
          <p class="mt-1.5 text-primary-100 text-sm md:text-base">
            Overview of your building management
          </p>
        </div>
        <div class="w-full sm:w-64 rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
          <USelectMenu
            v-model="selectedBuilding"
            :items="buildingOptions"
            placeholder="Select building"
            :loading="loadingBuildings"
            class="w-full"
          />
        </div>
      </div>
      <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
      <div class="absolute -bottom-12 -right-4 h-32 w-32 rounded-full bg-white/5" />
    </div>

    <!-- Empty state: no buildings yet -->
    <UCard
      v-if="!loadingBuildings && buildings.length === 0"
      variant="elevated"
      class="overflow-hidden border-2 border-dashed border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/30"
    >
      <div class="flex flex-col items-center justify-center py-12 px-6 text-center sm:py-16">
        <div
          class="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/50 ring-4 ring-primary-200/50 dark:ring-primary-800/50"
        >
          <UIcon name="i-heroicons-building-office-2" class="h-10 w-10 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 class="mt-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          No buildings yet
        </h2>
        <p class="mt-2 max-w-sm text-zinc-600 dark:text-zinc-400">
          Add your first building to start managing units, tenants, and payments from your dashboard.
        </p>
        <NuxtLink to="/dashboard/buildings">
          <UButton color="primary" size="lg" icon="i-heroicons-plus" class="mt-6">
            Add your first building
          </UButton>
        </NuxtLink>
      </div>
    </UCard>

    <!-- Stats cards -->
    <div v-if="stats" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UCard variant="elevated" class="overflow-hidden">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-400">Total Tenants</p>
            <p class="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ stats.totalTenants }}</p>
          </div>
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40">
            <UIcon name="i-heroicons-users" class="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </UCard>

      <UCard variant="elevated" class="overflow-hidden">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-400">Occupancy Rate</p>
            <p class="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ stats.occupancyRate }}%</p>
            <p class="mt-0.5 text-xs text-zinc-500">{{ stats.occupiedUnits }} / {{ stats.totalUnits }} units</p>
          </div>
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40">
            <UIcon name="i-heroicons-building-office-2" class="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </UCard>

      <UCard variant="elevated" class="overflow-hidden">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-400">Revenue This Month</p>
            <p class="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              ETB {{ stats.revenueThisMonth.toLocaleString() }}
            </p>
          </div>
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
            <UIcon name="i-heroicons-banknotes" class="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </UCard>

      <UCard variant="elevated" class="overflow-hidden">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-400">Pending Maintenance</p>
            <p class="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {{ stats.pendingMaintenanceRequests }}
            </p>
          </div>
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40">
            <UIcon name="i-heroicons-wrench-screwdriver" class="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Charts: Occupancy donut + Revenue bar -->
    <div v-if="selectedBuildingId" class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <UCard variant="elevated" class="overflow-hidden">
        <template #header>
          <h2 class="text-base font-semibold text-zinc-800 dark:text-zinc-200">Occupancy</h2>
        </template>
        <div v-if="loadingStats" class="flex h-56 items-center justify-center">
          <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-primary-500" />
        </div>
        <div v-else-if="occupancyDonutData" class="h-56">
          <ClientOnly>
            <Doughnut :data="occupancyDonutData" :options="occupancyDonutOptions" />
            <template #fallback>
              <div class="flex h-56 items-center justify-center text-zinc-400">Loading chart…</div>
            </template>
          </ClientOnly>
        </div>
        <div v-else class="flex h-56 items-center justify-center text-zinc-400 text-sm">
          No unit data yet
        </div>
      </UCard>

      <UCard variant="elevated" class="lg:col-span-2 overflow-hidden">
        <template #header>
          <h2 class="text-base font-semibold text-zinc-800 dark:text-zinc-200">Revenue by month</h2>
        </template>
        <div v-if="loadingRevenue" class="flex h-56 items-center justify-center">
          <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-primary-500" />
        </div>
        <div v-else-if="revenueBarData" class="h-56">
          <ClientOnly>
            <Bar :data="revenueBarData" :options="revenueBarOptions" />
            <template #fallback>
              <div class="flex h-56 items-center justify-center text-zinc-400">Loading chart…</div>
            </template>
          </ClientOnly>
        </div>
        <div v-else class="flex h-56 items-center justify-center text-zinc-400 text-sm">
          No revenue data yet
        </div>
      </UCard>
    </div>

    <!-- Upcoming payments -->
    <UCard v-if="selectedBuildingId" variant="elevated" class="overflow-hidden">
      <template #header>
        <h2 class="text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Upcoming payments (next 2 weeks)
        </h2>
      </template>

      <UTable :data="upcomingPayments" :columns="columns" :loading="loadingPayments">
          <template #tenantName-cell="{ row }">
            <div>
              <p class="font-medium text-zinc-900 dark:text-zinc-100">{{ row.original.tenantName }}</p>
              <p class="text-sm text-zinc-500">{{ row.original.tenantEmail }}</p>
            </div>
          </template>

          <template #unit-cell="{ row }">
            <span class="text-zinc-700 dark:text-zinc-300">{{ row.original.unit.unitNumber }}</span>
          </template>

          <template #months-cell="{ row }">
            <span class="text-zinc-600 dark:text-zinc-400">
              {{ row.original.months.map(m => formatMonth(m)).join(', ') }}
            </span>
          </template>

          <template #totalAmount-cell="{ row }">
            <span class="font-semibold text-primary-600 dark:text-primary-400">
              ETB {{ row.original.totalAmount.toLocaleString() }}
            </span>
          </template>

          <template #empty>
            <div class="py-12 text-center">
              <UIcon name="i-heroicons-check-circle" class="mx-auto mb-4 h-12 w-12 text-green-500" />
              <p class="mb-2 font-medium text-zinc-900 dark:text-zinc-100">All caught up!</p>
              <p class="text-zinc-500">No upcoming payments in the next 2 weeks</p>
            </div>
          </template>
        </UTable>
    </UCard>
  </div>
</template>
