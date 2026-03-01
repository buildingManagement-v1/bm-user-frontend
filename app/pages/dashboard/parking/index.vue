<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ParkingRegistration } from '~/types/parking'
import type { ApiResponse, PaginatedResponse, PageInfo } from '~/types'

const { buildingApi } = useApi()
const toast = useToast()

const registrations = ref<ParkingRegistration[]>([])
const { selectedBuildingId } = useSelectedBuilding()
const loading = ref(false)
const pageInfo = ref<PageInfo | null>(null)
const limit = ref(20)
const currentPage = ref(1)
const searchQ = ref('')
const isRegisterModalOpen = ref(false)
const removingId = ref<string | null>(null)

const columns: TableColumn<ParkingRegistration>[] = [
  { accessorKey: 'licensePlate', header: 'License plate' },
  { accessorKey: 'tenant', header: 'Tenant' },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'createdAt', header: 'Registered' },
  { accessorKey: 'actions', header: '' },
]

async function fetchRegistrations() {
  if (!selectedBuildingId.value) return

  loading.value = true
  try {
    const offset = (currentPage.value - 1) * limit.value
    const params = new URLSearchParams()
    params.set('limit', String(limit.value))
    params.set('offset', String(offset))
    if (searchQ.value.trim()) params.set('q', searchQ.value.trim())
    const response = await buildingApi<PaginatedResponse<ParkingRegistration[]>>(
      selectedBuildingId.value,
      `/v1/app/parking?${params.toString()}`
    )
    registrations.value = response.data
    pageInfo.value = response.meta.page_info
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch parking registrations', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

function goToPage(page: number) {
  if (page < 1 || (pageInfo.value && page > pageInfo.value.total_pages)) return
  currentPage.value = page
  fetchRegistrations()
}

function onLimitChange(newLimit: number) {
  limit.value = newLimit
  currentPage.value = 1
  fetchRegistrations()
}

function onFilterChange() {
  currentPage.value = 1
  fetchRegistrations()
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function handleSuccess() {
  isRegisterModalOpen.value = false
  fetchRegistrations()
}

async function removeRegistration(id: string) {
  if (!selectedBuildingId.value) return
  removingId.value = id
  try {
    await buildingApi<ApiResponse<{ success: boolean }>>(
      selectedBuildingId.value,
      `/v1/app/parking/${id}`,
      { method: 'DELETE' }
    )
    toast.add({ title: 'Registration removed', color: 'success' })
    fetchRegistrations()
  } catch (error: any) {
    toast.add({ title: 'Failed to remove registration', description: error.message, color: 'error' })
  } finally {
    removingId.value = null
  }
}

watch(selectedBuildingId, () => {
  if (selectedBuildingId.value) {
    currentPage.value = 1
    fetchRegistrations()
  }
}, { immediate: true })
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Parking</h1>
        <p class="text-gray-600 mt-1">Register and manage tenant vehicles</p>
      </div>

      <div class="flex items-center gap-3">
        <BuildingSelector v-model="selectedBuildingId" />
        <UButton
          color="primary"
          icon="i-heroicons-plus"
          @click="isRegisterModalOpen = true"
          :disabled="!selectedBuildingId"
        >
          Register car
        </UButton>
      </div>
    </div>

    <UCard v-if="selectedBuildingId" variant="elevated" class="mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Search</span>
          <UInput
            v-model="searchQ"
            placeholder="License plate, tenant, or unit..."
            class="w-56"
            @keyup.enter="onFilterChange"
          />
          <UButton size="sm" color="neutral" variant="outline" @click="onFilterChange">
            Search
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard variant="elevated">
      <PaginationBar
        :page-info="pageInfo"
        item-label="registrations"
        :current-count="registrations.length"
        :limit="limit"
        show-limit-selector
        @go-to-page="goToPage"
        @update:limit="onLimitChange"
      />
      <UTable :data="registrations" :columns="columns" :loading="loading">
        <template #licensePlate-cell="{ row }">
          <span class="font-mono font-medium">{{ row.original.licensePlate }}</span>
        </template>

        <template #tenant-cell="{ row }">
          <span>{{ row.original.tenant.name }}</span>
        </template>

        <template #unit-cell="{ row }">
          <span>{{ row.original.unit.unitNumber }}</span>
          <span v-if="row.original.unit.floor" class="text-gray-500"> (Floor {{ row.original.unit.floor }})</span>
        </template>

        <template #createdAt-cell="{ row }">
          <span>{{ formatDate(row.original.createdAt) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <UButton
            size="xs"
            color="error"
            variant="ghost"
            :loading="removingId === row.original.id"
            @click="removeRegistration(row.original.id)"
          >
            Remove
          </UButton>
        </template>

        <template #empty>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-truck" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-900 font-medium mb-2">No parking registrations</p>
            <p class="text-gray-500 mb-4">
              {{ selectedBuildingId ? 'Register a tenant vehicle to get started' : 'Select a building to view parking' }}
            </p>
            <UButton v-if="selectedBuildingId" color="primary" @click="isRegisterModalOpen = true">
              Register car
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="isRegisterModalOpen" title="Register car">
      <template #body>
        <ParkingRegistrationForm
          v-if="selectedBuildingId"
          :building-id="selectedBuildingId"
          @success="handleSuccess"
          @cancel="isRegisterModalOpen = false"
        />
      </template>
    </UModal>
  </div>
</template>
