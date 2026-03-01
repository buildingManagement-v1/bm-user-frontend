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
import type { ApiResponse } from '~/types'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

definePageMeta({
  layout: 'tenant',
})

const { api } = useApi()
const toast = useToast()

interface TenantLease {
  id: string
  unitNumber: string
  floor?: number
  rentPrice: number
}

interface TenantProfile {
  id: string
  name: string
  email: string
  phone?: string
  building: {
    id: string
    name: string
    address?: string
  }
  leases?: Array<{
    id: string
    startDate: string
    endDate: string
    status: string
    rentAmount: number
    unit: TenantLease
  }>
}

interface RentStatusItem {
  id: string
  rentAmount: number
  startDate: string
  endDate: string
  status: string
  unit: {
    id: string
    unitNumber: string
    floor?: number
    rentPrice: number
  }
}

interface UpcomingPayment {
  id: string
  month: string
  dueLabel: string
  amount: number
  status: 'unpaid' | 'overdue'
  unitNumber: string
  unitFloor?: number
  leaseId: string
}

interface DashboardStats {
  paymentSummary: { paidAmount: number; unpaidAmount: number; overdueAmount: number }
  recentMonths: Array<{ month: string; label: string; due: number; paid: number }>
}

const profile = ref<TenantProfile | null>(null)
const rentStatusList = ref<RentStatusItem[]>([])
const upcomingPayments = ref<UpcomingPayment[]>([])
const dashboardStats = ref<DashboardStats | null>(null)
const profileLoading = ref(false)
const rentLoading = ref(false)
const upcomingLoading = ref(false)
const statsLoading = ref(false)

async function fetchProfile() {
  profileLoading.value = true
  try {
    const response = await api<ApiResponse<TenantProfile>>('/v1/tenant/profile')
    profile.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch profile', description: error.message, color: 'error' })
  } finally {
    profileLoading.value = false
  }
}

async function fetchRentStatus() {
  rentLoading.value = true
  try {
    const response = await api<ApiResponse<RentStatusItem[] | null>>('/v1/tenant/rent-status')
    rentStatusList.value = Array.isArray(response.data) ? response.data : []
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch rent status', description: error.message, color: 'error' })
  } finally {
    rentLoading.value = false
  }
}

async function fetchUpcomingPayments() {
  upcomingLoading.value = true
  try {
    const response = await api<ApiResponse<UpcomingPayment[]>>('/v1/tenant/upcoming-payments?limit=10')
    upcomingPayments.value = Array.isArray(response.data) ? response.data : []
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch upcoming payments', description: error.message, color: 'error' })
  } finally {
    upcomingLoading.value = false
  }
}

async function fetchDashboardStats() {
  statsLoading.value = true
  try {
    const response = await api<ApiResponse<DashboardStats>>('/v1/tenant/dashboard-stats')
    dashboardStats.value = response.data
  } catch {
    dashboardStats.value = null
  } finally {
    statsLoading.value = false
  }
}

const paymentDonutData = computed(() => {
  const s = dashboardStats.value?.paymentSummary
  if (!s || (s.paidAmount === 0 && s.unpaidAmount === 0 && s.overdueAmount === 0)) return null
  return {
    labels: ['Paid', 'Unpaid', 'Overdue'],
    datasets: [
      {
        data: [s.paidAmount, s.unpaidAmount, s.overdueAmount],
        backgroundColor: ['#8b5cf6', '#a1a1aa', '#f43f5e'],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }
})

const paymentDonutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: { position: 'bottom' as const },
  },
}

