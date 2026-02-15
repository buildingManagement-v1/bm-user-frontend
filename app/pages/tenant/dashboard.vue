<script setup lang="ts">
import type { ApiResponse } from '~/types'

definePageMeta({
  layout: 'tenant',
})

const { api } = useApi()
const toast = useToast()

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
  unit: {
    id: string
    unitNumber: string
  } | null
}

interface RentStatus {
  id: string
  rentAmount: number
  startDate: string
  endDate: string
  status: string
}

const profile = ref<TenantProfile | null>(null)
const rentStatus = ref<RentStatus | null>(null)
const profileLoading = ref(false)
const rentLoading = ref(false)

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
    const response = await api<ApiResponse<RentStatus | null>>('/v1/tenant/rent-status')
    rentStatus.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch rent status', description: error.message, color: 'error' })
  } finally {
    rentLoading.value = false
  }
}

onMounted(() => {
  fetchProfile()
  fetchRentStatus()
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
          <div v-if="profile.unit">
            <p class="text-sm text-gray-500">Unit</p>
            <p class="font-medium">Unit {{ profile.unit.unitNumber }}</p>
          </div>
        </div>
      </UCard>

      <!-- Rent Status Card -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">Rent Status</h2>
        </template>

        <div v-if="rentLoading" class="animate-pulse space-y-3">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        <div v-else-if="rentStatus" class="space-y-3">
          <div>
            <p class="text-sm text-gray-500">Monthly Rent</p>
            <p class="text-2xl font-bold text-primary-600">ETB {{ rentStatus.rentAmount }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Lease Period</p>
            <p class="font-medium">
              {{ new Date(rentStatus.startDate).toLocaleDateString() }} -
              {{ new Date(rentStatus.endDate).toLocaleDateString() }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Status</p>
            <UBadge :color="rentStatus.status === 'active' ? 'success' : 'neutral'">
              {{ rentStatus.status }}
            </UBadge>
          </div>
        </div>

        <div v-else>
          <p class="text-gray-500">No active lease found</p>
        </div>
      </UCard>
    </div>
  </div>
</template>