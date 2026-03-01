<script setup lang="ts">
import type { ApiResponse } from '~/types'

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

const profile = ref<TenantProfile | null>(null)
const rentStatusList = ref<RentStatusItem[]>([])
const upcomingPayments = ref<UpcomingPayment[]>([])
const profileLoading = ref(false)
const rentLoading = ref(false)
const upcomingLoading = ref(false)

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

onMounted(() => {
  fetchProfile()
  fetchRentStatus()
  fetchUpcomingPayments()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-500 mt-1">Welcome to your tenant portal</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Profile Card -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">My Profile</h2>
        </template>

        <div v-if="profileLoading" class="animate-pulse space-y-3">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        <div v-else-if="profile" class="space-y-3">
          <div>
            <p class="text-sm text-gray-500">Name</p>
            <p class="font-medium">{{ profile.name }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Email</p>
            <p class="font-medium">{{ profile.email }}</p>
          </div>
          <div v-if="profile.phone">
            <p class="text-sm text-gray-500">Phone</p>
            <p class="font-medium">{{ profile.phone }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Building</p>
            <p class="font-medium">{{ profile.building.name }}</p>
          </div>
          <div v-if="profile.leases?.length">
            <p class="text-sm text-gray-500">Your units</p>
            <p class="font-medium">
              {{ profile.leases.map(l => `Unit ${l.unit.unitNumber}`).join(', ') }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Rent Status: show first lease as summary when only one, or "Your leases" intro when multiple -->
      <UCard v-if="rentStatusList.length > 0">
        <template #header>
          <h2 class="text-xl font-semibold">
            {{ rentStatusList.length === 1 ? 'Rent Status' : 'Your Leases' }}
          </h2>
        </template>

        <div v-if="rentLoading" class="animate-pulse space-y-3">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        <div v-else class="space-y-6">
          <div
            v-for="lease in rentStatusList"
            :key="lease.id"
            class="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="font-semibold text-gray-900">
                Unit {{ lease.unit.unitNumber }}
                <span v-if="lease.unit.floor" class="text-gray-500 font-normal">(Floor {{ lease.unit.floor }})</span>
              </span>
              <UBadge :color="lease.status === 'active' ? 'success' : 'neutral'" variant="subtle" class="capitalize">
                {{ lease.status }}
              </UBadge>
            </div>
            <p class="text-2xl font-bold text-primary-600">ETB {{ Number(lease.rentAmount).toLocaleString() }}</p>
            <p class="text-sm text-gray-500">
              {{ new Date(lease.startDate).toLocaleDateString() }} –
              {{ new Date(lease.endDate).toLocaleDateString() }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- No leases placeholder: span full width when no rent status -->
      <UCard v-else-if="!rentLoading" class="lg:col-span-2">
        <template #header>
          <h2 class="text-xl font-semibold">Rent Status</h2>
        </template>
        <p class="text-gray-500">No active lease found</p>
      </UCard>
    </div>

    <!-- Upcoming payments -->
    <UCard v-if="rentStatusList.length > 0">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Upcoming payments</h2>
          <NuxtLink to="/tenant/payment-requests" class="text-sm text-primary-600 hover:underline">
            Submit payment
          </NuxtLink>
        </div>
      </template>

      <div v-if="upcomingLoading" class="animate-pulse space-y-3">
        <div v-for="i in 3" :key="i" class="h-12 bg-gray-200 rounded"></div>
      </div>

      <div v-else-if="upcomingPayments.length === 0" class="text-gray-500 py-4">
        <p>No upcoming or overdue rent. You're all set for now.</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in upcomingPayments"
          :key="item.id"
          class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
        >
          <div>
            <p class="font-medium text-gray-900">
              {{ item.dueLabel }}
              <span class="text-gray-500 font-normal">
                · Unit {{ item.unitNumber }}
                <span v-if="item.unitFloor"> (Floor {{ item.unitFloor }})</span>
              </span>
            </p>
            <UBadge
              v-if="item.status === 'overdue'"
              color="error"
              variant="subtle"
              size="xs"
              class="mt-1"
            >
              Overdue
            </UBadge>
          </div>
          <p class="text-lg font-semibold text-primary-600">
            ETB {{ item.amount.toLocaleString() }}
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>