const recentMonthsBarData = computed(() => {
  const months = dashboardStats.value?.recentMonths
  if (!months?.length) return null
  return {
    labels: months.map(m => m.label),
    datasets: [
      {
        label: 'Due',
        data: months.map(m => m.due),
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: '#8b5cf6',
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: 'Paid',
        data: months.map(m => m.paid),
        backgroundColor: 'rgba(34, 197, 94, 0.35)',
        borderColor: '#22c55e',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  }
})

const recentMonthsBarOptions = {
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

onMounted(() => {
  fetchProfile()
  fetchRentStatus()
  fetchUpcomingPayments()
  fetchDashboardStats()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Hero -->
    <div
      class="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary-500 via-primary-600 to-indigo-700 px-8 py-10 text-white shadow-xl">
      <div class="relative z-10">
        <h1 class="text-2xl font-semibold tracking-tight md:text-3xl">
          Welcome back{{ profile?.name ? `, ${profile.name.split(' ')[0]}` : '' }}
        </h1>
        <p class="mt-1.5 text-primary-100 text-sm md:text-base">
          Here’s an overview of your tenancy and payments.
        </p>
      </div>
      <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
      <div class="absolute -bottom-12 -right-4 h-32 w-32 rounded-full bg-white/5" />
    </div>

    <!-- Stats + Charts row -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Payment status donut -->
      <UCard variant="elevated" class="overflow-hidden">
        <template #header>
          <h2 class="text-base font-semibold text-zinc-800 dark:text-zinc-200">
            Payment status
          </h2>
        </template>
        <div v-if="statsLoading" class="flex h-56 items-center justify-center">
          <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-primary-500" />
        </div>
        <div v-else-if="paymentDonutData" class="h-56">
          <ClientOnly>
            <Doughnut :data="paymentDonutData" :options="paymentDonutOptions" />
            <template #fallback>
              <div class="flex h-56 items-center justify-center text-zinc-400">Loading chart…</div>
            </template>
          </ClientOnly>
        </div>
        <div v-else class="flex h-56 items-center justify-center text-zinc-400 text-sm">
          No payment data yet
        </div>
      </UCard>

      <!-- Rent by month bar -->
      <UCard variant="elevated" class="lg:col-span-2 overflow-hidden">
        <template #header>
          <h2 class="text-base font-semibold text-zinc-800 dark:text-zinc-200">
            Rent by month
          </h2>
        </template>
        <div v-if="statsLoading" class="flex h-56 items-center justify-center">
          <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-primary-500" />
        </div>
        <div v-else-if="recentMonthsBarData" class="h-56">
          <ClientOnly>
            <Bar :data="recentMonthsBarData" :options="recentMonthsBarOptions" />
            <template #fallback>
              <div class="flex h-56 items-center justify-center text-zinc-400">Loading chart…</div>
            </template>
          </ClientOnly>
        </div>
        <div v-else class="flex h-56 items-center justify-center text-zinc-400 text-sm">
          No monthly data yet
        </div>
      </UCard>
    </div>

    <!-- Profile + Rent status -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <UCard variant="elevated">
        <template #header>
          <h2 class="text-base font-semibold text-zinc-800 dark:text-zinc-200">
            My profile
          </h2>
        </template>
        <div v-if="profileLoading" class="animate-pulse space-y-4">
          <div class="h-4 rounded bg-zinc-200 dark:bg-zinc-700 w-3/4" />
          <div class="h-4 rounded bg-zinc-200 dark:bg-zinc-700 w-1/2" />
          <div class="h-4 rounded bg-zinc-200 dark:bg-zinc-700 w-2/3" />
        </div>
        <div v-else-if="profile" class="space-y-4">
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-400">Name</p>
            <p class="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{{ profile.name }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-400">Email</p>
            <p class="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{{ profile.email }}</p>
          </div>
          <div v-if="profile.phone">
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-400">Phone</p>
            <p class="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{{ profile.phone }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-400">Building</p>
            <p class="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{{ profile.building.name }}</p>
          </div>
          <div v-if="profile.leases?.length">
            <p class="text-xs font-medium uppercase tracking-wider text-zinc-400">Your units</p>
            <p class="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">
              {{profile.leases.map(l => `Unit ${l.unit.unitNumber}`).join(', ')}}
            </p>
          </div>
        </div>
      </UCard>

      <UCard v-if="rentStatusList.length > 0" variant="elevated">
        <template #header>
          <h2 class="text-base font-semibold text-zinc-800 dark:text-zinc-200">
            {{ rentStatusList.length === 1 ? 'Rent status' : 'Your leases' }}
          </h2>
        </template>
        <div v-if="rentLoading" class="animate-pulse space-y-4">
          <div class="h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          <div class="h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div v-else class="space-y-4">
          <div v-for="lease in rentStatusList" :key="lease.id"
            class="rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 bg-zinc-50/80 dark:bg-zinc-800/50 p-4 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-zinc-900 dark:text-zinc-100">
                Unit {{ lease.unit.unitNumber }}
                <span v-if="lease.unit.floor" class="font-normal text-zinc-500">(Floor {{ lease.unit.floor }})</span>
              </span>
              <UBadge :color="lease.status === 'active' ? 'success' : 'neutral'" variant="subtle" class="capitalize">
                {{ lease.status }}
              </UBadge>
            </div>
            <p class="text-xl font-bold text-primary-600 dark:text-primary-400">
              ETB {{ Number(lease.rentAmount).toLocaleString() }}
            </p>
            <p class="text-sm text-zinc-500">
              {{ new Date(lease.startDate).toLocaleDateString() }} –
              {{ new Date(lease.endDate).toLocaleDateString() }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard v-else-if="!rentLoading" variant="elevated" class="lg:col-span-2">
        <template #header>
          <h2 class="text-base font-semibold text-zinc-800 dark:text-zinc-200">Rent status</h2>
        </template>
        <p class="text-zinc-500">No active lease found.</p>
      </UCard>
    </div>

    <!-- Upcoming payments -->
    <UCard v-if="rentStatusList.length > 0" variant="elevated">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-zinc-800 dark:text-zinc-200">Upcoming payments</h2>
          <NuxtLink to="/tenant/payment-requests"
            class="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            Submit payment
          </NuxtLink>
        </div>
      </template>
      <div v-if="upcomingLoading" class="animate-pulse space-y-3">
        <div v-for="i in 3" :key="i" class="h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <div v-else-if="upcomingPayments.length === 0" class="py-6 text-center text-zinc-500">
        <p>No upcoming or overdue rent. You’re all set for now.</p>
      </div>
      <div v-else class="space-y-1">
        <div v-for="item in upcomingPayments" :key="item.id"
          class="flex items-center justify-between rounded-lg py-3 px-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
          <div>
            <p class="font-medium text-zinc-900 dark:text-zinc-100">
              {{ item.dueLabel }}
              <span class="font-normal text-zinc-500">
                · Unit {{ item.unitNumber }}
                <span v-if="item.unitFloor"> (Floor {{ item.unitFloor }})</span>
              </span>
            </p>
            <UBadge v-if="item.status === 'overdue'" color="error" variant="subtle" size="xs" class="mt-1">
              Overdue
            </UBadge>
          </div>
          <p class="text-lg font-semibold text-primary-600 dark:text-primary-400">
            ETB {{ item.amount.toLocaleString() }}
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>
